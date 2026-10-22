import React from "react";
import { apiClient } from "@/lib/api/api-client";
import { MapPin, Clock, AlertCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Serviceable Delivery Areas - Express Grocery Delivery Locations",
  description:
    "Check all neighborhood delivery locations served by Tiding in Bengaluru and Ahmedabad.",
};

interface ServiceAreaItem {
  id?: string;
  area: string;
  city: string;
  pincode: string;
  eta?: number;
  is_active?: boolean;
}

export default async function DeliveryAreasPage() {
  let areas: ServiceAreaItem[] = [];
  try {
    const res = await apiClient.get<ServiceAreaItem[]>("/service-areas");
    if (Array.isArray(res)) {
      areas = res;
    }
  } catch {
    areas = [];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
      <div className="border-b border-[var(--border)] pb-6 text-center space-y-2">
        <span className="rounded-full bg-[#18A818]/15 px-3 py-1 text-xs font-bold text-[#18A818]">
          ⚡ Express Hubs
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
          Serviceable Delivery Localities
        </h1>
        <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
          We deliver fresh groceries, milk, fruits, and vegetables from local dark stores directly to your doorstep.
        </p>
      </div>

      {areas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {areas.map((loc, idx) => (
            <div
              key={loc.id || `${loc.area}-${idx}`}
              className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 shadow-xs hover:border-[#18A818] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#18A818]/15 text-[#18A818]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">{loc.area}</h2>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {loc.city} • PIN: {loc.pincode}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--border-light)] pt-3 text-xs">
                <span className="flex items-center gap-1 font-bold text-[#18A818]">
                  <Clock className="h-3.5 w-3.5" />
                  ⚡ {loc.eta || 10} Mins Delivery
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                  Active Hub
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
          <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Service Areas Being Updated
          </h2>
          <p className="text-xs text-[var(--text-muted)] max-w-sm">
            Please select your location on the top bar or use auto-detect GPS to view delivery service in your locality.
          </p>
        </div>
      )}
    </div>
  );
}
