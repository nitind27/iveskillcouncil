import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const EMAIL = "official.iveskillcouncil@gmail.com";
const PASSWORD = "12345678";

async function main() {
  const prisma = new PrismaClient();

  const admin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "official.eklavyaeducationhub@gmail.com" },
        { roleId: 2 },
      ],
    },
    orderBy: { id: "asc" },
  });

  if (!admin) {
    throw new Error("Institute admin not found");
  }

  const holder = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (holder && holder.id !== admin.id) {
    await prisma.user.update({
      where: { id: holder.id },
      data: {
        email: `retired.${holder.id}@iveskillcouncil.local`,
        status: "INACTIVE",
      },
    });
  }

  const hash = await bcrypt.hash(PASSWORD, 10);
  const updated = await prisma.user.update({
    where: { id: admin.id },
    data: {
      email: EMAIL,
      password: hash,
      mustChangePassword: false,
      status: "ACTIVE",
      fullName: admin.fullName || "Institute Admin",
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      roleId: true,
      status: true,
      password: true,
    },
  });

  const passwordOk = await bcrypt.compare(PASSWORD, updated.password);
  console.log(
    JSON.stringify(
      {
        id: String(updated.id),
        email: updated.email,
        fullName: updated.fullName,
        roleId: updated.roleId,
        status: updated.status,
        passwordOk,
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
