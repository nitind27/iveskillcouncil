ALTER TABLE `certificates`
  ADD COLUMN IF NOT EXISTS `requested_by` BIGINT UNSIGNED NULL AFTER `issued_by`,
  ADD INDEX IF NOT EXISTS `idx_certificate_requester` (`requested_by`);
