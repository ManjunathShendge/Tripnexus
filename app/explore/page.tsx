import { Compass, MapPin, Sparkles, Star, Trees, Wallet } from "lucide-react";
import Link from "next/link";
import { PlaceCategory } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { INDIA_STATES, haversineKm } from "@/lib/india-geo";
import { saveTouristPlaceToTrip } from "@/app/trip/actions";
import { NearbyLocator } from "@/components/nearby-locator";

const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  ATTRACTION: "Attraction",
  LANDMARK: "Landmark",
  MUSEUM: "Museum",
  BEACH: "Beach",
  SHOPPING: "Shopping",
  NIGHTLIFE: "Nightlife",
  PARK: "Park",
  ESSENTIAL: "Essential",
};

const CATEGORY_ICONS: Record<PlaceCategory, typeof Compass> = {
  ATTRACTION: Compass,
  LANDMARK: MapPin,
  MUSEUM: Sparkles,
  BEACH: Compass,
  SHOPPING: Wallet,
  NIGHTLIFE: Sparkles,
  PARK: Trees,
  ESSENTIAL: MapPin,
};

type ExplorePageProps = {
  searchParams: Promise<{
    q?: string;
    category?: PlaceCategory;
    state?: string;
    sort?: "featured" | "nearby" | "rating";
    lat?: string;
    lng?: string;
    savedToTrip?: string;
    error?: string;
  }>;
};

function formatExternalHref(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return `https://${value}`;
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category;
  const state = params.state?.trim() ?? "";
  const sort = params.sort ?? "featured";
  const latitude = Number.parseFloat(params.lat ?? "");
  const longitude = Number.parseFloat(params.lng ?? "");
  const hasValidLocation = !Number.isNaN(latitude) && !Number.isNaN(longitude);

  const places = isDatabaseConfigured
    ? await prisma.touristPlace.findMany({
        where: {
          isActive: true,
          ...(state ? { state } : {}),
          ...(category ? { category } : {}),
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
        orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
      })
    : [];

  const enrichedPlaces = places
    .map((place) => ({
      ...place,
      distanceKm: hasValidLocation ? haversineKm(latitude, longitude, place.latitude, place.longitude) : null,
    }))
    .sort((a, b) => {
      if (sort === "nearby" && a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }

      if (sort === "rating") {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }

      if (a.isFeatured !== b.isFeatured) {
        return Number(b.isFeatured) - Number(a.isFeatured);
      }

      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }

      return (b.rating ?? 0) - (a.rating ?? 0);
    });

  const stateOptions = Array.from(
    new Set(places.map((place) => place.state).filter((item): item is string => Boolean(item))),
  ).sort((a, b) => a.localeCompare(b));

  const mergedStateOptions = Array.from(new Set([...INDIA_STATES, ...stateOptions]));
  const featuredCount = places.filter((place) => place.isFeatured).length;
  const familyFriendlyCount = places.filter((place) => place.familyFriendly).length;
  const topRatedCount = places.filter((place) => (place.rating ?? 0) >= 4.5).length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.16),_transparent_24%),linear-gradient(180deg,_#f3fffe_0%,_#ffffff_46%,_#fffaf0_100%)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-cyan-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700 shadow-sm">
              Explore Nearby
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Build the route around places people will actually enjoy.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Find attractions, essentials, parks, and landmarks, then save the strongest stops into the trip. The goal
              is not more pins. It is a day plan that makes sense.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-cyan-200 bg-white/90 px-4 py-2 text-sm font-medium text-cyan-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-cyan-50"
            >
              Home
            </Link>
            <Link
              href="/transport"
              className="rounded-full border border-amber-200 bg-white/90 px-4 py-2 text-sm font-medium text-amber-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-50"
            >
              Transport
            </Link>
            <Link
              href="/trip"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              My Trip
            </Link>
          </div>
        </div>

        {params.savedToTrip ? (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Place added to your trip. Use the trip page to mark it completed after the visit.
          </div>
        ) : null}
        {params.error ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            Could not save item: {params.error.replaceAll("_", " ")}.
          </div>
        ) : null}

        <section className="mb-8 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
          <div className="rounded-[28px] border border-white/70 bg-slate-950 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Explore with intent</p>
                <h2 className="mt-3 text-2xl font-semibold">Mix anchors, quick stops, and essentials.</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  A good itinerary usually needs a headline stop, a few nearby fillers, and practical essentials. Save
                  only what fits the flow of the day, not every interesting option.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Available places</p>
                <p className="mt-1 text-3xl font-semibold">{places.length}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Featured</p>
                <p className="mt-2 text-2xl font-semibold text-cyan-300">{featuredCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Top rated</p>
                <p className="mt-2 text-2xl font-semibold text-amber-300">{topRatedCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Family friendly</p>
                <p className="mt-2 text-2xl font-semibold">{familyFriendlyCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-cyan-100 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)] backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-950">A better saved-place flow</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                Save only the places that fit the route, then use `My Trip` to mark them completed after the visit.
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                Balance high-energy places with easy essentials like parks, food stops, and transport nearby.
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                Use ratings, budget labels, and visit time to avoid unrealistic day plans.
              </div>
            </div>
          </div>
        </section>

        <form className="mb-8 grid gap-3 rounded-[28px] border border-cyan-100 bg-white/90 p-4 shadow-[0_18px_40px_rgba(148,163,184,0.12)] backdrop-blur sm:grid-cols-5">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search attractions, museums, markets..."
            className="sm:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-cyan-200 focus:ring-2"
          />
          <select
            name="category"
            defaultValue={category ?? ""}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-cyan-200 focus:ring-2"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            name="state"
            defaultValue={state}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-cyan-200 focus:ring-2"
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
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-cyan-200 focus:ring-2"
          >
            <option value="featured">Featured First</option>
            <option value="rating">Top Rated</option>
            <option value="nearby">Nearest</option>
          </select>
          <input type="hidden" name="lat" value={hasValidLocation ? latitude : ""} />
          <input type="hidden" name="lng" value={hasValidLocation ? longitude : ""} />
          <div className="sm:col-span-5 flex justify-end">
            <button
              type="submit"
              className="rounded-2xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800"
            >
              Apply filters
            </button>
          </div>
          <div className="sm:col-span-5">
            <NearbyLocator clearSortValue="featured" />
          </div>
        </form>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {enrichedPlaces.length ? enrichedPlaces.map((place) => {
            const Icon = CATEGORY_ICONS[place.category];
            const websiteHref = formatExternalHref(place.website);

            return (
              <article
                key={place.id}
                className="rounded-[28px] border border-cyan-100 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(236,254,255,0.82)_100%)] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.10)]"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">{place.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">{CATEGORY_LABELS[place.category]}</p>
                    </div>
                  </div>
                  {place.isFeatured ? (
                    <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">
                      Featured
                    </span>
                  ) : null}
                </div>

                <p className="mb-4 line-clamp-3 text-sm leading-6 text-slate-600">
                  {place.description ?? "A useful nearby stop for travelers."}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/80 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Address</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{place.address}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Rating</p>
                    <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Star className="h-4 w-4 text-amber-500" />
                      {place.rating?.toFixed(1) ?? "N/A"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Visit time</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{place.estimatedVisitTime ?? "Flexible"}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Budget cue</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{place.priceLabel ?? "Varies"}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2">
                    <MapPin className="h-4 w-4 text-cyan-600" />
                    {place.distanceKm !== null ? `${place.distanceKm.toFixed(1)} km away` : "Enable location"}
                  </span>
                  {(place.city || place.state) && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2">
                      <Compass className="h-4 w-4 text-amber-600" />
                      {[place.city, place.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {websiteHref ? (
                    <Link
                      href={websiteHref}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                      Open details
                    </Link>
                  ) : null}
                  <form action={saveTouristPlaceToTrip} className="flex-1 min-w-[170px]">
                    <input type="hidden" name="touristPlaceId" value={place.id} />
                    <input type="hidden" name="redirectPath" value="/explore" />
                    <button
                      type="submit"
                      className="w-full rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Add to trip
                    </button>
                  </form>
                </div>
              </article>
            );
          }) : (
            <div className="sm:col-span-2 xl:col-span-3 rounded-[28px] border border-dashed border-cyan-200 bg-white/85 px-6 py-12 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">No places match these filters</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Try a broader search, switch category, or reset the state filter to discover more useful stops.
              </p>
              <Link
                href="/explore"
                className="mt-5 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Reset explore filters
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
