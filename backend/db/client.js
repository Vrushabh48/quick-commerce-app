import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../db/prisma/generated/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });