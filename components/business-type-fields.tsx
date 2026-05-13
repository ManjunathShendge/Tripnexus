"use client";

import { useState } from "react";
import type { AccommodationType, BusinessType, TransportType } from "@prisma/client";
import {
  ACCOMMODATION_TYPE_LABELS,
  BUSINESS_TYPE_LABELS,
  TRANSPORT_TYPE_LABELS,
} from "@/lib/business";

type BusinessTypeFieldsProps = {
  states: string[];
};

const BUSINESS_TYPES = Object.keys(BUSINESS_TYPE_LABELS) as BusinessType[];
const TRANSPORT_TYPES = Object.keys(TRANSPORT_TYPE_LABELS) as TransportType[];
const ACCOMMODATION_TYPES = Object.keys(ACCOMMODATION_TYPE_LABELS) as AccommodationType[];

export function BusinessTypeFields({ states }: BusinessTypeFieldsProps) {
  const [businessType, setBusinessType] = useState<BusinessType>("FOOD_AND_DINING");

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Choose your business type</h2>
        <p className="mt-1 text-sm text-slate-600">
          Each partner type gets a different registration path and dashboard.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {BUSINESS_TYPES.map((type) => (
          <label
            key={type}
            className={`cursor-pointer rounded-2xl border p-4 transition ${
              businessType === type
                ? "border-cyan-300 bg-cyan-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="businessType"
              value={type}
              checked={businessType === type}
              onChange={() => setBusinessType(type)}
              className="sr-only"
            />
            <p className="font-semibold text-slate-900">{BUSINESS_TYPE_LABELS[type]}</p>
            <p className="mt-1 text-xs text-slate-500">
              {type === "FOOD_AND_DINING" && "Restaurants, cafes, bakeries, and food counters"}
              {type === "TRANSPORT_OPERATOR" && "Driver-led transport, cabs, airport pickup, shuttle, or rentals"}
              {type === "HOSPITALITY_STAY" && "Hotels, lodges, hostels, resorts, and homestays"}
              {type === "TOUR_GUIDE" && "Licensed guides, local experts, and city walk operators"}
              {type === "ATTRACTION_OPERATOR" && "Museums, parks, ticketed attractions, and venue operators"}
              {type === "LOCAL_EXPERIENCE" && "Workshops, boat rides, food trails, and local activities"}
            </p>
          </label>
        ))}
      </div>

      {businessType === "FOOD_AND_DINING" ? (
        <div className="space-y-3 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
          <p className="text-sm font-semibold text-orange-900">Food business setup</p>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input type="checkbox" name="createRestaurant" defaultChecked />
            Add first restaurant now
          </label>
          <input name="restaurantName" placeholder="Restaurant name" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input name="restaurantCuisine" placeholder="Cuisine tags, comma separated" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input type="checkbox" name="createStarterMenu" defaultChecked />
            Auto-create starter menu items
          </label>
          <input name="restaurantAddress" placeholder="Restaurant address" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="restaurantCity" placeholder="City" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <select name="restaurantState" defaultValue="" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Select state</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="restaurantLatitude" type="number" step="0.0001" placeholder="Latitude" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input name="restaurantLongitude" type="number" step="0.0001" placeholder="Longitude" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="restaurantEmail" type="email" placeholder="Restaurant email" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input name="restaurantPhone" placeholder="Restaurant phone" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>
      ) : null}

      {businessType === "TRANSPORT_OPERATOR" ? (
        <div className="space-y-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
          <p className="text-sm font-semibold text-sky-900">Transport operator setup</p>
          <input name="transportName" placeholder="Service name" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <select name="transportType" defaultValue="PRIVATE_CAB" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {TRANSPORT_TYPES.map((type) => (
              <option key={type} value={type}>
                {TRANSPORT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <input name="transportServiceArea" placeholder="Service area (e.g. Airport to city center)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input name="transportPricingNotes" placeholder="Pricing notes" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input name="transportHours" placeholder="Hours (e.g. 24x7)" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="transportCity" placeholder="City" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <select name="transportState" defaultValue="" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Select state</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="transportPhone" placeholder="Contact phone" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input name="transportWebsite" placeholder="Website or WhatsApp link" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
        </div>
      ) : null}

      {businessType === "HOSPITALITY_STAY" ? (
        <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
          <p className="text-sm font-semibold text-emerald-900">Stay / hospitality setup</p>
          <input name="accommodationName" placeholder="Hotel or lodge name" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <select name="accommodationType" defaultValue="HOTEL" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
            {ACCOMMODATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {ACCOMMODATION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <textarea name="accommodationDescription" rows={3} placeholder="Property description" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input name="accommodationAddress" placeholder="Property address" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="accommodationCity" placeholder="City" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <select name="accommodationState" defaultValue="" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Select state</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="pricePerNight" type="number" step="0.01" placeholder="Price per night" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input name="roomCount" type="number" placeholder="Room count" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <input name="accommodationAmenities" placeholder="Amenities, comma separated" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>
      ) : null}

      {businessType === "TOUR_GUIDE" ? (
        <div className="space-y-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
          <p className="text-sm font-semibold text-violet-900">Guide service setup</p>
          <input name="guideServiceName" placeholder="Guide service or personal brand" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <textarea name="guideDescription" rows={3} placeholder="What kind of tours or help do you offer?" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input name="guideLanguages" placeholder="Languages, comma separated" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input name="guideSpecialties" placeholder="Specialties, comma separated" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="guideCity" placeholder="City" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <select name="guideState" defaultValue="" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Select state</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="guideYearsExperience" type="number" placeholder="Years of experience" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input name="guideHourlyRate" type="number" step="0.01" placeholder="Hourly rate" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <input name="guideFullDayRate" type="number" step="0.01" placeholder="Full day rate" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <input type="checkbox" name="guideIsLicensed" />
            I am a licensed or certified guide
          </label>
        </div>
      ) : null}

      {businessType === "ATTRACTION_OPERATOR" || businessType === "LOCAL_EXPERIENCE" ? (
        <div className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
          <p className="text-sm font-semibold text-amber-900">Place / experience setup</p>
          <input name="placeName" placeholder="Place or experience name" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <textarea name="placeDescription" rows={3} placeholder="Describe the place or experience" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input name="placeAddress" placeholder="Address" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="placeCity" placeholder="City" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
            <select name="placeState" defaultValue="" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <option value="">Select state</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <input name="placeTags" placeholder="Tags, comma separated" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input name="placeVisitTime" placeholder="Estimated visit time" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
        </div>
      ) : null}
    </section>
  );
}
