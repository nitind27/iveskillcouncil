-- ============================================================
-- Permissions tables for role & plan-based access control
-- MySQL 5.7+ / 8.0+
-- Run after: roles, subscription_plans tables must exist
-- ============================================================

-- 1) Permissions master table
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(100) NOT NULL COMMENT 'Unique permission key e.g. dashboard.view',
  `label` VARCHAR(150) NOT NULL COMMENT 'Display label',
  `module` VARCHAR(80) NOT NULL COMMENT 'Group/module name',
  `description` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_key_unique` (`key`),
  KEY `idx_permissions_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Master list of permission keys used for role and plan access';


-- 2) Role-Permission mapping (which role has which permission)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id` TINYINT UNSIGNED NOT NULL,
  `permission_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_permission` (`role_id`, `permission_id`),
  KEY `idx_role_perm_permission` (`permission_id`),
  CONSTRAINT `fk_role_permissions_role` 
    FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_role_permissions_permission` 
    FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Maps roles to permissions (SUPER_ADMIN can manage)';


-- 3) Plan-Permission mapping (which subscription plan has which permission)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS `plan_permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `plan_id` TINYINT UNSIGNED NOT NULL,
  `permission_id` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_plan_permission` (`plan_id`, `permission_id`),
  KEY `idx_plan_perm_permission` (`permission_id`),
  CONSTRAINT `fk_plan_permissions_plan` 
    FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_plan_permissions_permission` 
    FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Maps subscription plans to permissions (plan-wise feature access)';


-- ============================================================
-- Optional: Insert default permission rows (match lib/permissions.ts)
-- Run this after tables are created if you want seed data via SQL
-- ============================================================
/*
INSERT INTO `permissions` (`key`, `label`, `module`) VALUES
('dashboard.view', 'View Dashboard', 'Main'),
('userpanel.manage', 'Manage User Panel', 'Main'),
('analytics.view', 'View Analytics', 'Main'),
('subscription.plans.view', 'View Subscription Plans', 'Subscription'),
('subscription.plans.manage', 'Manage Subscription Plans', 'Subscription'),
('franchises.view', 'View Franchises', 'Subscription'),
('franchises.manage', 'Manage Franchises', 'Subscription'),
('franchises.approve', 'Approve Franchises', 'Subscription'),
('courses.view', 'View Courses', 'Academics'),
('courses.manage', 'Manage Courses', 'Academics'),
('students.view', 'View Students', 'Academics'),
('students.manage', 'Manage Students', 'Academics'),
('fees.view', 'View Fees', 'Academics'),
('fees.manage', 'Manage Fees', 'Academics'),
('attendance.view', 'View Attendance', 'Attendance'),
('attendance.manage', 'Manage Attendance', 'Attendance'),
('certificates.view', 'View Certificates', 'Certificates'),
('certificates.issue', 'Issue Certificates', 'Certificates'),
('staff.view', 'View Staff', 'Staff'),
('staff.manage', 'Manage Staff', 'Staff'),
('notifications.view', 'View Notifications', 'Communication'),
('notifications.manage', 'Manage Notifications', 'Communication'),
('feedback.view', 'View Feedback', 'Communication'),
('feedback.manage', 'Manage Feedback', 'Communication'),
('email_reminders.manage', 'Manage Email Reminders', 'Communication'),
('users.view', 'View Users', 'System'),
('users.manage', 'Manage Users', 'System'),
('settings.view', 'View Settings', 'System'),
('settings.manage', 'Manage Settings', 'System'),
('permissions.manage', 'Manage Permissions', 'System')
ON DUPLICATE KEY UPDATE `label` = VALUES(`label`), `module` = VALUES(`module`);
*/
