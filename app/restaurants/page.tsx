import Link from "next/link";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { INDIA_STATES, haversineKm } from "@/lib/india-geo";
import { NearbyLocator } from "@/components/nearby-locator";

type RestaurantsPageProps = {
  searchParams: Promise<{
    q?: string;
    cuisine?: string;
    state?: string;
    sort?: "best" | "rating" | "delivery" | "nearby";
    lat?: string;
    lng?: string;
  }>;
};

function extractCuisines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string");
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export default async function RestaurantsPage({
  searchParams,
}: RestaurantsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const cuisine = params.cuisine?.trim() ?? "";
  const state = params.state?.trim() ?? "";
  const sort = params.sort ?? "best";
  const latitude = Number.parseFloat(params.lat ?? "");
  const longitude = Number.parseFloat(params.lng ?? "");
  const hasValidLocation = !Number.isNaN(latitude) && !Number.isNaN(longitude);

  const restaurants = isDatabaseConfigured
    ? await prisma.restaurant.findMany({
        where: {
          isActive: true,
          ...(state ? { state } : {}),
          ...(query
            ? {
                OR: [
                  { name: { contains: query } },
                  { description: { contains: query } },
                  { address: { contains: query } },
                  { city: { contains: query } },
                  { state: { contains: query } },
                ],
              }
            : {}),
        },
        include: {
          reviews: {
            select: {
              rating: true,
            },
          },
          menuItems: {
            select: {
              id: true,
            },
          },
        },
      })
    : [];

  const enriched = restaurants
    .map((restaurant) => {
      const cuisines = extractCuisines(restaurant.cuisineType);
      const totalReviews = restaurant.reviews.length;
      const averageRating =
        totalReviews === 0
          ? 0
          : restaurant.reviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews;

      const distanceKm =
        hasValidLocation
          ? haversineKm(latitude, longitude, restaurant.latitude, restaurant.longitude)
          : null;

      const qualityScore =
        averageRating * 20 +
        Math.min(totalReviews, 50) * 0.2 +
        (restaurant.isOpen ? 2 : 0) -
        restaurant.deliveryFee * 0.05 +
        (distanceKm ? Math.max(0, 10 - Math.min(distanceKm, 10)) * 0.3 : 0);

      return {
        ...restaurant,
        cuisines,
        totalReviews,
        averageRating,
        distanceKm,
        qualityScore,
      };
    })
    .filter((restaurant) =>
      cuisine ? restaurant.cuisines.includes(cuisine) : true,
    )
    .sort((a, b) => {
      if (sort === "best") {
        if (b.qualityScore !== a.qualityScore) {
          return b.qualityScore - a.qualityScore;
        }
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        return b.averageRating - a.averageRating;
      }

      if (sort === "nearby") {
        if (a.distanceKm !== null && b.distanceKm !== null) {
          if (a.distanceKm !== b.distanceKm) {
            return a.distanceKm - b.distanceKm;
          }
          return b.averageRating - a.averageRating;
        }
        return b.averageRating - a.averageRating;
      }

      if (sort === "delivery") {
        return a.deliveryFee - b.deliveryFee;
      }

      return b.averageRating - a.averageRating;
    });

  const cuisineOptions = Array.from(
    new Set(restaurants.flatMap((restaurant) => extractCuisines(restaurant.cuisineType))),
  ).sort((a, b) => a.localeCompare(b));

  const stateOptions = Array.from(
    new Set(
      restaurants
        .map((restaurant) => restaurant.state)
        .filter((item): item is string => Boolean(item)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const mergedStateOptions = Array.from(new Set([...INDIA_STATES, ...stateOptions]));

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-orange-600">
              Discover Food
            </p>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Restaurant Listing
            </h1>
            <p className="mt-2 text-slate-600">
              Find restaurants by state, cuisine, quality score, and nearby distance.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href="/cart"
              className="rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-slate-800"
            >
              View Cart
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-center text-sm font-medium text-orange-700 transition hover:border-orange-300 hover:bg-orange-50"
            >
              Back Home
            </Link>
          </div>
        </div>

        <form className="mb-8 grid gap-3 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-5">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search restaurants..."
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none ring-orange-200 transition placeholder:text-slate-400 focus:ring-2 sm:col-span-2 xl:col-span-2"
          />
          <select
            name="state"
            defaultValue={state}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none ring-orange-200 transition focus:ring-2"
          >
            <option value="">All States</option>
            {mergedStateOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            name="cuisine"
            defaultValue={cuisine}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none ring-orange-200 transition focus:ring-2"
          >
            <option value="">All Cuisines</option>
            {cuisineOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-800 outline-none ring-orange-200 transition focus:ring-2"
          >
            <option value="best">Best Nearby and Top Rated</option>
            <option value="rating">Sort by Rating</option>
            <option value="delivery">Sort by Delivery Fee</option>
            <option value="nearby">Sort by Distance</option>
          </select>
          <input type="hidden" name="lat" value={hasValidLocation ? latitude : ""} />
          <input type="hidden" name="lng" value={hasValidLocation ? longitude : ""} />
          <div className="flex justify-stretch sm:col-span-2 sm:justify-end xl:col-span-5">
            <button
              type="submit"
              className="w-full rounded-xl bg-orange-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 sm:w-auto"
            >
              Apply Filters
            </button>
          </div>
          <div className="sm:col-span-2 xl:col-span-5">
            <NearbyLocator clearSortValue="best" />
          </div>
        </form>

        {enriched.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              No restaurants found
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Try changing your filters or add sample restaurants to the
              database.
            </p>
          </div>
        ) : (
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {enriched.map((restaurant) => (
              <article
                key={restaurant.id}
                className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {restaurant.name}
                  </h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      restaurant.isOpen
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {restaurant.isOpen ? "Open" : "Closed"}
                  </span>
                </div>
                <p className="mb-4 line-clamp-2 text-sm text-slate-600">
                  {restaurant.description ?? "No description available."}
                </p>
                <p className="mb-3 text-xs text-slate-500">
                  {restaurant.city ?? "City not set"}, {restaurant.state ?? "State not set"}
                </p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {restaurant.cuisines.length > 0 ? (
                    restaurant.cuisines.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      No cuisine tags
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm text-slate-700">
                  <p>
                    Rating:{" "}
                    <span className="font-semibold text-slate-900">
                      {restaurant.averageRating.toFixed(1)}
                    </span>{" "}
                    ({restaurant.totalReviews} reviews)
                  </p>
                  <p>
                    Delivery Fee:{" "}
                    <span className="font-semibold text-slate-900">
                      ${restaurant.deliveryFee.toFixed(2)}
                    </span>
                  </p>
                  <p>
                    ETA:{" "}
                    <span className="font-semibold text-slate-900">
                      {restaurant.estimatedTime ?? "Not set"}
                    </span>
                  </p>
                  <p>
                    Distance:{" "}
                    <span className="font-semibold text-slate-900">
                      {restaurant.distanceKm !== null
                        ? `${restaurant.distanceKm.toFixed(1)} km`
                        : "Enable location"}
                    </span>
                  </p>
                  <p>
                    Menu Items:{" "}
                    <span className="font-semibold text-slate-900">
                      {restaurant.menuItems.length}
                    </span>
                  </p>
                </div>
                <Link
                  href={`/restaurants/${restaurant.id}`}
                  className="mt-4 inline-flex w-full justify-center rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 sm:w-auto"
                >
                  View Menu
                </Link>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
