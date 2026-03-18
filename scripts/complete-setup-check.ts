import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load .env file
config();

const prisma = new PrismaClient();

async function completeSetupCheck() {
  console.log('🔍 Complete Setup Check\n');
  console.log('='.repeat(50));

  try {
    // Step 1: Check .env file
    console.log('\n📝 Step 1: Checking .env file...');
    const dbUrl = process.env.DATABASE_URL;
    const jwtAccess = process.env.JWT_ACCESS_SECRET;
    const jwtRefresh = process.env.JWT_REFRESH_SECRET;

    if (!dbUrl) {
      console.log('❌ DATABASE_URL not found in .env');
      console.log('💡 Run: npm run setup:env\n');
      return;
    }
    console.log('✅ DATABASE_URL found');
    console.log(`   URL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password

    if (!jwtAccess || !jwtRefresh) {
      console.log('⚠️  JWT secrets not found, using defaults');
    } else {
      console.log('✅ JWT secrets found');
    }

    // Step 2: Test database connection
    console.log('\n📝 Step 2: Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');

    // Step 3: Check roles
    console.log('\n📝 Step 3: Checking roles...');
    const roles = await prisma.role.findMany();
    console.log(`✅ Found ${roles.length} roles`);
    if (roles.length === 0) {
      console.log('💡 Run: mysql -u root -p franchise_institute < scripts/insert-users-simple.sql');
    }

    // Step 4: Check users
    console.log('\n📝 Step 4: Checking users...');
    const users = await prisma.user.findMany({
      include: { role: true },
    });
    console.log(`✅ Found ${users.length} users`);

    if (users.length === 0) {
      console.log('❌ No users found!');
      console.log('💡 Run: mysql -u root -p franchise_institute < scripts/insert-users-simple.sql\n');
      return;
    }

    // Step 5: Check admin user specifically
    console.log('\n📝 Step 5: Checking admin user...');
    const adminUser = users.find(u => u.email === 'admin@example.com');
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      console.log('💡 Run: mysql -u root -p franchise_institute < scripts/insert-users-simple.sql\n');
      return;
    }

    console.log('✅ Admin user found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Name: ${adminUser.fullName}`);
    console.log(`   Role: ${adminUser.role.name}`);
    console.log(`   Status: ${adminUser.status}`);

    // Step 6: Test password
    console.log('\n📝 Step 6: Testing password...');
    const testPassword = 'password123';
    const isValid = await bcrypt.compare(testPassword, adminUser.password);

    if (isValid) {
      console.log('✅ Password is correct!');
    } else {
      console.log('❌ Password is incorrect!');
      console.log('💡 Fixing password...');
      
      const newHash = await bcrypt.hash(testPassword, 10);
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { 
          password: newHash,
          status: 'ACTIVE',
        },
      });
      
      console.log('✅ Password fixed!');
      console.log(`   New hash: ${newHash.substring(0, 30)}...`);
    }

    // Step 7: Verify status
    if (adminUser.status !== 'ACTIVE') {
      console.log('\n📝 Step 7: Fixing user status...');
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { status: 'ACTIVE' },
      });
      console.log('✅ User status set to ACTIVE');
    }

    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Setup Check Complete!\n');
    console.log('✅ Everything is ready for login!\n');
    console.log('📋 Login Credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: password123\n');
    console.log('🚀 Next step: Start server and login');
    console.log('   npm run dev\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('DATABASE_URL')) {
      console.error('\n💡 Solution:');
      console.error('   1. Create .env file: npm run setup:env');
      console.error('   2. Or manually create .env with DATABASE_URL\n');
    } else if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Solution:');
      console.error('   1. Check MySQL is running');
      console.error('   2. Verify DATABASE_URL in .env');
      console.error('   3. Check username and password\n');
    } else {
      console.error('\n💡 Check:');
      console.error('   1. Database connection');
      console.error('   2. Database schema imported');
      console.error('   3. Users inserted\n');
    }
  } finally {
    await prisma.$disconnect();
  }
}

completeSetupCheck();

