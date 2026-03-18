import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('🔍 Testing Login Authentication...\n');

    const testEmail = 'admin@example.com';
    const testPassword = 'password123';

    // 1. Check if user exists
    console.log('1. Checking if user exists...');
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { role: true },
    });

    if (!user) {
      console.log('❌ User not found in database!');
      console.log('💡 Run: npm run db:seed or insert users manually\n');
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.fullName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role.name}`);
    console.log(`   Status: ${user.status}\n`);

    // 2. Check user status
    if (user.status !== 'ACTIVE') {
      console.log(`❌ User status is ${user.status}, not ACTIVE!`);
      console.log('💡 Update user status to ACTIVE\n');
      return;
    }

    // 3. Test password verification
    console.log('2. Testing password verification...');
    console.log(`   Testing password: "${testPassword}"`);
    console.log(`   Stored hash: ${user.password.substring(0, 30)}...`);

    const isValid = await bcrypt.compare(testPassword, user.password);
    
    if (isValid) {
      console.log('✅ Password is valid!\n');
    } else {
      console.log('❌ Password verification failed!');
      console.log('💡 The password hash in database might be incorrect');
      console.log('💡 Generate new hash: node scripts/generate-password-hash.js "password123"');
      console.log('💡 Then update user password in database\n');
      return;
    }

    // 4. Generate test hash for comparison
    console.log('3. Generating new hash for comparison...');
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log(`   New hash: ${newHash}`);
    console.log(`   Note: Bcrypt generates different hashes each time (with salt)\n`);

    console.log('✅ All tests passed! Login should work.\n');
    console.log('📋 Login Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}\n`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Check:');
    console.error('   1. Database connection (.env file)');
    console.error('   2. Database schema is imported');
    console.error('   3. Users are inserted\n');
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();

