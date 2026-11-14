import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IEEEXploreScraper } from './sources/ieee-xplore.scraper';
import { SemanticScholarScraper } from './sources/semantic-scholar.scraper';
import { ORCIDScraper } from './sources/orcid.scraper';
import { GoogleScholarScraper } from './sources/google-scholar.scraper';
import { InstitutionFilterService } from './filters/institution-filter.service';
import { DeduplicationService } from './utils/deduplication.service';
import { RateLimiterService } from './utils/rate-limiter.service';
import { OrchestratorService } from './orchestrator.service';

@Module({
  imports: [HttpModule],
  providers: [
    IEEEXploreScraper,
    SemanticScholarScraper,
    ORCIDScraper,
    GoogleScholarScraper,
    InstitutionFilterService,
    DeduplicationService,
    RateLimiterService,
    OrchestratorService,
  ],
  exports: [OrchestratorService],
})
export class ScrapersModule {}
