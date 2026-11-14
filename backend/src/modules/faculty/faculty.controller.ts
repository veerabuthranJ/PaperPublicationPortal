import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FacultyService } from './faculty.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { ImportFacultyDto } from './dto/import-faculty.dto';

@ApiTags('faculty')
@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new faculty member' })
  create(@Body() createFacultyDto: CreateFacultyDto) {
    return this.facultyService.create(createFacultyDto);
  }

  @Post('bulk-import')
  @ApiOperation({ summary: 'Bulk import multiple faculty members' })
  bulkImport(@Body() importFacultyDto: ImportFacultyDto) {
    return this.facultyService.bulkImport(importFacultyDto.faculty);
  }

  @Get()
  @ApiOperation({ summary: 'Get all faculty members' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive faculty members',
  })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.facultyService.findAll(includeInactive === 'true');
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'Get faculty by department' })
  findByDepartment(@Param('departmentId') departmentId: string) {
    return this.facultyService.findByDepartment(departmentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a faculty member by ID' })
  findOne(@Param('id') id: string) {
    return this.facultyService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get publication statistics for a faculty member' })
  getStats(@Param('id') id: string) {
    return this.facultyService.getPublicationStats(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a faculty member' })
  update(@Param('id') id: string, @Body() updateFacultyDto: UpdateFacultyDto) {
    return this.facultyService.update(id, updateFacultyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a faculty member' })
  remove(@Param('id') id: string) {
    return this.facultyService.remove(id);
  }
}
