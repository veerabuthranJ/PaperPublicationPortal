import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { AutoScrapeService } from './auto-scrape.service';
import { ScrapersModule } from '../scrapers/scrapers.module';

@Module({
  imports: [ScrapersModule],
  controllers: [JobsController],
  providers: [JobsService, AutoScrapeService],
  exports: [JobsService],
})
export class JobsModule {}
