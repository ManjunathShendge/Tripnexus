import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ACCOMMODATION_TYPE_LABELS } from "@/lib/business";
import { createAccommodationBookingRequest } from "@/app/stays/actions";
import { getCurrentAppUser } from "@/lib/vendor-context";
import { countOpenAccommodationBookingRequests } from "@/lib/accommodation-booking";

type StayDetailPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ requested?: string; error?: string }>;
};

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatAmenity(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export default async function StayDetailPage({ params, searchParams }: StayDetailPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const user = await getCurrentAppUser();

  const stay = await prisma.accommodation.findUnique({
    where: { slug },
    include: {
      vendor: {
        select: {
          name: true,
          supportPhone: true,
          supportEmail: true,
          tagline: true,
        },
      },
    },
  });

  if (!stay || !stay.isActive) {
    notFound();
  }

  const openRequestCount = await countOpenAccommodationBookingRequests(stay.id);

  const amenities = formatAmenity(stay.amenities);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-cyan-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/stays"
              className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
            >
              Back to Stays
            </Link>
            <Link
              href="/trip"
              className="rounded-xl border border-cyan-200 bg-white px-4 py-2 text-sm font-medium text-cyan-800 hover:bg-cyan-50"
            >
              My Trip
            </Link>
          </div>
          <p className="text-sm text-slate-600">
            {user ? `Signed in as ${user.email}` : "You can request a booking even without signing in."}
          </p>
        </div>

        {query.requested ? (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Booking request sent. The stay owner can now review your dates and contact details.
          </div>
        ) : null}
        {query.error ? (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            Could not submit request: {query.error.replaceAll("_", " ")}.
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  {ACCOMMODATION_TYPE_LABELS[stay.type]}
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">{stay.name}</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  {stay.description ?? "Comfortable stay option for travelers."}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Starting from</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {typeof stay.pricePerNight === "number" ? `$${stay.pricePerNight.toFixed(2)}` : "Contact"}
                </p>
                <p className="text-xs text-slate-500">per night</p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <p>Location: <span className="font-semibold text-slate-900">{stay.address}</span></p>
              <p>City / State: <span className="font-semibold text-slate-900">{stay.city ?? "Not set"}, {stay.state ?? "Not set"}</span></p>
              <p>Rooms: <span className="font-semibold text-slate-900">{stay.roomCount ?? "Ask owner"}</span></p>
              <p>Check-in: <span className="font-semibold text-slate-900">{stay.checkInTime ?? "Flexible"}</span></p>
              <p>Check-out: <span className="font-semibold text-slate-900">{stay.checkOutTime ?? "Flexible"}</span></p>
              <p>Open requests: <span className="font-semibold text-slate-900">{openRequestCount}</span></p>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900">Amenities</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {amenities.length > 0 ? (
                  amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800"
                    >
                      {amenity}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Amenities will be shared by the owner
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="text-lg font-semibold text-slate-900">Direct Contact</h2>
              <p className="mt-1 text-sm text-slate-600">
                Managed by {stay.vendor.name}{stay.vendor.tagline ? ` - ${stay.vendor.tagline}` : ""}.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {stay.phone || stay.vendor.supportPhone ? (
                  <a
                    href={`tel:${(stay.phone ?? stay.vendor.supportPhone ?? "").replace(/\s+/g, "")}`}
                    className="rounded-xl border border-emerald-200 bg-white px-4 py-2 font-semibold text-emerald-800 hover:bg-emerald-50"
                  >
                    Call {stay.phone ?? stay.vendor.supportPhone}
                  </a>
                ) : null}
                {stay.email || stay.vendor.supportEmail ? (
                  <a
                    href={`mailto:${stay.email ?? stay.vendor.supportEmail ?? ""}?subject=${encodeURIComponent(`Stay inquiry for ${stay.name}`)}`}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Email {stay.email ?? stay.vendor.supportEmail}
                  </a>
                ) : null}
              </div>
            </div>
          </article>

          <aside className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Send Booking Request</h2>
            <p className="mt-2 text-sm text-slate-600">
              Share your dates and contact information. The hotel or lodge owner will see this in their dashboard.
            </p>

            <form action={createAccommodationBookingRequest} className="mt-5 space-y-4">
              <input type="hidden" name="accommodationId" value={stay.id} />
              <input type="hidden" name="redirectPath" value={`/stays/${stay.slug}`} />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="guestName"
                  required
                  defaultValue={user?.name ?? ""}
                  placeholder="Your full name"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2"
                />
                <input
                  name="guestEmail"
                  type="email"
                  required
                  defaultValue={user?.email ?? ""}
                  placeholder="Your email"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2"
                />
                <input
                  name="guestPhone"
                  placeholder="Phone number"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2"
                />
                <input
                  name="rooms"
                  type="number"
                  min="1"
                  placeholder="Rooms needed"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2"
                />
                <input
                  name="checkInDate"
                  type="date"
                  required
                  min={formatDateInput(today)}
                  defaultValue={formatDateInput(today)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2"
                />
                <input
                  name="checkOutDate"
                  type="date"
                  required
                  min={formatDateInput(tomorrow)}
                  defaultValue={formatDateInput(tomorrow)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2"
                />
                <input
                  name="guests"
                  type="number"
                  min="1"
                  defaultValue="2"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2"
                />
              </div>
              <textarea
                name="message"
                rows={5}
                placeholder="Tell the owner about arrival time, room preference, family size, or anything else important."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-200 focus:ring-2"
              />
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Send Request to Owner
              </button>
            </form>
          </aside>
        </section>
      </div>
    </main>
  );
}
