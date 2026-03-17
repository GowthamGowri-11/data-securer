/**
 * Prisma Database Client
 * 
 * Singleton instance of Prisma Client for database operations.
 * Handles connection pooling and prevents multiple instances in development.
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Initialize Prisma Client with logging configuration and connection settings
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Store in global to prevent multiple instances during hot reload
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Test database connection with retry logic
 */
export async function testDatabaseConnection(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      return true;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error instanceof Error ? error.message : error);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }
  }
  return false;
}

/**
 * Graceful shutdown handler
 * Ensures database connections are properly closed
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
}

// Handle process termination
process.on('beforeExit', async () => {
  await disconnectDatabase();
});
