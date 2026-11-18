import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobsService } from './jobs.service';

@Injectable()
export class AutoScrapeService {
  private readonly logger = new Logger(AutoScrapeService.name);
  private isRunning = false;

  constructor(private jobsService: JobsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyScrape() {
    if (this.isRunning) {
      this.logger.warn('Auto-scrape already running, skipping');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting daily auto-scrape for all faculty');

    try {
      const result = await this.jobsService.scrapeAllFaculty();
      this.logger.log(
        `Daily auto-scrape queued: ${result.totalJobs} jobs for ${result.message}`,
      );
    } catch (error) {
      this.logger.error(`Daily auto-scrape failed: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }
}
