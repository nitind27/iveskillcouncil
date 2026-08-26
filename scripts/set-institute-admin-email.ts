import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const NEW_EMAIL = "official.iveskillcouncil@gmail.com";

async function main() {
  const admins = await prisma.user.findMany({
    where: { roleId: 2 },
    orderBy: { id: "asc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      status: true,
      password: true,
    },
  });
  console.log(
    "Admins:",
    admins.map((a) => ({ id: a.id.toString(), email: a.email, status: a.status }))
  );

  const primary = admins.find((a) => a.email === "admin@franchiseinstitute.com") || admins[0];
  if (!primary) {
    console.log("No institute admin found");
    return;
  }

  // Free the target email if held by another user
  const holder = await prisma.user.findUnique({ where: { email: NEW_EMAIL } });
  if (holder && holder.id !== primary.id) {
    // Keep password from whichever is more likely the real account (primary)
    // Retire the duplicate seed account
    const retired = `retired.${holder.id}@iveskillcouncil.local`;
    await prisma.user.update({
      where: { id: holder.id },
      data: {
        email: retired,
        status: "INACTIVE",
      },
    });
    console.log(`Retired duplicate admin ${holder.id} -> ${retired}`);
  }

  await prisma.user.update({
    where: { id: primary.id },
    data: {
      email: NEW_EMAIL,
      status: "ACTIVE",
      mustChangePassword: false,
      fullName: primary.fullName || "Institute Admin",
    },
  });

  console.log(`Main Admin (Institute) login email: ${NEW_EMAIL} (user id ${primary.id})`);

  const after = await prisma.user.findMany({
    where: { roleId: 2, status: "ACTIVE" },
    select: { id: true, email: true, fullName: true, status: true },
  });
  console.log("Active ADMIN users:", after);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
