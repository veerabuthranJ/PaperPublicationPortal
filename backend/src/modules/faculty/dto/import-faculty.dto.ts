import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateFacultyDto } from './create-faculty.dto';

export class ImportFacultyDto {
  @ApiProperty({
    type: [CreateFacultyDto],
    description: 'Array of faculty members to import',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFacultyDto)
  faculty: CreateFacultyDto[];
}
