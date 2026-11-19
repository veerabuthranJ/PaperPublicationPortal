import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrchestratorService } from '../scrapers/orchestrator.service';

export interface ScrapingJobData {
  facultyId?: string;
  source: string;
  options?: any;
}

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private prisma: PrismaService,
    private orchestrator: OrchestratorService,
  ) {}

  async addScrapingJob(data: ScrapingJobData) {
    // Create job record in database
    const jobRecord = await this.prisma.scrapingJob.create({
      data: {
        facultyId: data.facultyId,
        source: data.source,
        status: 'pending',
        metadata: data.options || {},
      },
    });

    // Run scraping directly (fire-and-forget)
    this.runScrapingJob(jobRecord.id, data).catch((error) => {
      this.logger.error(`Scraping job ${jobRecord.id} failed: ${error.message}`);
    });

    return {
      jobRecordId: jobRecord.id,
      status: 'running',
    };
  }

  private async runScrapingJob(jobRecordId: string, data: ScrapingJobData) {
    try {
      await this.prisma.scrapingJob.update({
        where: { id: jobRecordId },
        data: { status: 'running', startedAt: new Date() },
      });

      const sources = data.source === 'all' ? undefined : [data.source];
      const results = await this.orchestrator.scrapeFaculty(
        data.facultyId,
        sources,
        data.options,
      );

      const totalFound = results.reduce((sum, r) => sum + r.publicationsFound, 0);
      const totalAdded = results.reduce((sum, r) => sum + r.publicationsAdded, 0);
      const totalUpdated = results.reduce((sum, r) => sum + r.publicationsUpdated, 0);
      const errors = results.flatMap((r) => r.errors);

      await this.prisma.scrapingJob.update({
        where: { id: jobRecordId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          publicationsFound: totalFound,
          publicationsAdded: totalAdded,
          publicationsUpdated: totalUpdated,
          errorMessage: errors.length > 0 ? errors.join('; ') : null,
          metadata: { results } as any,
        },
      });

      this.logger.log(
        `Scraping job ${jobRecordId}: ${totalFound} found, ${totalAdded} added, ${totalUpdated} updated`,
      );
    } catch (error) {
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

  async scrapeFaculty(facultyId: string, sources?: string[]) {
    const defaultSources = sources || [
      'orcid',
      'google_scholar',
      'semantic_scholar',
    ];

    const jobs = await Promise.all(
      defaultSources.map((source) =>
        this.addScrapingJob({
          facultyId,
          source,
        }),
      ),
    );

    return {
      message: `Started ${jobs.length} scraping jobs for faculty`,
      jobs,
    };
  }

  async scrapeAllFaculty(sources?: string[]) {
    const activeFaculty = await this.prisma.faculty.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const jobs = await Promise.all(
      activeFaculty.map((faculty) =>
        this.scrapeFaculty(faculty.id, sources),
      ),
    );

    return {
      message: `Started scraping for ${activeFaculty.length} faculty members`,
      totalJobs: jobs.reduce((sum, j) => sum + j.jobs.length, 0),
    };
  }

  async listJobs(
    page = 1,
    limit = 20,
    status?: string,
    facultyId?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (facultyId) {
      where.facultyId = facultyId;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.scrapingJob.findMany({
        where,
        include: {
          faculty: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.scrapingJob.count({ where }),
    ]);

    return {
      data: jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
