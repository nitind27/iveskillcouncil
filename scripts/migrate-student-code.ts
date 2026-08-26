import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Add column if missing
  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE students ADD COLUMN student_code VARCHAR(32) NULL"
    );
    console.log("Added student_code column");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/Duplicate column/i.test(msg)) throw e;
    console.log("student_code already exists");
  }

  const rows = await prisma.$queryRawUnsafe<Array<{ id: bigint }>>(
    "SELECT id FROM students WHERE student_code IS NULL OR student_code = '' ORDER BY id ASC"
  );
  const year = new Date().getFullYear();
  let i = 1;
  // Also get max existing
  const maxRow = await prisma.$queryRawUnsafe<Array<{ student_code: string | null }>>(
    `SELECT student_code FROM students WHERE student_code LIKE 'STU-${year}-%' ORDER BY student_code DESC LIMIT 1`
  );
  if (maxRow[0]?.student_code) {
    const n = parseInt(maxRow[0].student_code.split("-").pop() || "0", 10);
    if (Number.isFinite(n)) i = n + 1;
  }

  for (const r of rows) {
    const code = `STU-${year}-${String(i).padStart(6, "0")}`;
    await prisma.$executeRawUnsafe(
      "UPDATE students SET student_code = ? WHERE id = ?",
      code,
      r.id
    );
    console.log("Set", r.id.toString(), "→", code);
    i++;
  }

  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE students MODIFY student_code VARCHAR(32) NOT NULL"
    );
  } catch (e) {
    console.warn("NOT NULL:", e);
  }

  try {
    await prisma.$executeRawUnsafe(
      "CREATE UNIQUE INDEX students_student_code_key ON students (student_code)"
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/Duplicate|exists/i.test(msg)) console.warn("unique index:", msg);
  }

  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE students MODIFY course_id BIGINT UNSIGNED NULL"
    );
    console.log("course_id nullable");
  } catch (e) {
    console.warn("course_id:", e);
  }

  console.log("Done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
