import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAppUser } from "@/lib/vendor-context";

type OrderDetailsPageProps = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ placed?: string }>;
};

export default async function OrderDetailsPage({
  params,
  searchParams,
}: OrderDetailsPageProps) {
  const { orderId } = await params;
  const query = await searchParams;

  const customer = await getCurrentAppUser();

  if (!customer) {
    notFound();
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: customer.id,
    },
    include: {
      restaurant: {
        select: {
          name: true,
          phone: true,
          address: true,
        },
      },
      orderItems: {
        include: {
          menuItem: {
            select: {
              name: true,
            },
          },
        },
      },
      payment: true,
      delivery: true,
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Order Details</h1>
            <p className="mt-1 text-sm text-slate-600">Customer: {customer.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/restaurants"
              className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-700 transition hover:border-orange-300 hover:bg-orange-50"
            >
              Browse Restaurants
            </Link>
            {order.paymentStatus !== "SUCCESS" && order.paymentMethod !== "CASH" ? (
              <Link
                href={`/checkout/pay?orderId=${order.id}`}
                className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
              >
                Complete Payment
              </Link>
            ) : null}
            <Link
              href="/cart"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Go to Cart
            </Link>
          </div>
        </div>

        {query.placed ? (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Order placed successfully.
          </div>
        ) : null}

        <section className="mb-6 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
            <p>
              Order ID: <span className="font-semibold text-slate-900">{order.id}</span>
            </p>
            <p>
              Order Number:{" "}
              <span className="font-semibold text-slate-900">{order.orderNumber}</span>
            </p>
            <p>
              Placed At:{" "}
              <span className="font-semibold text-slate-900">
                {new Date(order.createdAt).toLocaleString()}
              </span>
            </p>
            <p>
              Status: <span className="font-semibold text-slate-900">{order.status}</span>
            </p>
            <p>
              Payment:{" "}
              <span className="font-semibold text-slate-900">
                {order.payment?.status ?? order.paymentStatus}
              </span>
            </p>
            <p>
              Delivery:{" "}
              <span className="font-semibold text-slate-900">
                {order.delivery?.status ?? "SEARCHING"}
              </span>
            </p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Items</h2>
            <div className="space-y-3">
              {order.orderItems.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.menuItem.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      {item.quantity} x ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    ${item.totalPrice.toFixed(2)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Summary</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Restaurant</span>
                <span className="font-semibold">{order.restaurant.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment Method</span>
                <span className="font-semibold">{order.paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery</span>
                <span className="font-semibold">${order.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax</span>
                <span className="font-semibold">${order.tax.toFixed(2)}</span>
              </div>
              <div className="my-2 border-t border-slate-200" />
              <div className="flex items-center justify-between text-base text-slate-900">
                <span className="font-semibold">Grand Total</span>
                <span className="font-bold">${order.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Delivery Address
              </p>
              <p className="mt-1 text-sm text-slate-700">{order.deliveryAddress}</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
