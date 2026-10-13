-- Private certificate/result share links (username + password, chosen students only)
CREATE TABLE IF NOT EXISTS `certificate_share_links` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `token` VARCHAR(64) NOT NULL,
  `username` VARCHAR(80) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `title` VARCHAR(150) NULL,
  `student_ids` JSON NOT NULL,
  `course_id` VARCHAR(32) NULL,
  `kinds` VARCHAR(20) NOT NULL DEFAULT 'both',
  `created_by` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificate_share_links_token_key` (`token`),
  KEY `idx_share_created_by` (`created_by`)
);
