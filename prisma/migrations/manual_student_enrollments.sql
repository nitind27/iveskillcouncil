-- One student, many courses. Existing course_id rows are copied in.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS `student_enrollments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `student_id` BIGINT UNSIGNED NOT NULL,
  `course_id` BIGINT UNSIGNED NOT NULL,
  `total_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_course_enrollment` (`student_id`, `course_id`),
  KEY `idx_enrollment_course` (`course_id`),
  CONSTRAINT `fk_enroll_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_enroll_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `student_enrollments` (`student_id`, `course_id`, `total_fee`, `status`)
SELECT `id`, `course_id`, `total_fee`, 'ACTIVE'
FROM `students`
WHERE `course_id` IS NOT NULL
ON DUPLICATE KEY UPDATE `total_fee` = `student_enrollments`.`total_fee`;
