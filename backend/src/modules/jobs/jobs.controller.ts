import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('scrape/faculty/:facultyId')
  @ApiOperation({ summary: 'Start scraping job for a specific faculty member' })
  scrapeFaculty(
    @Param('facultyId') facultyId: string,
    @Body('sources') sources?: string[],
  ) {
    return this.jobsService.scrapeFaculty(facultyId, sources);
  }

  @Post('scrape/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start scraping jobs for all active faculty' })
  scrapeAll(@Body('sources') sources?: string[]) {
    return this.jobsService.scrapeAllFaculty(sources);
  }

  @Get()
  @ApiOperation({ summary: 'List all scraping jobs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'facultyId', required: false, type: String })
  listJobs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('facultyId') facultyId?: string,
  ) {
    return this.jobsService.listJobs(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
      facultyId,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  getStats() {
    return this.jobsService.getQueueStats();
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Get status of a specific job' })
  getJobStatus(@Param('jobId') jobId: string) {
    return this.jobsService.getJobStatus(jobId);
  }

  @Post(':jobId/retry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retry a failed job' })
  retryJob(@Param('jobId') jobId: string) {
    return this.jobsService.retryFailedJob(jobId);
  }

  @Delete(':jobId')
  @ApiOperation({ summary: 'Cancel a job' })
  cancelJob(@Param('jobId') jobId: string) {
    return this.jobsService.cancelJob(jobId);
  }

  @Post('clean')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clean old completed and failed jobs' })
  cleanQueue() {
    return this.jobsService.cleanQueue();
  }
}
