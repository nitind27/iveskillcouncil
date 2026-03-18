-- ============================================
-- Simple SQL Queries to Insert Users
-- ============================================
-- 
-- Password: "password123"
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- 
-- To generate new hash:
-- node scripts/generate-password-hash.js "your_password"
-- ============================================

-- Ensure roles exist
INSERT INTO roles (id, name) VALUES
(1, 'SUPER_ADMIN'),
(2, 'ADMIN'),
(3, 'SUB_ADMIN'),
(4, 'STUDENT'),
(5, 'STAFF')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Super Admin
-- Password: password123
INSERT INTO users (role_id, full_name, email, phone, password, status) VALUES
(1, 'Super Admin', 'admin@example.com', '9876543210', 
 '$2a$10$umdL862hCjhBXLKg.5BFj.1GtIURtx0UdEaBhsKg0McCqVToNFY/u', 'ACTIVE')
ON DUPLICATE KEY UPDATE password=VALUES(password), status='ACTIVE';

-- Insert Admin
-- Password: password123
INSERT INTO users (role_id, full_name, email, phone, password, status) VALUES
(2, 'Institute Admin', 'institute@example.com', '9876543211', 
 '$2a$10$umdL862hCjhBXLKg.5BFj.1GtIURtx0UdEaBhsKg0McCqVToNFY/u', 'ACTIVE')
ON DUPLICATE KEY UPDATE password=VALUES(password), status='ACTIVE';

-- Insert Franchise Owner (Sub Admin)
-- Password: password123
INSERT INTO users (role_id, full_name, email, phone, password, status) VALUES
(3, 'Franchise Owner', 'franchise@example.com', '9876543212', 
 '$2a$10$umdL862hCjhBXLKg.5BFj.1GtIURtx0UdEaBhsKg0McCqVToNFY/u', 'ACTIVE')
ON DUPLICATE KEY UPDATE password=VALUES(password), status='ACTIVE';

-- Insert Student
-- Password: password123
INSERT INTO users (role_id, full_name, email, phone, password, status) VALUES
(4, 'Test Student', 'student@example.com', '9876543213', 
 '$2a$10$umdL862hCjhBXLKg.5BFj.1GtIURtx0UdEaBhsKg0McCqVToNFY/u', 'ACTIVE')
ON DUPLICATE KEY UPDATE password=VALUES(password), status='ACTIVE';

-- Insert Staff
-- Password: password123
INSERT INTO users (role_id, full_name, email, phone, password, status) VALUES
(5, 'Staff Member', 'staff@example.com', '9876543214', 
 '$2a$10$umdL862hCjhBXLKg.5BFj.1GtIURtx0UdEaBhsKg0McCqVToNFY/u', 'ACTIVE')
ON DUPLICATE KEY UPDATE password=VALUES(password), status='ACTIVE';

-- View inserted users
SELECT u.id, u.full_name, u.email, r.name as role, u.status 
FROM users u 
JOIN roles r ON u.role_id = r.id 
ORDER BY u.id;

