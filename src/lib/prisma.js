import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

console.log('🔗 Initializing Prisma client...');
console.log('📍 Database URL configured:', !!process.env.DATABASE_URL);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Test database connection
prisma.$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch((error) => console.error('❌ Database connection failed:', error.message));

export default prisma;