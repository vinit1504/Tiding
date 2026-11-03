"use client";

import React from "react";
import {
  MapPin,
  Home,
  Briefcase,
  Clock,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { useAtomValue, useSetAtom } from "jotai";
import { deliveryLocationAtom, isLocationModalOpenAtom } from "@/stores";
import { Button } from "@/components/ui/button";

interface DeliveryInfoBannerProps {
  className?: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  HOME: { label: "Home", icon: Home },
  WORK: { label: "Work", icon: Briefcase },
  OTHER: { label: "Other", icon: MapPin },
};

/** Join parts, skipping empty values and case-insensitive duplicates */
const joinUnique = (parts: Array<string | null | undefined>, sep = ", ") => {
  const seen = new Set<string>();
  return parts
    .map((p) => p?.trim())
    .filter((p): p is string => {
      if (!p) return false;
      const key = p.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(sep);
};

export function DeliveryInfoBanner({ className = "" }: DeliveryInfoBannerProps) {
  const location = useAtomValue(deliveryLocationAtom);
  const setIsLocationModalOpen = useSetAtom(isLocationModalOpenAtom);

  const typeKey = (location.addressType || "OTHER").toUpperCase();
  const type = TYPE_CONFIG[typeKey] ?? TYPE_CONFIG.OTHER;
  const TypeIcon = type.icon;

  const etaMinutes = location.deliveryEtaMinutes || 15;
  const isServiceable = location.isServiceable !== false;

  // Line 1: house / flat / society details
  const line1 = location.houseNo || location.society || "Current Location";

  // Line 2: area, city, state - pincode (duplicates removed)
  const areaCity = joinUnique([location.area, location.city, location.state]);
  const line2 = location.pincode ? `${areaCity} — ${location.pincode}` : areaCity;

  // Show landmark only if it isn't already inside houseNo
  const showLandmark =
    !!location.landmark &&
    !line1.toLowerCase().includes(location.landmark.toLowerCase());

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-xs transition-all ${className}`}
    >
      {/* Top: label + status */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 px-4 py-2.5">
        <span className="text-[11px] font-normal uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Delivering to
        </span>

        {isServiceable ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 px-2.5 py-0.5 text-[10px] font-normal text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            Serviceable
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 px-2.5 py-0.5 text-[10px] font-normal text-amber-700 dark:text-amber-300">
            Out of Area
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="flex min-w-0 items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--primary)]/20 bg-[var(--primary)]/10 text-[var(--primary)] shadow-2xs">
            <TypeIcon className="h-5 w-5" />
          </div>

          <div className="min-w-0 space-y-1 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-normal text-zinc-900 dark:text-zinc-100">
                {type.label}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-normal leading-snug text-zinc-900 dark:text-zinc-100 truncate">
              {line1}
            </p>
            <p className="text-xs font-normal leading-relaxed text-zinc-500 dark:text-zinc-400 truncate">
              {line2}
            </p>

            {showLandmark && (
              <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 pt-0.5 font-normal">
                <MapPin className="h-3 w-3 shrink-0 text-zinc-400" />
                <span>Landmark:</span>
                <span className="font-normal text-zinc-700 dark:text-zinc-300">{location.landmark}</span>
              </p>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsLocationModalOpen(true)}
          className="h-9 shrink-0 cursor-pointer gap-1 rounded-xl border-zinc-200 dark:border-zinc-700 bg-transparent px-3.5 text-xs font-normal text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all"
        >
          Change
          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
        </Button>
      </div>

      {/* Footer: ETA */}
      <div className="flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800 bg-[var(--primary)]/5 px-4 py-2.5 text-xs text-zinc-600 dark:text-zinc-300 font-normal">
        <Clock className="h-4 w-4 text-[var(--primary)]" />
        <span>
          Instant delivery in{" "}
          <span className="font-normal text-zinc-900 dark:text-zinc-100">
            {etaMinutes}–{etaMinutes + 5} mins
          </span>
        </span>
      </div>
    </div>
  );
}