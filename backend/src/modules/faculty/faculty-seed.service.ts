import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FacultySeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FacultySeedService.name);

  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    await this.syncFacultyScholarIds();
  }

  private async syncFacultyScholarIds() {
    this.logger.log('Syncing faculty Google Scholar IDs...');

    const facultyData = [
      { email: 'sairamesh.ist@gmail.com', googleScholarId: 'l9qipyYAAAAJ', orcidId: '0000-0003-0630-2571' },
      { email: 'dafnirose.j@cse.faculty.edu', googleScholarId: 'aj-BkgcAAAAJ', orcidId: null },
      { email: 'adlin.sheeba@cse.faculty.edu', googleScholarId: '-vetm4sAAAAJ', orcidId: '0000-0002-7428-8575' },
      { email: 'subasini.ca@cse.faculty.edu', googleScholarId: 'QNg9EiMAAAAJ', orcidId: '0000-0002-3814-358X' },
      { email: 'vasanthi.r@cse.faculty.edu', googleScholarId: '-yva1LkAAAAJ', orcidId: '0000-0002-1992-2254' },
      { email: 'deepakkumar.a@cse.faculty.edu', googleScholarId: 'bjQsQSEAAAAJ', orcidId: '0000-0002-3443-6959' },
      { email: 'jaspin.k@cse.faculty.edu', googleScholarId: 'OY93j_wAAAAJ', orcidId: '0000-0001-7777-5099' },
      { email: 'ajitha.e@cse.faculty.edu', googleScholarId: 'ICfbbhgAAAAJ', orcidId: '0000-0002-8664-555X' },
      { email: 'balamurali.a@cse.faculty.edu', googleScholarId: 'efziaRYAAAAJ', orcidId: '0009-0000-8379-9820' },
      { email: 'menaga.d@cse.faculty.edu', googleScholarId: 'flgIIF0AAAAJ', orcidId: '0000-0002-6137-8897' },
      { email: 'sherin.k@cse.faculty.edu', googleScholarId: 'c_rtU_oAAAAJ', orcidId: '0009-0001-5762-9761' },
      { email: 'revathy.s@cse.faculty.edu', googleScholarId: 'j__hTvcAAAAJ', orcidId: '0000-0003-3212-4895' },
      { email: 'mithun.p@cse.faculty.edu', googleScholarId: 'fbbUyfgAAAAJ', orcidId: '0000-0001-9608-2722' },
      { email: 'ezhildyana.mv@cse.faculty.edu', googleScholarId: 'hRneBS4AAAAJ', orcidId: '0000-0002-1647-0475' },
      { email: 'vanilavanya.a@cse.faculty.edu', googleScholarId: '3L_KPdgAAAAJ', orcidId: '0000-0001-7136-0511' },
      { email: 'janagiraman.s@cse.faculty.edu', googleScholarId: 'bPbAJWoAAAAJ', orcidId: '0009-0002-3535-4266' },
      { email: 'surya.u@cse.faculty.edu', googleScholarId: 'O1WJktUAAAAJ', orcidId: '0000-0003-1841-321X' },
      { email: 'muthukumar.s@cse.faculty.edu', googleScholarId: 'ER9Qz2kAAAAJ', orcidId: null },
      { email: 'tamilthendral.m@cse.faculty.edu', googleScholarId: 'qdlaob8AAAAJ', orcidId: '0000-0001-8994-3694' },
      { email: 'ramya.m@cse.faculty.edu', googleScholarId: 'zsH_c_AAAAAJ', orcidId: '0009-0000-6034-5041' },
      { email: 'sundarababu.maddu@cse.faculty.edu', googleScholarId: 'N68HM9gAAAAJ', orcidId: '0009-0007-3612-5605' },
      { email: 'mythili.n@cse.faculty.edu', googleScholarId: 'g6HHtf8AAAAJ', orcidId: '0000-0003-3474-262X' },
      { email: 'keerthana.sm@cse.faculty.edu', googleScholarId: '_M8wLhUAAAAJ', orcidId: null },
      { email: 'smilarubavathy.g@cse.faculty.edu', googleScholarId: 'Fd1Sd8AAAAAJ', orcidId: null },
      { email: 'sabaresan@cse.faculty.edu', googleScholarId: 'Xu2rpDkAAAAJ', orcidId: null },
      { email: 'krishnaraj@cse.faculty.edu', googleScholarId: '59gL76QAAAAJ', orcidId: null },
      { email: 'sindhu@cse.faculty.edu', googleScholarId: 'rD9h9-gAAAAJ', orcidId: null },
      { email: 'kalingarani.g@cse.faculty.edu', googleScholarId: 'EYp_jCcAAAAJ', orcidId: null },
      { email: 'karthiga.r@cse.faculty.edu', googleScholarId: 'V4eBk7oAAAAJ', orcidId: null },
    ];

    let updated = 0;
    for (const f of facultyData) {
      try {
        const result = await this.prisma.faculty.updateMany({
          where: {
            email: f.email,
            OR: [
              { googleScholarId: null },
              { googleScholarId: { not: f.googleScholarId } },
            ],
          },
          data: {
            googleScholarId: f.googleScholarId,
            ...(f.orcidId ? { orcidId: f.orcidId } : {}),
          },
        });
        if (result.count > 0) updated++;
      } catch (error) {
        // Faculty might not exist yet, skip
      }
    }

    if (updated > 0) {
      this.logger.log(`Updated Google Scholar IDs for ${updated} faculty members`);
    } else {
      this.logger.log('All faculty Google Scholar IDs already up to date');
    }
  }
}
