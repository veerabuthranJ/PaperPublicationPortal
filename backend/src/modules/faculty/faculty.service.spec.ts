import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { FacultyService } from './faculty.service';

describe('FacultyService', () => {
  it('counts exact title/year matches once using the highest citation count', async () => {
    const publication = {
      title: 'Cross-source publication',
      publicationYear: 2020,
    };
    const prisma = {
      faculty: {
        findUnique: jest.fn().mockResolvedValue({
          authors: [
            {
              publications: [
                {
                  publication: {
                    id: 'scholar-publication',
                    ...publication,
                    citationCount: 23,
                  },
                },
              ],
            },
            {
              publications: [
                {
                  publication: {
                    id: 'orcid-publication',
                    ...publication,
                    citationCount: 0,
                  },
                },
              ],
            },
          ],
        }),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        FacultyService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    try {
      const service = module.get(FacultyService);
      const stats = await service.getPublicationStats('faculty-id');

      expect(stats.totalPublications).toBe(1);
      expect(stats.totalCitations).toBe(23);
      expect(stats.publicationsByYear).toEqual([{ year: 2020, count: 1 }]);
    } finally {
      await module.close();
    }
  });
});
