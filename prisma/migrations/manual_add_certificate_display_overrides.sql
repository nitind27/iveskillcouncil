-- Add certificate display override fields for admin-edited preview/print content
ALTER TABLE `certificates`
  ADD COLUMN IF NOT EXISTS `display_overrides` JSON NULL AFTER `issued_by`;
