import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { FacultyModule } from './modules/faculty/faculty.module';
import { PublicationsModule } from './modules/publications/publications.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ScrapersModule } from './modules/scrapers/scrapers.module';

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
    ScheduleModule.forRoot(),
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
