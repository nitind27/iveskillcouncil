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

-- 7. Student subject marks (class-wise marks entry)
CREATE TABLE IF NOT EXISTS `student_subject_marks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` BIGINT UNSIGNED NOT NULL,
  `course_id` BIGINT UNSIGNED NOT NULL,
  `subject_name` VARCHAR(150) NOT NULL,
  `max_marks` INT NOT NULL DEFAULT 100,
  `obtained_marks` INT NOT NULL DEFAULT 0,
  `updated_by_id` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_course_subject` (`student_id`, `course_id`, `subject_name`),
  KEY `idx_ssm_course` (`course_id`),
  KEY `idx_ssm_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Course subjects (per-course syllabus for marks / certificates)
CREATE TABLE IF NOT EXISTS `course_subjects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `course_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `max_marks` INT NOT NULL DEFAULT 100,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_course_subject_name` (`course_id`, `name`),
  KEY `idx_course_subject_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
