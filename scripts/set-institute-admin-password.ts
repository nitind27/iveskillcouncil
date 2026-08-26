import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("12345678", 10);
  const u = await prisma.user.update({
    where: { email: "official.iveskillcouncil@gmail.com" },
    data: {
      password: hash,
      mustChangePassword: false,
      status: "ACTIVE",
    },
    select: { id: true, email: true },
  });
  console.log("Password set to 12345678 for:", u.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
