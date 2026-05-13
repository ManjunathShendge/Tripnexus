"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type NearbyLocatorProps = {
  clearSortValue?: string;
  locationSortValue?: string;
};

export function NearbyLocator({
  clearSortValue,
  locationSortValue = "nearby",
}: NearbyLocatorProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateParams(latitude?: number, longitude?: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (typeof latitude === "number" && typeof longitude === "number") {
      params.set("lat", latitude.toFixed(6));
      params.set("lng", longitude.toFixed(6));
      params.set("sort", locationSortValue);
    } else {
      params.delete("lat");
      params.delete("lng");
      if (params.get("sort") === "nearby") {
        if (clearSortValue) {
          params.set("sort", clearSortValue);
        } else {
          params.delete("sort");
        }
      }
    }

    router.push(`${pathname}?${params.toString()}`);
  }

  function handleEnableLocation() {
    setError("");
    setLoading(true);

    if (!navigator.geolocation) {
      setLoading(false);
      setError("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        updateParams(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setLoading(false);
        setError("Location permission denied. You can still filter by state.");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    );
  }

  const hasLocation = Boolean(searchParams.get("lat") && searchParams.get("lng"));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleEnableLocation}
        disabled={loading}
        className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-50 disabled:opacity-60"
      >
        {loading ? "Finding location..." : hasLocation ? "Refresh my location" : "Use my location"}
      </button>
      {hasLocation ? (
        <button
          type="button"
          onClick={() => updateParams()}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Clear distance mode
        </button>
      ) : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
