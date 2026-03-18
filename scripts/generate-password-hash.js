/**
 * Generate Password Hash for SQL Insert
 * 
 * Usage: node scripts/generate-password-hash.js "your_password"
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'password123';

console.log('\n🔐 Password Hash Generator\n');
console.log('Password:', password);
console.log('Hash:', bcrypt.hashSync(password, 10));
console.log('\n💡 Use this hash in your SQL INSERT queries\n');

