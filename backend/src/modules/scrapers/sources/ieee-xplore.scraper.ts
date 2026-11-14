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
export class IEEEXploreScraper extends BaseScraper {
  sourceName = 'ieee_xplore';
  private readonly logger = new Logger(IEEEXploreScraper.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://ieeexploreapi.ieee.org/api/v1/search/articles';

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private rateLimiter: RateLimiterService,
  ) {
    super();
    this.apiKey = this.configService.get<string>('IEEE_API_KEY');

    // Configure rate limiter (200 requests per day for free tier)
    const requestsPerDay = parseInt(
      this.configService.get<string>('IEEE_REQUESTS_PER_DAY') || '200',
    );
    this.rateLimiter.registerLimiter(this.sourceName, {
      requestsPerDay,
      requestsPerSecond: 1, // Also limit to 1 per second to be safe
    });
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey !== 'your-ieee-api-key-here';
  }

  async fetchPublications(
    faculty: FacultySearchData,
    options?: ScraperOptions,
  ): Promise<ScraperResult[]> {
    if (!this.isAvailable()) {
      this.logger.warn('IEEE Xplore API key not configured');
      return [];
    }

    this.logger.log(`Fetching publications for ${faculty.firstName} ${faculty.lastName}`);

    const results: ScraperResult[] = [];

    // Build search query
    const authorName = this.normalizeAuthorName(faculty.firstName, faculty.lastName);
    const institutionName = this.configService.get<string>('INSTITUTION_NAME');

    // Search with author name and institution
    let query = `author:${authorName}`;
    if (institutionName) {
      query += ` AND affiliation:${institutionName}`;
    }

    try {
      await this.rateLimiter.throttle(this.sourceName);

      const params: any = {
        apikey: this.apiKey,
        querytext: query,
        max_records: options?.maxResults || 100,
        start_record: 1,
      };

      // Add year filters if provided
      if (options?.yearFrom) {
        params.start_year = options.yearFrom;
      }
      if (options?.yearTo) {
        params.end_year = options.yearTo;
      }

      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, { params }),
      );

      if (response.data && response.data.articles) {
        for (const article of response.data.articles) {
          const result = this.parseArticle(article);
          if (result) {
            results.push(result);
          }
        }
      }

      this.logger.log(`Found ${results.length} publications from IEEE Xplore`);
    } catch (error) {
      this.logger.error(`Error fetching from IEEE Xplore: ${error.message}`);
    }

    return results;
  }

  async searchPublications(
    query: string,
    options?: ScraperOptions,
  ): Promise<ScraperResult[]> {
    if (!this.isAvailable()) {
      return [];
    }

    const results: ScraperResult[] = [];

    try {
      await this.rateLimiter.throttle(this.sourceName);

      const params: any = {
        apikey: this.apiKey,
        querytext: query,
        max_records: options?.maxResults || 100,
        start_record: 1,
      };

      if (options?.yearFrom) {
        params.start_year = options.yearFrom;
      }
      if (options?.yearTo) {
        params.end_year = options.yearTo;
      }

      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, { params }),
      );

      if (response.data && response.data.articles) {
        for (const article of response.data.articles) {
          const result = this.parseArticle(article);
          if (result) {
            results.push(result);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error searching IEEE Xplore: ${error.message}`);
    }

    return results;
  }

  async getPublicationById(id: string): Promise<ScraperResult | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      await this.rateLimiter.throttle(this.sourceName);

      const params = {
        apikey: this.apiKey,
        article_number: id,
      };

      const response = await firstValueFrom(
        this.httpService.get(this.baseUrl, { params }),
      );

      if (response.data && response.data.articles && response.data.articles[0]) {
        return this.parseArticle(response.data.articles[0]);
      }
    } catch (error) {
      this.logger.error(`Error fetching article ${id} from IEEE Xplore: ${error.message}`);
    }

    return null;
  }

  private parseArticle(article: any): ScraperResult | null {
    try {
      // Parse authors
      const authors = [];
      if (article.authors && article.authors.authors) {
        for (const author of article.authors.authors) {
          authors.push({
            name: author.full_name || author.author_name || 'Unknown',
            affiliation: author.affiliation || undefined,
            email: undefined, // IEEE API doesn't provide emails
          });
        }
      }

      // Determine venue type
      let venueType = 'conference';
      if (article.content_type === 'Journals') {
        venueType = 'journal';
      } else if (article.content_type === 'Conferences') {
        venueType = 'conference';
      }

      // Parse keywords
      const keywords: string[] = [];
      if (article.index_terms) {
        if (article.index_terms.ieee_terms) {
          keywords.push(...article.index_terms.ieee_terms.terms);
        }
        if (article.index_terms.author_terms) {
          keywords.push(...article.index_terms.author_terms.terms);
        }
      }

      const result: ScraperResult = {
        title: article.title || '',
        abstract: article.abstract || undefined,
        publicationYear: parseInt(article.publication_year) || new Date().getFullYear(),
        publicationDate: article.publication_date
          ? new Date(article.publication_date)
          : undefined,
        venueType,
        venueName: article.publication_title || undefined,
        volume: article.volume || undefined,
        issue: article.issue || undefined,
        pages: article.start_page && article.end_page
          ? `${article.start_page}-${article.end_page}`
          : undefined,
        doi: article.doi || undefined,
        isbn: article.isbn || undefined,
        issn: article.issn || undefined,
        pdfUrl: article.pdf_url || undefined,
        externalUrl: article.html_url || undefined,
        citationCount: parseInt(article.citing_paper_count) || 0,
        source: this.sourceName,
        sourceId: article.article_number || undefined,
        rawMetadata: article,
        authors,
        keywords: keywords.length > 0 ? keywords : undefined,
      };

      return result;
    } catch (error) {
      this.logger.error(`Error parsing article: ${error.message}`);
      return null;
    }
  }
}
