import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import {
  BaseScraper,
  ScraperResult,
  FacultySearchData,
  ScraperOptions,
} from '../interfaces/base-scraper.interface';
import { RateLimiterService } from '../utils/rate-limiter.service';

@Injectable()
export class GoogleScholarScraper extends BaseScraper {
  sourceName = 'google_scholar';
  private readonly logger = new Logger(GoogleScholarScraper.name);
  private readonly serpApiKey?: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private rateLimiter: RateLimiterService,
  ) {
    super();
    this.serpApiKey = this.configService.get<string>('SERPAPI_KEY');

    // Configure rate limiter (conservative to avoid blocking)
    this.rateLimiter.registerLimiter(this.sourceName, {
      requestsPerSecond: 0.2, // 1 request every 5 seconds
    });
  }

  isAvailable(): boolean {
    return true; // We can scrape public profiles
  }

  async fetchPublications(
    faculty: FacultySearchData,
    options?: ScraperOptions,
  ): Promise<ScraperResult[]> {
    this.logger.log(
      `Fetching publications for ${faculty.firstName} ${faculty.lastName} from Google Scholar`,
    );

    const results: ScraperResult[] = [];

    try {
      if (!faculty.googleScholarId) {
        this.logger.warn('No Google Scholar ID provided for faculty');
        return [];
      }

      // Fetch publications from Google Scholar profile
      const publications = await this.fetchFromProfile(
        faculty.googleScholarId,
        options,
      );
      results.push(...publications);

      this.logger.log(`Found ${results.length} publications from Google Scholar`);
    } catch (error) {
      this.logger.error(
        `Error fetching from Google Scholar: ${error.message}`,
      );
    }

    return results;
  }

  async searchPublications(
    query: string,
    options?: ScraperOptions,
  ): Promise<ScraperResult[]> {
    this.logger.warn('Direct search not implemented for Google Scholar');
    return [];
  }

  async getPublicationById(id: string): Promise<ScraperResult | null> {
    this.logger.warn('Get by ID not implemented for Google Scholar');
    return null;
  }

  private async fetchFromProfile(
    scholarId: string,
    options?: ScraperOptions,
  ): Promise<ScraperResult[]> {
    const results: ScraperResult[] = [];

    try {
      await this.rateLimiter.throttle(this.sourceName);

      const url = `https://scholar.google.com/citations?user=${scholarId}&hl=en&cstart=0&pagesize=100`;

      this.logger.log(`Fetching Google Scholar profile: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          timeout: 30000,
        }),
      );

      const html = response.data;
      const $ = cheerio.load(html);

      // Parse publications from the page
      $('.gsc_a_tr').each((index, element) => {
        try {
          const $row = $(element);

          // Extract title and link
          const $titleLink = $row.find('.gsc_a_at');
          const title = $titleLink.text().trim();
          const citationLink = $titleLink.attr('data-href') || $titleLink.attr('href');

          // Extract authors
          const authors = $row.find('.gs_gray').eq(0).text().trim();

          // Extract venue/source
          const venue = $row.find('.gs_gray').eq(1).text().trim();

          // Extract year
          const yearText = $row.find('.gsc_a_y span').text().trim();
          const year = yearText ? parseInt(yearText) : new Date().getFullYear();

          // Extract citation count
          const citationText = $row.find('.gsc_a_c').text().trim();
          const citationCount = citationText ? parseInt(citationText) : 0;

          if (title) {
            // Parse authors into array
            const authorList = authors.split(',').map((name) => ({
              name: name.trim(),
              affiliation: undefined,
              email: undefined,
            }));

            const result: ScraperResult = {
              title,
              abstract: undefined,
              publicationYear: year,
              publicationDate: undefined,
              venueType: undefined,
              venueName: venue || undefined,
              doi: undefined,
              externalUrl: citationLink
                ? `https://scholar.google.com${citationLink}`
                : undefined,
              citationCount: citationCount || 0,
              source: this.sourceName,
              sourceId: `${scholarId}:${index}`,
              rawMetadata: {
                title,
                authors,
                venue,
                year,
                citationCount,
                citationLink,
              } as any,
              authors: authorList,
              keywords: undefined,
            };

            results.push(result);
          }
        } catch (error) {
          this.logger.error(`Error parsing publication row: ${error.message}`);
        }
      });

      const maxResults = options?.maxResults || 1000;
      let offset = results.length;
      while (results.length >= 100 && results.length < maxResults) {
        this.logger.log(`Fetching next Google Scholar page at offset ${offset}`);
        const nextPageResults = await this.fetchNextPage(
          scholarId,
          offset,
          options,
        );
        if (nextPageResults.length === 0) {
          break;
        }

        const remaining = maxResults - results.length;
        results.push(...nextPageResults.slice(0, remaining));
        offset += nextPageResults.length;

        if (nextPageResults.length < 100) {
          break;
        }
      }
    } catch (error) {
      this.logger.error(`Error fetching Google Scholar profile: ${error.message}`);
    }

    return results;
  }

  private async fetchNextPage(
    scholarId: string,
    offset: number,
    options?: ScraperOptions,
  ): Promise<ScraperResult[]> {
    const results: ScraperResult[] = [];

    try {
      await this.rateLimiter.throttle(this.sourceName);

      const url = `https://scholar.google.com/citations?user=${scholarId}&hl=en&cstart=${offset}&pagesize=100`;

      this.logger.log(`Fetching next page: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          timeout: 30000,
        }),
      );

      const html = response.data;
      const $ = cheerio.load(html);

      $('.gsc_a_tr').each((index, element) => {
        try {
          const $row = $(element);

          const $titleLink = $row.find('.gsc_a_at');
          const title = $titleLink.text().trim();
          const citationLink = $titleLink.attr('data-href') || $titleLink.attr('href');

          const authors = $row.find('.gs_gray').eq(0).text().trim();
          const venue = $row.find('.gs_gray').eq(1).text().trim();

          const yearText = $row.find('.gsc_a_y span').text().trim();
          const year = yearText ? parseInt(yearText) : new Date().getFullYear();

          const citationText = $row.find('.gsc_a_c').text().trim();
          const citationCount = citationText ? parseInt(citationText) : 0;

          if (title) {
            const authorList = authors.split(',').map((name) => ({
              name: name.trim(),
              affiliation: undefined,
              email: undefined,
            }));

            const result: ScraperResult = {
              title,
              abstract: undefined,
              publicationYear: year,
              publicationDate: undefined,
              venueType: undefined,
              venueName: venue || undefined,
              doi: undefined,
              externalUrl: citationLink
                ? `https://scholar.google.com${citationLink}`
                : undefined,
              citationCount: citationCount || 0,
              source: this.sourceName,
              sourceId: `${scholarId}:${offset + index}`,
              rawMetadata: {
                title,
                authors,
                venue,
                year,
                citationCount,
                citationLink,
              } as any,
              authors: authorList,
              keywords: undefined,
            };

            results.push(result);
          }
        } catch (error) {
          this.logger.error(`Error parsing publication row: ${error.message}`);
        }
      });
    } catch (error) {
      this.logger.error(`Error fetching next page: ${error.message}`);
    }

    return results;
  }
}
