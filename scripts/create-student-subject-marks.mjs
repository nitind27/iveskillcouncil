import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const sql = readFileSync(new URL("./create-student-subject-marks.sql", import.meta.url), "utf8");
const prisma = new PrismaClient();

try {
  await prisma.$executeRawUnsafe(sql);
  console.log("student_subject_marks: OK");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
