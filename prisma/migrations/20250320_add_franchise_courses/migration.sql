-- AlterTable: Add franchiseId to courses for franchise-specific courses
ALTER TABLE `courses` ADD COLUMN `franchise_id` BIGINT UNSIGNED NULL;
ALTER TABLE `courses` ADD INDEX `idx_course_franchise`(`franchise_id`);
ALTER TABLE `courses` ADD CONSTRAINT `courses_franchise_id_fkey` FOREIGN KEY (`franchise_id`) REFERENCES `franchises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
