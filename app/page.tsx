import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { HomePage } from "@/components/home-page";

export const dynamic = "force-dynamic";

export default async function Home() {
  let restaurantCount = 0;
  let placeCount = 0;
  let transportCount = 0;
  let stayCount = 0;
  let featuredPlaces: any[] = [];
  let featuredTransport: any[] = [];

  if (isDatabaseConfigured) {
    try {
      [restaurantCount, placeCount, transportCount, stayCount, featuredPlaces, featuredTransport] =
        await Promise.all([
          prisma.restaurant.count({ where: { isActive: true } }),
          prisma.touristPlace.count({ where: { isActive: true } }),
          prisma.transportOption.count({ where: { isActive: true } }),
          prisma.accommodation.count({ where: { isActive: true } }),
          prisma.touristPlace.findMany({
            where: { isActive: true },
            orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
            take: 3,
          }),
          prisma.transportOption.findMany({
            where: { isActive: true },
            orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
            take: 3,
          }),
        ]);
    } catch (error) {
      // Database connection failed, use default values
      console.warn("Database connection failed, using default values:", error);
    }
  }

  return (
    <HomePage
      counts={{
        restaurants: restaurantCount,
        places: placeCount,
        transport: transportCount,
        stays: stayCount,
      }}
      featuredPlaces={featuredPlaces}
      featuredTransport={featuredTransport}
    />
  );
}
