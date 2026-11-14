import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { IEEEXploreScraper } from './sources/ieee-xplore.scraper';
import { SemanticScholarScraper } from './sources/semantic-scholar.scraper';
import { ORCIDScraper } from './sources/orcid.scraper';
import { GoogleScholarScraper } from './sources/google-scholar.scraper';
import { InstitutionFilterService } from './filters/institution-filter.service';
import { DeduplicationService } from './utils/deduplication.service';
import { ScraperResult, ScraperOptions } from './interfaces/base-scraper.interface';

export interface ScrapingResult {
  source: string;
  facultyId: string;
  publicationsFound: number;
  publicationsAdded: number;
  publicationsUpdated: number;
  publicationsFiltered: number;
  errors: string[];
}

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private prisma: PrismaService,
    private ieeeXplore: IEEEXploreScraper,
    private semanticScholar: SemanticScholarScraper,
    private orcid: ORCIDScraper,
    private googleScholar: GoogleScholarScraper,
    private institutionFilter: InstitutionFilterService,
    private deduplication: DeduplicationService,
  ) {}

  /**
   * Scrape publications for a faculty member from all available sources
   */
  async scrapeFaculty(
    facultyId: string,
    sources?: string[],
    options?: ScraperOptions,
  ): Promise<ScrapingResult[]> {
    this.logger.log(`Starting scraping for faculty ${facultyId}`);

    // Fetch faculty details
    const faculty = await this.prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        department: true,
      },
    });

    if (!faculty) {
      throw new Error(`Faculty with ID ${facultyId} not found`);
    }

    const results: ScrapingResult[] = [];

    // Determine which scrapers to use
    // Note: ORCID and Google Scholar are prioritized when faculty has IDs
    const availableScrapers = [
      { name: 'orcid', scraper: this.orcid, requiresId: 'orcidId' },
      { name: 'google_scholar', scraper: this.googleScholar, requiresId: 'googleScholarId' },
      { name: 'ieee_xplore', scraper: this.ieeeXplore },
      { name: 'semantic_scholar', scraper: this.semanticScholar },
    ];

    let scrapersToUse = sources
      ? availableScrapers.filter((s) => sources.includes(s.name))
      : availableScrapers;

    // Filter out scrapers that require IDs but faculty doesn't have them
    scrapersToUse = scrapersToUse.filter((s) => {
      if (s.name === 'orcid' && !faculty.orcidId) {
        this.logger.log('Skipping ORCID scraper - faculty has no ORCID ID');
        return false;
      }
      if (s.name === 'google_scholar' && !faculty.googleScholarId) {
        this.logger.log('Skipping Google Scholar scraper - faculty has no Google Scholar ID');
        return false;
      }
      return true;
    });

    // Run each scraper
    for (const { name, scraper } of scrapersToUse) {
      if (!scraper.isAvailable()) {
        this.logger.warn(`Scraper ${name} is not available (API key missing?)`);
        continue;
      }

      try {
        const result = await this.scrapeFromSource(
          name,
          scraper,
          faculty,
          options,
        );
        results.push(result);
      } catch (error) {
        this.logger.error(`Error scraping from ${name}: ${error.message}`);
        results.push({
          source: name,
          facultyId,
          publicationsFound: 0,
          publicationsAdded: 0,
          publicationsUpdated: 0,
          publicationsFiltered: 0,
          errors: [error.message],
        });
      }
    }

    return results;
  }

  /**
   * Scrape from a single source
   */
  private async scrapeFromSource(
    sourceName: string,
    scraper: any,
    faculty: any,
    options?: ScraperOptions,
  ): Promise<ScrapingResult> {
    this.logger.log(`Scraping ${sourceName} for ${faculty.firstName} ${faculty.lastName}`);

    const errors: string[] = [];
    let publicationsFound = 0;
    let publicationsAdded = 0;
    let publicationsUpdated = 0;
    let publicationsFiltered = 0;

    try {
      // Fetch publications from source
      const rawResults = await scraper.fetchPublications(faculty, options);
      publicationsFound = rawResults.length;

      // Filter by institution (skip for ORCID and Google Scholar since they're author-curated)
      let filteredResults: ScraperResult[];
      if (sourceName === 'orcid' || sourceName === 'google_scholar') {
        // Trust ORCID and Google Scholar profiles - if it's in their profile, it's their paper
        filteredResults = rawResults;
        publicationsFiltered = 0;
        this.logger.log(
          `Found ${publicationsFound} publications from ${sourceName} (no institution filter needed - author-curated profile)`,
        );
      } else {
        const filterResult = this.institutionFilter.filterPublications(rawResults);
        filteredResults = filterResult.included;
        publicationsFiltered = rawResults.length - filteredResults.length;
        this.logger.log(
          `Found ${publicationsFound} publications, ${filteredResults.length} match institution`,
        );
      }

      // Process each publication
      for (const result of filteredResults) {
        try {
          const processed = await this.processPublication(result, faculty.id);
          if (processed.action === 'created') {
            publicationsAdded++;
          } else if (processed.action === 'updated') {
            publicationsUpdated++;
          }
        } catch (error) {
          errors.push(`Error processing publication "${result.title}": ${error.message}`);
        }
      }
    } catch (error) {
      errors.push(error.message);
      throw error;
    }

    return {
      source: sourceName,
      facultyId: faculty.id,
      publicationsFound,
      publicationsAdded,
      publicationsUpdated,
      publicationsFiltered,
      errors,
    };
  }

  /**
   * Process a single publication (deduplicate and save)
   */
  private async processPublication(
    result: ScraperResult,
    facultyId: string,
  ): Promise<{ action: 'created' | 'updated' | 'skipped'; id: string }> {
    // Check for existing publication
    const existing = await this.deduplication.findExistingPublication(result);

    if (existing) {
      // Update existing publication with new information
      const mergedData = this.deduplication.mergePublicationData(
        existing.publication,
        result,
      );

      const updated = await this.prisma.publication.update({
        where: { id: existing.publication.id },
        data: mergedData as any,
      });

      this.logger.debug(
        `Updated existing publication: ${updated.title} (match type: ${existing.matchType})`,
      );

      return { action: 'updated', id: updated.id };
    }

    // Create new publication
    const publication = await this.createPublication(result, facultyId);

    this.logger.debug(`Created new publication: ${publication.title}`);

    return { action: 'created', id: publication.id };
  }

  /**
   * Create a new publication in the database
   */
  private async createPublication(result: ScraperResult, facultyId: string) {
    // First, create/find authors
    const authorIds = await this.processAuthors(result.authors, facultyId);

    // Create publication
    const publication = await this.prisma.publication.create({
      data: {
        title: result.title,
        abstract: result.abstract,
        publicationYear: result.publicationYear,
        publicationDate: result.publicationDate,
        venueType: result.venueType,
        venueName: result.venueName,
        volume: result.volume,
        issue: result.issue,
        pages: result.pages,
        doi: result.doi,
        isbn: result.isbn,
        issn: result.issn,
        pdfUrl: result.pdfUrl,
        externalUrl: result.externalUrl,
        citationCount: result.citationCount || 0,
        source: result.source,
        sourceId: result.sourceId,
        rawMetadata: result.rawMetadata,
        // Link authors
        authors: {
          create: authorIds.map((authorId, index) => ({
            authorId,
            authorPosition: index + 1,
          })),
        },
        // Link keywords
        keywords: result.keywords
          ? {
              create: result.keywords.map((keyword) => ({
                keyword: {
                  connectOrCreate: {
                    where: { keyword },
                    create: {
                      keyword,
                      normalized: keyword.toLowerCase().trim(),
                    },
                  },
                },
              })),
            }
          : undefined,
      },
    });

    return publication;
  }

  /**
   * Process authors and link to faculty if possible
   */
  private async processAuthors(
    authors: ScraperResult['authors'],
    facultyId: string,
  ): Promise<string[]> {
    const authorIds: string[] = [];

    for (const authorData of authors) {
      // Try to find existing author or create new one
      let author = await this.prisma.author.findFirst({
        where: {
          name: authorData.name,
          facultyId,
        },
      });

      if (!author) {
        // Check if this author matches faculty by name/email
        let linkedFacultyId: string | undefined = facultyId;

        // If email matches another faculty member, link to them instead
        if (authorData.email) {
          const matchingFaculty = await this.prisma.faculty.findUnique({
            where: { email: authorData.email },
          });
          if (matchingFaculty) {
            linkedFacultyId = matchingFaculty.id;
          }
        }

        // Create new author
        author = await this.prisma.author.create({
          data: {
            name: authorData.name,
            affiliation: authorData.affiliation,
            email: authorData.email,
            facultyId: linkedFacultyId,
          },
        });
      }

      authorIds.push(author.id);
    }

    return authorIds;
  }

  /**
   * Get scraping statistics
   */
  async getStatistics() {
    const [totalPublications, bySource, recentJobs] = await Promise.all([
      this.prisma.publication.count(),
      this.prisma.publication.groupBy({
        by: ['source'],
        _count: true,
      }),
      this.prisma.scrapingJob.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          faculty: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    return {
      totalPublications,
      publicationsBySource: bySource,
      recentJobs,
      scrapers: {
        orcid: {
          available: this.orcid.isAvailable(),
          name: this.orcid.sourceName,
          note: 'Requires faculty to have ORCID ID',
        },
        ieeeXplore: {
          available: this.ieeeXplore.isAvailable(),
          name: this.ieeeXplore.sourceName,
        },
        semanticScholar: {
          available: this.semanticScholar.isAvailable(),
          name: this.semanticScholar.sourceName,
        },
      },
    };
  }
}
