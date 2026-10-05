-- Extra online-exam question types and written answers.
-- Safe to re-run on MariaDB / MySQL 8 that supports IF NOT EXISTS.

ALTER TABLE `exam_questions`
  MODIFY COLUMN `type` ENUM(
    'SINGLE_CHOICE',
    'MULTIPLE_CHOICE',
    'TRUE_FALSE',
    'SHORT_ANSWER',
    'PARAGRAPH'
  ) NOT NULL DEFAULT 'SINGLE_CHOICE';

ALTER TABLE `exam_answers`
  ADD COLUMN IF NOT EXISTS `answer_text` TEXT NULL;
