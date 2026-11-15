jest.mock('@nestjs/axios', () => ({
  HttpService: class HttpService {},
}));

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { RateLimiterService } from '../utils/rate-limiter.service';
import { GoogleScholarScraper } from './google-scholar.scraper';

function createScholarPage(start: number, count: number): string {
  const rows = Array.from({ length: count }, (_, index) => {
    const publicationIndex = start + index;
    return `
      <tr class="gsc_a_tr">
        <td class="gsc_a_t">
          <a class="gsc_a_at" href="/citations?view_op=view_citation">Paper ${publicationIndex}</a>
          <div class="gs_gray">Sairamesh Lakshmanan, Coauthor</div>
          <div class="gs_gray">Venue ${publicationIndex}</div>
        </td>
        <td class="gsc_a_c"><a>${publicationIndex}</a></td>
        <td class="gsc_a_y"><span>2020</span></td>
      </tr>`;
  });

  return `<table>${rows.join('')}</table>`;
}

describe('GoogleScholarScraper', () => {
  it('fetches subsequent pages when the first page is full', async () => {
    const httpService = {
      get: jest
        .fn()
        .mockReturnValueOnce(of({ data: createScholarPage(0, 100) }))
        .mockReturnValueOnce(of({ data: createScholarPage(100, 42) })),
    };
    const module = await Test.createTestingModule({
      providers: [
        GoogleScholarScraper,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: HttpService,
          useValue: httpService,
        },
        {
          provide: RateLimiterService,
          useValue: {
            registerLimiter: jest.fn(),
            throttle: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    try {
      const scraper = module.get(GoogleScholarScraper);
      const publications = await scraper.fetchPublications({
        id: 'faculty-id',
        firstName: 'Sairamesh',
        lastName: 'Lakshmanan',
        email: 'faculty@example.edu',
        googleScholarId: 'scholar-id',
      });

      expect(publications).toHaveLength(142);
      expect(httpService.get).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('cstart=100&pagesize=100'),
        expect.any(Object),
      );
    } finally {
      await module.close();
    }
  });
});
