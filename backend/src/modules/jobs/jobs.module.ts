import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { ScrapingProcessor } from './processors/scraping.processor';
import { ScrapersModule } from '../scrapers/scrapers.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scraping',
    }),
    ScrapersModule,
  ],
  controllers: [JobsController],
  providers: [JobsService, ScrapingProcessor],
  exports: [JobsService],
})
export class JobsModule {}
