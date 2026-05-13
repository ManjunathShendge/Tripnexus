import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BedDouble, CarFront, Compass, Star, Store, Ticket } from "lucide-react";
import Link from "next/link";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { INDIA_STATES, haversineKm } from "@/lib/india-geo";
import { NearbyLocator } from "@/components/nearby-locator";
import { ACCOMMODATION_TYPE_LABELS } from "@/lib/business";

type NearbyPageProps = {
  searchParams: Promise<{
    q?: string;
    state?: string;
    sort?: "featured" | "nearby";
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

function sortByDistanceThenFeatured<T extends { distanceKm: number | null; isFeatured?: boolean; name: string }>(
  items: T[],
  sort: "featured" | "nearby",
) {
  return [...items].sort((a, b) => {
    if (sort === "nearby") {
      if (a.distanceKm !== null && b.distanceKm !== null && a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      if (a.distanceKm !== null && b.distanceKm === null) {
        return -1;
      }
      if (a.distanceKm === null && b.distanceKm !== null) {
        return 1;
      }
    }

    if (Boolean(a.isFeatured) !== Boolean(b.isFeatured)) {
      return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
    }

    if (a.distanceKm !== null && b.distanceKm !== null && a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm;
    }

    return a.name.localeCompare(b.name);
  });
}

function formatExternalHref(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("tel:")) {
    return value;
  }

  return `https://${value}`;
}

export default async function NearbyPage({ searchParams }: NearbyPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const state = params.state?.trim() ?? "";
  const sort = params.sort ?? "nearby";
  const latitude = Number.parseFloat(params.lat ?? "");
  const longitude = Number.parseFloat(params.lng ?? "");
  const hasValidLocation = !Number.isNaN(latitude) && !Number.isNaN(longitude);

  const [restaurants, places, transportOptions, stays] = isDatabaseConfigured
    ? await Promise.all([
        prisma.restaurant.findMany({
          where: {
            isActive: true,
            ...(state ? { state } : {}),
            ...(query
              ? {
                  OR: [
                    { name: { contains: query } },
                    { description: { contains: query } },
                    { city: { contains: query } },
                    { state: { contains: query } },
                    { address: { contains: query } },
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
          },
        }),
        prisma.touristPlace.findMany({
          where: {
            isActive: true,
            ...(state ? { state } : {}),
            ...(query
              ? {
                  OR: [
                    { name: { contains: query } },
                    { description: { contains: query } },
                    { city: { contains: query } },
                    { state: { contains: query } },
                    { address: { contains: query } },
                  ],
                }
              : {}),
          },
        }),
        prisma.transportOption.findMany({
          where: {
            isActive: true,
            ...(state ? { state } : {}),
            ...(query
              ? {
                  OR: [
                    { name: { contains: query } },
                    { description: { contains: query } },
                    { operatorName: { contains: query } },
                    { serviceArea: { contains: query } },
                    { city: { contains: query } },
                  ],
                }
              : {}),
          },
        }),
        prisma.accommodation.findMany({
          where: {
            isActive: true,
            ...(state ? { state } : {}),
            ...(query
              ? {
                  OR: [
                    { name: { contains: query } },
                    { description: { contains: query } },
                    { city: { contains: query } },
                    { state: { contains: query } },
                    { address: { contains: query } },
                  ],
                }
              : {}),
          },
          include: {
            vendor: {
              select: {
                supportPhone: true,
                supportEmail: true,
              },
            },
          },
        }),
      ])
    : [[], [], [], []];

  const enrichedRestaurants = sortByDistanceThenFeatured(
    restaurants.map((restaurant) => {
      const averageRating =
        restaurant.reviews.length === 0
          ? 0
          : restaurant.reviews.reduce((sum, review) => sum + review.rating, 0) / restaurant.reviews.length;

      return {
        ...restaurant,
        cuisines: extractCuisines(restaurant.cuisineType),
        averageRating,
        distanceKm: hasValidLocation
          ? haversineKm(latitude, longitude, restaurant.latitude, restaurant.longitude)
          : null,
      };
    }),
    sort,
  ).slice(0, 4);

  const enrichedPlaces = sortByDistanceThenFeatured(
    places.map((place) => ({
      ...place,
      distanceKm: hasValidLocation ? haversineKm(latitude, longitude, place.latitude, place.longitude) : null,
    })),
    sort,
  ).slice(0, 4);

  const enrichedTransport = sortByDistanceThenFeatured(
    transportOptions.map((option) => ({
      ...option,
      distanceKm:
        hasValidLocation &&
        typeof option.latitude === "number" &&
        typeof option.longitude === "number"
          ? haversineKm(latitude, longitude, option.latitude, option.longitude)
          : null,
    })),
    sort,
  ).slice(0, 4);

  const enrichedStays = sortByDistanceThenFeatured(
    stays.map((stay) => ({
      ...stay,
      distanceKm:
        hasValidLocation &&
        typeof stay.latitude === "number" &&
        typeof stay.longitude === "number"
          ? haversineKm(latitude, longitude, stay.latitude, stay.longitude)
          : null,
    })),
    sort,
  ).slice(0, 4);

  const mergedStateOptions = Array.from(
    new Set([
      ...INDIA_STATES,
      ...restaurants.map((item) => item.state).filter((item): item is string => Boolean(item)),
      ...places.map((item) => item.state).filter((item): item is string => Boolean(item)),
      ...transportOptions.map((item) => item.state).filter((item): item is string => Boolean(item)),
      ...stays.map((item) => item.state).filter((item): item is string => Boolean(item)),
    ]),
  ).sort((a, b) => a.localeCompare(b));

  const totalResults =
    enrichedRestaurants.length + enrichedPlaces.length + enrichedTransport.length + enrichedStays.length;
  const distanceParams = hasValidLocation
    ? `lat=${latitude.toFixed(6)}&lng=${longitude.toFixed(6)}&sort=nearby`
    : "sort=featured";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.14),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(180deg,_#f8fff9_0%,_#ffffff_42%,_#f7fbff_100%)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700 shadow-sm">
              Nearby Hub
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Show everything useful around the user in one place.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Use the current location to surface nearby transport, hotels, places, and food together so the user can
              decide faster without opening four separate category pages.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm hover:bg-emerald-50">
              Home
            </Link>
            <Link href="/trip" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
              My Trip
            </Link>
          </div>
        </div>

        <section className="mb-8 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
          <div className="rounded-[28px] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Location mode</p>
                <h2 className="mt-3 text-2xl font-semibold">
                  {hasValidLocation ? "Nearby results are live" : "Enable location for true nearby results"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {hasValidLocation
                    ? "Distances are being calculated from the user location, and each section is prioritizing the closest relevant options first."
                    : "You can still browse by state, but turning on location makes the hub much more useful for real-time travel decisions."}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Visible results</p>
                <p className="mt-1 text-3xl font-semibold">{totalResults}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <MetricCard label="Food" value={enrichedRestaurants.length} />
              <MetricCard label="Places" value={enrichedPlaces.length} />
              <MetricCard label="Transport" value={enrichedTransport.length} />
              <MetricCard label="Stays" value={enrichedStays.length} />
            </div>
          </div>

          <form className="rounded-[28px] border border-emerald-100 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)] backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-950">Filter this nearby view</h2>
            <div className="mt-4 space-y-3">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search places, food, transport, hotels..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-emerald-200 focus:ring-2"
              />
              <select
                name="state"
                defaultValue={state}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-emerald-200 focus:ring-2"
              >
                <option value="">All States</option>
                {mergedStateOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                name="sort"
                defaultValue={sort}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-emerald-200 focus:ring-2"
              >
                <option value="nearby">Nearest First</option>
                <option value="featured">Featured First</option>
              </select>
              <input type="hidden" name="lat" value={hasValidLocation ? latitude : ""} />
              <input type="hidden" name="lng" value={hasValidLocation ? longitude : ""} />
              <button type="submit" className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
                Apply filters
              </button>
              <NearbyLocator clearSortValue="featured" />
            </div>
          </form>
        </section>

        {totalResults === 0 ? (
          <div className="rounded-[28px] border border-dashed border-emerald-200 bg-white/90 px-6 py-12 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Nothing matched this nearby search</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Try clearing the search, broadening the state filter, or turning on location to unlock actual distance-based results.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <NearbySection
              icon={Store}
              title="Food nearby"
              href={`/restaurants?${distanceParams}`}
              cta="Open all food"
              emptyText="No nearby restaurants matched the current filters."
            >
              {enrichedRestaurants.map((restaurant) => (
                <article key={restaurant.id} className="rounded-[24px] border border-orange-100 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-950">{restaurant.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{[restaurant.city, restaurant.state].filter(Boolean).join(", ")}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {restaurant.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{restaurant.description ?? "Nearby food stop."}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {restaurant.cuisines.slice(0, 3).map((cuisine) => (
                      <span key={cuisine} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                        {cuisine}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" />{restaurant.averageRating.toFixed(1)}</span>
                    <span>{restaurant.distanceKm !== null ? `${restaurant.distanceKm.toFixed(1)} km` : "Location pending"}</span>
                  </div>
                  <Link href={`/restaurants/${restaurant.id}`} className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                    View restaurant
                  </Link>
                </article>
              ))}
            </NearbySection>

            <NearbySection
              icon={Compass}
              title="Places nearby"
              href={`/explore?${distanceParams}`}
              cta="Open all places"
              emptyText="No nearby places matched the current filters."
            >
              {enrichedPlaces.map((place) => (
                <article key={place.id} className="rounded-[24px] border border-cyan-100 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-950">{place.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{[place.city, place.state].filter(Boolean).join(", ")}</p>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{place.description ?? "Nearby stop worth visiting."}</p>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>{place.estimatedVisitTime ?? "Flexible visit"}</span>
                    <span>{place.distanceKm !== null ? `${place.distanceKm.toFixed(1)} km` : "Location pending"}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
                      {place.category.replaceAll("_", " ")}
                    </span>
                    {place.priceLabel ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {place.priceLabel}
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </NearbySection>

            <NearbySection
              icon={CarFront}
              title="Transport nearby"
              href={`/transport?${distanceParams}`}
              cta="Open all transport"
              emptyText="No nearby transport options matched the current filters."
            >
              {enrichedTransport.map((option) => {
                const contactHref =
                  formatExternalHref(option.website) ??
                  (option.phone ? `tel:${option.phone}` : null);

                return (
                  <article key={option.id} className="rounded-[24px] border border-sky-100 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-950">{option.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{[option.city, option.state].filter(Boolean).join(", ")}</p>
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">{option.description ?? "Nearby movement option."}</p>
                    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                      <span>{option.type.replaceAll("_", " ")}</span>
                      <span>{option.distanceKm !== null ? `${option.distanceKm.toFixed(1)} km` : "Location pending"}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {contactHref ? (
                        <Link
                          href={contactHref}
                          target={contactHref.startsWith("http") ? "_blank" : undefined}
                          rel={contactHref.startsWith("http") ? "noreferrer" : undefined}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                        >
                          <Ticket className="h-4 w-4" />
                          Contact
                        </Link>
                      ) : null}
                      <Link href="/trip" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                        Review in trip
                      </Link>
                    </div>
                  </article>
                );
              })}
            </NearbySection>

            <NearbySection
              icon={BedDouble}
              title="Hotels and stays nearby"
              href={`/stays?${distanceParams}`}
              cta="Open all stays"
              emptyText="No nearby stays matched the current filters."
            >
              {enrichedStays.map((stay) => (
                <article key={stay.id} className="rounded-[24px] border border-emerald-100 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-950">{stay.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{[stay.city, stay.state].filter(Boolean).join(", ")}</p>
                  <p className="mt-3 line-clamp-2 text-sm text-slate-600">{stay.description ?? "Nearby stay option."}</p>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                    <span>{ACCOMMODATION_TYPE_LABELS[stay.type]}</span>
                    <span>{stay.distanceKm !== null ? `${stay.distanceKm.toFixed(1)} km` : "Location pending"}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {stay.phone || stay.vendor.supportPhone ? (
                      <a
                        href={`tel:${(stay.phone ?? stay.vendor.supportPhone ?? "").replace(/\s+/g, "")}`}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        Call stay
                      </a>
                    ) : null}
                    <Link href={`/stays/${stay.slug}`} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                      View stay
                    </Link>
                  </div>
                </article>
              ))}
            </NearbySection>
          </div>
        )}
      </div>
    </main>
  );
}

function NearbySection({
  icon: Icon,
  title,
  href,
  cta,
  emptyText,
  children,
}: {
  icon: LucideIcon;
  title: string;
  href: string;
  cta: string;
  emptyText: string;
  children: ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
        </div>
        <Link href={href} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50">
          {cta}
        </Link>
      </div>
      {items.length > 0 && items[0] ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/85 px-6 py-8 text-sm text-slate-600 shadow-sm">
          {emptyText}
        </div>
      )}
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}
