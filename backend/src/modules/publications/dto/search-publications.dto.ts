import { IsOptional, IsString, IsInt, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchPublicationsDto {
  @ApiProperty({
    example: 'machine learning',
    required: false,
    description: 'Search in title, abstract, and venue name',
  })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({ example: 2023, required: false })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  year?: number;

  @ApiProperty({ example: 2020, required: false })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  yearFrom?: number;

  @ApiProperty({ example: 2023, required: false })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  yearTo?: number;

  @ApiProperty({ required: false, description: 'Filter by department ID' })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ required: false, description: 'Filter by faculty ID' })
  @IsString()
  @IsOptional()
  facultyId?: string;

  @ApiProperty({
    example: ['machine learning', 'NLP'],
    required: false,
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];

  @ApiProperty({
    example: 'ieee_xplore',
    required: false,
    description: 'Filter by data source',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ example: 1, required: false, default: 1 })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({ example: 20, required: false, default: 20 })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @IsOptional()
  limit?: number;
}
