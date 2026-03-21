-- Run all pending migrations manually
-- Execute in MySQL or copy-paste into phpMyAdmin
-- Run each block separately. Skip any that give "Duplicate" or "already exists" error.

-- 1. franchise_id in courses (SKIP if you get "Duplicate column name 'franchise_id'")
-- ALTER TABLE `courses` ADD COLUMN `franchise_id` BIGINT UNSIGNED NULL;
-- ALTER TABLE `courses` ADD INDEX `idx_course_franchise`(`franchise_id`);
-- ALTER TABLE `courses` ADD CONSTRAINT `courses_franchise_id_fkey` FOREIGN KEY (`franchise_id`) REFERENCES `franchises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Add must_change_password to users
ALTER TABLE `users` ADD COLUMN `must_change_password` TINYINT(1) NOT NULL DEFAULT 0;

-- 3. Create otp_verifications table
CREATE TABLE IF NOT EXISTS `otp_verifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `otp` varchar(10) NOT NULL,
  `purpose` varchar(50) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_otp_email_purpose` (`email`, `purpose`),
  KEY `idx_otp_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Create support_requests table
CREATE TABLE IF NOT EXISTS `support_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `source` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_support_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Add address fields to students (SKIP if "Duplicate column" error)
ALTER TABLE `students` ADD COLUMN `address` VARCHAR(500) NULL;
ALTER TABLE `students` ADD COLUMN `area` VARCHAR(150) NULL;
ALTER TABLE `students` ADD COLUMN `pincode` VARCHAR(20) NULL;
ALTER TABLE `students` ADD COLUMN `city` VARCHAR(100) NULL;
ALTER TABLE `students` ADD COLUMN `state` VARCHAR(100) NULL;

-- 6. Create announcements table (Super Admin broadcasts to franchise admins)
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `created_by` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_announcement_created` (`created_at`),
  CONSTRAINT `announcements_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
