import { prisma } from "@/lib/prisma";

export async function ensureActiveTripPlan(userId: string) {
  const existingDefault = await prisma.tripPlan.findFirst({
    where: {
      userId,
      isDefault: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (existingDefault) {
    return existingDefault;
  }

  const latestPlan = await prisma.tripPlan.findFirst({
    where: { userId },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (latestPlan) {
    return prisma.tripPlan.update({
      where: { id: latestPlan.id },
      data: { isDefault: true },
    });
  }

  return prisma.tripPlan.create({
    data: {
      userId,
      title: "My Trip",
      isDefault: true,
    },
  });
}

export function appendQueryFlag(path: string, key: string, value = "1") {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}
