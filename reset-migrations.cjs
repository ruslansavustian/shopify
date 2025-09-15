const { PrismaClient } = require("@prisma/client");

async function resetMigrations() {
  const prisma = new PrismaClient();

  try {
    // Удаляем таблицу _prisma_migrations
    await prisma.$executeRaw`DROP TABLE IF EXISTS "_prisma_migrations"`;
    console.log("✅ Migration table dropped");

    // Удаляем таблицу Session если существует
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Session"`;
    console.log("✅ Session table dropped");

    console.log("✅ Database reset completed");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetMigrations();
