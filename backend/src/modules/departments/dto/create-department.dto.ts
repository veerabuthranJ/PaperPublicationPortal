import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Computer Science and Engineering' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'CSE' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Department of Computer Science and Engineering',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
