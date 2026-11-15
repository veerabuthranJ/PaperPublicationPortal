import { Test } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
import { PublicationsService } from './publications.service';

describe('PublicationsService', () => {
  it('deduplicates title/year matches before paginating search results', async () => {
    const matchingPublications = [
      {
        id: 'other-publication',
        title: 'Another publication',
        publicationYear: 2021,
        citationCount: 1,
      },
      {
        id: 'source-a',
        title: 'Cross-source publication!',
        publicationYear: 2020,
        citationCount: 3,
      },
      {
        id: 'source-b',
        title: 'Crosssource publication',
        publicationYear: 2020,
        citationCount: 12,
      },
    ];
    const expectedPublication = {
      ...matchingPublications[2],
      authors: [],
      keywords: [],
    };
    const prisma = {
      publication: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce(matchingPublications)
          .mockResolvedValueOnce([expectedPublication]),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        PublicationsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    try {
      const service = module.get(PublicationsService);
      const result = await service.search({ page: 2, limit: 1 });

      expect(result.meta).toEqual({
        total: 2,
        page: 2,
        limit: 1,
        totalPages: 2,
      });
      expect(result.data).toEqual([expectedPublication]);
      expect(prisma.publication.findMany).toHaveBeenCalledTimes(2);
    } finally {
      await module.close();
    }
  });
});
