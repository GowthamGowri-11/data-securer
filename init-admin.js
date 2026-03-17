/**
 * Initialize Super Admin
 * 
 * This script creates the super admin user in the database
 * Username: admin
 * Password: admin123
 * Role: admin
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initAdmin() {
  console.log('🔧 Initializing Super Admin...\n');

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (existingAdmin) {
      console.log('✅ Super admin already exists');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Created: ${existingAdmin.createdAt.toLocaleString()}\n`);
      await prisma.$disconnect();
      return;
    }

    // Create super admin
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: 'admin123', // In production, hash this!
        email: 'admin@tamperguard.com',
        role: 'admin',
      },
    });

    console.log('✅ Super admin created successfully!\n');
    console.log('📋 Admin Details:');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Password: admin123`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}\n`);

    console.log('🔑 Login Credentials:');
    console.log('   URL: http://localhost:3001/login');
    console.log('   Username: admin');
    console.log('   Password: admin123\n');

    await prisma.$disconnect();
    console.log('✅ Initialization complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

initAdmin();
