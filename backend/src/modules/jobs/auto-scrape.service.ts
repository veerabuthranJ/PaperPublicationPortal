import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { OrchestratorService } from '../scrapers/orchestrator.service';

@Injectable()
export class AutoScrapeService {
  private readonly logger = new Logger(AutoScrapeService.name);
  private isRunning = false;

  constructor(
    private prisma: PrismaService,
    private orchestrator: OrchestratorService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyScrape() {
    if (this.isRunning) {
      this.logger.warn('Auto-scrape already running, skipping');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting daily auto-scrape for all faculty');

    try {
      const activeFaculty = await this.prisma.faculty.findMany({
        where: { isActive: true },
        select: { id: true, firstName: true, lastName: true },
      });

      this.logger.log(`Scraping publications for ${activeFaculty.length} faculty members`);

      let totalAdded = 0;
      let totalUpdated = 0;

      for (const faculty of activeFaculty) {
        try {
          const results = await this.orchestrator.scrapeFaculty(faculty.id);
          const added = results.reduce((sum, r) => sum + r.publicationsAdded, 0);
          const updated = results.reduce((sum, r) => sum + r.publicationsUpdated, 0);
          totalAdded += added;
          totalUpdated += updated;

          this.logger.log(
            `${faculty.firstName} ${faculty.lastName}: ${added} added, ${updated} updated`,
          );
        } catch (error: any) {
          this.logger.error(
            `Error scraping ${faculty.firstName} ${faculty.lastName}: ${error.message}`,
          );
        }
      }

      this.logger.log(
        `Daily auto-scrape complete: ${totalAdded} added, ${totalUpdated} updated`,
      );
    } catch (error: any) {
      this.logger.error(`Daily auto-scrape failed: ${error.message}`);
    } finally {
      this.isRunning = false;
    }
  }
}
