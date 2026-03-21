-- Create offer_applications table
-- Run manually if prisma migrate fails

CREATE TABLE IF NOT EXISTS `offer_applications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `offer_id` VARCHAR(100) NOT NULL,
  `offer_title` VARCHAR(200) NOT NULL,
  `message` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_offer_app_created` (`created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
