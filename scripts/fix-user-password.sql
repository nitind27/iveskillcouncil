-- ============================================
-- Fix User Passwords with Correct Hash
-- ============================================
-- This will update all user passwords to use
-- the correct bcrypt hash for "password123"
-- ============================================

-- Update all users with correct password hash
-- Password: "password123"
-- Hash generated with: bcrypt.hashSync('password123', 10)

UPDATE users 
SET password = '$2a$10$umdL862hCjhBXLKg.5BFj.1GtIURtx0UdEaBhsKg0McCqVToNFY/u',
    status = 'ACTIVE'
WHERE email IN (
    'admin@example.com',
    'institute@example.com',
    'franchise@example.com',
    'student@example.com',
    'staff@example.com'
);

-- Verify update
SELECT 
    id,
    full_name,
    email,
    status,
    LEFT(password, 30) as password_hash_preview
FROM users
WHERE email IN (
    'admin@example.com',
    'institute@example.com',
    'franchise@example.com',
    'student@example.com',
    'staff@example.com'
);

