import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const createSql = `
CREATE TABLE IF NOT EXISTS \`course_subjects\` (
  \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`course_id\` BIGINT UNSIGNED NOT NULL,
  \`name\` VARCHAR(150) NOT NULL,
  \`max_marks\` INT NOT NULL DEFAULT 100,
  \`sort_order\` INT NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`unique_course_subject_name\` (\`course_id\`, \`name\`),
  KEY \`idx_course_subject_course\` (\`course_id\`),
  CONSTRAINT \`fk_course_subject_course\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

function parseNames(raw) {
  if (!raw || !String(raw).trim()) return [];
  const seen = new Set();
  const out = [];
  for (const part of String(raw).split(/[,\n]/)) {
    const name = part.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

try {
  await prisma.$executeRawUnsafe(createSql);
  console.log("course_subjects table: OK");

  const courses = await prisma.$queryRawUnsafe(
    `SELECT id, certificate_subject AS certificateSubject, objective_marks AS objectiveMarks, practical_marks AS practicalMarks FROM courses WHERE certificate_subject IS NOT NULL AND TRIM(certificate_subject) <> ''`
  );

  let inserted = 0;
  for (const c of courses) {
    const names = parseNames(c.certificateSubject);
    if (!names.length) continue;
    const defaultMax = c.objectiveMarks ?? c.practicalMarks ?? 100;
    for (let i = 0; i < names.length; i++) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT IGNORE INTO course_subjects (course_id, name, max_marks, sort_order) VALUES (?, ?, ?, ?)`,
          c.id,
          names[i],
          defaultMax,
          i + 1
        );
        inserted += 1;
      } catch {
        // ignore dupes
      }
    }
  }
  console.log(`Migrated subject rows (attempted inserts): ${inserted}`);
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
