-- Table: global_settings
-- Single-row config for app-wide settings (SUPER_ADMIN only).
-- Used by /api/settings/global and Global Settings page.

CREATE TABLE IF NOT EXISTS `global_settings` (
  `id` INT NOT NULL DEFAULT 1,
  `config` JSON NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default row: empty object; app upserts on first save.
INSERT INTO `global_settings` (`id`, `config`, `updated_at`)
VALUES (1, '{}', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;
