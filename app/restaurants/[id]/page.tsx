import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAppUser } from "@/lib/vendor-context";
import { AuthRequiredSubmit } from "@/components/auth-required-submit";
import { saveRestaurantToTrip } from "@/app/trip/actions";

async function addToCart(formData: FormData) {
  "use server";

  const menuItemId = formData.get("menuItemId")?.toString();
  const restaurantId = formData.get("restaurantId")?.toString();

  if (!menuItemId || !restaurantId) {
    redirect(`/restaurants/${restaurantId ?? ""}?error=invalid_request`);
  }

  const customer = await getCurrentAppUser();

  if (!customer) {
    redirect(`/auth/login?next=/restaurants/${restaurantId}`);
  }

  const existing = await prisma.cartItem.findUnique({
    where: {
      userId_menuItemId: {
        userId: customer.id,
        menuItemId,
      },
    },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + 1 },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        userId: customer.id,
        menuItemId,
        quantity: 1,
      },
    });
  }

  revalidatePath(`/restaurants/${restaurantId}`);
  redirect(`/restaurants/${restaurantId}?added=1`);
}

type RestaurantDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ added?: string; error?: string; savedToTrip?: string }>;
};

export default async function RestaurantDetailPage({
  params,
  searchParams,
}: RestaurantDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: {
      menuItems: {
        where: { isAvailable: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      },
      reviews: {
        select: { rating: true },
      },
    },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  const groupedMenu = restaurant.menuItems.reduce<Record<string, typeof restaurant.menuItems>>(
    (acc, item) => {
      const category = item.category || "Others";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {},
  );

  const averageRating =
    restaurant.reviews.length === 0
      ? 0
      : restaurant.reviews.reduce((sum, review) => sum + review.rating, 0) /
        restaurant.reviews.length;

  const customer = await getCurrentAppUser();

  const cartCount = customer
    ? await prisma.cartItem.count({
        where: { userId: customer.id },
      })
    : 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50 to-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/restaurants"
              className="rounded-xl border border-orange-200 bg-white px-4 py-2 text-center text-sm font-medium text-orange-700 transition hover:border-orange-300 hover:bg-orange-50"
            >
              Back to Restaurants
            </Link>
            <Link
              href="/cart"
              className="rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Cart Items: {cartCount}
            </Link>
            <Link
              href="/trip"
              className="rounded-xl border border-cyan-200 bg-white px-4 py-2 text-center text-sm font-medium text-cyan-700 transition hover:bg-cyan-50"
            >
              My Trip
            </Link>
          </div>
          <p className="text-sm text-slate-600 sm:text-right">
            {customer ? (
              <>
                Signed in as: <span className="font-semibold">{customer.email}</span>
              </>
            ) : (
              "Browse menus freely. Sign in required to add items."
            )}
          </p>
        </div>

        {query.added ? (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Item added to cart.
          </div>
        ) : null}
        {query.error ? (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            Could not add item to cart ({query.error}).
          </div>
        ) : null}
        {query.savedToTrip ? (
          <div className="mb-5 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-800">
            Restaurant saved to your trip plan.
          </div>
        ) : null}

        <section className="mb-8 rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{restaurant.name}</h1>
              <p className="mt-2 text-slate-600">{restaurant.description ?? "No description available."}</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <span
                className={`rounded-full px-4 py-2 text-center text-sm font-semibold ${
                  restaurant.isOpen ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {restaurant.isOpen ? "Open Now" : "Closed"}
              </span>
              <form action={saveRestaurantToTrip}>
                <input type="hidden" name="restaurantId" value={restaurant.id} />
                <input type="hidden" name="redirectPath" value={`/restaurants/${restaurant.id}`} />
                <button
                  type="submit"
                  className="w-full rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-100 sm:w-auto"
                >
                  Save to Trip
                </button>
              </form>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
            <p>
              Rating: <span className="font-semibold text-slate-900">{averageRating.toFixed(1)}</span> (
              {restaurant.reviews.length} reviews)
            </p>
            <p>
              Delivery Fee: <span className="font-semibold text-slate-900">${restaurant.deliveryFee.toFixed(2)}</span>
            </p>
            <p>
              ETA: <span className="font-semibold text-slate-900">{restaurant.estimatedTime ?? "Not set"}</span>
            </p>
            <p>
              Min Order: <span className="font-semibold text-slate-900">${restaurant.minOrder.toFixed(2)}</span>
            </p>
          </div>
        </section>

        <section className="space-y-6">
          {Object.keys(groupedMenu).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-10 text-center text-slate-600">
              No available menu items.
            </div>
          ) : (
            Object.entries(groupedMenu).map(([category, items]) => (
              <div key={category} className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-slate-900">{category}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {items.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                        <span className="text-sm font-bold text-orange-700">${item.price.toFixed(2)}</span>
                      </div>
                      <p className="mb-3 text-sm text-slate-600">
                        {item.description ?? "No description available."}
                      </p>
                      <div className="mb-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
                          {item.isVeg ? "Veg" : "Non-Veg"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                          Spice: {item.spicyLevel ?? 0}
                        </span>
                      </div>
                      <form id={`add-to-cart-${item.id}`} action={addToCart}>
                        <input type="hidden" name="menuItemId" value={item.id} />
                        <input type="hidden" name="restaurantId" value={restaurant.id} />
                        <AuthRequiredSubmit
                          formId={`add-to-cart-${item.id}`}
                          loginNextPath={`/restaurants/${restaurant.id}`}
                          className="w-full rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                        >
                          Add to Cart
                        </AuthRequiredSubmit>
                      </form>
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
