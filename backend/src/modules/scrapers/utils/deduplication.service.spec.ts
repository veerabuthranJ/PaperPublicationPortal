import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../database/prisma.service';
import { DeduplicationService } from './deduplication.service';

describe('DeduplicationService', () => {
  it('matches exact title and year across sources when authors differ', async () => {
    const publication = {
      id: 'existing-publication',
      title: 'A Study of Publication Data',
      publicationYear: 2020,
      authors: [],
    };
    const prisma = {
      publication: {
        findUnique: jest.fn().mockResolvedValue(publication),
        findMany: jest.fn().mockResolvedValue([publication]),
      },
    };
    const module = await Test.createTestingModule({
      providers: [
        DeduplicationService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    try {
      const service = module.get(DeduplicationService);
      const match = await service.findExistingPublication({
        title: 'A Study of Publication Data',
        publicationYear: 2020,
        source: 'orcid',
        authors: [{ name: 'Different Author' }],
      });

      expect(match).toMatchObject({
        publication,
        matchType: 'exact_title_year',
      });
    } finally {
      await module.close();
    }
  });
});
