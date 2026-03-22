
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log('Starting DB cleanup...');
    
    // Convert any null userId to 'system'
    // Prisma might not allow 'null' in where if it's non-nullable in schema
    // using raw query for MongoDB
    
    const sensorCount = await prisma.sensorData.updateMany({
      where: { userId: { equals: null } },
      data: { userId: 'system' }
    });
    console.log('Updated SensorData records:', sensorCount);

    const auditCount = await prisma.auditLog.updateMany({
      where: { userId: { equals: null } },
      data: { userId: 'system' }
    });
    console.log('Updated AuditLog records:', auditCount);

    console.log('Cleanup finished.');
  } catch (e) {
    console.error('Cleanup failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
