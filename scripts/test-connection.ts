import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load .env file
config();

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Test query
    const roleCount = await prisma.role.count();
    console.log(`📊 Found ${roleCount} roles in database`);

    const userCount = await prisma.user.count();
    console.log(`👥 Found ${userCount} users in database`);

    const franchiseCount = await prisma.franchise.count();
    console.log(`🏢 Found ${franchiseCount} franchises in database`);

    console.log('\n✅ All tests passed! Database is ready.\n');
  } catch (error: any) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your DATABASE_URL in .env file');
    console.log('2. Ensure MySQL server is running');
    console.log('3. Verify database "franchise_institute" exists');
    console.log('4. Check username and password are correct\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

