import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ScraperResult } from '../interfaces/base-scraper.interface';
import * as levenshtein from 'fast-levenshtein';

@Injectable()
export class DeduplicationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if a publication already exists in the database
   * Returns the existing publication if found, null otherwise
   */
  async findExistingPublication(result: ScraperResult) {
    // 1. Try exact DOI match first (most reliable)
    if (result.doi) {
      const existing = await this.prisma.publication.findUnique({
        where: { doi: result.doi },
      });
      if (existing) {
        return { publication: existing, matchType: 'doi' };
      }
    }

    // 2. Try source ID match
    if (result.sourceId) {
      const existing = await this.prisma.publication.findFirst({
        where: {
          source: result.source,
          sourceId: result.sourceId,
        },
      });
      if (existing) {
        return { publication: existing, matchType: 'sourceId' };
      }
    }

    // 3. Try title similarity match (fuzzy)
    const candidates = await this.prisma.publication.findMany({
      where: {
        publicationYear: {
          gte: result.publicationYear - 1,
          lte: result.publicationYear + 1,
        },
      },
      select: {
        id: true,
        title: true,
        publicationYear: true,
        authors: {
          include: {
            author: true,
          },
        },
      },
    });

    // Check title similarity for each candidate
    for (const candidate of candidates) {
      const similarity = this.calculateTitleSimilarity(
        result.title,
        candidate.title,
      );

      if (similarity > 0.85) {
        // High title similarity, check author overlap
        const authorOverlap = this.calculateAuthorOverlap(
          result.authors.map((a) => a.name),
          candidate.authors.map((pa) => pa.author.name),
        );

        if (authorOverlap > 0.5) {
          const fullPublication = await this.prisma.publication.findUnique({
            where: { id: candidate.id },
          });
          return {
            publication: fullPublication,
            matchType: 'similarity',
            similarity,
            authorOverlap,
          };
        }
      }
    }

    return null;
  }

  /**
   * Calculate title similarity using Levenshtein distance
   */
  calculateTitleSimilarity(title1: string, title2: string): number {
    const normalized1 = this.normalizeTitle(title1);
    const normalized2 = this.normalizeTitle(title2);

    const distance = levenshtein.get(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);

    return 1 - distance / maxLength;
  }

  /**
   * Calculate author overlap between two author lists
   */
  calculateAuthorOverlap(authors1: string[], authors2: string[]): number {
    if (authors1.length === 0 || authors2.length === 0) {
      return 0;
    }

    const normalized1 = authors1.map((a) => this.normalizeAuthorName(a));
    const normalized2 = authors2.map((a) => this.normalizeAuthorName(a));

    let matches = 0;
    for (const author1 of normalized1) {
      for (const author2 of normalized2) {
        if (this.authorsMatch(author1, author2)) {
          matches++;
          break;
        }
      }
    }

    return matches / Math.max(authors1.length, authors2.length);
  }

  /**
   * Check if two author names refer to the same person
   */
  private authorsMatch(name1: string, name2: string): boolean {
    // Exact match
    if (name1 === name2) {
      return true;
    }

    // Check for initials vs full name (e.g., "J. Doe" vs "John Doe")
    const parts1 = name1.split(' ');
    const parts2 = name2.split(' ');

    if (parts1.length !== parts2.length) {
      return false;
    }

    for (let i = 0; i < parts1.length; i++) {
      const p1 = parts1[i];
      const p2 = parts2[i];

      // Check if one is initial and other is full name
      if (p1.length === 1 || p1.length === 2) {
        // p1 might be initial
        if (!p2.startsWith(p1[0])) {
          return false;
        }
      } else if (p2.length === 1 || p2.length === 2) {
        // p2 might be initial
        if (!p1.startsWith(p2[0])) {
          return false;
        }
      } else {
        // Both are full names, must match
        if (p1 !== p2) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Normalize title for comparison
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Normalize author name for comparison
   */
  private normalizeAuthorName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s.-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Deduplicate a list of scraper results
   */
  async deduplicateResults(
    results: ScraperResult[],
  ): Promise<ScraperResult[]> {
    const unique: ScraperResult[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      // Create a key based on DOI or normalized title
      const key = result.doi
        ? `doi:${result.doi}`
        : `title:${this.normalizeTitle(result.title)}:${result.publicationYear}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(result);
      }
    }

    return unique;
  }

  /**
   * Merge metadata from multiple sources
   */
  mergePublicationData(
    existing: any,
    newData: ScraperResult,
  ): Partial<ScraperResult> {
    return {
      // Prefer non-empty values
      title: existing.title || newData.title,
      abstract: existing.abstract || newData.abstract,
      doi: existing.doi || newData.doi,
      pdfUrl: existing.pdfUrl || newData.pdfUrl,
      externalUrl: existing.externalUrl || newData.externalUrl,

      // Take the higher citation count
      citationCount: Math.max(
        existing.citationCount || 0,
        newData.citationCount || 0,
      ),

      // Keep existing metadata but add new source info
      rawMetadata: {
        ...(existing.rawMetadata || {}),
        [newData.source]: newData.rawMetadata,
      },
    };
  }
}
