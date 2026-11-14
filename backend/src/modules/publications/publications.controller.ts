import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PublicationsService } from './publications.service';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { SearchPublicationsDto } from './dto/search-publications.dto';

@ApiTags('publications')
@Controller('publications')
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new publication' })
  create(@Body() createPublicationDto: CreatePublicationDto) {
    return this.publicationsService.create(createPublicationDto);
  }

  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search publications with filters' })
  search(@Body() searchDto: SearchPublicationsDto) {
    return this.publicationsService.search(searchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all publications (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.publicationsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get publication statistics' })
  getStatistics() {
    return this.publicationsService.getStatistics();
  }

  @Get('doi/:doi')
  @ApiOperation({ summary: 'Find publication by DOI' })
  findByDoi(@Param('doi') doi: string) {
    return this.publicationsService.findByDoi(doi);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a publication by ID' })
  findOne(@Param('id') id: string) {
    return this.publicationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a publication' })
  update(
    @Param('id') id: string,
    @Body() updatePublicationDto: UpdatePublicationDto,
  ) {
    return this.publicationsService.update(id, updatePublicationDto);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Verify a publication' })
  verify(@Param('id') id: string, @Body('verifiedBy') verifiedBy: string) {
    return this.publicationsService.verify(id, verifiedBy);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a publication' })
  remove(@Param('id') id: string) {
    return this.publicationsService.remove(id);
  }

  @Post('export/bibtex')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export publications as BibTeX' })
  exportBibTeX(@Body('ids') ids: string[]) {
    return this.publicationsService.exportBibTeX(ids);
  }
}
