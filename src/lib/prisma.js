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

// Test database connection (non-blocking)
prisma.$connect()
  .then(() => console.log('✅ Database connected successfully'))
  .catch((error) => {
    console.error('❌ Database connection failed:', error.message);
    // Don't exit process, allow server to start without DB for health checks
    console.warn('⚠️  Server will continue without database connection');
  });

export default prisma;