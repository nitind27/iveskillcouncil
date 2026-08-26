-- Advanced course catalogue fields (safe / idempotent)

-- Core advanced columns
ALTER TABLE `courses`
  ADD COLUMN IF NOT EXISTS `award_category` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `certificate_type` VARCHAR(30) NULL,
  ADD COLUMN IF NOT EXISTS `course_preposition` VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS `mrp` DECIMAL(10,2) NULL,
  ADD COLUMN IF NOT EXISTS `display_order` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `duration_value` INT NULL,
  ADD COLUMN IF NOT EXISTS `duration_unit` VARCHAR(20) NULL,
  ADD COLUMN IF NOT EXISTS `preview_video_url` VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS `practical_marks` INT NULL,
  ADD COLUMN IF NOT EXISTS `objective_marks` INT NULL,
  ADD COLUMN IF NOT EXISTS `exam_fees_by_plan` JSON NULL,
  ADD COLUMN IF NOT EXISTS `syllabus` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `eligibility` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `certificate_subject` VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS `tags` JSON NULL,
  ADD COLUMN IF NOT EXISTS `is_popular` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `is_recommended` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `is_mrp_visible` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `hide_exam_result` TINYINT(1) NOT NULL DEFAULT 0;

-- Index (ignore error if already exists)
-- CREATE INDEX `idx_course_display_order` ON `courses` (`display_order`);
