import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { SearchPublicationsDto } from './dto/search-publications.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PublicationsService {
  constructor(private prisma: PrismaService) {}

  async create(createPublicationDto: CreatePublicationDto) {
    const { authors, keywords, ...publicationData } = createPublicationDto;

    return this.prisma.publication.create({
      data: {
        ...publicationData,
        authors: authors
          ? {
              create: authors.map((author, index) => ({
                authorPosition: index + 1,
                isCorresponding: author.isCorresponding || false,
                author: {
                  connectOrCreate: {
                    where: { id: author.authorId || 'new' },
                    create: {
                      name: author.name,
                      affiliation: author.affiliation,
                      email: author.email,
                      facultyId: author.facultyId,
                    },
                  },
                },
              })),
            }
          : undefined,
        keywords: keywords
          ? {
              create: keywords.map((keyword) => ({
                keyword: {
                  connectOrCreate: {
                    where: { keyword },
                    create: {
                      keyword,
                      normalized: keyword.toLowerCase().trim(),
                    },
                  },
                },
              })),
            }
          : undefined,
      },
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
    });
  }

  async search(searchDto: SearchPublicationsDto) {
    const {
      query,
      year,
      yearFrom,
      yearTo,
      departmentId,
      facultyId,
      keywords,
      source,
      page = 1,
      limit = 20,
    } = searchDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.PublicationWhereInput = {
      AND: [],
    };

    // Text search
    if (query) {
      (where.AND as Prisma.PublicationWhereInput[]).push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { abstract: { contains: query, mode: 'insensitive' } },
          { venueName: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    // Year filters
    if (year) {
      (where.AND as Prisma.PublicationWhereInput[]).push({
        publicationYear: year,
      });
    } else {
      if (yearFrom) {
        (where.AND as Prisma.PublicationWhereInput[]).push({
          publicationYear: { gte: yearFrom },
        });
      }
      if (yearTo) {
        (where.AND as Prisma.PublicationWhereInput[]).push({
          publicationYear: { lte: yearTo },
        });
      }
    }

    // Faculty filter
    if (facultyId) {
      (where.AND as Prisma.PublicationWhereInput[]).push({
        authors: {
          some: {
            author: {
              facultyId,
            },
          },
        },
      });
    }

    // Department filter
    if (departmentId) {
      (where.AND as Prisma.PublicationWhereInput[]).push({
        authors: {
          some: {
            author: {
              faculty: {
                departmentId,
              },
            },
          },
        },
      });
    }

    // Keywords filter
    if (keywords && keywords.length > 0) {
      (where.AND as Prisma.PublicationWhereInput[]).push({
        keywords: {
          some: {
            keyword: {
              keyword: {
                in: keywords,
                mode: 'insensitive',
              },
            },
          },
        },
      });
    }

    // Source filter
    if (source) {
      (where.AND as Prisma.PublicationWhereInput[]).push({
        source,
      });
    }

    // Remove empty AND array if no filters
    if ((where.AND as Prisma.PublicationWhereInput[]).length === 0) {
      delete where.AND;
    }

    // Execute query
    const [publications, total] = await Promise.all([
      this.prisma.publication.findMany({
        where,
        include: {
          authors: {
            include: {
              author: {
                include: {
                  faculty: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      department: true,
                    },
                  },
                },
              },
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
        orderBy: {
          publicationYear: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.publication.count({ where }),
    ]);

    return {
      data: publications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAll(page = 1, limit = 20) {
    return this.search({ page, limit });
  }

  async findOne(id: string) {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
      include: {
        authors: {
          include: {
            author: {
              include: {
                faculty: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    department: true,
                  },
                },
              },
            },
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
        verifier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }

    return publication;
  }

  async findByDoi(doi: string) {
    return this.prisma.publication.findUnique({
      where: { doi },
      include: {
        authors: {
          include: {
            author: true,
          },
        },
        keywords: {
          include: {
            keyword: true,
          },
        },
      },
    });
  }

  async update(id: string, updatePublicationDto: UpdatePublicationDto) {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
    });

    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }

    return this.prisma.publication.update({
      where: { id },
      data: updatePublicationDto as any,
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
    });
  }

  async verify(id: string, verifiedBy: string) {
    return this.prisma.publication.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedBy,
        verifiedAt: new Date(),
      },
    });
  }

  async remove(id: string) {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
    });

    if (!publication) {
      throw new NotFoundException(`Publication with ID ${id} not found`);
    }

    return this.prisma.publication.delete({
      where: { id },
    });
  }

  async exportBibTeX(ids: string[]) {
    const publications = await this.prisma.publication.findMany({
      where: { id: { in: ids } },
      include: {
        authors: {
          include: {
            author: true,
          },
          orderBy: {
            authorPosition: 'asc',
          },
        },
      },
    });

    return publications
      .map((pub) => {
        const authors = pub.authors.map((a) => a.author.name).join(' and ');
        const type = pub.venueType === 'journal' ? 'article' : 'inproceedings';
        const key = `${pub.authors[0]?.author.name.split(' ')[0]}${pub.publicationYear}`;

        return `@${type}{${key},
  title={${pub.title}},
  author={${authors}},
  year={${pub.publicationYear}},
  ${pub.venueName ? `journal={${pub.venueName}},` : ''}
  ${pub.volume ? `volume={${pub.volume}},` : ''}
  ${pub.issue ? `number={${pub.issue}},` : ''}
  ${pub.pages ? `pages={${pub.pages}},` : ''}
  ${pub.doi ? `doi={${pub.doi}},` : ''}
}`;
      })
      .join('\n\n');
  }

  async getStatistics() {
    const [
      totalPublications,
      publicationsByYear,
      publicationsByDepartment,
      topCited,
    ] = await Promise.all([
      this.prisma.publication.count(),
      this.prisma.publication.groupBy({
        by: ['publicationYear'],
        _count: true,
        orderBy: {
          publicationYear: 'desc',
        },
        take: 10,
      }),
      this.prisma.$queryRaw`
        SELECT d.name as department, COUNT(DISTINCT p.id) as count
        FROM publications p
        JOIN publication_authors pa ON p.id = pa.publication_id
        JOIN authors a ON pa.author_id = a.id
        JOIN faculty f ON a.faculty_id = f.id
        JOIN departments d ON f.department_id = d.id
        GROUP BY d.id, d.name
        ORDER BY count DESC
        LIMIT 10
      `,
      this.prisma.publication.findMany({
        orderBy: {
          citationCount: 'desc',
        },
        take: 10,
        select: {
          id: true,
          title: true,
          publicationYear: true,
          citationCount: true,
        },
      }),
    ]);

    return {
      totalPublications,
      publicationsByYear,
      publicationsByDepartment,
      topCited,
    };
  }
}
