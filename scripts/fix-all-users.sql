-- ============================================
-- Fix All Users - Complete SQL Script
-- ============================================
-- This script will:
-- 1. Ensure roles exist
-- 2. Update all user passwords with correct hash
-- 3. Set all users to ACTIVE status
-- 4. Verify the changes
-- ============================================

-- Step 1: Ensure roles exist
INSERT INTO roles (id, name, created_at, updated_at) VALUES
(1, 'SUPER_ADMIN', NOW(), NOW()),
(2, 'ADMIN', NOW(), NOW()),
(3, 'SUB_ADMIN', NOW(), NOW()),
(4, 'STUDENT', NOW(), NOW()),
(5, 'STAFF', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name), updated_at=NOW();

-- Step 2: Update all existing users with correct password hash
-- Password: "password123"
-- Hash: $2a$10$umdL862hCjhBXLKg.5BFj.1GtIURtx0UdEaBhsKg0McCqVToNFY/u
UPDATE users 
SET 
    password = '$2a$10$umdL862hCjhBXLKg.5BFj.1GtIURtx0UdEaBhsKg0McCqVToNFY/u',
    status = 'ACTIVE',
    updated_at = NOW()
WHERE email IN (
    'admin@example.com',
    'institute@example.com',
    'franchise@example.com',
    'student@example.com',
    'staff@example.com'
);

-- Step 3: If users don't exist, create them
INSERT INTO users (role_id, full_name, email, phone, password, status, created_at, updated_at)
SELECT 1, 'Super Admin', 'admin@example.com', '9876543210', 
       '$2a$10$umdL862hCjhBXLKg.5BFj.1GtIURtx0UdEaBhsKg0McCqVToNFY/u', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

INSERT INTO users (role_id, full_name, email, phone, password, status, created_at, updated_at)
SELECT 2, 'Institute Admin', 'institute@example.com', '9876543211', 
       '$2a$10$umdL862hCjhBXLKg.5BFj.1GtIURtx0UdEaBhsKg0McCqVToNFY/u', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'institute@example.com');

INSERT INTO users (role_id, full_name, email, phone, password, status, created_at, updated_at)
SELECT 3, 'Franchise Owner', 'franchise@example.com', '9876543212', 
       '$2a$10$umdL862hCjhBXLKg.5BFj.1GtIURtx0UdEaBhsKg0McCqVToNFY/u', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'franchise@example.com');

INSERT INTO users (role_id, full_name, email, phone, password, status, created_at, updated_at)
SELECT 4, 'Test Student', 'student@example.com', '9876543213', 
       '$2a$10$umdL862hCjhBXLKg.5BFj.1GtIURtx0UdEaBhsKg0McCqVToNFY/u', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'student@example.com');

INSERT INTO users (role_id, full_name, email, phone, password, status, created_at, updated_at)
SELECT 5, 'Staff Member', 'staff@example.com', '9876543214', 
       '$2a$10$umdL862hCjhBXLKg.5BFj.1GtIURtx0UdEaBhsKg0McCqVToNFY/u', 'ACTIVE', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'staff@example.com');

-- Step 4: Verify all users
SELECT 
    u.id,
    u.full_name,
    u.email,
    r.name as role_name,
    u.status,
    LEFT(u.password, 30) as password_hash_preview,
    u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.email IN (
    'admin@example.com',
    'institute@example.com',
    'franchise@example.com',
    'student@example.com',
    'staff@example.com'
)
ORDER BY u.id;

-- Expected output: All users should have:
-- - status = 'ACTIVE'
-- - password_hash_preview starting with '$2a$10$'

