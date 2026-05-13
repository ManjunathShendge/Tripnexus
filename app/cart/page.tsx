import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAppUser } from "@/lib/vendor-context";

async function getAuthenticatedUserOrRedirect() {
  const user = await getCurrentAppUser();
  if (!user) {
    redirect("/auth/login?next=/cart");
  }
  return user;
}

async function increaseQuantity(formData: FormData) {
  "use server";

  const user = await getAuthenticatedUserOrRedirect();
  const cartItemId = formData.get("cartItemId")?.toString();
  if (!cartItemId) return;

  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId: user.id },
    select: { quantity: true },
  });

  if (!cartItem) return;

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity: cartItem.quantity + 1 },
  });

  revalidatePath("/cart");
}

async function decreaseQuantity(formData: FormData) {
  "use server";

  const user = await getAuthenticatedUserOrRedirect();
  const cartItemId = formData.get("cartItemId")?.toString();
  if (!cartItemId) return;

  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId: user.id },
    select: { quantity: true },
  });

  if (!cartItem) return;

  if (cartItem.quantity <= 1) {
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  } else {
    await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: cartItem.quantity - 1 },
    });
  }

  revalidatePath("/cart");
}

async function removeItem(formData: FormData) {
  "use server";

  const user = await getAuthenticatedUserOrRedirect();
  const cartItemId = formData.get("cartItemId")?.toString();
  if (!cartItemId) return;

  const cartItem = await prisma.cartItem.findFirst({
    where: { id: cartItemId, userId: user.id },
    select: { id: true },
  });
  if (!cartItem) return;

  await prisma.cartItem.delete({
    where: { id: cartItem.id },
  });

  revalidatePath("/cart");
}

async function clearCart() {
  "use server";

  const user = await getAuthenticatedUserOrRedirect();

  await prisma.cartItem.deleteMany({
    where: { userId: user.id },
  });

  revalidatePath("/cart");
}

export default async function CartPage() {
  const customer = await getAuthenticatedUserOrRedirect();

  const cartItems = await prisma.cartItem.findMany({
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
    orderBy: { updatedAt: "desc" },
  });

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0,
  );

  const deliveryFee = cartItems.length > 0 ? cartItems[0].menuItem.restaurant.deliveryFee : 0;
  const tax = subtotal * 0.08;
  const grandTotal = subtotal + deliveryFee + tax;

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your Cart</h1>
            <p className="mt-1 text-sm text-slate-600">Demo customer: {customer.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/restaurants"
              className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-medium text-orange-700 transition hover:border-orange-300 hover:bg-orange-50"
            >
              Continue Shopping
            </Link>
            {cartItems.length > 0 ? (
              <form action={clearCart}>
                <button
                  type="submit"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                >
                  Clear Cart
                </button>
              </form>
            ) : null}
          </div>
        </div>

        {cartItems.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-orange-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Cart is empty</h2>
            <p className="mt-2 text-sm text-slate-600">
              Add items from a restaurant menu to start your order.
            </p>
            <Link
              href="/restaurants"
              className="mt-4 inline-flex rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              Browse Restaurants
            </Link>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <article key={item.id} className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{item.menuItem.name}</h2>
                      <p className="text-sm text-slate-600">{item.menuItem.restaurant.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        ${item.menuItem.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Item Total</p>
                      <p className="text-lg font-bold text-slate-900">
                        ${(item.menuItem.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <form action={decreaseQuantity}>
                      <input type="hidden" name="cartItemId" value={item.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        -
                      </button>
                    </form>
                    <span className="min-w-10 text-center text-sm font-semibold text-slate-900">
                      {item.quantity}
                    </span>
                    <form action={increaseQuantity}>
                      <input type="hidden" name="cartItemId" value={item.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        +
                      </button>
                    </form>
                    <form action={removeItem} className="ml-2">
                      <input type="hidden" name="cartItemId" value={item.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-rose-200 px-3 py-1 text-sm font-medium text-rose-700 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </form>
                    <Link
                      href={`/restaurants/${item.menuItem.restaurant.id}`}
                      className="ml-auto rounded-lg border border-orange-200 px-3 py-1 text-sm font-medium text-orange-700 hover:bg-orange-50"
                    >
                      Back to Menu
                    </Link>
                  </div>
                </article>
              ))}
            </section>

            <aside className="h-fit rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-slate-900">Order Summary</h3>
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

              <Link
                href="/checkout"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Proceed to Checkout
              </Link>
              <p className="mt-2 text-xs text-slate-500">
                Review address and payment details on the checkout page.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
