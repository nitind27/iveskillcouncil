-- Add address fields to students table
ALTER TABLE `students` ADD COLUMN `address` VARCHAR(500) NULL;
ALTER TABLE `students` ADD COLUMN `area` VARCHAR(150) NULL;
ALTER TABLE `students` ADD COLUMN `pincode` VARCHAR(20) NULL;
ALTER TABLE `students` ADD COLUMN `city` VARCHAR(100) NULL;
ALTER TABLE `students` ADD COLUMN `state` VARCHAR(100) NULL;
