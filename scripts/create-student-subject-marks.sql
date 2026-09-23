CREATE TABLE IF NOT EXISTS `student_subject_marks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` BIGINT UNSIGNED NOT NULL,
  `course_id` BIGINT UNSIGNED NOT NULL,
  `subject_name` VARCHAR(150) NOT NULL,
  `max_marks` INT NOT NULL DEFAULT 100,
  `obtained_marks` INT NOT NULL DEFAULT 0,
  `updated_by_id` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_course_subject` (`student_id`, `course_id`, `subject_name`),
  KEY `idx_ssm_course` (`course_id`),
  KEY `idx_ssm_student` (`student_id`),
  CONSTRAINT `fk_ssm_student` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ssm_course` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
