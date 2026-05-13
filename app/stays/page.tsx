import Link from "next/link";
import { AccommodationType } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { INDIA_STATES, haversineKm } from "@/lib/india-geo";
import { NearbyLocator } from "@/components/nearby-locator";
import { ACCOMMODATION_TYPE_LABELS } from "@/lib/business";

type StaysPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: AccommodationType;
    state?: string;
    sort?: "featured" | "price_low" | "nearby";
    lat?: string;
    lng?: string;
  }>;
};

export default async function StaysPage({ searchParams }: StaysPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const selectedType = params.type;
  const state = params.state?.trim() ?? "";
  const sort = params.sort ?? "featured";
  const latitude = Number.parseFloat(params.lat ?? "");
  const longitude = Number.parseFloat(params.lng ?? "");
  const hasValidLocation = !Number.isNaN(latitude) && !Number.isNaN(longitude);

  const stays = isDatabaseConfigured
    ? await prisma.accommodation.findMany({
        where: {
          isActive: true,
          ...(selectedType ? { type: selectedType } : {}),
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
              name: true,
              supportPhone: true,
              supportEmail: true,
            },
          },
        },
        orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
      })
    : [];

  const enrichedStays = stays
    .map((stay) => ({
      ...stay,
      distanceKm:
        hasValidLocation &&
        typeof stay.latitude === "number" &&
        typeof stay.longitude === "number"
          ? haversineKm(latitude, longitude, stay.latitude, stay.longitude)
          : null,
    }))
    .sort((a, b) => {
      if (sort === "price_low") {
        return (a.pricePerNight ?? Number.MAX_SAFE_INTEGER) - (b.pricePerNight ?? Number.MAX_SAFE_INTEGER);
      }

      if (sort === "nearby" && a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }

      if (a.isFeatured !== b.isFeatured) {
        return Number(b.isFeatured) - Number(a.isFeatured);
      }

      return a.name.localeCompare(b.name);
    });

  const stateOptions = Array.from(
    new Set(stays.map((stay) => stay.state).filter((item): item is string => Boolean(item))),
  ).sort((a, b) => a.localeCompare(b));

  const mergedStateOptions = Array.from(new Set([...INDIA_STATES, ...stateOptions]));

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Book Your Stay
            </p>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Hotels, lodges, resorts, and homestays
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Compare stay partners, review direct contact details, and send booking requests from the listing.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/" className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50">
              Home
            </Link>
            <Link href="/explore" className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50">
              Explore
            </Link>
            <Link href="/trip" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              My Trip
            </Link>
          </div>
        </div>

        <form className="mb-8 grid gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:grid-cols-5">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search hotels, lodges, homestays..."
            className="sm:col-span-2 rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none ring-emerald-200 focus:ring-2"
          />
          <select
            name="type"
            defaultValue={selectedType ?? ""}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none ring-emerald-200 focus:ring-2"
          >
            <option value="">All Stay Types</option>
            {Object.entries(ACCOMMODATION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            name="state"
            defaultValue={state}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none ring-emerald-200 focus:ring-2"
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
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none ring-emerald-200 focus:ring-2"
          >
            <option value="featured">Featured First</option>
            <option value="price_low">Lowest Price First</option>
            <option value="nearby">Nearest</option>
          </select>
          <input type="hidden" name="lat" value={hasValidLocation ? latitude : ""} />
          <input type="hidden" name="lng" value={hasValidLocation ? longitude : ""} />
          <div className="sm:col-span-5 flex justify-end">
            <button type="submit" className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              Apply Filters
            </button>
          </div>
          <div className="sm:col-span-5">
            <NearbyLocator clearSortValue="featured" />
          </div>
        </form>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {enrichedStays.map((stay) => (
            <article key={stay.id} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{stay.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{ACCOMMODATION_TYPE_LABELS[stay.type]}</p>
                </div>
                {stay.isFeatured ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Featured
                  </span>
                ) : null}
              </div>
              <p className="mb-3 line-clamp-3 text-sm text-slate-600">
                {stay.description ?? "Comfortable stay option for travelers."}
              </p>
              <div className="space-y-2 text-sm text-slate-700">
                <p>Location: <span className="font-semibold text-slate-900">{stay.city ?? "City not set"}, {stay.state ?? "State not set"}</span></p>
                <p>Rate: <span className="font-semibold text-slate-900">{typeof stay.pricePerNight === "number" ? `$${stay.pricePerNight.toFixed(2)} / night` : "Contact for price"}</span></p>
                <p>Rooms: <span className="font-semibold text-slate-900">{stay.roomCount ?? "Not listed"}</span></p>
                <p>Distance: <span className="font-semibold text-slate-900">{stay.distanceKm !== null ? `${stay.distanceKm.toFixed(1)} km` : "Enable location"}</span></p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {stay.phone || stay.vendor.supportPhone ? (
                  <a
                    href={`tel:${(stay.phone ?? stay.vendor.supportPhone ?? "").replace(/\s+/g, "")}`}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
                  >
                    Call
                  </a>
                ) : null}
                {stay.email || stay.vendor.supportEmail ? (
                  <a
                    href={`mailto:${stay.email ?? stay.vendor.supportEmail ?? ""}`}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Email
                  </a>
                ) : null}
                <Link
                  href={`/stays/${stay.slug}`}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  View Stay
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
