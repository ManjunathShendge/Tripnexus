import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAppUser } from "@/lib/vendor-context";
import { RazorpayPayClient } from "./razorpay-pay-client";

type CheckoutPayPageProps = {
  searchParams: Promise<{ orderId?: string }>;
};

export default async function CheckoutPayPage({ searchParams }: CheckoutPayPageProps) {
  const params = await searchParams;
  const orderId = params.orderId?.trim();

  const user = await getCurrentAppUser();
  if (!user) {
    redirect("/auth/login?next=/checkout/pay");
  }

  if (!orderId) {
    redirect("/checkout?error=missing_order_for_payment");
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: user.id,
    },
    include: {
      payment: true,
      restaurant: { select: { name: true } },
    },
  });

  if (!order || !order.payment) {
    redirect("/checkout?error=order_not_found");
  }

  if (order.paymentStatus === "SUCCESS" || order.payment.status === "SUCCESS") {
    redirect(`/orders/${order.id}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Razorpay Checkout</h1>
            <p className="mt-1 text-sm text-slate-600">
              Order {order.orderNumber} • {order.restaurant.name}
            </p>
          </div>
          <Link
            href="/checkout"
            className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-700 transition hover:border-orange-300 hover:bg-orange-50"
          >
            Back to Checkout
          </Link>
        </div>

        <RazorpayPayClient
          orderId={order.id}
          amountDisplay={`₹${order.grandTotal.toFixed(2)}`}
        />
      </div>
    </main>
  );
}
