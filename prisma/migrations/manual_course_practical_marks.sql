-- Course-wise practical on Statement of Marks, plus per-subject practical marks.
-- Safe to re-run.

ALTER TABLE `courses`
  ADD COLUMN IF NOT EXISTS `has_practical` TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE `student_subject_marks`
  ADD COLUMN IF NOT EXISTS `practical_max` INT NULL,
  ADD COLUMN IF NOT EXISTS `practical_obtained` INT NULL;
