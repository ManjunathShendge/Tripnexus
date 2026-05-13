import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAppUser } from "@/lib/vendor-context";

export default async function AccountOrdersPage() {
  const user = await getCurrentAppUser();
  if (!user) {
    redirect("/auth/login?next=/account/orders");
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      restaurant: {
        select: {
          name: true,
          city: true,
          state: true,
        },
      },
      orderItems: {
        select: {
          quantity: true,
        },
      },
      delivery: {
        select: {
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
            <p className="mt-1 text-sm text-slate-600">
              Track your past orders and current delivery status.
            </p>
          </div>
          <Link
            href="/restaurants"
            className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-700 transition hover:border-orange-300 hover:bg-orange-50"
          >
            Explore Restaurants
          </Link>
        </div>

        {orders.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-orange-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">No orders yet</h2>
            <p className="mt-2 text-sm text-slate-600">
              Place your first order to start seeing your history here.
            </p>
            <Link
              href="/restaurants"
              className="mt-4 inline-flex rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Find Food
            </Link>
          </section>
        ) : (
          <section className="space-y-3">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">
                      {order.orderNumber}
                    </p>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {order.restaurant.name}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {order.restaurant.city ?? "City"} {order.restaurant.state ? `, ${order.restaurant.state}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      ${order.grandTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                    Order: {order.status}
                  </span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700">
                    Delivery: {order.delivery?.status ?? "SEARCHING"}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-700">
                    Items: {order.orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                  <Link
                    href={`/orders/${order.id}`}
                    className="ml-auto rounded-full border border-orange-200 px-3 py-1 font-medium text-orange-700 hover:bg-orange-50"
                  >
                    View Details
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
