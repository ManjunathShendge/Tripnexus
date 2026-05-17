import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AccommodationType, BusinessType, Prisma, TransportType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentAppUser } from "@/lib/vendor-context";
import { buildMenuItemsFromFreeformEntries, buildStarterMenuFromCuisines } from "@/lib/cuisine-catalog";
import { BUSINESS_TYPE_LABELS, splitCommaList } from "@/lib/business";
import { INDIA_STATES, getStateCentroid } from "@/lib/india-geo";
import { BusinessTypeFields } from "@/components/business-type-fields";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const RESTAURANT_FIELDS = new Set(
  Prisma.dmmf.datamodel.models
    .find((model) => model.name === "Restaurant")
    ?.fields.map((field) => field.name) ?? [],
);

function parseEnumValue<T extends string>(value: string, allowed: readonly T[]) {
  return allowed.includes(value as T) ? (value as T) : null;
}

function resolveCoordinatesFromState(
  state: string,
  latitudeValue: string | null | undefined,
  longitudeValue: string | null | undefined,
) {
  const latitude = Number.parseFloat(latitudeValue ?? "");
  const longitude = Number.parseFloat(longitudeValue ?? "");

  if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
    return { latitude, longitude };
  }

  const centroid = getStateCentroid(state);
  if (!centroid) {
    return null;
  }

  return {
    latitude: centroid.latitude,
    longitude: centroid.longitude,
  };
}

async function deleteVendorProfile(formData: FormData) {
  "use server";

  const user = await getCurrentAppUser();
  if (!user) {
    redirect("/auth/login?next=/account/become-vendor");
  }

  const membershipId = formData.get("membershipId")?.toString().trim() ?? "";
  if (!membershipId) {
    redirect("/account/become-vendor?error=missing_membership");
  }

  const membership = await prisma.vendorUser.findUnique({
    where: {
      id: membershipId,
    },
    include: {
      vendor: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  if (!membership || membership.userId !== user.id) {
    redirect("/account/become-vendor?error=vendor_not_found");
  }

  if (membership.role !== "OWNER") {
    redirect("/account/become-vendor?error=only_owner_can_delete_business");
  }

  const vendorId = membership.vendorId;

  const [restaurantIds, accommodationIds, orderCount, bookingRequestCount] = await Promise.all([
    prisma.restaurant.findMany({
      where: { vendorId },
      select: { id: true },
    }),
    prisma.accommodation.findMany({
      where: { vendorId },
      select: { id: true },
    }),
    prisma.order.count({
      where: {
        restaurant: {
          vendorId,
        },
      },
    }),
    prisma.accommodationBookingRequest.count({
      where: {
        accommodation: {
          vendorId,
        },
      },
    }),
  ]);

  if (orderCount > 0 || bookingRequestCount > 0) {
    redirect("/account/become-vendor?error=business_has_orders_or_booking_requests");
  }

  const restaurantIdList = restaurantIds.map((restaurant) => restaurant.id);
  const accommodationIdList = accommodationIds.map((accommodation) => accommodation.id);

  await prisma.$transaction(async (tx) => {
    if (restaurantIdList.length > 0) {
      const menuItems = await tx.menuItem.findMany({
        where: {
          restaurantId: { in: restaurantIdList },
        },
        select: { id: true },
      });

      const menuItemIdList = menuItems.map((item) => item.id);

      if (menuItemIdList.length > 0) {
        await tx.cartItem.deleteMany({
          where: {
            menuItemId: { in: menuItemIdList },
          },
        });

        await tx.menuItem.deleteMany({
          where: {
            id: { in: menuItemIdList },
          },
        });
      }

      await tx.review.deleteMany({
        where: {
          restaurantId: { in: restaurantIdList },
        },
      });

      await tx.tripItem.deleteMany({
        where: {
          restaurantId: { in: restaurantIdList },
        },
      });

      await tx.restaurant.deleteMany({
        where: {
          id: { in: restaurantIdList },
        },
      });
    }

    if (accommodationIdList.length > 0) {
      await tx.accommodationBookingRequest.deleteMany({
        where: {
          accommodationId: { in: accommodationIdList },
        },
      });
    }

    await tx.tripItem.deleteMany({
      where: {
        touristPlace: {
          vendorId,
        },
      },
    });

    await tx.tripItem.deleteMany({
      where: {
        transportOption: {
          vendorId,
        },
      },
    });

    await tx.touristPlace.deleteMany({
      where: { vendorId },
    });

    await tx.transportOption.deleteMany({
      where: { vendorId },
    });

    await tx.guideService.deleteMany({
      where: { vendorId },
    });

    await tx.accommodation.deleteMany({
      where: { vendorId },
    });

    await tx.vendorUser.deleteMany({
      where: { vendorId },
    });

    await tx.vendor.delete({
      where: { id: vendorId },
    });
  });

  revalidatePath("/account/become-vendor");
  revalidatePath("/vendor/orders");
  revalidatePath("/restaurants");
  revalidatePath("/stays");
  revalidatePath("/transport");
  revalidatePath("/explore");

  redirect("/account/become-vendor?deleted=1");
}

async function createVendorProfile(formData: FormData) {
  "use server";

  const user = await getCurrentAppUser();
  if (!user) {
    redirect("/auth/login?next=/account/become-vendor");
  }

  const vendorId = formData.get("vendorId")?.toString().trim() ?? "";
  const businessName = formData.get("businessName")?.toString().trim() ?? "";
  const requestedSlug = formData.get("businessSlug")?.toString().trim() ?? "";
  const businessType =
    parseEnumValue(
      formData.get("businessType")?.toString() ?? "",
      Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[],
    ) ?? "FOOD_AND_DINING";
  const tagline = formData.get("tagline")?.toString().trim() ?? "";
  const supportPhone = formData.get("supportPhone")?.toString().trim() ?? "";
  const supportEmail = formData.get("supportEmail")?.toString().trim() ?? "";

  if (businessName.length < 3) {
    redirect("/account/become-vendor?error=business_name_too_short");
  }

  if (vendorId) {
    const existingVendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!existingVendor) {
      redirect("/vendor/orders");
    }

    await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        name: businessName,
        tagline: tagline || null,
        supportPhone: supportPhone || null,
        supportEmail: supportEmail || null,
      },
    });

    redirect(`/vendor/orders?vendor=${existingVendor.slug}`);
  }

  const baseSlug = slugify(requestedSlug || businessName);
  if (!baseSlug) {
    redirect("/account/become-vendor?error=invalid_slug");
  }

  let finalSlug = baseSlug;
  for (let i = 0; i < 15; i += 1) {
    const candidate = i === 0 ? baseSlug : `${baseSlug}-${i + 1}`;
    const existing = await prisma.vendor.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) {
      finalSlug = candidate;
      break;
    }
    if (i === 14) {
      redirect("/account/become-vendor?error=slug_unavailable");
    }
  }

  const vendor = await prisma.$transaction(async (tx) => {
    const createdVendor = await tx.vendor.create({
      data: {
        name: businessName,
        slug: finalSlug,
        businessType,
        tagline: tagline || null,
        supportPhone: supportPhone || null,
        supportEmail: supportEmail || null,
        isActive: true,
      },
    });

    await tx.vendorUser.create({
      data: {
        vendorId: createdVendor.id,
        userId: user.id,
        role: "OWNER",
      },
    });

    if (businessType === "FOOD_AND_DINING") {
      const restaurantName = formData.get("restaurantName")?.toString().trim() ?? "";
      const restaurantAddress = formData.get("restaurantAddress")?.toString().trim() ?? "";
      const restaurantCity = formData.get("restaurantCity")?.toString().trim() ?? "";
      const restaurantState = formData.get("restaurantState")?.toString().trim() ?? "";
      const restaurantEmail = formData.get("restaurantEmail")?.toString().trim() ?? "";
      const restaurantPhone = formData.get("restaurantPhone")?.toString().trim() ?? "";
      const cuisineInput = formData.get("restaurantCuisine")?.toString().trim() ?? "";
      const createStarterMenu = formData.get("createStarterMenu") === "on";

      if (
        !restaurantName ||
        !restaurantAddress ||
        !restaurantCity ||
        !restaurantState ||
        !restaurantEmail ||
        !restaurantPhone
      ) {
        redirect("/account/become-vendor?error=restaurant_fields_required");
      }

      if (!INDIA_STATES.includes(restaurantState)) {
        redirect("/account/become-vendor?error=invalid_state");
      }

      const cuisines = cuisineInput ? splitCommaList(cuisineInput) : ["General"];
      const coordinates = resolveCoordinatesFromState(
        restaurantState,
        formData.get("restaurantLatitude")?.toString(),
        formData.get("restaurantLongitude")?.toString(),
      );

      if (!coordinates) {
        redirect("/account/become-vendor?error=missing_location");
      }

      const createdRestaurant = await tx.restaurant.create({
        data: {
          name: restaurantName,
          description: `${restaurantName} on ${businessName}`,
          cuisineType: cuisines,
          address: restaurantAddress,
          ...(RESTAURANT_FIELDS.has("city") ? { city: restaurantCity } : {}),
          ...(RESTAURANT_FIELDS.has("state") ? { state: restaurantState } : {}),
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          phone: restaurantPhone,
          email: restaurantEmail,
          isActive: true,
          isOpen: false,
          minOrder: 0,
          deliveryFee: 0,
          estimatedTime: "30-40 mins",
          ownerId: user.id,
          vendorId: createdVendor.id,
        },
      });

      if (createStarterMenu) {
        const starterMenuItems = buildStarterMenuFromCuisines(cuisines);
        const menuItemsToCreate =
          starterMenuItems.length > 0
            ? starterMenuItems
            : buildMenuItemsFromFreeformEntries(cuisines);

        for (const item of menuItemsToCreate) {
          await tx.menuItem.create({
            data: {
              restaurantId: createdRestaurant.id,
              name: item.name,
              description: item.description,
              price: item.price,
              category: item.category,
              isAvailable: true,
              isVeg: item.isVeg,
              spicyLevel: item.spicyLevel,
            },
          });
        }
      }
    }

    if (businessType === "TRANSPORT_OPERATOR") {
      const transportName = formData.get("transportName")?.toString().trim() ?? "";
      const transportType =
        parseEnumValue(
          formData.get("transportType")?.toString() ?? "",
          Object.values(TransportType),
        ) ?? "PRIVATE_CAB";
      const transportServiceArea = formData.get("transportServiceArea")?.toString().trim() ?? "";
      const transportPricingNotes = formData.get("transportPricingNotes")?.toString().trim() ?? "";
      const transportHours = formData.get("transportHours")?.toString().trim() ?? "";
      const transportAddress = formData.get("transportAddress")?.toString().trim() ?? "";
      const transportCity = formData.get("transportCity")?.toString().trim() ?? "";
      const transportState = formData.get("transportState")?.toString().trim() ?? "";
      const transportPhone = formData.get("transportPhone")?.toString().trim() ?? "";
      const transportWebsite = formData.get("transportWebsite")?.toString().trim() ?? "";

      if (!transportName || !transportCity || !transportState) {
        redirect("/account/become-vendor?error=transport_fields_required");
      }

      const transportCoordinates = resolveCoordinatesFromState(
        transportState,
        formData.get("transportLatitude")?.toString(),
        formData.get("transportLongitude")?.toString(),
      );

      await tx.transportOption.create({
        data: {
          name: transportName,
          slug: `${createdVendor.slug}-transport`,
          type: transportType,
          description: `${transportName} helps tourists move across ${transportCity}.`,
          operatorName: businessName,
          serviceArea: transportServiceArea || `${transportCity} tourist circuit`,
          address: transportAddress || null,
          city: transportCity,
          state: transportState,
          latitude: transportCoordinates?.latitude ?? null,
          longitude: transportCoordinates?.longitude ?? null,
          phone: transportPhone || supportPhone || null,
          website: transportWebsite || null,
          pricingNotes: transportPricingNotes || "Contact for route-wise pricing",
          hours: transportHours || "Flexible timing",
          isActive: true,
          isFeatured: true,
          vendorId: createdVendor.id,
        },
      });
    }

    if (businessType === "HOSPITALITY_STAY") {
      const accommodationName = formData.get("accommodationName")?.toString().trim() ?? "";
      const accommodationType =
        parseEnumValue(
          formData.get("accommodationType")?.toString() ?? "",
          Object.values(AccommodationType),
        ) ?? "HOTEL";
      const accommodationDescription =
        formData.get("accommodationDescription")?.toString().trim() ?? "";
      const accommodationAddress = formData.get("accommodationAddress")?.toString().trim() ?? "";
      const accommodationCity = formData.get("accommodationCity")?.toString().trim() ?? "";
      const accommodationState = formData.get("accommodationState")?.toString().trim() ?? "";
      const amenities = splitCommaList(formData.get("accommodationAmenities")?.toString() ?? "");
      const pricePerNight = Number.parseFloat(formData.get("pricePerNight")?.toString() ?? "");
      const roomCount = Number.parseInt(formData.get("roomCount")?.toString() ?? "", 10);

      if (!accommodationName || !accommodationAddress || !accommodationCity || !accommodationState) {
        redirect("/account/become-vendor?error=accommodation_fields_required");
      }

      const accommodationCoordinates = resolveCoordinatesFromState(
        accommodationState,
        formData.get("accommodationLatitude")?.toString(),
        formData.get("accommodationLongitude")?.toString(),
      );

      await tx.accommodation.create({
        data: {
          name: accommodationName,
          slug: `${createdVendor.slug}-stay`,
          type: accommodationType,
          description: accommodationDescription || `${accommodationName} welcomes visiting travelers.`,
          address: accommodationAddress,
          city: accommodationCity,
          state: accommodationState,
          latitude: accommodationCoordinates?.latitude ?? null,
          longitude: accommodationCoordinates?.longitude ?? null,
          phone: supportPhone || null,
          email: supportEmail || null,
          pricePerNight: Number.isNaN(pricePerNight) ? null : pricePerNight,
          roomCount: Number.isNaN(roomCount) ? null : roomCount,
          amenities,
          isActive: true,
          isFeatured: true,
          vendorId: createdVendor.id,
        },
      });
    }

    if (businessType === "TOUR_GUIDE") {
      const guideServiceName = formData.get("guideServiceName")?.toString().trim() ?? "";
      const guideDescription = formData.get("guideDescription")?.toString().trim() ?? "";
      const guideCity = formData.get("guideCity")?.toString().trim() ?? "";
      const guideState = formData.get("guideState")?.toString().trim() ?? "";
      const guideLanguages = splitCommaList(formData.get("guideLanguages")?.toString() ?? "");
      const guideSpecialties = splitCommaList(formData.get("guideSpecialties")?.toString() ?? "");
      const guideYearsExperience = Number.parseInt(
        formData.get("guideYearsExperience")?.toString() ?? "",
        10,
      );
      const guideHourlyRate = Number.parseFloat(formData.get("guideHourlyRate")?.toString() ?? "");
      const guideFullDayRate = Number.parseFloat(formData.get("guideFullDayRate")?.toString() ?? "");
      const guideIsLicensed = formData.get("guideIsLicensed") === "on";

      if (!guideServiceName || !guideCity || !guideState) {
        redirect("/account/become-vendor?error=guide_fields_required");
      }

      await tx.guideService.create({
        data: {
          name: guideServiceName,
          slug: `${createdVendor.slug}-guide`,
          description: guideDescription || `${guideServiceName} offers local guided support for travelers.`,
          city: guideCity,
          state: guideState,
          phone: supportPhone || null,
          email: supportEmail || null,
          languages: guideLanguages,
          specialties: guideSpecialties,
          yearsExperience: Number.isNaN(guideYearsExperience) ? null : guideYearsExperience,
          hourlyRate: Number.isNaN(guideHourlyRate) ? null : guideHourlyRate,
          fullDayRate: Number.isNaN(guideFullDayRate) ? null : guideFullDayRate,
          isLicensed: guideIsLicensed,
          isActive: true,
          isFeatured: true,
          vendorId: createdVendor.id,
        },
      });
    }

    if (businessType === "ATTRACTION_OPERATOR" || businessType === "LOCAL_EXPERIENCE") {
      const placeName = formData.get("placeName")?.toString().trim() ?? "";
      const placeDescription = formData.get("placeDescription")?.toString().trim() ?? "";
      const placeAddress = formData.get("placeAddress")?.toString().trim() ?? "";
      const placeCity = formData.get("placeCity")?.toString().trim() ?? "";
      const placeState = formData.get("placeState")?.toString().trim() ?? "";
      const placeTags = splitCommaList(formData.get("placeTags")?.toString() ?? "");
      const placeVisitTime = formData.get("placeVisitTime")?.toString().trim() ?? "";

      if (!placeName || !placeAddress || !placeCity || !placeState) {
        redirect("/account/become-vendor?error=place_fields_required");
      }

      const centroid = getStateCentroid(placeState);

      await tx.touristPlace.create({
        data: {
          name: placeName,
          slug: `${createdVendor.slug}-place`,
          description: placeDescription || `${placeName} is available for tourists on the platform.`,
          category: businessType === "ATTRACTION_OPERATOR" ? "ATTRACTION" : "ESSENTIAL",
          address: placeAddress,
          city: placeCity,
          state: placeState,
          latitude: centroid?.latitude ?? 0,
          longitude: centroid?.longitude ?? 0,
          phone: supportPhone || null,
          website: null,
          isActive: true,
          isFeatured: true,
          estimatedVisitTime: placeVisitTime || "Flexible",
          tags: placeTags,
          vendorId: createdVendor.id,
        },
      });
    }

    return createdVendor;
  });

  redirect(`/vendor/orders?vendor=${vendor.slug}&onboarded=1`);
}

type BecomeVendorPageProps = {
  searchParams: Promise<{ deleted?: string; error?: string; vendor?: string }>;
};

export default async function BecomeVendorPage({ searchParams }: BecomeVendorPageProps) {
  const query = await searchParams;
  const user = await getCurrentAppUser();
  if (!user) {
    redirect("/auth/login?next=/account/become-vendor");
  }

  const memberships = await prisma.vendorUser.findMany({
    where: { userId: user.id },
    include: {
      vendor: {
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          businessType: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const queryVendor = query.vendor?.toString().trim();
  const vendorToEdit = queryVendor
    ? await prisma.vendor.findFirst({
        where: {
          slug: queryVendor,
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      })
    : null;

  if (queryVendor && !vendorToEdit) {
    redirect("/vendor/orders");
  }

  const isEditMode = !!vendorToEdit;

  return (
    <main className="min-h-screen bg-gradient-to-b from-cyan-50 via-white to-amber-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {isEditMode ? "Edit Business Profile" : "Register Your Tourism Business"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {isEditMode
                ? "Update your business details and support contacts."
                : "Drivers, hotels, guides, attraction owners, and food operators all get tailored onboarding and dashboards."}
            </p>
          </div>
          <Link
            href="/vendor/orders"
            className="rounded-xl border border-cyan-200 bg-white px-4 py-2 text-sm font-medium text-cyan-800 transition hover:bg-cyan-50"
          >
            Open Partner Hub
          </Link>
        </div>

        {query.error ? (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            Registration error: {query.error.replaceAll("_", " ")}.
          </div>
        ) : null}

        {query.deleted ? (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            Business deleted successfully.
          </div>
        ) : null}

        {memberships.length > 0 ? (
          <section className="mb-6 rounded-2xl border border-cyan-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Existing Partner Memberships</h2>
            <div className="flex flex-wrap gap-2">
              {memberships.map((membership) => {
                const businessLabel = BUSINESS_TYPE_LABELS[membership.vendor.businessType];

                return (
                  <div
                    key={membership.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Link
                        href={`/vendor/orders?vendor=${membership.vendor.slug}`}
                        className="truncate hover:text-slate-900"
                      >
                        {membership.vendor.name} · {businessLabel}
                      </Link>
                    </div>
                    {membership.role === "OWNER" ? (
                      <Link
                        href={`/account/become-vendor?vendor=${membership.vendor.slug}`}
                        className="rounded-md border border-cyan-200 px-2 py-1 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-50"
                      >
                        Edit
                      </Link>
                    ) : null}
                    {membership.role === "OWNER" ? (
                      <form action={deleteVendorProfile}>
                        <input type="hidden" name="membershipId" value={membership.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </form>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        <form action={createVendorProfile} className="space-y-6 rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
          <input type="hidden" name="vendorId" value={vendorToEdit?.id ?? ""} />
          {isEditMode ? (
            <input type="hidden" name="businessType" value={vendorToEdit?.businessType ?? "FOOD_AND_DINING"} />
          ) : null}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Business Profile</h2>
            <input
              name="businessName"
              defaultValue={vendorToEdit?.name ?? ""}
              required
              placeholder="Business name"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-cyan-200 focus:ring-2"
            />
            {isEditMode ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Business slug</p>
                <p>{vendorToEdit?.slug}</p>
                <p className="mt-2 text-slate-600">The public vendor path is based on this slug. To change it, create a new listing.</p>
              </div>
            ) : (
              <input
                name="businessSlug"
                placeholder="Preferred slug (optional)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-cyan-200 focus:ring-2"
              />
            )}
            <input
              name="tagline"
              defaultValue={vendorToEdit?.tagline ?? ""}
              placeholder="Short tagline (e.g. Airport pickups with local support)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-cyan-200 focus:ring-2"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                name="supportPhone"
                defaultValue={vendorToEdit?.supportPhone ?? ""}
                placeholder="Support phone"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-cyan-200 focus:ring-2"
              />
              <input
                name="supportEmail"
                type="email"
                defaultValue={vendorToEdit?.supportEmail ?? ""}
                placeholder="Support email"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-cyan-200 focus:ring-2"
              />
            </div>
          </section>

          {!isEditMode ? <BusinessTypeFields states={INDIA_STATES} /> : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800"
          >
            {isEditMode ? "Save business profile" : "Register Business and Open Dashboard"}
          </button>
        </form>
      </div>
    </main>
  );
}
