import type { AccommodationType, BusinessType, TransportType } from "@prisma/client";

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  FOOD_AND_DINING: "Food and Dining",
  TRANSPORT_OPERATOR: "Transport Operator",
  HOSPITALITY_STAY: "Hotel / Lodge / Stay",
  TOUR_GUIDE: "Tour Guide",
  ATTRACTION_OPERATOR: "Attraction Operator",
  LOCAL_EXPERIENCE: "Local Experience",
};

export const TRANSPORT_TYPE_LABELS: Record<TransportType, string> = {
  PRIVATE_CAB: "Private Cab",
  PUBLIC_BUS: "Public Bus",
  METRO: "Metro",
  TRAIN: "Train",
  AUTO_RICKSHAW: "Auto Rickshaw",
  AIRPORT_TRANSFER: "Airport Transfer",
  FERRY: "Ferry",
  BIKE_RENTAL: "Bike Rental",
};

export const ACCOMMODATION_TYPE_LABELS: Record<AccommodationType, string> = {
  HOTEL: "Hotel",
  LODGE: "Lodge",
  RESORT: "Resort",
  HOMESTAY: "Homestay",
  HOSTEL: "Hostel",
  APARTMENT_STAY: "Apartment Stay",
};

export function splitCommaList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
