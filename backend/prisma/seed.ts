import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed departments
  const departments = [
    {
      name: 'Computer Science and Engineering',
      code: 'CSE',
      description: 'Department of Computer Science and Engineering',
    },
    {
      name: 'Electrical and Electronics Engineering',
      code: 'EEE',
      description: 'Department of Electrical and Electronics Engineering',
    },
    {
      name: 'Mechanical Engineering',
      code: 'MECH',
      description: 'Department of Mechanical Engineering',
    },
    {
      name: 'Civil Engineering',
      code: 'CIVIL',
      description: 'Department of Civil Engineering',
    },
    {
      name: 'Electronics and Communication Engineering',
      code: 'ECE',
      description: 'Department of Electronics and Communication Engineering',
    },
    {
      name: 'Information Technology',
      code: 'IT',
      description: 'Department of Information Technology',
    },
    {
      name: 'Mathematics',
      code: 'MATH',
      description: 'Department of Mathematics',
    },
    {
      name: 'Physics',
      code: 'PHY',
      description: 'Department of Physics',
    },
    {
      name: 'Chemistry',
      code: 'CHEM',
      description: 'Department of Chemistry',
    },
    {
      name: 'Management Studies',
      code: 'MGT',
      description: 'Department of Management Studies',
    },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }

  console.log('✅ Seeded departments');

  // Get CSE department
  const cseDept = await prisma.department.findUnique({ where: { code: 'CSE' } });
  if (!cseDept) {
    throw new Error('CSE department not found after seeding');
  }

  // Faculty data from faculty_template.csv
  const facultyData = [
    { firstName: 'Sairamesh', lastName: 'Lakshmanan', email: 'sairamesh.ist@gmail.com', orcidId: '0000-0003-0630-2571', title: 'Professor', googleScholarId: 'l9qipyYAAAAJ' },
    { firstName: 'Dafni Rose', lastName: 'J', email: 'dafnirose.j@cse.faculty.edu', orcidId: null, title: null, googleScholarId: 'aj-BkgcAAAAJ' },
    { firstName: 'Adlin', lastName: 'Sheeba', email: 'adlin.sheeba@cse.faculty.edu', orcidId: '0000-0002-7428-8575', title: null, googleScholarId: '-vetm4sAAAAJ' },
    { firstName: 'Subasini', lastName: 'C A', email: 'subasini.ca@cse.faculty.edu', orcidId: '0000-0002-3814-358X', title: null, googleScholarId: 'QNg9EiMAAAAJ' },
    { firstName: 'Vasanthi', lastName: 'R', email: 'vasanthi.r@cse.faculty.edu', orcidId: '0000-0002-1992-2254', title: null, googleScholarId: '-yva1LkAAAAJ' },
    { firstName: 'Deepak Kumar', lastName: 'A', email: 'deepakkumar.a@cse.faculty.edu', orcidId: '0000-0002-3443-6959', title: null, googleScholarId: 'bjQsQSEAAAAJ' },
    { firstName: 'Jaspin', lastName: 'K', email: 'jaspin.k@cse.faculty.edu', orcidId: '0000-0001-7777-5099', title: null, googleScholarId: 'OY93j_wAAAAJ' },
    { firstName: 'Ajitha', lastName: 'E', email: 'ajitha.e@cse.faculty.edu', orcidId: '0000-0002-8664-555X', title: null, googleScholarId: 'ICfbbhgAAAAJ' },
    { firstName: 'Balamurali', lastName: 'A', email: 'balamurali.a@cse.faculty.edu', orcidId: '0009-0000-8379-9820', title: null, googleScholarId: 'efziaRYAAAAJ' },
    { firstName: 'Menaga', lastName: 'D', email: 'menaga.d@cse.faculty.edu', orcidId: '0000-0002-6137-8897', title: null, googleScholarId: 'flgIIF0AAAAJ' },
    { firstName: 'Sherin', lastName: 'K', email: 'sherin.k@cse.faculty.edu', orcidId: '0009-0001-5762-9761', title: null, googleScholarId: 'c_rtU_oAAAAJ' },
    { firstName: 'Revathy', lastName: 'S', email: 'revathy.s@cse.faculty.edu', orcidId: '0000-0003-3212-4895', title: null, googleScholarId: 'j__hTvcAAAAJ' },
    { firstName: 'Mithun', lastName: 'P', email: 'mithun.p@cse.faculty.edu', orcidId: '0000-0001-9608-2722', title: null, googleScholarId: 'fbbUyfgAAAAJ' },
    { firstName: 'Ezhil Dyana', lastName: 'M V', email: 'ezhildyana.mv@cse.faculty.edu', orcidId: '0000-0002-1647-0475', title: null, googleScholarId: 'hRneBS4AAAAJ' },
    { firstName: 'Vani Lavanya', lastName: 'A', email: 'vanilavanya.a@cse.faculty.edu', orcidId: '0000-0001-7136-0511', title: null, googleScholarId: '3L_KPdgAAAAJ' },
    { firstName: 'Janagiraman', lastName: 'S', email: 'janagiraman.s@cse.faculty.edu', orcidId: '0009-0002-3535-4266', title: null, googleScholarId: 'bPbAJWoAAAAJ' },
    { firstName: 'Surya', lastName: 'U', email: 'surya.u@cse.faculty.edu', orcidId: '0000-0003-1841-321X', title: null, googleScholarId: 'O1WJktUAAAAJ' },
    { firstName: 'Muthu Kumar', lastName: 'S', email: 'muthukumar.s@cse.faculty.edu', orcidId: null, title: null, googleScholarId: 'ER9Qz2kAAAAJ' },
    { firstName: 'TamilThendral', lastName: 'M', email: 'tamilthendral.m@cse.faculty.edu', orcidId: '0000-0001-8994-3694', title: null, googleScholarId: 'qdlaob8AAAAJ' },
    { firstName: 'Ramya', lastName: 'M', email: 'ramya.m@cse.faculty.edu', orcidId: '0009-0000-6034-5041', title: null, googleScholarId: 'zsH_c_AAAAAJ' },
    { firstName: 'Sundara Babu', lastName: 'Maddu', email: 'sundarababu.maddu@cse.faculty.edu', orcidId: '0009-0007-3612-5605', title: null, googleScholarId: 'N68HM9gAAAAJ' },
    { firstName: 'Mythili', lastName: 'N', email: 'mythili.n@cse.faculty.edu', orcidId: '0000-0003-3474-262X', title: null, googleScholarId: 'g6HHtf8AAAAJ' },
    { firstName: 'Keerthana', lastName: 'S M', email: 'keerthana.sm@cse.faculty.edu', orcidId: null, title: null, googleScholarId: '_M8wLhUAAAAJ' },
    { firstName: 'Smilarubavathy', lastName: 'G', email: 'smilarubavathy.g@cse.faculty.edu', orcidId: null, title: null, googleScholarId: 'Fd1Sd8AAAAAJ' },
    { firstName: 'Sabaresan', lastName: '.', email: 'sabaresan@cse.faculty.edu', orcidId: null, title: null, googleScholarId: 'Xu2rpDkAAAAJ' },
    { firstName: 'Krishnaraj', lastName: '.', email: 'krishnaraj@cse.faculty.edu', orcidId: null, title: null, googleScholarId: '59gL76QAAAAJ' },
    { firstName: 'Divyarubakala', lastName: '.', email: 'divyarubakala@cse.faculty.edu', orcidId: null, title: null, googleScholarId: null },
    { firstName: 'Sindhu', lastName: '.', email: 'sindhu@cse.faculty.edu', orcidId: null, title: null, googleScholarId: 'rD9h9-gAAAAJ' },
    { firstName: 'Sangeetha', lastName: '.', email: 'sangeetha@cse.faculty.edu', orcidId: null, title: null, googleScholarId: null },
    { firstName: 'Ranganayaki', lastName: 'V C', email: 'ranganayaki.vc@cse.faculty.edu', orcidId: null, title: null, googleScholarId: null },
    { firstName: 'Shalini', lastName: 'Shankar', email: 'shalini.shankar@cse.faculty.edu', orcidId: null, title: null, googleScholarId: null },
    { firstName: 'Kalingarani', lastName: 'G', email: 'kalingarani.g@cse.faculty.edu', orcidId: null, title: null, googleScholarId: 'EYp_jCcAAAAJ' },
    { firstName: 'Karthiga', lastName: 'R', email: 'karthiga.r@cse.faculty.edu', orcidId: null, title: null, googleScholarId: 'V4eBk7oAAAAJ' },
  ];

  console.log(`📝 Seeding ${facultyData.length} faculty members...`);

  for (const f of facultyData) {
    await prisma.faculty.upsert({
      where: { email: f.email },
      update: {
        firstName: f.firstName,
        lastName: f.lastName,
        title: f.title,
        orcidId: f.orcidId,
        googleScholarId: f.googleScholarId,
        departmentId: cseDept.id,
        isActive: true,
      },
      create: {
        firstName: f.firstName,
        lastName: f.lastName,
        email: f.email,
        title: f.title,
        orcidId: f.orcidId,
        googleScholarId: f.googleScholarId,
        departmentId: cseDept.id,
        isActive: true,
      },
    });
  }

  console.log(`✅ Seeded ${facultyData.length} faculty members`);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
