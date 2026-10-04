import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL must be configured by the backend runtime');
    }

    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
