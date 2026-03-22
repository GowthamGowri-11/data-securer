
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log('Starting RAW DB cleanup...');
    
    // Use MongoDB direct update
    const result1 = await prisma.$runCommandRaw({
      update: "sensor_data",
      updates: [
        {
          q: { $or: [{ userId: null }, { userId: { $exists: false } }] },
          u: { $set: { userId: "system" } },
          multi: true
        }
      ]
    });
    console.log('SensorData update result:', result1);

    const result2 = await prisma.$runCommandRaw({
      update: "audit_logs",
      updates: [
        {
          q: { $or: [{ userId: null }, { userId: { $exists: false } }] },
          u: { $set: { userId: "system" } },
          multi: true
        }
      ]
    });
    console.log('AuditLog update result:', result2);

    console.log('Raw cleanup finished.');
  } catch (e) {
    console.error('Raw cleanup failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
