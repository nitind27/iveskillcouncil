-- Run this SQL in your MySQL database to add franchise_id to courses table
-- Copy-paste into phpMyAdmin or: mysql -u user -p database < this_file.sql

ALTER TABLE `courses` ADD COLUMN `franchise_id` BIGINT UNSIGNED NULL;
ALTER TABLE `courses` ADD INDEX `idx_course_franchise`(`franchise_id`);
ALTER TABLE `courses` ADD CONSTRAINT `courses_franchise_id_fkey` FOREIGN KEY (`franchise_id`) REFERENCES `franchises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
