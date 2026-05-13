import { prisma } from "@/lib/prisma";

export const OPEN_BOOKING_REQUEST_STATUSES = ["PENDING", "CONTACTED", "CONFIRMED"] as const;

type BookingStatus = (typeof OPEN_BOOKING_REQUEST_STATUSES)[number] | "CANCELLED";

type CreateAccommodationBookingRequestInput = {
  accommodationId: string;
  userId: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  checkInDate: Date;
  checkOutDate: Date;
  guests: number;
  rooms: number | null;
  message: string | null;
  status?: BookingStatus;
};

export type VendorAccommodationBookingRequest = {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  checkInDate: Date | string;
  checkOutDate: Date | string;
  guests: number;
  rooms: number | null;
  message: string | null;
  status: string;
  createdAt: Date | string;
  accommodation: {
    name: string;
  };
};

function getAccommodationBookingRequestDelegate() {
  const candidate = (prisma as unknown as {
    accommodationBookingRequest?: {
      count?: (args: unknown) => Promise<number>;
      create?: (args: unknown) => Promise<unknown>;
      findMany?: (args: unknown) => Promise<VendorAccommodationBookingRequest[]>;
    };
  }).accommodationBookingRequest;

  return candidate ?? null;
}

export async function countOpenAccommodationBookingRequests(accommodationId: string) {
  const delegate = getAccommodationBookingRequestDelegate();

  if (delegate?.count) {
    return delegate.count({
      where: {
        accommodationId,
        status: {
          in: [...OPEN_BOOKING_REQUEST_STATUSES],
        },
      },
    });
  }

  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*) as count
    FROM "AccommodationBookingRequest"
    WHERE "accommodationId" = ${accommodationId}
      AND "status" IN (${OPEN_BOOKING_REQUEST_STATUSES[0]}, ${OPEN_BOOKING_REQUEST_STATUSES[1]}, ${OPEN_BOOKING_REQUEST_STATUSES[2]})
  `;

  return rows[0]?.count ?? 0;
}

export async function createAccommodationBookingRequestRecord(
  input: CreateAccommodationBookingRequestInput,
) {
  const delegate = getAccommodationBookingRequestDelegate();
  const status = input.status ?? "PENDING";

  if (delegate?.create) {
    return delegate.create({
      data: {
        ...input,
        status,
      },
    });
  }

  return prisma.$executeRaw`
    INSERT INTO "AccommodationBookingRequest" (
      "id",
      "accommodationId",
      "userId",
      "guestName",
      "guestEmail",
      "guestPhone",
      "checkInDate",
      "checkOutDate",
      "guests",
      "rooms",
      "message",
      "status",
      "createdAt",
      "updatedAt"
    ) VALUES (
      ${crypto.randomUUID()},
      ${input.accommodationId},
      ${input.userId},
      ${input.guestName},
      ${input.guestEmail},
      ${input.guestPhone},
      ${input.checkInDate},
      ${input.checkOutDate},
      ${input.guests},
      ${input.rooms},
      ${input.message},
      ${status},
      ${new Date()},
      ${new Date()}
    )
  `;
}

export async function findVendorAccommodationBookingRequests(vendorId: string, take = 12) {
  const delegate = getAccommodationBookingRequestDelegate();

  if (delegate?.findMany) {
    return delegate.findMany({
      where: {
        accommodation: {
          vendorId,
        },
      },
      include: {
        accommodation: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
    });
  }

  const rows = await prisma.$queryRaw<
    Array<
      Omit<VendorAccommodationBookingRequest, "accommodation"> & {
        accommodationName: string;
      }
    >
  >`
    SELECT
      abr."id",
      abr."guestName",
      abr."guestEmail",
      abr."guestPhone",
      abr."checkInDate",
      abr."checkOutDate",
      abr."guests",
      abr."rooms",
      abr."message",
      abr."status",
      abr."createdAt",
      a."name" as accommodationName
    FROM "AccommodationBookingRequest" abr
    INNER JOIN "Accommodation" a ON a."id" = abr."accommodationId"
    WHERE a."vendorId" = ${vendorId}
    ORDER BY abr."createdAt" DESC
    LIMIT ${take}
  `;

  return rows.map(({ accommodationName, ...row }) => ({
    ...row,
    accommodation: {
      name: accommodationName,
    },
  }));
}
