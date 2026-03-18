-- ============================================================
-- Insert Subscription Plans (SILVER, GOLD, DIAMOND)
-- Table: subscription_plans
-- ============================================================

INSERT INTO `subscription_plans` (`id`, `name`, `price`, `duration_in_days`, `status`, `created_at`, `updated_at`) VALUES
(1, 'SILVER', 5000.00, 365, 'ACTIVE', NOW(), NOW()),
(2, 'GOLD', 10000.00, 365, 'ACTIVE', NOW(), NOW()),
(3, 'DIAMOND', 20000.00, 365, 'ACTIVE', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `price` = VALUES(`price`),
  `duration_in_days` = VALUES(`duration_in_days`),
  `status` = VALUES(`status`),
  `updated_at` = NOW();


-- ============================================================
-- Optional: If table uses ENUM and you need to create table first
-- (Normally Prisma migration creates the table)
-- ============================================================
/*
CREATE TABLE IF NOT EXISTS `subscription_plans` (
  `id` TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` ENUM('SILVER','GOLD','DIAMOND') NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `duration_in_days` INT NOT NULL,
  `status` ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subscription_plans_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `subscription_plans` (`name`, `price`, `duration_in_days`, `status`) VALUES
('SILVER', 5000.00, 365, 'ACTIVE'),
('GOLD', 10000.00, 365, 'ACTIVE'),
('DIAMOND', 20000.00, 365, 'ACTIVE');
*/
