// Seed database on application start if empty
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedOnStart() {
  try {
    // Check if departments exist
    const deptCount = await prisma.department.count();

    if (deptCount === 0) {
      console.log('🌱 Database is empty, seeding...');

      // Create departments
      const departments = [
        { name: 'Computer Science', code: 'CS', description: 'Department of Computer Science' },
        { name: 'Electronics and Communication', code: 'ECE', description: 'Department of ECE' },
        { name: 'Mechanical Engineering', code: 'ME', description: 'Department of Mechanical Engineering' },
        { name: 'Civil Engineering', code: 'CE', description: 'Department of Civil Engineering' },
        { name: 'Information Technology', code: 'IT', description: 'Department of Information Technology' },
      ];

      for (const dept of departments) {
        await prisma.department.create({ data: dept });
      }

      console.log('✅ Seeded departments');

      // Create admin user (if you have an admin table)
      // Uncomment if you have admin/user table
      /*
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.admin.create({
        data: {
          username: 'admin',
          password: hashedPassword,
        },
      });
      console.log('✅ Seeded admin user');
      */

      console.log('🎉 Database seeding completed!');
    } else {
      console.log('✅ Database already seeded, skipping...');
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { seedOnStart };
