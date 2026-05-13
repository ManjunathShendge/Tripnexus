import { TripItemStatus } from "@prisma/client";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Route,
  Sparkles,
  Ticket,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureActiveTripPlan } from "@/lib/trip";
import { getCurrentAppUser } from "@/lib/vendor-context";
import {
  createTripPlan,
  removeTripItem,
  setActiveTripPlan,
  updateTripItemStatus,
} from "@/app/trip/actions";

type TripPageProps = {
  searchParams: Promise<{
    tripCreated?: string;
    tripActivated?: string;
    updated?: string;
    removed?: string;
    error?: string;
  }>;
};

type RecommendationCard = {
  title: string;
  description: string;
  href: string;
  cta: string;
};

const STATUS_META: Record<
  TripItemStatus,
  {
    label: string;
    className: string;
  }
> = {
  SAVED: {
    label: "Saved",
    className: "border-slate-200 bg-slate-100 text-slate-700",
  },
  BOOKING_PENDING: {
    label: "Booking pending",
    className: "border-amber-200 bg-amber-100 text-amber-800",
  },
  BOOKED: {
    label: "Booked",
    className: "border-emerald-200 bg-emerald-100 text-emerald-800",
  },
  VISITED: {
    label: "Completed",
    className: "border-cyan-200 bg-cyan-100 text-cyan-800",
  },
};

function formatDateRange(startDate: Date | null, endDate: Date | null) {
  if (!startDate && !endDate) {
    return "Dates not locked yet";
  }

  const formatter = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  });

  if (startDate && endDate) {
    return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
  }

  return startDate ? `Starts ${formatter.format(startDate)}` : `Until ${formatter.format(endDate!)}`;
}

function normalizeExternalUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("tel:") ||
    value.startsWith("mailto:")
  ) {
    return value;
  }

  return `https://${value}`;
}

function buildExploreLink(query: string, basePath: string) {
  return `${basePath}?q=${encodeURIComponent(query)}`;
}

export default async function TripPage({ searchParams }: TripPageProps) {
  const query = await searchParams;
  const user = await getCurrentAppUser();

  if (!user) {
    redirect("/auth/login?next=/trip");
  }

  const activeTrip = await ensureActiveTripPlan(user.id);
  const tripPlans = await prisma.tripPlan.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
            },
          },
          touristPlace: {
            select: {
              id: true,
              name: true,
              category: true,
              city: true,
              state: true,
              address: true,
              website: true,
              estimatedVisitTime: true,
              priceLabel: true,
            },
          },
          transportOption: {
            select: {
              id: true,
              name: true,
              type: true,
              city: true,
              state: true,
              website: true,
              phone: true,
              hours: true,
              pricingNotes: true,
              serviceArea: true,
              operatorName: true,
            },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
    },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  const currentTrip = tripPlans.find((plan) => plan.id === activeTrip.id);

  if (!currentTrip) {
    redirect("/trip?error=trip_not_found");
  }

  const transportItems = currentTrip.items.filter((item) => Boolean(item.transportOption));
  const placeItems = currentTrip.items.filter((item) => Boolean(item.touristPlace));
  const foodItems = currentTrip.items.filter((item) => Boolean(item.restaurant));
  const bookedCount = currentTrip.items.filter((item) => item.bookingStatus === TripItemStatus.BOOKED).length;
  const pendingCount = currentTrip.items.filter(
    (item) => item.bookingStatus === TripItemStatus.BOOKING_PENDING,
  ).length;
  const completedCount = currentTrip.items.filter(
    (item) => item.bookingStatus === TripItemStatus.VISITED,
  ).length;
  const readiness = currentTrip.items.length
    ? Math.round(((bookedCount + completedCount) / currentTrip.items.length) * 100)
    : 0;

  const recommendationCards = [
    !transportItems.length
      ? {
          title: "Add how you will move around",
          description: "Save a cab, airport transfer, metro, or local ride so the trip feels executable, not just inspirational.",
          href: "/transport",
          cta: "Find transport",
        }
      : null,
    transportItems.length && pendingCount
      ? {
          title: "Complete pending transport bookings",
          description: "You have selected transport for this trip, but at least one ride still needs a booking confirmation.",
          href: "/trip",
          cta: "Review itinerary",
        }
      : null,
    !placeItems.length
      ? {
          title: "Add must-visit stops",
          description: "Save landmarks, parks, museums, and essentials to shape the flow of the day.",
          href: "/explore",
          cta: "Discover places",
        }
      : null,
    !foodItems.length
      ? {
          title: "Plan food breaks",
          description: "Add a restaurant so the itinerary includes meal stops and not just movement between places.",
          href: "/restaurants",
          cta: "Browse food",
        }
      : null,
  ].filter((card): card is RecommendationCard => card !== null);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.2),_transparent_28%),linear-gradient(180deg,_#fffaf0_0%,_#ffffff_48%,_#eef7ff_100%)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center rounded-full border border-amber-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-700 shadow-sm">
              My Trip Dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Organize the journey, not just the wishlist.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Keep transport, places, and food in one trip plan, track what is still pending, and move each item from
              saved to booked or completed as the tour comes together.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/explore"
              className="rounded-full border border-amber-300 bg-white/90 px-4 py-2 text-sm font-medium text-amber-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-50"
            >
              Explore
            </Link>
            <Link
              href="/transport"
              className="rounded-full border border-sky-200 bg-white/90 px-4 py-2 text-sm font-medium text-sky-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-50"
            >
              Transport
            </Link>
            <Link
              href="/restaurants"
              className="rounded-full border border-orange-200 bg-white/90 px-4 py-2 text-sm font-medium text-orange-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-orange-50"
            >
              Food
            </Link>
          </div>
        </div>

        {query.tripCreated ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-800">
            New trip plan created and set as your active trip.
          </div>
        ) : null}
        {query.tripActivated ? (
          <div className="mb-4 rounded-2xl border border-cyan-200 bg-cyan-50/90 px-4 py-3 text-sm font-medium text-cyan-800">
            Active trip switched successfully.
          </div>
        ) : null}
        {query.updated ? (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm font-medium text-slate-700">
            Trip item updated.
          </div>
        ) : null}
        {query.removed ? (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm font-medium text-amber-800">
            Item removed from your trip.
          </div>
        ) : null}
        {query.error ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-700">
            Trip action failed: {query.error.replaceAll("_", " ")}.
          </div>
        ) : null}

        <section className="mb-8 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="overflow-hidden rounded-[28px] border border-white/70 bg-slate-950 text-white shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
            <div className="grid gap-6 p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Active itinerary</p>
                  <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{currentTrip.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      <MapPin className="h-4 w-4 text-amber-300" />
                      {currentTrip.destinationCity ?? "Destination to be decided"}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      <CalendarDays className="h-4 w-4 text-cyan-300" />
                      {formatDateRange(currentTrip.startDate, currentTrip.endDate)}
                    </span>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Trip readiness</p>
                  <p className="mt-1 text-3xl font-semibold text-white">{readiness}%</p>
                  <p className="text-xs text-slate-300">
                    {bookedCount + completedCount} of {currentTrip.items.length || 1} items confirmed or completed
                  </p>
                </div>
              </div>

              {currentTrip.notes ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-200">
                  {currentTrip.notes}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Saved items</p>
                  <p className="mt-2 text-2xl font-semibold">{currentTrip.items.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Transport selected</p>
                  <p className="mt-2 text-2xl font-semibold">{transportItems.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Pending bookings</p>
                  <p className="mt-2 text-2xl font-semibold text-amber-300">{pendingCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Completed stops</p>
                  <p className="mt-2 text-2xl font-semibold text-cyan-300">{completedCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-amber-100 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)] backdrop-blur">
              <div className="mb-3 flex items-center gap-2 text-slate-900">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold">Next best actions</h2>
              </div>
              <div className="space-y-3">
                {recommendationCards.length ? (
                  recommendationCards.slice(0, 3).map((card) => (
                    <Link
                      key={card.title}
                      href={card.href}
                      className="block rounded-2xl border border-slate-200 px-4 py-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50"
                    >
                      <p className="font-semibold text-slate-900">{card.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{card.description}</p>
                      <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                        {card.cta}
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
                    Your trip already has movement, places, and food covered. You can now focus on polishing notes and
                    completing the remaining bookings.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-sky-100 bg-white/90 p-5 shadow-[0_18px_40px_rgba(148,163,184,0.12)] backdrop-blur">
              <h2 className="text-lg font-semibold text-slate-900">Useful features added</h2>
              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  Transport can now stay in a booking-pending state instead of looking like a finished confirmation.
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  Every item can move between saved, booked, and completed so the itinerary reflects real-world progress.
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  Trips now store travel dates and can be switched active from the saved plans panel.
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <section className="rounded-[30px] border border-white/70 bg-white/85 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.14)] backdrop-blur sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Trip flow</h2>
                <p className="mt-1 text-sm text-slate-500">
                  A clearer view of what is selected, what still needs booking, and what is already done.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                {currentTrip.items.length} items
              </span>
            </div>

            {currentTrip.items.length ? (
              <div className="space-y-4">
                {currentTrip.items.map((item, index) => {
                  const isTransport = Boolean(item.transportOption);
                  const isRestaurant = Boolean(item.restaurant);
                  const isPlace = Boolean(item.touristPlace);
                  const title =
                    item.restaurant?.name ?? item.touristPlace?.name ?? item.transportOption?.name ?? "Trip item";
                  const subtitle = isRestaurant
                    ? "Food stop"
                    : isPlace
                      ? `Place - ${item.touristPlace?.category.replaceAll("_", " ")}`
                      : `Transport - ${item.transportOption?.type.replaceAll("_", " ")}`;
                  const location = isRestaurant
                    ? [item.restaurant?.city, item.restaurant?.state].filter(Boolean).join(", ")
                    : isPlace
                      ? [item.touristPlace?.city, item.touristPlace?.state].filter(Boolean).join(", ")
                      : [item.transportOption?.city, item.transportOption?.state].filter(Boolean).join(", ");
                  const statusMeta = STATUS_META[item.bookingStatus];
                  const transportBookingLink =
                    normalizeExternalUrl(item.transportOption?.website) ??
                    (item.transportOption?.phone ? `tel:${item.transportOption.phone}` : null) ??
                    buildExploreLink(item.transportOption?.name ?? "", "/transport");
                  const primaryHref = isRestaurant
                    ? `/restaurants/${item.restaurant?.id}`
                    : isPlace
                      ? normalizeExternalUrl(item.touristPlace?.website) ??
                        buildExploreLink(item.touristPlace?.name ?? "", "/explore")
                      : transportBookingLink;
                  const primaryLabel = isTransport
                    ? item.bookingStatus === TripItemStatus.BOOKED
                      ? "Manage booking"
                      : "Book now"
                    : isRestaurant
                      ? "View menu"
                      : item.bookingStatus === TripItemStatus.VISITED
                        ? "Revisit details"
                        : "Open details";
                  const detailLine = isTransport
                    ? item.transportOption?.serviceArea ?? item.transportOption?.operatorName ?? "Local transport support"
                    : isPlace
                      ? item.touristPlace?.address ?? "Nearby stop"
                      : "Perfect meal break for the journey";
                  const supportLine = isTransport
                    ? item.transportOption?.pricingNotes ?? item.transportOption?.hours ?? "Contact provider for timing"
                    : isPlace
                      ? item.touristPlace?.estimatedVisitTime ?? item.touristPlace?.priceLabel ?? "Flexible visit"
                      : location || "Location details coming soon";

                  return (
                    <article
                      key={item.id}
                      className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96)_0%,_rgba(248,250,252,0.92)_100%)] p-5 shadow-sm"
                    >
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                            {isTransport ? (
                              <Route className="h-5 w-5" />
                            ) : isRestaurant ? (
                              <UtensilsCrossed className="h-5 w-5" />
                            ) : (
                              <MapPin className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                                Stop {index + 1}
                              </span>
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
                              >
                                {statusMeta.label}
                              </span>
                            </div>
                            <h3 className="mt-2 text-xl font-semibold text-slate-950">{title}</h3>
                            <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
                          </div>
                        </div>
                        {item.bookingStatus === TripItemStatus.BOOKING_PENDING && isTransport ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            <p className="font-semibold">Selected, but not booked yet</p>
                            <p className="mt-1 text-amber-700">Keep this visible until the ride is confirmed.</p>
                          </div>
                        ) : null}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Location</p>
                          <p className="mt-2 text-sm font-medium text-slate-800">{location || "Details coming soon"}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Plan note</p>
                          <p className="mt-2 text-sm font-medium text-slate-800">{detailLine}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 px-4 py-3">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                            {isTransport ? "Booking cue" : "Helpful info"}
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-800">{supportLine}</p>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        {primaryHref ? (
                          <Link
                            href={primaryHref}
                            target={primaryHref.startsWith("http") || primaryHref.startsWith("tel:") ? "_blank" : undefined}
                            rel={primaryHref.startsWith("http") ? "noreferrer" : undefined}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            {isTransport ? <Ticket className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                            {primaryLabel}
                          </Link>
                        ) : null}

                        {item.bookingStatus !== TripItemStatus.BOOKED ? (
                          <form action={updateTripItemStatus}>
                            <input type="hidden" name="itemId" value={item.id} />
                            <input type="hidden" name="status" value={TripItemStatus.BOOKED} />
                            <input type="hidden" name="redirectPath" value="/trip" />
                            <button
                              type="submit"
                              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                            >
                              Mark booked
                            </button>
                          </form>
                        ) : null}

                        {item.bookingStatus !== TripItemStatus.VISITED ? (
                          <form action={updateTripItemStatus}>
                            <input type="hidden" name="itemId" value={item.id} />
                            <input type="hidden" name="status" value={TripItemStatus.VISITED} />
                            <input type="hidden" name="redirectPath" value="/trip" />
                            <button
                              type="submit"
                              className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100"
                            >
                              Mark completed
                            </button>
                          </form>
                        ) : null}

                        {item.bookingStatus !== TripItemStatus.SAVED ? (
                          <form action={updateTripItemStatus}>
                            <input type="hidden" name="itemId" value={item.id} />
                            <input type="hidden" name="status" value={TripItemStatus.SAVED} />
                            <input type="hidden" name="redirectPath" value="/trip" />
                            <button
                              type="submit"
                              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Reset status
                            </button>
                          </form>
                        ) : null}

                        <form action={removeTripItem} className="ml-auto">
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="redirectPath" value="/trip" />
                          <button
                            type="submit"
                            className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            Remove
                          </button>
                        </form>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-slate-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">Start building your route</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Add places to visit, transport to use, and food stops so this page turns into a real travel plan.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Link href="/explore" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                    Explore places
                  </Link>
                  <Link
                    href="/transport"
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
                  >
                    Add transport
                  </Link>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-amber-100 bg-white/90 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.14)] backdrop-blur">
              <h2 className="mb-4 text-xl font-semibold text-slate-950">Create new trip</h2>
              <form action={createTripPlan} className="space-y-3">
                <input type="hidden" name="redirectPath" value="/trip" />
                <input
                  name="title"
                  placeholder="Trip title"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-amber-200 focus:ring-2"
                />
                <input
                  name="destinationCity"
                  placeholder="Destination city"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-amber-200 focus:ring-2"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Start date
                    </span>
                    <input
                      type="date"
                      name="startDate"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-amber-200 focus:ring-2"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      End date
                    </span>
                    <input
                      type="date"
                      name="endDate"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-amber-200 focus:ring-2"
                    />
                  </label>
                </div>
                <textarea
                  name="notes"
                  rows={4}
                  placeholder="Arrival plans, reminders, hotel notes, pickup details..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-amber-200 focus:ring-2"
                />
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                >
                  Create trip
                </button>
              </form>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white/90 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.14)] backdrop-blur">
              <div className="mb-4 flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-slate-700" />
                <h2 className="text-xl font-semibold text-slate-950">Saved trip plans</h2>
              </div>
              <div className="space-y-3">
                {tripPlans.map((plan) => (
                  <div key={plan.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{plan.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {plan.destinationCity ?? "Destination not set"} · {formatDateRange(plan.startDate, plan.endDate)}
                        </p>
                      </div>
                      {plan.isDefault ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Active
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {plan.items.length} saved items
                    </p>
                    {!plan.isDefault ? (
                      <form action={setActiveTripPlan} className="mt-3">
                        <input type="hidden" name="tripPlanId" value={plan.id} />
                        <input type="hidden" name="redirectPath" value="/trip" />
                        <button
                          type="submit"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
                        >
                          Make active trip
                        </button>
                      </form>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
