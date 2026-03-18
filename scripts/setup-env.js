const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnv() {
  console.log('\n🔧 Setting up .env file...\n');

  const envPath = path.join(process.cwd(), '.env');
  const templatePath = path.join(process.cwd(), 'env.template');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists!');
    const overwrite = await question('Do you want to overwrite it? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ Cancelled. Using existing .env file.');
      rl.close();
      return;
    }
  }

  // Get database credentials
  console.log('Please enter your MySQL database credentials:\n');
  
  const dbUser = await question('MySQL Username (default: root): ') || 'root';
  const dbPassword = await question('MySQL Password: ');
  const dbHost = await question('MySQL Host (default: localhost): ') || 'localhost';
  const dbPort = await question('MySQL Port (default: 3306): ') || '3306';
  const dbName = await question('Database Name (default: franchise_institute): ') || 'franchise_institute';

  // Generate JWT secrets
  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 64; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const accessSecret = generateSecret();
  const refreshSecret = generateSecret();

  // Create .env content
  const envContent = `# Database Connection
DATABASE_URL="mysql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# JWT Secrets (Auto-generated)
JWT_ACCESS_SECRET="${accessSecret}"
JWT_REFRESH_SECRET="${refreshSecret}"

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
`;

  // Write .env file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!\n');
    console.log('📋 Database URL:', `mysql://${dbUser}:***@${dbHost}:${dbPort}/${dbName}`);
    console.log('🔑 JWT secrets generated automatically\n');
    
    console.log('📝 Next steps:');
    console.log('1. Test database connection: npm run db:test');
    console.log('2. Fix users: mysql -u root -p franchise_institute < scripts/fix-all-users.sql');
    console.log('3. Test login flow: npm run db:login-flow');
    console.log('4. Start server: npm run dev\n');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }

  rl.close();
}

setupEnv();

