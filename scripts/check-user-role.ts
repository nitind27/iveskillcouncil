import { PrismaClient } from "@prisma/client";

const email = "official.eklavyaeducationhub@gmail.com";

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      roleId: true,
      status: true,
      franchiseId: true,
      role: { select: { name: true } },
    },
  });

  if (!user) {
    console.log("NOT_FOUND");
    const similar = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: "eklavya" } },
          { email: { contains: "official" } },
        ],
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        roleId: true,
        status: true,
        franchiseId: true,
        role: { select: { name: true } },
      },
    });
    console.log(
      JSON.stringify(
        similar.map((u) => ({
          id: String(u.id),
          email: u.email,
          fullName: u.fullName,
          roleId: u.roleId,
          roleName: u.role?.name,
          status: u.status,
          franchiseId: u.franchiseId ? String(u.franchiseId) : null,
        })),
        null,
        2
      )
    );
    await prisma.$disconnect();
    return;
  }

  console.log(
    JSON.stringify(
      {
        id: String(user.id),
        email: user.email,
        fullName: user.fullName,
        roleId: user.roleId,
        roleName: user.role?.name,
        isSubAdmin: user.roleId === 3,
        status: user.status,
        franchiseId: user.franchiseId ? String(user.franchiseId) : null,
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

main().catch(console.error);
