import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

@Injectable()
export class FacultyService {
  constructor(private prisma: PrismaService) {}

  async create(createFacultyDto: CreateFacultyDto) {
    return this.prisma.faculty.create({
      data: createFacultyDto,
      include: {
        department: true,
      },
    });
  }

  async bulkImport(facultyList: CreateFacultyDto[]) {
    const results = {
      success: [],
      failed: [],
      total: facultyList.length,
    };

    for (const facultyData of facultyList) {
      try {
        // Check if faculty already exists by email
        const existing = await this.prisma.faculty.findUnique({
          where: { email: facultyData.email },
        });

        if (existing) {
          results.failed.push({
            data: facultyData,
            error: 'Faculty with this email already exists',
          });
          continue;
        }

        const faculty = await this.create(facultyData);
        results.success.push(faculty);
      } catch (error) {
        results.failed.push({
          data: facultyData,
          error: error.message,
        });
      }
    }

    return results;
  }

  async findAll(includeInactive = false) {
    return this.prisma.faculty.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        department: true,
        _count: {
          select: {
            authors: true,
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findOne(id: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
      include: {
        department: true,
        authors: {
          include: {
            publications: {
              include: {
                publication: {
                  include: {
                    authors: {
                      include: {
                        author: true,
                      },
                      orderBy: {
                        authorPosition: 'asc',
                      },
                    },
                    keywords: {
                      include: {
                        keyword: true,
                      },
                    },
                  },
                },
              },
              orderBy: {
                publication: {
                  publicationYear: 'desc',
                },
              },
            },
          },
        },
      },
    });

    if (!faculty) {
      throw new NotFoundException(`Faculty with ID ${id} not found`);
    }

    return faculty;
  }

  async findByEmail(email: string) {
    return this.prisma.faculty.findUnique({
      where: { email },
      include: {
        department: true,
      },
    });
  }

  async findByDepartment(departmentId: string) {
    return this.prisma.faculty.findMany({
      where: {
        departmentId,
        isActive: true,
      },
      include: {
        department: true,
        _count: {
          select: {
            authors: true,
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async update(id: string, updateFacultyDto: UpdateFacultyDto) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
    });

    if (!faculty) {
      throw new NotFoundException(`Faculty with ID ${id} not found`);
    }

    return this.prisma.faculty.update({
      where: { id },
      data: updateFacultyDto,
      include: {
        department: true,
      },
    });
  }

  async remove(id: string) {
    const faculty = await this.prisma.faculty.findUnique({
      where: { id },
    });

    if (!faculty) {
      throw new NotFoundException(`Faculty with ID ${id} not found`);
    }

    return this.prisma.faculty.delete({
      where: { id },
    });
  }

  async getPublicationStats(id: string) {
    const faculty = await this.findOne(id);

    // Extract ALL publications from authors (may contain duplicates)
    const allPublications = faculty.authors.flatMap((author) =>
      author.publications.map((pa) => pa.publication),
    );

    // Deduplicate publications by ID
    const uniquePublicationsMap = new Map();
    allPublications.forEach((pub) => {
      uniquePublicationsMap.set(pub.id, pub);
    });
    const publications = Array.from(uniquePublicationsMap.values());

    // Group by year
    const publicationsByYear = publications.reduce(
      (acc, pub) => {
        const year = pub.publicationYear;
        if (!acc[year]) {
          acc[year] = 0;
        }
        acc[year]++;
        return acc;
      },
      {} as Record<number, number>,
    );

    // Calculate total citations
    const totalCitations = publications.reduce(
      (sum, pub) => sum + pub.citationCount,
      0,
    );

    return {
      totalPublications: publications.length,
      totalCitations,
      publicationsByYear: Object.entries(publicationsByYear)
        .map(([year, count]) => ({
          year: parseInt(year),
          count,
        }))
        .sort((a, b) => b.year - a.year),
      recentPublications: publications
        .sort((a, b) => b.publicationYear - a.publicationYear)
        .slice(0, 5),
    };
  }
}
