import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load .env file
config();

const prisma = new PrismaClient();

async function testLoginFlow() {
  console.log('🔍 Testing Complete Login Flow...\n');

  const testEmail = 'admin@example.com';
  const testPassword = 'password123';

  try {
    // Step 1: Check if user exists
    console.log('Step 1: Checking if user exists...');
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { role: true },
    });

    if (!user) {
      console.log('❌ User not found!');
      console.log('💡 Run: mysql -u root -p franchise_institute < scripts/insert-users-simple.sql\n');
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.fullName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role.name}`);
    console.log(`   Status: ${user.status}\n`);

    // Step 2: Check user status
    if (user.status !== 'ACTIVE') {
      console.log(`❌ User status is ${user.status}, not ACTIVE!`);
      console.log('💡 Fix: UPDATE users SET status = "ACTIVE" WHERE email = "admin@example.com";\n');
      return;
    }
    console.log('✅ User status is ACTIVE\n');

    // Step 3: Test password verification
    console.log('Step 2: Testing password verification...');
    console.log(`   Testing password: "${testPassword}"`);
    console.log(`   Stored hash: ${user.password.substring(0, 30)}...`);

    const isValid = await bcrypt.compare(testPassword, user.password);
    
    if (isValid) {
      console.log('✅ Password is valid!\n');
    } else {
      console.log('❌ Password verification failed!');
      console.log('💡 Fixing password...');
      
      // Generate new hash
      const newHash = await bcrypt.hash(testPassword, 10);
      
      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash },
      });
      
      console.log('✅ Password updated successfully!');
      console.log(`   New hash: ${newHash.substring(0, 30)}...\n`);
    }

    // Step 4: Verify password again
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (updatedUser) {
      const isValidAfterUpdate = await bcrypt.compare(testPassword, updatedUser.password);
      if (isValidAfterUpdate) {
        console.log('✅ Password verification confirmed!\n');
      }
    }

    console.log('🎉 All tests passed! Login should work now.\n');
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

testLoginFlow();

