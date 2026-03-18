-- Table: user_panel_settings
-- Stores dynamic config for the public user panel (homepage).
-- Used by /api/userpanel-config and /api/admin/userpanel-config.

CREATE TABLE IF NOT EXISTS `user_panel_settings` (
  `id` INT NOT NULL DEFAULT 1,
  `config` JSON NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default row (optional – app can upsert on first save)
-- INSERT INTO `user_panel_settings` (`id`, `config`, `updated_at`)
-- VALUES (1, '{}', CURRENT_TIMESTAMP)
-- ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;
