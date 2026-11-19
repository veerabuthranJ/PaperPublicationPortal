import { Module } from '@nestjs/common';
import { FacultyController } from './faculty.controller';
import { FacultyService } from './faculty.service';
import { FacultySeedService } from './faculty-seed.service';

@Module({
  controllers: [FacultyController],
  providers: [FacultyService, FacultySeedService],
  exports: [FacultyService],
})
export class FacultyModule {}
