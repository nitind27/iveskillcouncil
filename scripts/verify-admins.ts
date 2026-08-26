import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      roleId: true,
      fullName: true,
      status: true,
      password: true,
    },
    orderBy: { roleId: "asc" },
  });
  console.log("User count:", users.length);
  for (const u of users) {
    let ok = false;
    if (u.email === "codeatinfotech@gmail.com") {
      ok = await bcrypt.compare("NP@@7359", u.password);
    }
    if (u.email === "official.iveskillcouncil@gmail.com") {
      ok = await bcrypt.compare("12345678", u.password);
    }
    console.log({
      id: String(u.id),
      email: u.email,
      roleId: u.roleId,
      name: u.fullName,
      status: u.status,
      passwordOk: ok,
    });
  }
  console.log({
    franchises: await prisma.franchise.count(),
    students: await prisma.student.count(),
    courses: await prisma.course.count(),
    exams: await prisma.exam.count(),
    payments: await prisma.payment.count(),
    staff: await prisma.staff.count(),
    chatMessages: await prisma.chatMessage.count(),
    otps: await prisma.otpVerification.count(),
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
