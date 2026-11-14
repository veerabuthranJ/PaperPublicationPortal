import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../database/prisma.service';
import { OrchestratorService } from '../../scrapers/orchestrator.service';

@Processor('scraping')
export class ScrapingProcessor {
  private readonly logger = new Logger(ScrapingProcessor.name);

  constructor(
    private prisma: PrismaService,
    private orchestrator: OrchestratorService,
  ) {}

  @Process('scrape')
  async handleScraping(job: Job) {
    const { facultyId, source, jobRecordId, options } = job.data;

    this.logger.log(
      `Starting scraping job ${job.id} for faculty ${facultyId} from ${source}`,
    );

    try {
      // Update job status to running
      await this.prisma.scrapingJob.update({
        where: { id: jobRecordId },
        data: {
          status: 'running',
          startedAt: new Date(),
        },
      });

      job.progress(25);

      // Run the scraping orchestrator
      const sources = source === 'all' ? undefined : [source];
      const results = await this.orchestrator.scrapeFaculty(
        facultyId,
        sources,
        options,
      );

      job.progress(75);

      // Aggregate results
      const totalFound = results.reduce((sum, r) => sum + r.publicationsFound, 0);
      const totalAdded = results.reduce((sum, r) => sum + r.publicationsAdded, 0);
      const totalUpdated = results.reduce((sum, r) => sum + r.publicationsUpdated, 0);
      const errors = results.flatMap((r) => r.errors);

      // Update job status to completed
      await this.prisma.scrapingJob.update({
        where: { id: jobRecordId },
        data: {
          status: errors.length > 0 ? 'completed' : 'completed',
          completedAt: new Date(),
          publicationsFound: totalFound,
          publicationsAdded: totalAdded,
          publicationsUpdated: totalUpdated,
          errorMessage: errors.length > 0 ? errors.join('; ') : null,
          metadata: { results } as any,
        },
      });

      job.progress(100);

      this.logger.log(
        `Completed scraping job ${job.id}: ${totalFound} found, ${totalAdded} added, ${totalUpdated} updated`,
      );

      return {
        publicationsFound: totalFound,
        publicationsAdded: totalAdded,
        publicationsUpdated: totalUpdated,
        sources: results.map((r) => r.source),
      };
    } catch (error) {
      this.logger.error(
        `Failed scraping job ${job.id}: ${error.message}`,
        error.stack,
      );

      // Update job status to failed
      await this.prisma.scrapingJob.update({
        where: { id: jobRecordId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }
}
