import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsDateString,
  IsUrl,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AuthorDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  authorId?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'University Name', required: false })
  @IsString()
  @IsOptional()
  affiliation?: string;

  @ApiProperty({ example: 'john.doe@college.edu', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  facultyId?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isCorresponding?: boolean;
}

export class CreatePublicationDto {
  @ApiProperty({
    example: 'Deep Learning Approaches for Natural Language Processing',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'This paper presents a comprehensive survey...',
    required: false,
  })
  @IsString()
  @IsOptional()
  abstract?: string;

  @ApiProperty({ example: 2023 })
  @IsInt()
  @Min(1900)
  publicationYear: number;

  @ApiProperty({ example: '2023-06-15', required: false })
  @IsDateString()
  @IsOptional()
  publicationDate?: string;

  @ApiProperty({ example: 'journal', required: false })
  @IsString()
  @IsOptional()
  venueType?: string;

  @ApiProperty({ example: 'IEEE Transactions on Neural Networks', required: false })
  @IsString()
  @IsOptional()
  venueName?: string;

  @ApiProperty({ example: '34', required: false })
  @IsString()
  @IsOptional()
  volume?: string;

  @ApiProperty({ example: '5', required: false })
  @IsString()
  @IsOptional()
  issue?: string;

  @ApiProperty({ example: '1234-1256', required: false })
  @IsString()
  @IsOptional()
  pages?: string;

  @ApiProperty({ example: '10.1109/TNNLS.2023.1234567', required: false })
  @IsString()
  @IsOptional()
  doi?: string;

  @ApiProperty({ example: '978-1-7281-6926-2', required: false })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiProperty({ example: '2162-237X', required: false })
  @IsString()
  @IsOptional()
  issn?: string;

  @ApiProperty({ example: 'https://example.com/paper.pdf', required: false })
  @IsUrl()
  @IsOptional()
  pdfUrl?: string;

  @ApiProperty({ example: 'https://ieeexplore.ieee.org/document/123', required: false })
  @IsUrl()
  @IsOptional()
  externalUrl?: string;

  @ApiProperty({ example: 42, required: false, default: 0 })
  @IsInt()
  @IsOptional()
  citationCount?: number;

  @ApiProperty({ example: 'ieee_xplore', required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ example: '9876543', required: false })
  @IsString()
  @IsOptional()
  sourceId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  rawMetadata?: any;

  @ApiProperty({ type: [AuthorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuthorDto)
  authors: AuthorDto[];

  @ApiProperty({ example: ['machine learning', 'NLP', 'deep learning'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywords?: string[];
}
