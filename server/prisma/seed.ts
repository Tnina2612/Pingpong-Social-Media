import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log("🌱 Start seeding...");

  const permissions = [
    "SEND_MESSAGE",
    "DELETE_MESSAGE",
    "KICK_MEMBER",
    "BAN_MEMBER",
    "MANAGE_CHANNEL",
    "MANAGE_ROLE",
    "MANAGE_SERVER",
  ];

  for (const code of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code },
    });
  }
  console.log("Done seeding");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
