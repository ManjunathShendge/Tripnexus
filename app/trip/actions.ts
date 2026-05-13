'use server'

import { TripItemStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { appendQueryFlag, ensureActiveTripPlan } from "@/lib/trip";
import { getCurrentAppUser } from "@/lib/vendor-context";

async function getAuthenticatedUserOrRedirect(nextPath: string) {
  const user = await getCurrentAppUser();

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

function getRedirectPath(formData: FormData, fallbackPath: string) {
  return formData.get("redirectPath")?.toString() || fallbackPath;
}

export async function createTripPlan(formData: FormData) {
  const redirectPath = getRedirectPath(formData, "/trip");
  const user = await getAuthenticatedUserOrRedirect("/trip");
  const title = formData.get("title")?.toString().trim() ?? "";
  const destinationCity = formData.get("destinationCity")?.toString().trim() ?? "";
  const startDateValue = formData.get("startDate")?.toString().trim() ?? "";
  const endDateValue = formData.get("endDate")?.toString().trim() ?? "";
  const notes = formData.get("notes")?.toString().trim() ?? "";
  const startDate = startDateValue ? new Date(`${startDateValue}T00:00:00.000Z`) : null;
  const endDate = endDateValue ? new Date(`${endDateValue}T00:00:00.000Z`) : null;

  if (title.length < 2) {
    redirect(appendQueryFlag(redirectPath, "error", "trip_title_too_short"));
  }

  if (startDate && endDate && endDate < startDate) {
    redirect(appendQueryFlag(redirectPath, "error", "trip_dates_invalid"));
  }

  await prisma.tripPlan.updateMany({
    where: {
      userId: user.id,
      isDefault: true,
    },
    data: {
      isDefault: false,
    },
  });

  await prisma.tripPlan.create({
    data: {
      userId: user.id,
      title,
      destinationCity: destinationCity || null,
      startDate,
      endDate,
      notes: notes || null,
      isDefault: true,
    },
  });

  revalidatePath("/trip");
  redirect(appendQueryFlag(redirectPath, "tripCreated"));
}

async function saveItemToTrip({
  redirectPath,
  restaurantId,
  touristPlaceId,
  transportOptionId,
  bookingStatus = TripItemStatus.SAVED,
}: {
  redirectPath: string;
  restaurantId?: string;
  touristPlaceId?: string;
  transportOptionId?: string;
  bookingStatus?: TripItemStatus;
}) {
  const user = await getAuthenticatedUserOrRedirect(redirectPath);
  const tripPlan = await ensureActiveTripPlan(user.id);

  const existingItem = await prisma.tripItem.findFirst({
    where: {
      tripPlanId: tripPlan.id,
      restaurantId: restaurantId ?? null,
      touristPlaceId: touristPlaceId ?? null,
      transportOptionId: transportOptionId ?? null,
    },
    select: { id: true },
  });

  if (!existingItem) {
    const currentCount = await prisma.tripItem.count({
      where: { tripPlanId: tripPlan.id },
    });

    await prisma.tripItem.create({
      data: {
        tripPlanId: tripPlan.id,
        restaurantId,
        touristPlaceId,
        transportOptionId,
        bookingStatus,
        bookedAt: bookingStatus === TripItemStatus.BOOKED ? new Date() : null,
        sortOrder: currentCount + 1,
      },
    });
  }

  revalidatePath("/trip");
  if (redirectPath.startsWith("/")) {
    revalidatePath(redirectPath.split("?")[0]);
  }
  redirect(appendQueryFlag(redirectPath, "savedToTrip"));
}

export async function saveRestaurantToTrip(formData: FormData) {
  const restaurantId = formData.get("restaurantId")?.toString();
  const redirectPath = getRedirectPath(formData, "/restaurants");

  if (!restaurantId) {
    redirect(appendQueryFlag(redirectPath, "error", "missing_restaurant"));
  }

  await saveItemToTrip({
    redirectPath,
    restaurantId,
  });
}

export async function saveTouristPlaceToTrip(formData: FormData) {
  const touristPlaceId = formData.get("touristPlaceId")?.toString();
  const redirectPath = getRedirectPath(formData, "/explore");

  if (!touristPlaceId) {
    redirect(appendQueryFlag(redirectPath, "error", "missing_place"));
  }

  await saveItemToTrip({
    redirectPath,
    touristPlaceId,
  });
}

export async function saveTransportOptionToTrip(formData: FormData) {
  const transportOptionId = formData.get("transportOptionId")?.toString();
  const redirectPath = getRedirectPath(formData, "/transport");

  if (!transportOptionId) {
    redirect(appendQueryFlag(redirectPath, "error", "missing_transport"));
  }

  await saveItemToTrip({
    redirectPath,
    transportOptionId,
    bookingStatus: TripItemStatus.BOOKING_PENDING,
  });
}

export async function updateTripItemStatus(formData: FormData) {
  const redirectPath = getRedirectPath(formData, "/trip");
  const itemId = formData.get("itemId")?.toString();
  const statusValue = formData.get("status")?.toString();
  const user = await getAuthenticatedUserOrRedirect("/trip");

  if (!itemId || !statusValue) {
    redirect(appendQueryFlag(redirectPath, "error", "missing_trip_status"));
  }

  const status = Object.values(TripItemStatus).find((value) => value === statusValue);

  if (!status) {
    redirect(appendQueryFlag(redirectPath, "error", "invalid_trip_status"));
  }

  const item = await prisma.tripItem.findFirst({
    where: {
      id: itemId,
      tripPlan: {
        userId: user.id,
      },
    },
    select: { id: true },
  });

  if (!item) {
    redirect(appendQueryFlag(redirectPath, "error", "trip_item_not_found"));
  }

  await prisma.tripItem.update({
    where: { id: item.id },
    data: {
      bookingStatus: status,
      bookedAt: status === TripItemStatus.BOOKED ? new Date() : null,
    },
  });

  revalidatePath("/trip");
  redirect(appendQueryFlag(redirectPath, "updated"));
}

export async function setActiveTripPlan(formData: FormData) {
  const redirectPath = getRedirectPath(formData, "/trip");
  const tripPlanId = formData.get("tripPlanId")?.toString();
  const user = await getAuthenticatedUserOrRedirect("/trip");

  if (!tripPlanId) {
    redirect(appendQueryFlag(redirectPath, "error", "missing_trip_plan"));
  }

  const tripPlan = await prisma.tripPlan.findFirst({
    where: {
      id: tripPlanId,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!tripPlan) {
    redirect(appendQueryFlag(redirectPath, "error", "trip_plan_not_found"));
  }

  await prisma.$transaction([
    prisma.tripPlan.updateMany({
      where: {
        userId: user.id,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    }),
    prisma.tripPlan.update({
      where: { id: tripPlan.id },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/trip");
  redirect(appendQueryFlag(redirectPath, "tripActivated"));
}

export async function removeTripItem(formData: FormData) {
  const redirectPath = getRedirectPath(formData, "/trip");
  const itemId = formData.get("itemId")?.toString();
  const user = await getAuthenticatedUserOrRedirect("/trip");

  if (!itemId) {
    redirect(appendQueryFlag(redirectPath, "error", "missing_trip_item"));
  }

  const item = await prisma.tripItem.findFirst({
    where: {
      id: itemId,
      tripPlan: {
        userId: user.id,
      },
    },
    select: { id: true },
  });

  if (!item) {
    redirect(appendQueryFlag(redirectPath, "error", "trip_item_not_found"));
  }

  await prisma.tripItem.delete({
    where: { id: item.id },
  });

  revalidatePath("/trip");
  redirect(appendQueryFlag(redirectPath, "removed"));
}
