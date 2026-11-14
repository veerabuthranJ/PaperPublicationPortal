export interface ScraperResult {
  title: string;
  abstract?: string;
  publicationYear: number;
  publicationDate?: Date;
  venueType?: string;
  venueName?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  isbn?: string;
  issn?: string;
  pdfUrl?: string;
  externalUrl?: string;
  citationCount?: number;
  source: string;
  sourceId?: string;
  rawMetadata?: any;
  authors: {
    name: string;
    affiliation?: string;
    email?: string;
  }[];
  keywords?: string[];
}

export interface FacultySearchData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  googleScholarId?: string;
  orcidId?: string;
  ieeeAuthorId?: string;
  scopusAuthorId?: string;
  department?: {
    name: string;
  };
}

export interface ScraperOptions {
  maxResults?: number;
  yearFrom?: number;
  yearTo?: number;
}

export abstract class BaseScraper {
  abstract sourceName: string;

  /**
   * Fetch publications for a faculty member
   */
  abstract fetchPublications(
    faculty: FacultySearchData,
    options?: ScraperOptions,
  ): Promise<ScraperResult[]>;

  /**
   * Search publications by query
   */
  abstract searchPublications(
    query: string,
    options?: ScraperOptions,
  ): Promise<ScraperResult[]>;

  /**
   * Get publication details by ID/DOI
   */
  abstract getPublicationById(id: string): Promise<ScraperResult | null>;

  /**
   * Check if scraper is available and configured
   */
  abstract isAvailable(): boolean;

  /**
   * Normalize author name for searching
   */
  protected normalizeAuthorName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
  }

  /**
   * Build search query for faculty
   */
  protected buildFacultyQuery(faculty: FacultySearchData): string {
    const name = this.normalizeAuthorName(faculty.firstName, faculty.lastName);
    return name;
  }

  /**
   * Delay execution for rate limiting
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
