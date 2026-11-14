import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../database/prisma.service';

export interface ScrapingJobData {
  facultyId?: string;
  source: string;
  options?: any;
}

@Injectable()
export class JobsService {
  constructor(
    @InjectQueue('scraping') private scrapingQueue: Queue,
    private prisma: PrismaService,
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

    // Add job to queue
    const job = await this.scrapingQueue.add('scrape', {
      ...data,
      jobRecordId: jobRecord.id,
    });

    return {
      jobId: job.id,
      jobRecordId: jobRecord.id,
      status: 'queued',
    };
  }

  async scrapeFaculty(facultyId: string, sources?: string[]) {
    const defaultSources = sources || [
      'ieee_xplore',
      'semantic_scholar',
      'google_scholar',
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

  async getJobStatus(jobId: string) {
    const job = await this.scrapingQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();
    const failedReason = job.failedReason;

    return {
      id: job.id,
      state,
      progress,
      failedReason,
      data: job.data,
      returnvalue: job.returnvalue,
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

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.scrapingQueue.getWaitingCount(),
      this.scrapingQueue.getActiveCount(),
      this.scrapingQueue.getCompletedCount(),
      this.scrapingQueue.getFailedCount(),
      this.scrapingQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  async cleanQueue() {
    await this.scrapingQueue.clean(3600000, 'completed'); // Clean completed jobs older than 1 hour
    await this.scrapingQueue.clean(86400000, 'failed'); // Clean failed jobs older than 1 day

    return { message: 'Queue cleaned successfully' };
  }

  async retryFailedJob(jobId: string) {
    const job = await this.scrapingQueue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    await job.retry();
    return { message: 'Job retry initiated', jobId };
  }

  async cancelJob(jobId: string) {
    const job = await this.scrapingQueue.getJob(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    await job.remove();
    return { message: 'Job cancelled successfully', jobId };
  }
}
