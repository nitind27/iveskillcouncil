import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HERO_IMAGES = [
  "/uploads/userpanel/hero/1.png",
  "/uploads/userpanel/hero/2.png",
  "/uploads/userpanel/hero/3.png",
  "/uploads/userpanel/hero/4.png",
];

async function main() {
  const row = await prisma.userPanelSetting.findUnique({ where: { id: 1 } });
  const config = (row?.config ?? {}) as Record<string, any>;
  const hero = { ...(config.hero ?? {}) };

  hero.backgroundImage = HERO_IMAGES[0];
  hero.backgroundImages = HERO_IMAGES;

  await prisma.userPanelSetting.upsert({
    where: { id: 1 },
    create: { id: 1, config: { ...config, hero } },
    update: { config: { ...config, hero } },
  });

  console.log("Updated hero images:");
  HERO_IMAGES.forEach((img) => console.log(" -", img));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
