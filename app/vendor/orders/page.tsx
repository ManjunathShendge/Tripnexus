import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getVendorAccessOrRedirect } from "@/lib/vendor-context";
import {
  ACCOMMODATION_TYPE_LABELS,
  BUSINESS_TYPE_LABELS,
  TRANSPORT_TYPE_LABELS,
} from "@/lib/business";
import { findVendorAccommodationBookingRequests } from "@/lib/accommodation-booking";

export const dynamic = "force-dynamic";

type VendorOrdersPageProps = {
  searchParams: Promise<{ vendor?: string; onboarded?: string }>;
};

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Not set";
  }

  return `$${value.toFixed(2)}`;
}

export default async function VendorOrdersPage({ searchParams }: VendorOrdersPageProps) {
  const query = await searchParams;
  const access = await getVendorAccessOrRedirect(query.vendor);

  const [
    orders,
    restaurants,
    transportOptions,
    accommodations,
    guideServices,
    touristPlaces,
    accommodationBookingRequests,
  ] =
    await Promise.all([
      prisma.order.findMany({
        where: {
          restaurant: {
            vendorId: access.activeVendor.id,
          },
        },
        include: {
          user: { select: { email: true, name: true } },
          restaurant: { select: { name: true } },
          orderItems: { select: { quantity: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.restaurant.findMany({
        where: { vendorId: access.activeVendor.id },
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          isOpen: true,
          estimatedTime: true,
        },
      }),
      prisma.transportOption.findMany({
        where: { vendorId: access.activeVendor.id },
        select: {
          id: true,
          name: true,
          type: true,
          city: true,
          state: true,
          pricingNotes: true,
          hours: true,
        },
      }),
      prisma.accommodation.findMany({
        where: { vendorId: access.activeVendor.id },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          city: true,
          state: true,
          pricePerNight: true,
          roomCount: true,
        },
      }),
      prisma.guideService.findMany({
        where: { vendorId: access.activeVendor.id },
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          yearsExperience: true,
          hourlyRate: true,
          fullDayRate: true,
          isLicensed: true,
        },
      }),
      prisma.touristPlace.findMany({
        where: { vendorId: access.activeVendor.id },
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
          state: true,
          estimatedVisitTime: true,
          isFeatured: true,
        },
      }),
      findVendorAccommodationBookingRequests(access.activeVendor.id, 12),
    ]);

  const totalRevenue = orders.reduce((sum, order) => sum + order.grandTotal, 0);
  const totalGuests = orders.reduce(
    (sum, order) => sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-amber-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
              Partner Hub
            </p>
            <h1 className="text-3xl font-bold text-slate-900">Business Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Signed in as {access.user.email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/account/become-vendor?vendor=${access.activeVendor.slug}`}
              className="rounded-xl border border-cyan-200 bg-white px-4 py-2 text-sm font-medium text-cyan-800 transition hover:bg-cyan-50"
            >
              Edit Business Profile
            </Link>
            <Link
              href="/account/become-vendor"
              className="rounded-xl border border-cyan-200 bg-white px-4 py-2 text-sm font-medium text-cyan-800 transition hover:bg-cyan-50"
            >
              Register Another Business
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back Home
            </Link>
          </div>
        </div>

        {query.onboarded ? (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Business registered successfully. Your dashboard is ready.
          </div>
        ) : null}

        <section className="mb-6 rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-600">Active Business</p>
              <h2 className="text-2xl font-semibold text-slate-900">{access.activeVendor.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {BUSINESS_TYPE_LABELS[access.activeVendor.businessType]}
              </p>
              {access.activeVendor.tagline ? (
                <p className="mt-2 max-w-2xl text-sm text-slate-600">{access.activeVendor.tagline}</p>
              ) : null}
            </div>
            <div className="text-sm text-slate-600">
              <p>Role: <span className="font-semibold text-slate-900">{access.activeMembership.role}</span></p>
              {access.activeVendor.supportPhone ? (
                <p>Support: <span className="font-semibold text-slate-900">{access.activeVendor.supportPhone}</span></p>
              ) : null}
            </div>
          </div>
          {access.memberships.length > 1 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {access.memberships.map((membership) => (
                <Link
                  key={membership.id}
                  href={`/vendor/orders?vendor=${membership.vendor.slug}`}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                    membership.vendor.id === access.activeVendor.id
                      ? "border-cyan-300 bg-cyan-100 text-cyan-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {membership.vendor.name}
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-5">
          <article className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Food Orders</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{orders.length}</p>
          </article>
          <article className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Revenue Snapshot</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
          </article>
          <article className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Guest / Rider Volume</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totalGuests}</p>
          </article>
          <article className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Live Listings</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {restaurants.length + transportOptions.length + accommodations.length + guideServices.length + touristPlaces.length}
            </p>
          </article>
          <article className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Stay Booking Requests</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{accommodationBookingRequests.length}</p>
          </article>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            {access.activeVendor.businessType === "FOOD_AND_DINING" ? (
              <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">Restaurant Operations</h3>
                    <p className="text-sm text-slate-600">Track your live food listings and recent orders.</p>
                  </div>
                </div>
                {restaurants.length === 0 ? (
                  <p className="text-sm text-slate-600">No restaurant listings yet.</p>
                ) : (
                  <div className="space-y-3">
                    {restaurants.map((restaurant) => (
                      <div key={restaurant.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{restaurant.name}</p>
                            <p className="text-sm text-slate-500">{restaurant.city}, {restaurant.state}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${restaurant.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {restaurant.isOpen ? "Open" : "Closed"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">ETA: {restaurant.estimatedTime ?? "Not set"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {access.activeVendor.businessType === "TRANSPORT_OPERATOR" ? (
              <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">Transport Service Deck</h3>
                <p className="mb-4 text-sm text-slate-600">Manage routes, pricing promises, and service windows.</p>
                <div className="space-y-3">
                  {transportOptions.map((option) => (
                    <div key={option.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">{option.name}</p>
                      <p className="text-sm text-slate-500">{TRANSPORT_TYPE_LABELS[option.type]} · {option.city}, {option.state}</p>
                      <p className="mt-2 text-sm text-slate-600">Pricing: {option.pricingNotes ?? "Not set"}</p>
                      <p className="text-sm text-slate-600">Hours: {option.hours ?? "Not set"}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {access.activeVendor.businessType === "HOSPITALITY_STAY" ? (
              <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">Stay Management</h3>
                <p className="mb-4 text-sm text-slate-600">Highlight your rooms, rates, and guest readiness.</p>
                <div className="space-y-3">
                  {accommodations.map((stay) => (
                    <div key={stay.id} className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">{stay.name}</p>
                      <p className="text-sm text-slate-500">{ACCOMMODATION_TYPE_LABELS[stay.type]} · {stay.city}, {stay.state}</p>
                      <p className="mt-2 text-sm text-slate-600">Nightly rate: {formatCurrency(stay.pricePerNight)}</p>
                      <p className="text-sm text-slate-600">Rooms: {stay.roomCount ?? "Not set"}</p>
                      <Link
                        href={`/stays/${stay.slug}`}
                        className="mt-3 inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        Open public stay page
                      </Link>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-slate-900">Recent Booking Requests</h4>
                  <p className="mb-4 text-sm text-slate-600">
                    These requests are submitted from your public stay page so you can call or email the traveler back.
                  </p>
                  {accommodationBookingRequests.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4 text-sm text-slate-600">
                      No booking requests yet. Share your public stay link with guests so they can send dates and contact details.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {accommodationBookingRequests.map((request) => (
                        <div key={request.id} className="rounded-xl border border-slate-200 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{request.guestName}</p>
                              <p className="text-sm text-slate-500">{request.accommodation.name}</p>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              {request.status}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                            <p>Email: <span className="font-semibold text-slate-900">{request.guestEmail}</span></p>
                            <p>Phone: <span className="font-semibold text-slate-900">{request.guestPhone ?? "Not shared"}</span></p>
                            <p>Stay: <span className="font-semibold text-slate-900">{new Date(request.checkInDate).toLocaleDateString()} to {new Date(request.checkOutDate).toLocaleDateString()}</span></p>
                            <p>Guests / Rooms: <span className="font-semibold text-slate-900">{request.guests} / {request.rooms ?? "Ask"}</span></p>
                          </div>
                          {request.message ? (
                            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                              {request.message}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ) : null}

            {access.activeVendor.businessType === "TOUR_GUIDE" ? (
              <section className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">Guide Command Center</h3>
                <p className="mb-4 text-sm text-slate-600">Show expertise, pricing, and trust markers for travelers.</p>
                <div className="space-y-3">
                  {guideServices.map((guide) => (
                    <div key={guide.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{guide.name}</p>
                          <p className="text-sm text-slate-500">{guide.city}, {guide.state}</p>
                        </div>
                        {guide.isLicensed ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Licensed
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-slate-600">Experience: {guide.yearsExperience ?? 0} years</p>
                      <p className="text-sm text-slate-600">Hourly: {formatCurrency(guide.hourlyRate)}</p>
                      <p className="text-sm text-slate-600">Full day: {formatCurrency(guide.fullDayRate)}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {(access.activeVendor.businessType === "ATTRACTION_OPERATOR" ||
              access.activeVendor.businessType === "LOCAL_EXPERIENCE") ? (
              <section className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">Experience Showcase</h3>
                <p className="mb-4 text-sm text-slate-600">Feature places, time slots, and curated stop quality.</p>
                <div className="space-y-3">
                  {touristPlaces.map((place) => (
                    <div key={place.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{place.name}</p>
                          <p className="text-sm text-slate-500">{place.city}, {place.state}</p>
                        </div>
                        {place.isFeatured ? (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            Featured
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-slate-600">Category: {place.category.replaceAll("_", " ")}</p>
                      <p className="text-sm text-slate-600">Visit time: {place.estimatedVisitTime ?? "Flexible"}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </section>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Business Playbook</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <p>Food operators can eventually add menu engineering, bestseller ranking, and traveler-combo offers.</p>
                <p>Transport partners can grow into live pickup status, multilingual driver badges, and airport scheduling blocks.</p>
                <p>Stay partners can add vacancy calendars, family-room badges, and airport-arrival bundles.</p>
                <p>Guides can offer themed walk packs, language badges, and half-day vs full-day packages.</p>
                <p>Experience partners can add timed slots, ticket caps, and weather-aware recommendations.</p>
              </div>
            </section>

            {orders.length > 0 ? (
              <section className="rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">Recent Food Orders</h3>
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-slate-200 p-3">
                      <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                      <p className="text-sm text-slate-500">{order.restaurant.name}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {order.user.name ?? order.user.email} · {formatCurrency(order.grandTotal)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-dashed border-cyan-200 bg-white p-8 text-center shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">No food orders yet</h3>
                <p className="mt-2 text-sm text-slate-600">
                  That is expected for non-food partners. Your dashboard now focuses on your business inventory first.
                </p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
