import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.department.findUnique({
      where: { id },
      include: {
        faculty: {
          where: { isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });
  }

  async create(data: { name: string; code: string; description?: string }) {
    return this.prisma.department.create({
      data,
    });
  }

  async update(
    id: string,
    data: { name?: string; code?: string; description?: string },
  ) {
    return this.prisma.department.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.department.delete({
      where: { id },
    });
  }
}
