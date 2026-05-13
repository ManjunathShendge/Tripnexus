import { Bus, Clock3, MapPinned, Plane, Route, Ticket, TrainFront } from "lucide-react";
import Link from "next/link";
import { TransportType } from "@prisma/client";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { INDIA_STATES, haversineKm } from "@/lib/india-geo";
import { saveTransportOptionToTrip } from "@/app/trip/actions";
import { NearbyLocator } from "@/components/nearby-locator";

const TRANSPORT_LABELS: Record<TransportType, string> = {
  PRIVATE_CAB: "Private Cab",
  PUBLIC_BUS: "Public Bus",
  METRO: "Metro",
  TRAIN: "Train",
  AUTO_RICKSHAW: "Auto Rickshaw",
  AIRPORT_TRANSFER: "Airport Transfer",
  FERRY: "Ferry",
  BIKE_RENTAL: "Bike Rental",
};

const TRANSPORT_ICONS: Record<TransportType, typeof Route> = {
  PRIVATE_CAB: Route,
  PUBLIC_BUS: Bus,
  METRO: TrainFront,
  TRAIN: TrainFront,
  AUTO_RICKSHAW: Route,
  AIRPORT_TRANSFER: Plane,
  FERRY: Route,
  BIKE_RENTAL: Route,
};

type TransportPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: TransportType;
    state?: string;
    sort?: "featured" | "nearby";
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

  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("tel:")) {
    return value;
  }

  return `https://${value}`;
}

export default async function TransportPage({ searchParams }: TransportPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const selectedType = params.type;
  const state = params.state?.trim() ?? "";
  const sort = params.sort ?? "featured";
  const latitude = Number.parseFloat(params.lat ?? "");
  const longitude = Number.parseFloat(params.lng ?? "");
  const hasValidLocation = !Number.isNaN(latitude) && !Number.isNaN(longitude);

  const transportOptions = isDatabaseConfigured
    ? await prisma.transportOption.findMany({
        where: {
          isActive: true,
          ...(selectedType ? { type: selectedType } : {}),
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
        orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
      })
    : [];

  const enrichedOptions = transportOptions
    .map((option) => ({
      ...option,
      distanceKm:
        hasValidLocation &&
        typeof option.latitude === "number" &&
        typeof option.longitude === "number"
          ? haversineKm(latitude, longitude, option.latitude, option.longitude)
          : null,
    }))
    .sort((a, b) => {
      if (sort === "nearby" && a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }

      if (a.isFeatured !== b.isFeatured) {
        return Number(b.isFeatured) - Number(a.isFeatured);
      }

      return a.name.localeCompare(b.name);
    });

  const stateOptions = Array.from(
    new Set(
      transportOptions
        .map((option) => option.state)
        .filter((item): item is string => Boolean(item)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const mergedStateOptions = Array.from(new Set([...INDIA_STATES, ...stateOptions]));
  const featuredCount = transportOptions.filter((option) => option.isFeatured).length;
  const airportTransferCount = transportOptions.filter(
    (option) => option.type === TransportType.AIRPORT_TRANSFER,
  ).length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.14),_transparent_24%),linear-gradient(180deg,_#effaff_0%,_#ffffff_48%,_#f8fafc_100%)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full border border-sky-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700 shadow-sm">
              Get Around
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Choose transport that can actually carry the trip.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Compare local movement options, shortlist the practical ones, and send them to `My Trip` where they
              automatically show up as booking-pending until you confirm them.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-sm font-medium text-sky-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-50"
            >
              Home
            </Link>
            <Link
              href="/explore"
              className="rounded-full border border-amber-200 bg-white/90 px-4 py-2 text-sm font-medium text-amber-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-50"
            >
              Explore
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
            Transport added to your trip. It will appear there as booking pending until you confirm it.
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
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Planning logic</p>
                <h2 className="mt-3 text-2xl font-semibold">Shortlist first. Book later. Track both clearly.</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  This page helps users find transport. The actual trip page now separates selected transport from booked
                  transport, which makes the itinerary more honest and useful.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Available options</p>
                <p className="mt-1 text-3xl font-semibold">{transportOptions.length}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Featured</p>
                <p className="mt-2 text-2xl font-semibold text-sky-300">{featuredCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Airport transfers</p>
                <p className="mt-2 text-2xl font-semibold text-amber-300">{airportTransferCount}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Location mode</p>
                <p className="mt-2 text-lg font-semibold">{hasValidLocation ? "Nearby sorting on" : "Search mode"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-sky-100 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)] backdrop-blur">
            <h2 className="text-lg font-semibold text-slate-950">What makes a strong transport choice?</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                Pick by service area, not just name, so the ride matches the actual leg of the journey.
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                Save one or two realistic options to the trip first, then mark the final one booked after confirmation.
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                Use direct booking links or phone-based CTAs when vendors provide them, instead of losing users in search.
              </div>
            </div>
          </div>
        </section>

        <form className="mb-8 grid gap-3 rounded-[28px] border border-sky-100 bg-white/90 p-4 shadow-[0_18px_40px_rgba(148,163,184,0.12)] backdrop-blur sm:grid-cols-5">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search cabs, metro, airport transfer..."
            className="sm:col-span-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-sky-200 focus:ring-2"
          />
          <select
            name="type"
            defaultValue={selectedType ?? ""}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-sky-200 focus:ring-2"
          >
            <option value="">All Transport Types</option>
            {Object.entries(TRANSPORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            name="state"
            defaultValue={state}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-sky-200 focus:ring-2"
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
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-sky-200 focus:ring-2"
          >
            <option value="featured">Featured First</option>
            <option value="nearby">Nearest</option>
          </select>
          <input type="hidden" name="lat" value={hasValidLocation ? latitude : ""} />
          <input type="hidden" name="lng" value={hasValidLocation ? longitude : ""} />
          <div className="sm:col-span-5 flex justify-end">
            <button
              type="submit"
              className="rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              Apply filters
            </button>
          </div>
          <div className="sm:col-span-5">
            <NearbyLocator clearSortValue="featured" />
          </div>
        </form>

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {enrichedOptions.length ? enrichedOptions.map((option) => {
            const Icon = TRANSPORT_ICONS[option.type];
            const bookingHref =
              formatExternalHref(option.website) ??
              (option.phone ? `tel:${option.phone}` : null);

            return (
              <article
                key={option.id}
                className="rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(240,249,255,0.82)_100%)] p-5 shadow-[0_18px_40px_rgba(148,163,184,0.10)]"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">{option.name}</h2>
                      <p className="mt-1 text-sm text-slate-500">{TRANSPORT_LABELS[option.type]}</p>
                    </div>
                  </div>
                  {option.isFeatured ? (
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      Featured
                    </span>
                  ) : null}
                </div>

                <p className="mb-4 line-clamp-3 text-sm leading-6 text-slate-600">
                  {option.description ?? "Useful local transport support for travelers."}
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/80 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Service area</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {option.serviceArea ?? option.address ?? "City-wide service"}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Operator</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{option.operatorName ?? "Independent"}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Hours</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{option.hours ?? "Varies"}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pricing cue</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{option.pricingNotes ?? "Contact provider"}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2">
                    <MapPinned className="h-4 w-4 text-sky-600" />
                    {option.distanceKm !== null ? `${option.distanceKm.toFixed(1)} km away` : "Enable location"}
                  </span>
                  {option.city || option.state ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2">
                      <Clock3 className="h-4 w-4 text-amber-600" />
                      {[option.city, option.state].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {bookingHref ? (
                    <Link
                      href={bookingHref}
                      target={bookingHref.startsWith("http") ? "_blank" : undefined}
                      rel={bookingHref.startsWith("http") ? "noreferrer" : undefined}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                    >
                      <Ticket className="h-4 w-4" />
                      Book / contact
                    </Link>
                  ) : null}
                  <form action={saveTransportOptionToTrip} className="flex-1 min-w-[180px]">
                    <input type="hidden" name="transportOptionId" value={option.id} />
                    <input type="hidden" name="redirectPath" value="/transport" />
                    <button
                      type="submit"
                      className="w-full rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Add to trip as pending
                    </button>
                  </form>
                </div>
              </article>
            );
          }) : (
            <div className="sm:col-span-2 xl:col-span-3 rounded-[28px] border border-dashed border-sky-200 bg-white/85 px-6 py-12 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">No transport options match these filters</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Try clearing the search, changing the state, or switching back to featured results to widen the list.
              </p>
              <Link
                href="/transport"
                className="mt-5 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Reset transport filters
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
