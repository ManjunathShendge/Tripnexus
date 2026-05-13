const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for Prisma scripts.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const seedDomain = "@foodapp.local";

  const updatedSeedUsers = await prisma.user.updateMany({
    where: {
      authUserId: null,
      email: { endsWith: seedDomain },
    },
    data: {
      isSeedUser: true,
    },
  });

  const unresolved = await prisma.user.findMany({
    where: {
      authUserId: null,
      isSeedUser: false,
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`Seed users tagged: ${updatedSeedUsers.count}`);
  if (unresolved.length > 0) {
    console.log("Non-seed users still missing authUserId:");
    unresolved.forEach((user) => {
      console.log(`- ${user.email} (${user.id})`);
    });
    console.log(
      "Action required: these accounts should sign in via Supabase once so authUserId can be linked automatically.",
    );
  } else {
    console.log("All non-seed users are auth-linked.");
  }
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
