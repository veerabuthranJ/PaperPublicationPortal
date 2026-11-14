import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  BaseScraper,
  ScraperResult,
  FacultySearchData,
  ScraperOptions,
} from '../interfaces/base-scraper.interface';
import { RateLimiterService } from '../utils/rate-limiter.service';

@Injectable()
export class ORCIDScraper extends BaseScraper {
  sourceName = 'orcid';
  private readonly logger = new Logger(ORCIDScraper.name);
  private readonly baseUrl = 'https://pub.orcid.org/v3.0';

  constructor(
    private httpService: HttpService,
    private rateLimiter: RateLimiterService,
  ) {
    super();

    // Configure rate limiter (24 requests per second for public API)
    this.rateLimiter.registerLimiter(this.sourceName, {
      requestsPerSecond: 20, // Conservative
    });
  }

  isAvailable(): boolean {
    return true; // ORCID public API is always available
  }

  async fetchPublications(
    faculty: FacultySearchData,
    options?: ScraperOptions,
  ): Promise<ScraperResult[]> {
    if (!faculty.orcidId) {
      this.logger.warn(`Faculty ${faculty.firstName} ${faculty.lastName} has no ORCID ID`);
      return [];
    }

    this.logger.log(`Fetching publications for ORCID: ${faculty.orcidId}`);

    const results: ScraperResult[] = [];

    try {
      // Fetch works from ORCID
      const works = await this.fetchORCIDWorks(faculty.orcidId);

      // Process each work
      for (const work of works) {
        try {
          const result = await this.parseWork(work, faculty.orcidId);
          if (result) {
            // Apply year filter if specified
            if (options?.yearFrom && result.publicationYear < options.yearFrom) {
              continue;
            }
            if (options?.yearTo && result.publicationYear > options.yearTo) {
              continue;
            }

            results.push(result);

            // Respect maxResults if specified
            if (options?.maxResults && results.length >= options.maxResults) {
              break;
            }
          }
        } catch (error) {
          this.logger.error(`Error parsing work: ${error.message}`);
        }
      }

      this.logger.log(`Found ${results.length} publications from ORCID`);
    } catch (error) {
      this.logger.error(`Error fetching from ORCID: ${error.message}`);
    }

    return results;
  }

  async searchPublications(
    query: string,
    options?: ScraperOptions,
  ): Promise<ScraperResult[]> {
    // ORCID is person-centric, not publication search
    this.logger.warn('ORCID does not support publication search by query');
    return [];
  }

  async getPublicationById(id: string): Promise<ScraperResult | null> {
    // ORCID uses ORCID iD + work put-code format
    this.logger.warn('ORCID getPublicationById not implemented - use DOI lookup instead');
    return null;
  }

  /**
   * Fetch all works for an ORCID ID
   */
  private async fetchORCIDWorks(orcidId: string): Promise<any[]> {
    await this.rateLimiter.throttle(this.sourceName);

    const headers = {
      'Accept': 'application/json',
    };

    try {
      // Fetch works summary
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/${orcidId}/works`, { headers }),
      );

      const works: any[] = [];

      if (response.data && response.data.group) {
        for (const group of response.data.group) {
          // Each group contains work summaries
          if (group['work-summary'] && group['work-summary'].length > 0) {
            // Take the first work summary (preferred source)
            const workSummary = group['work-summary'][0];

            // Fetch detailed work information
            const putCode = workSummary['put-code'];
            const detailedWork = await this.fetchWorkDetails(orcidId, putCode);

            if (detailedWork) {
              works.push(detailedWork);
            }

            // Small delay to respect rate limits
            await this.delay(100);
          }
        }
      }

      return works;
    } catch (error) {
      this.logger.error(`Error fetching ORCID works: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch detailed information for a specific work
   */
  private async fetchWorkDetails(orcidId: string, putCode: number): Promise<any> {
    await this.rateLimiter.throttle(this.sourceName);

    const headers = {
      'Accept': 'application/json',
    };

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/${orcidId}/work/${putCode}`, { headers }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching work details for put-code ${putCode}: ${error.message}`);
      return null;
    }
  }

  /**
   * Parse ORCID work into our standard format
   */
  private async parseWork(work: any, orcidId: string): Promise<ScraperResult | null> {
    try {
      if (!work || !work.title || !work.title.title || !work.title.title.value) {
        return null;
      }

      const title = work.title.title.value;

      // Extract publication year
      let year: number | undefined;
      if (work['publication-date']) {
        year = parseInt(work['publication-date'].year?.value);
      }

      // Extract DOI and other external IDs
      let doi: string | undefined;
      const externalIds = work['external-ids']?.['external-id'] || [];

      for (const extId of externalIds) {
        if (extId['external-id-type'] === 'doi') {
          doi = extId['external-id-value'];
          break;
        }
      }

      // Extract journal/venue information
      let venueName: string | undefined;
      let venueType: string | undefined;

      if (work['journal-title']?.value) {
        venueName = work['journal-title'].value;
        venueType = 'journal';
      }

      // Extract type
      const workType = work.type?.toLowerCase();
      if (workType?.includes('conference')) {
        venueType = 'conference';
      } else if (workType?.includes('journal')) {
        venueType = 'journal';
      }

      // Extract authors (contributors)
      const authors: Array<{ name: string; affiliation?: string; email?: string }> = [];

      if (work.contributors?.contributor) {
        for (const contributor of work.contributors.contributor) {
          const creditName = contributor['credit-name']?.value;
          if (creditName) {
            authors.push({
              name: creditName,
              affiliation: undefined,
              email: undefined,
            });
          }
        }
      }

      // If no authors found, add the ORCID holder as author
      if (authors.length === 0) {
        authors.push({
          name: 'Author (from ORCID)',
          affiliation: undefined,
          email: undefined,
        });
      }

      // Extract URL
      let externalUrl: string | undefined;
      if (work.url?.value) {
        externalUrl = work.url.value;
      }

      // Build result
      const result: ScraperResult = {
        title,
        abstract: undefined, // ORCID doesn't provide abstracts
        publicationYear: year || new Date().getFullYear(),
        publicationDate: undefined,
        venueType,
        venueName,
        doi,
        externalUrl,
        citationCount: 0, // ORCID doesn't track citations
        source: this.sourceName,
        sourceId: `${orcidId}:${work['put-code']}`,
        rawMetadata: work,
        authors,
      };

      return result;
    } catch (error) {
      this.logger.error(`Error parsing ORCID work: ${error.message}`);
      return null;
    }
  }
}
