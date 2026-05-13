import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const connectionString = process.env.DATABASE_URL;

function hasConfiguredDatabaseUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  return !value.includes("[YOUR-PASSWORD]") && !value.includes("[REGION]");
}

export const isDatabaseConfigured = hasConfiguredDatabaseUrl(connectionString);

function createPrismaClient() {
  if (!connectionString) {
    throw new Error("DATABASE_URL is required for Prisma.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: ["error"],
  });
}

function getPrismaClient() {
  if (!isDatabaseConfigured) {
    throw new Error(
      "Prisma is unavailable because DATABASE_URL is still using placeholder values. Update .env with a real Supabase/Postgres connection string.",
    );
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
