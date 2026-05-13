'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { appendQueryFlag } from "@/lib/trip";
import { getCurrentAppUser } from "@/lib/vendor-context";
import { createAccommodationBookingRequestRecord } from "@/lib/accommodation-booking";

function getRedirectPath(formData: FormData) {
  return formData.get("redirectPath")?.toString() || "/stays";
}

function normalizeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createAccommodationBookingRequest(formData: FormData) {
  const redirectPath = getRedirectPath(formData);
  const accommodationId = formData.get("accommodationId")?.toString();
  const guestName = formData.get("guestName")?.toString().trim() ?? "";
  const guestEmail = formData.get("guestEmail")?.toString().trim() ?? "";
  const guestPhone = formData.get("guestPhone")?.toString().trim() ?? "";
  const message = formData.get("message")?.toString().trim() ?? "";
  const guests = Number.parseInt(formData.get("guests")?.toString() ?? "", 10);
  const rooms = Number.parseInt(formData.get("rooms")?.toString() ?? "", 10);
  const checkInDate = normalizeDate(formData.get("checkInDate")?.toString() ?? "");
  const checkOutDate = normalizeDate(formData.get("checkOutDate")?.toString() ?? "");

  if (!accommodationId) {
    redirect(appendQueryFlag(redirectPath, "error", "missing_stay"));
  }

  if (guestName.length < 2) {
    redirect(appendQueryFlag(redirectPath, "error", "guest_name_too_short"));
  }

  if (!guestEmail.includes("@")) {
    redirect(appendQueryFlag(redirectPath, "error", "invalid_email"));
  }

  if (!checkInDate || !checkOutDate) {
    redirect(appendQueryFlag(redirectPath, "error", "invalid_dates"));
  }

  if (checkOutDate <= checkInDate) {
    redirect(appendQueryFlag(redirectPath, "error", "checkout_before_checkin"));
  }

  const safeGuests = Number.isNaN(guests) || guests < 1 ? 1 : guests;
  const safeRooms = Number.isNaN(rooms) || rooms < 1 ? null : rooms;

  const accommodation = await prisma.accommodation.findUnique({
    where: { id: accommodationId },
    select: { id: true, slug: true, isActive: true },
  });

  if (!accommodation || !accommodation.isActive) {
    redirect(appendQueryFlag(redirectPath, "error", "stay_not_found"));
  }

  const user = await getCurrentAppUser();

  await createAccommodationBookingRequestRecord({
    accommodationId: accommodation.id,
    userId: user?.id ?? null,
    guestName,
    guestEmail,
    guestPhone: guestPhone || null,
    checkInDate,
    checkOutDate,
    guests: safeGuests,
    rooms: safeRooms,
    message: message || null,
    status: "PENDING",
  });

  revalidatePath("/stays");
  revalidatePath(`/stays/${accommodation.slug}`);
  revalidatePath("/vendor/orders");
  redirect(appendQueryFlag(`/stays/${accommodation.slug}`, "requested"));
}
