import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAppUser } from "@/lib/vendor-context";

const PAYMENT_METHODS = ["CASH", "CARD", "UPI"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod);
}

async function placeOrder(formData: FormData) {
  "use server";

  const paymentMethodValue = formData.get("paymentMethod")?.toString() ?? "";
  const selectedAddressId = formData.get("selectedAddressId")?.toString() ?? "";
  const newLabel = formData.get("newLabel")?.toString().trim() ?? "";
  const newAddress = formData.get("newAddress")?.toString().trim() ?? "";
  const newLatitudeRaw = formData.get("newLatitude")?.toString() ?? "12.9716";
  const newLongitudeRaw = formData.get("newLongitude")?.toString() ?? "77.5946";
  const specialInstructions =
    formData.get("specialInstructions")?.toString().trim() ?? "";

  if (!isPaymentMethod(paymentMethodValue)) {
    redirect("/checkout?error=invalid_payment_method");
  }

  const customer = await getCurrentAppUser();

  if (!customer) {
    redirect("/auth/login?next=/checkout");
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: customer.id },
    include: {
      menuItem: {
        include: {
          restaurant: {
            select: { id: true, deliveryFee: true },
          },
        },
      },
    },
  });

  if (cartItems.length === 0) {
    redirect("/cart?error=empty_cart");
  }

  const restaurantIds = Array.from(
    new Set(cartItems.map((item) => item.menuItem.restaurantId)),
  );

  if (restaurantIds.length !== 1) {
    redirect("/checkout?error=multiple_restaurants");
  }

  const restaurantId = restaurantIds[0];
  const deliveryFee = cartItems[0].menuItem.restaurant.deliveryFee;
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0,
  );
  const tax = Number((subtotal * 0.08).toFixed(2));
  const grandTotal = Number((subtotal + deliveryFee + tax).toFixed(2));

  let deliveryAddress = "";
  let latitude: number | null = null;
  let longitude: number | null = null;
  let addressToCreate:
    | {
        label: string;
        address: string;
        latitude: number;
        longitude: number;
      }
    | undefined;

  if (selectedAddressId && selectedAddressId !== "new") {
    const existingAddress = await prisma.address.findFirst({
      where: { id: selectedAddressId, userId: customer.id },
      select: { address: true, latitude: true, longitude: true },
    });

    if (!existingAddress) {
      redirect("/checkout?error=address_not_found");
    }

    deliveryAddress = existingAddress.address;
    latitude = existingAddress.latitude;
    longitude = existingAddress.longitude;
  } else {
    if (!newAddress) {
      redirect("/checkout?error=new_address_required");
    }

    const parsedLatitude = Number.parseFloat(newLatitudeRaw);
    const parsedLongitude = Number.parseFloat(newLongitudeRaw);

    if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
      redirect("/checkout?error=invalid_coordinates");
    }

    deliveryAddress = newAddress;
    latitude = parsedLatitude;
    longitude = parsedLongitude;
    addressToCreate = {
      label: newLabel || "Home",
      address: newAddress,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    };
  }

  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;
  let createdOrderId = "";

  await prisma.$transaction(async (tx) => {
    if (addressToCreate) {
      await tx.address.create({
        data: {
          userId: customer.id,
          label: addressToCreate.label,
          address: addressToCreate.address,
          latitude: addressToCreate.latitude,
          longitude: addressToCreate.longitude,
        },
      });
    }

    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: customer.id,
        restaurantId,
        totalAmount: subtotal,
        deliveryFee,
        tax,
        grandTotal,
        paymentMethod: paymentMethodValue,
        paymentStatus: "PENDING",
        status: paymentMethodValue === "CASH" ? "CONFIRMED" : "PENDING",
        deliveryAddress,
        latitude,
        longitude,
        specialInstructions: specialInstructions || null,
      },
    });

    await tx.orderItem.createMany({
      data: cartItems.map((item) => ({
        orderId: order.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.menuItem.price,
        totalPrice: Number((item.menuItem.price * item.quantity).toFixed(2)),
      })),
    });

    await tx.payment.create({
      data: {
        orderId: order.id,
        amount: grandTotal,
        status: "PENDING",
      },
    });

    if (paymentMethodValue === "CASH") {
      await tx.delivery.create({
        data: {
          orderId: order.id,
          status: "SEARCHING",
        },
      });

      await tx.cartItem.deleteMany({
        where: { userId: customer.id },
      });
    }

    createdOrderId = order.id;
  });

  revalidatePath("/cart");
  revalidatePath("/restaurants");
  revalidatePath("/checkout");
  if (paymentMethodValue === "CASH") {
    redirect(`/orders/${createdOrderId}?placed=1`);
  }

  redirect(`/checkout/pay?orderId=${createdOrderId}`);
}

type CheckoutPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const query = await searchParams;

  const customer = await getCurrentAppUser();

  if (!customer) {
    redirect("/auth/login?next=/checkout");
  }

  const [addresses, cartItems] = await Promise.all([
    prisma.address.findMany({
      where: { userId: customer.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    prisma.cartItem.findMany({
      where: { userId: customer.id },
      include: {
        menuItem: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                deliveryFee: true,
              },
            },
          },
        },
      },
    }),
  ]);

  if (cartItems.length === 0) {
    redirect("/cart?error=empty_cart");
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0,
  );
  const deliveryFee = cartItems[0].menuItem.restaurant.deliveryFee;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const grandTotal = Number((subtotal + deliveryFee + tax).toFixed(2));

  const uniqueRestaurantCount = new Set(
    cartItems.map((item) => item.menuItem.restaurant.id),
  ).size;

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
            <p className="mt-1 text-sm text-slate-600">Demo customer: {customer.email}</p>
          </div>
          <Link
            href="/cart"
            className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-700 transition hover:border-orange-300 hover:bg-orange-50"
          >
            Back to Cart
          </Link>
        </div>

        {query.error ? (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            Checkout error: {query.error.replaceAll("_", " ")}.
          </div>
        ) : null}

        {uniqueRestaurantCount > 1 ? (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            Cart contains items from multiple restaurants. Please keep items from one restaurant per order.
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <form action={placeOrder} className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Delivery Address</h2>
              <div className="space-y-3">
                {addresses.map((address, index) => (
                  <label
                    key={address.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3"
                  >
                    <input
                      type="radio"
                      name="selectedAddressId"
                      value={address.id}
                      defaultChecked={index === 0}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{address.label}</span>
                      <span className="block text-sm text-slate-600">{address.address}</span>
                    </span>
                  </label>
                ))}

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3">
                  <input
                    type="radio"
                    name="selectedAddressId"
                    value="new"
                    defaultChecked={addresses.length === 0}
                    className="mt-1"
                  />
                  <span className="text-sm font-semibold text-slate-900">Use a new address</span>
                </label>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  name="newLabel"
                  placeholder="Label (Home, Work...)"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-2"
                />
                <input
                  type="text"
                  name="newAddress"
                  placeholder="Full delivery address"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-2 sm:col-span-2"
                />
                <input
                  type="number"
                  step="0.0001"
                  name="newLatitude"
                  defaultValue="12.9716"
                  placeholder="Latitude"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-2"
                />
                <input
                  type="number"
                  step="0.0001"
                  name="newLongitude"
                  defaultValue="77.5946"
                  placeholder="Longitude"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-2"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Payment</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {PAYMENT_METHODS.map((method, index) => (
                  <label
                    key={method}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-medium text-slate-800"
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      defaultChecked={index === 0}
                    />
                    {method}
                  </label>
                ))}
              </div>
              <textarea
                name="specialInstructions"
                rows={3}
                placeholder="Special instructions (optional)"
                className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-2"
              />
            </section>

            <button
              type="submit"
              disabled={uniqueRestaurantCount > 1}
              className="w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Place Order
            </button>
          </form>

          <aside className="h-fit rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Order Summary</h3>
            <div className="mb-4 space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="text-sm font-semibold text-slate-900">{item.menuItem.name}</p>
                  <p className="text-xs text-slate-600">{item.menuItem.restaurant.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.quantity} x ${item.menuItem.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Delivery</span>
                <span className="font-semibold">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tax (8%)</span>
                <span className="font-semibold">${tax.toFixed(2)}</span>
              </div>
              <div className="my-2 border-t border-slate-200" />
              <div className="flex items-center justify-between text-base text-slate-900">
                <span className="font-semibold">Grand Total</span>
                <span className="font-bold">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
