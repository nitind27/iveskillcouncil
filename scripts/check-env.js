const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking .env file...\n');

const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('\n💡 Create .env file:');
  console.log('   1. Run: npm run setup:env');
  console.log('   2. Or manually create .env file in root directory\n');
  process.exit(1);
}

console.log('✅ .env file exists\n');

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');

let hasDatabaseUrl = false;
let hasJwtAccess = false;
let hasJwtRefresh = false;

console.log('📋 Checking environment variables:\n');

lines.forEach((line, index) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    if (trimmed.startsWith('DATABASE_URL=')) {
      hasDatabaseUrl = true;
      const value = trimmed.split('=')[1]?.replace(/^["']|["']$/g, '') || '';
      // Hide password in output
      const safeValue = value.replace(/:[^:@]+@/, ':****@');
      console.log(`✅ DATABASE_URL found`);
      console.log(`   ${safeValue}\n`);
    } else if (trimmed.startsWith('JWT_ACCESS_SECRET=')) {
      hasJwtAccess = true;
      const value = trimmed.split('=')[1]?.replace(/^["']|["']$/g, '') || '';
      console.log(`✅ JWT_ACCESS_SECRET found (${value.length} chars)\n`);
    } else if (trimmed.startsWith('JWT_REFRESH_SECRET=')) {
      hasJwtRefresh = true;
      const value = trimmed.split('=')[1]?.replace(/^["']|["']$/g, '') || '';
      console.log(`✅ JWT_REFRESH_SECRET found (${value.length} chars)\n`);
    }
  }
});

if (!hasDatabaseUrl) {
  console.log('❌ DATABASE_URL not found in .env file\n');
  console.log('💡 Add this line to .env:');
  console.log('   DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/franchise_institute"\n');
}

if (!hasJwtAccess) {
  console.log('⚠️  JWT_ACCESS_SECRET not found (will use default)\n');
}

if (!hasJwtRefresh) {
  console.log('⚠️  JWT_REFRESH_SECRET not found (will use default)\n');
}

if (hasDatabaseUrl && hasJwtAccess && hasJwtRefresh) {
  console.log('✅ All required environment variables are set!\n');
  console.log('📝 Next steps:');
  console.log('   1. Test connection: npm run db:test');
  console.log('   2. Fix users: mysql -u root -p franchise_institute < scripts/fix-all-users.sql');
  console.log('   3. Test login: npm run db:login-flow');
  console.log('   4. Start server: npm run dev\n');
} else {
  console.log('⚠️  Some environment variables are missing.\n');
  console.log('💡 Run: npm run setup:env to fix automatically\n');
}

