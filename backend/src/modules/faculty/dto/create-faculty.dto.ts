import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFacultyDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'john.doe@college.edu' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'uuid-of-department', required: false })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ example: 'Professor', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ example: 'https://example.com/photo.jpg', required: false })
  @IsString()
  @IsOptional()
  profileImageUrl?: string;

  @ApiProperty({
    example: 'Specializes in machine learning and data science',
    required: false,
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: 'ABC123XYZ', required: false })
  @IsString()
  @IsOptional()
  googleScholarId?: string;

  @ApiProperty({ example: '0000-0002-1825-0097', required: false })
  @IsString()
  @IsOptional()
  orcidId?: string;

  @ApiProperty({ example: '12345678', required: false })
  @IsString()
  @IsOptional()
  ieeeAuthorId?: string;

  @ApiProperty({ example: '987654321', required: false })
  @IsString()
  @IsOptional()
  scopusAuthorId?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
