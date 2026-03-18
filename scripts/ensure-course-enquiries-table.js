const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    const db = await prisma.$queryRawUnsafe("SELECT DATABASE() AS db");
    console.log("Connected DB:", db?.[0]?.db);

    const existsRows = await prisma.$queryRawUnsafe(
      "SELECT COUNT(*) AS cnt FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'course_enrollment_requests'"
    );
    const exists = Number(existsRows?.[0]?.cnt || 0) > 0;

    if (!exists) {
      console.log("Creating table course_enrollment_requests...");
      await prisma.$executeRawUnsafe(`
        CREATE TABLE course_enrollment_requests (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          full_name VARCHAR(150) NOT NULL,
          email VARCHAR(150) NOT NULL,
          phone VARCHAR(20) NOT NULL,
          course_name VARCHAR(200) NOT NULL,
          message TEXT NULL,
          address VARCHAR(500) NULL,
          pincode VARCHAR(10) NULL,
          area VARCHAR(150) NULL,
          city VARCHAR(100) NULL,
          state VARCHAR(100) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_enrollment_created (created_at),
          PRIMARY KEY (id)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      `);
      console.log("Table created.");
      return;
    }

    console.log("Table exists. Ensuring columns...");
    const cols = await prisma.$queryRawUnsafe(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'course_enrollment_requests'"
    );
    const set = new Set(cols.map((c) => String(c.column_name)));

    const addColumn = async (name, ddl) => {
      if (set.has(name)) return;
      console.log("Adding column:", name);
      await prisma.$executeRawUnsafe(
        `ALTER TABLE course_enrollment_requests ADD COLUMN ${ddl}`
      );
    };

    await addColumn("address", "address VARCHAR(500) NULL");
    await addColumn("pincode", "pincode VARCHAR(10) NULL");
    await addColumn("area", "area VARCHAR(150) NULL");
    await addColumn("city", "city VARCHAR(100) NULL");
    await addColumn("state", "state VARCHAR(100) NULL");

    console.log("Done. Schema is compatible for course enquiries.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});

