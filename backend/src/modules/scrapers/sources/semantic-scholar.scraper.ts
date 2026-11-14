import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
export class SemanticScholarScraper extends BaseScraper {
  sourceName = 'semantic_scholar';
  private readonly logger = new Logger(SemanticScholarScraper.name);
  private readonly apiKey?: string;
  private readonly baseUrl = 'https://api.semanticscholar.org/graph/v1';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private rateLimiter: RateLimiterService,
  ) {
    super();
    this.apiKey = this.configService.get<string>('SEMANTIC_SCHOLAR_API_KEY');

    // Configure rate limiter (100 requests per second, but we'll be conservative)
    this.rateLimiter.registerLimiter(this.sourceName, {
      requestsPerSecond: 10, // Conservative limit
    });
  }

  isAvailable(): boolean {
    return true; // API key is optional, works without it but with lower rate limits
  }

  async fetchPublications(
    faculty: FacultySearchData,
    options?: ScraperOptions,
  ): Promise<ScraperResult[]> {
    this.logger.log(`Fetching publications for ${faculty.firstName} ${faculty.lastName} from Semantic Scholar`);

    const results: ScraperResult[] = [];

    try {
      // Step 1: Search for author
      const authorName = this.normalizeAuthorName(faculty.firstName, faculty.lastName);
      const authorId = await this.findAuthorId(authorName);

      if (!authorId) {
        this.logger.warn(`Author not found in Semantic Scholar: ${authorName}`);
        return [];
      }

      // Step 2: Fetch author's papers
      const papers = await this.fetchAuthorPapers(authorId, options);

      // Step 3: Parse papers
      for (const paper of papers) {
        const result = this.parsePaper(paper);
        if (result) {
          results.push(result);
        }
      }

      this.logger.log(`Found ${results.length} publications from Semantic Scholar`);
    } catch (error) {
      this.logger.error(`Error fetching from Semantic Scholar: ${error.message}`);
    }

    return results;
  }

  async searchPublications(
    query: string,
    options?: ScraperOptions,
  ): Promise<ScraperResult[]> {
    const results: ScraperResult[] = [];

    try {
      await this.rateLimiter.throttle(this.sourceName);

      const params: any = {
        query,
        limit: options?.maxResults || 100,
        fields: 'title,abstract,year,authors,venue,citationCount,externalIds,publicationDate,fieldsOfStudy,url',
      };

      if (options?.yearFrom || options?.yearTo) {
        params.year = `${options.yearFrom || ''}-${options.yearTo || ''}`;
      }

      const headers = this.getHeaders();
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/paper/search`, { params, headers }),
      );

      if (response.data && response.data.data) {
        for (const paper of response.data.data) {
          const result = this.parsePaper(paper);
          if (result) {
            results.push(result);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error searching Semantic Scholar: ${error.message}`);
    }

    return results;
  }

  async getPublicationById(id: string): Promise<ScraperResult | null> {
    try {
      await this.rateLimiter.throttle(this.sourceName);

      const params = {
        fields: 'title,abstract,year,authors,venue,citationCount,externalIds,publicationDate,fieldsOfStudy,url',
      };

      const headers = this.getHeaders();
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/paper/${id}`, { params, headers }),
      );

      if (response.data) {
        return this.parsePaper(response.data);
      }
    } catch (error) {
      this.logger.error(`Error fetching paper ${id} from Semantic Scholar: ${error.message}`);
    }

    return null;
  }

  private async findAuthorId(authorName: string): Promise<string | null> {
    try {
      await this.rateLimiter.throttle(this.sourceName);

      const params = {
        query: authorName,
        limit: 5,
      };

      const headers = this.getHeaders();
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/author/search`, { params, headers }),
      );

      if (response.data && response.data.data && response.data.data.length > 0) {
        // Return the first matching author
        // TODO: Could improve by checking affiliation to match institution
        return response.data.data[0].authorId;
      }
    } catch (error) {
      this.logger.error(`Error searching for author: ${error.message}`);
    }

    return null;
  }

  private async fetchAuthorPapers(
    authorId: string,
    options?: ScraperOptions,
  ): Promise<any[]> {
    const papers: any[] = [];

    try {
      await this.rateLimiter.throttle(this.sourceName);

      const params: any = {
        fields: 'title,abstract,year,authors,venue,citationCount,externalIds,publicationDate,fieldsOfStudy,url',
        limit: options?.maxResults || 100,
      };

      const headers = this.getHeaders();
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/author/${authorId}/papers`, {
          params,
          headers,
        }),
      );

      if (response.data && response.data.data) {
        papers.push(...response.data.data);
      }
    } catch (error) {
      this.logger.error(`Error fetching author papers: ${error.message}`);
    }

    return papers;
  }

  private parsePaper(paper: any): ScraperResult | null {
    try {
      if (!paper || !paper.title) {
        return null;
      }

      // Parse authors
      const authors = [];
      if (paper.authors) {
        for (const author of paper.authors) {
          authors.push({
            name: author.name || 'Unknown',
            affiliation: undefined, // Semantic Scholar doesn't always provide this in basic query
            email: undefined,
          });
        }
      }

      // Extract DOI
      let doi: string | undefined;
      if (paper.externalIds) {
        doi = paper.externalIds.DOI || paper.externalIds.doi;
      }

      // Parse year
      const year = paper.year || paper.publicationDate?.split('-')[0];

      const result: ScraperResult = {
        title: paper.title,
        abstract: paper.abstract || undefined,
        publicationYear: parseInt(year) || new Date().getFullYear(),
        publicationDate: paper.publicationDate
          ? new Date(paper.publicationDate)
          : undefined,
        venueType: paper.venue ? 'journal' : undefined,
        venueName: paper.venue || undefined,
        doi,
        externalUrl: paper.url || undefined,
        citationCount: paper.citationCount || 0,
        source: this.sourceName,
        sourceId: paper.paperId || undefined,
        rawMetadata: paper,
        authors,
        keywords: paper.fieldsOfStudy || undefined,
      };

      return result;
    } catch (error) {
      this.logger.error(`Error parsing paper: ${error.message}`);
      return null;
    }
  }

  private getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    return headers;
  }
}
