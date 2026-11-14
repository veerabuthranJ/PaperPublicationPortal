import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { DatabaseModule } from './database/database.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { FacultyModule } from './modules/faculty/faculty.module';
import { PublicationsModule } from './modules/publications/publications.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ScrapersModule } from './modules/scrapers/scrapers.module';
import { queueConfig } from './config/queue.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    BullModule.forRoot(queueConfig),
    DatabaseModule,
    DepartmentsModule,
    FacultyModule,
    PublicationsModule,
    ScrapersModule,
    JobsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
