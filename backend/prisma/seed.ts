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

  // You can add sample faculty and publications here for testing
  // Example:
  // const cseDept = await prisma.department.findUnique({ where: { code: 'CSE' } });
  // await prisma.faculty.create({
  //   data: {
  //     firstName: 'John',
  //     lastName: 'Doe',
  //     email: 'john.doe@college.edu',
  //     departmentId: cseDept.id,
  //     title: 'Professor',
  //     isActive: true,
  //   },
  // });

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
