import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScraperResult } from '../interfaces/base-scraper.interface';
import * as similarity from 'string-similarity';

@Injectable()
export class InstitutionFilterService {
  private institutionName: string;
  private institutionDomains: string[];
  private institutionAliases: string[];

  constructor(private configService: ConfigService) {
    this.institutionName = this.configService.get<string>('INSTITUTION_NAME');
    this.institutionDomains = (
      this.configService.get<string>('INSTITUTION_DOMAINS') || ''
    )
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    this.institutionAliases = (
      this.configService.get<string>('INSTITUTION_ALIASES') || ''
    )
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);

    // Add the main institution name to aliases
    if (this.institutionName) {
      this.institutionAliases.push(this.institutionName);
    }
  }

  /**
   * Check if a publication belongs to our institution
   * Returns a confidence score (0-1)
   */
  filterPublication(result: ScraperResult): {
    belongs: boolean;
    confidence: number;
    reason: string;
  } {
    const scores: Array<{ score: number; reason: string }> = [];

    // 1. Check author email domains
    const emailScore = this.checkEmailDomains(result);
    if (emailScore.score > 0) {
      scores.push(emailScore);
    }

    // 2. Check author affiliations
    const affiliationScore = this.checkAffiliations(result);
    if (affiliationScore.score > 0) {
      scores.push(affiliationScore);
    }

    // Calculate overall confidence
    if (scores.length === 0) {
      return {
        belongs: false,
        confidence: 0,
        reason: 'No institutional markers found',
      };
    }

    // Take the highest score
    const best = scores.reduce((prev, current) =>
      current.score > prev.score ? current : prev,
    );

    return {
      belongs: best.score >= 0.7, // Threshold for inclusion
      confidence: best.score,
      reason: best.reason,
    };
  }

  /**
   * Check if any author has an email from our institution
   */
  private checkEmailDomains(result: ScraperResult): {
    score: number;
    reason: string;
  } {
    if (this.institutionDomains.length === 0) {
      return { score: 0, reason: '' };
    }

    for (const author of result.authors) {
      if (author.email) {
        for (const domain of this.institutionDomains) {
          if (author.email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)) {
            return {
              score: 1.0,
              reason: `Author ${author.name} has institutional email: ${author.email}`,
            };
          }
        }
      }
    }

    return { score: 0, reason: '' };
  }

  /**
   * Check if any author has our institution in their affiliation
   */
  private checkAffiliations(result: ScraperResult): {
    score: number;
    reason: string;
  } {
    if (this.institutionAliases.length === 0) {
      return { score: 0, reason: '' };
    }

    let bestScore = 0;
    let bestReason = '';
    let bestAuthor = '';

    for (const author of result.authors) {
      if (author.affiliation) {
        const normalizedAffiliation = author.affiliation.toLowerCase();

        // Check each alias
        for (const alias of this.institutionAliases) {
          const normalizedAlias = alias.toLowerCase();

          // Exact substring match
          if (normalizedAffiliation.includes(normalizedAlias)) {
            return {
              score: 1.0,
              reason: `Author ${author.name} affiliated with: ${author.affiliation}`,
            };
          }

          // Fuzzy match using string similarity
          const score = similarity.compareTwoStrings(
            normalizedAffiliation,
            normalizedAlias,
          );

          if (score > bestScore) {
            bestScore = score;
            bestAuthor = author.name;
            bestReason = `Author ${author.name} affiliation similarity: ${(score * 100).toFixed(0)}% (${author.affiliation})`;
          }
        }
      }
    }

    // Only return fuzzy matches above threshold
    if (bestScore >= 0.7) {
      return { score: bestScore, reason: bestReason };
    }

    return { score: 0, reason: '' };
  }

  /**
   * Filter a list of publications
   */
  filterPublications(results: ScraperResult[]): {
    included: ScraperResult[];
    excluded: ScraperResult[];
    filtered: Array<{
      publication: ScraperResult;
      confidence: number;
      reason: string;
    }>;
  } {
    const included: ScraperResult[] = [];
    const excluded: ScraperResult[] = [];
    const filtered: Array<{
      publication: ScraperResult;
      confidence: number;
      reason: string;
    }> = [];

    for (const result of results) {
      const filter = this.filterPublication(result);

      if (filter.belongs) {
        included.push(result);
        filtered.push({
          publication: result,
          confidence: filter.confidence,
          reason: filter.reason,
        });
      } else {
        excluded.push(result);
      }
    }

    return { included, excluded, filtered };
  }

  /**
   * Get institution configuration
   */
  getConfig() {
    return {
      institutionName: this.institutionName,
      domains: this.institutionDomains,
      aliases: this.institutionAliases,
    };
  }
}
