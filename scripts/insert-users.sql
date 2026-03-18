-- ============================================
-- SQL Queries to Insert Users into Database
-- ============================================
-- 
-- IMPORTANT: Passwords are hashed using bcrypt
-- Default password for all users: "password123"
-- 
-- To hash a password, use Node.js:
-- const bcrypt = require('bcryptjs');
-- const hash = bcrypt.hashSync('password123', 10);
-- console.log(hash);
--
-- Or use online bcrypt generator (for testing only)
-- ============================================

-- First, ensure roles exist
INSERT INTO roles (id, name, created_at, updated_at) VALUES
(1, 'SUPER_ADMIN', NOW(), NOW()),
(2, 'ADMIN', NOW(), NOW()),
(3, 'SUB_ADMIN', NOW(), NOW()),
(4, 'STUDENT', NOW(), NOW()),
(5, 'STAFF', NOW(), NOW())
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================
-- Insert Users
-- ============================================
-- Password hash for "password123" using bcrypt (cost 10)
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- 1. Super Admin User
INSERT INTO users (role_id, franchise_id, full_name, email, phone, password, status, created_at, updated_at)
VALUES (
    1,  -- SUPER_ADMIN
    NULL,
    'Super Admin',
    'admin@example.com',
    '9876543210',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
    'ACTIVE',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    status = 'ACTIVE';

-- 2. Institute Admin User
INSERT INTO users (role_id, franchise_id, full_name, email, phone, password, status, created_at, updated_at)
VALUES (
    2,  -- ADMIN
    NULL,
    'Institute Admin',
    'institute@example.com',
    '9876543211',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
    'ACTIVE',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    status = 'ACTIVE';

-- 3. Franchise Owner (Sub Admin) - Will be linked to franchise later
INSERT INTO users (role_id, franchise_id, full_name, email, phone, password, status, created_at, updated_at)
VALUES (
    3,  -- SUB_ADMIN
    NULL,  -- Will update after franchise is created
    'Franchise Owner',
    'franchise@example.com',
    '9876543212',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
    'ACTIVE',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    status = 'ACTIVE';

-- 4. Student User - Will be linked to franchise and course later
INSERT INTO users (role_id, franchise_id, full_name, email, phone, password, status, created_at, updated_at)
VALUES (
    4,  -- STUDENT
    NULL,  -- Will update after franchise is created
    'Test Student',
    'student@example.com',
    '9876543213',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
    'ACTIVE',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    status = 'ACTIVE';

-- 5. Staff User
INSERT INTO users (role_id, franchise_id, full_name, email, phone, password, status, created_at, updated_at)
VALUES (
    5,  -- STAFF
    NULL,  -- Will update after franchise is created
    'Staff Member',
    'staff@example.com',
    '9876543214',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
    'ACTIVE',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    status = 'ACTIVE';

-- ============================================
-- Additional Test Users (Optional)
-- ============================================

-- Additional Admin
INSERT INTO users (role_id, franchise_id, full_name, email, phone, password, status, created_at, updated_at)
VALUES (
    2,  -- ADMIN
    NULL,
    'Secondary Admin',
    'admin2@example.com',
    '9876543215',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
    'ACTIVE',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    status = 'ACTIVE';

-- Additional Students
INSERT INTO users (role_id, franchise_id, full_name, email, phone, password, status, created_at, updated_at)
VALUES 
(
    4,  -- STUDENT
    NULL,
    'John Doe',
    'john.doe@example.com',
    '9876543216',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
    'ACTIVE',
    NOW(),
    NOW()
),
(
    4,  -- STUDENT
    NULL,
    'Jane Smith',
    'jane.smith@example.com',
    '9876543217',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
    'ACTIVE',
    NOW(),
    NOW()
),
(
    4,  -- STUDENT
    NULL,
    'Mike Johnson',
    'mike.johnson@example.com',
    '9876543218',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password123
    'ACTIVE',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    status = 'ACTIVE';

-- ============================================
-- Verify Users
-- ============================================
SELECT 
    u.id,
    u.full_name,
    u.email,
    r.name as role_name,
    u.status,
    u.created_at
FROM users u
JOIN roles r ON u.role_id = r.id
ORDER BY u.id;

