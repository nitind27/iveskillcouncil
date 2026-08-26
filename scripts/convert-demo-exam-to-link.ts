/**
 * Convert "[DEMO] Web Development Basics Exam" to walk-in LINK mode
 * so the public exam link appears in the admin portal.
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const exam = await prisma.exam.findFirst({
    where: { title: { startsWith: "[DEMO] Web Development" } },
  });
  if (!exam) {
    console.error("Demo exam not found");
    process.exit(1);
  }

  const linkToken = exam.linkToken || randomBytes(24).toString("hex");
  const updated = await prisma.exam.update({
    where: { id: exam.id },
    data: {
      accessMode: "LINK",
      linkToken,
      linkActive: true,
      status: "PUBLISHED",
    },
  });

  console.log("Converted to LINK mode:");
  console.log("  id:", updated.id.toString());
  console.log("  title:", updated.title);
  console.log("  linkActive:", updated.linkActive);
  console.log("  path: /exam-link/" + updated.linkToken);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
