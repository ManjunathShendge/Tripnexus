"use client";

import { useMemo, useState } from "react";
import { CUISINE_LIBRARY } from "@/lib/cuisine-catalog";

type CuisineSelectorProps = {
  inputName?: string;
};

export function CuisineSelector({ inputName = "restaurantCuisine" }: CuisineSelectorProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [customCuisine, setCustomCuisine] = useState("");

  const allCuisines = useMemo(
    () => CUISINE_LIBRARY.flatMap((region) => region.cuisines.map((cuisine) => cuisine.name)),
    [],
  );

  function toggleCuisine(cuisineName: string) {
    setSelected((prev) =>
      prev.includes(cuisineName)
        ? prev.filter((item) => item !== cuisineName)
        : [...prev, cuisineName],
    );
  }

  function addCustomCuisine() {
    const value = customCuisine.trim();
    if (!value) return;
    if (!selected.includes(value)) {
      setSelected((prev) => [...prev, value]);
    }
    setCustomCuisine("");
  }

  function removeCuisine(cuisineName: string) {
    setSelected((prev) => prev.filter((item) => item !== cuisineName));
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={inputName} value={selected.join(", ")} />

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-12">
        {selected.length === 0 ? (
          <span className="text-sm text-slate-500">Select cuisines below. They will be used for starter menu suggestions.</span>
        ) : (
          selected.map((cuisine) => (
            <button
              key={cuisine}
              type="button"
              onClick={() => removeCuisine(cuisine)}
              className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-medium text-orange-700 hover:bg-orange-50"
            >
              {cuisine} ×
            </button>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={customCuisine}
          onChange={(event) => setCustomCuisine(event.target.value)}
          placeholder="Add custom cuisine (e.g. Lebanese)"
          list="cuisine-options"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-200 focus:ring-2"
        />
        <button
          type="button"
          onClick={addCustomCuisine}
          className="rounded-xl border border-orange-200 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50"
        >
          Add
        </button>
        <datalist id="cuisine-options">
          {allCuisines.map((cuisine) => (
            <option key={cuisine} value={cuisine} />
          ))}
        </datalist>
      </div>

      <div className="max-h-72 space-y-3 overflow-auto rounded-xl border border-slate-200 bg-white p-3">
        {CUISINE_LIBRARY.map((region) => (
          <div key={region.region}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {region.region}
            </p>
            <div className="flex flex-wrap gap-2">
              {region.cuisines.map((cuisine) => {
                const active = selected.includes(cuisine.name);
                return (
                  <button
                    key={cuisine.name}
                    type="button"
                    onClick={() => toggleCuisine(cuisine.name)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      active
                        ? "bg-orange-600 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                    title={`Popular dishes: ${cuisine.signatureDishes.join(", ")}`}
                  >
                    {cuisine.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
