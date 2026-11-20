"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  MapPin,
  Crosshair,
} from "lucide-react";
import { getAccuracyInfo, AccuracyInfo, LocationSource } from "@/types/location";

interface AccuracyIndicatorProps {
  accuracyMeters?: number | null;
  locationSource?: LocationSource;
  className?: string;
  compact?: boolean;
}

export function AccuracyIndicator({
  accuracyMeters,
  locationSource,
  className = "",
  compact = false,
}: AccuracyIndicatorProps) {
  const info: AccuracyInfo = getAccuracyInfo(accuracyMeters);

  const getIcon = () => {
    switch (info.level) {
      case "high":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case "moderate":
        return <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />;
      case "approximate":
        return <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />;
      case "low":
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />;
    }
  };

  const getSourceBadge = () => {
    switch (locationSource) {
      case "browser_gps":
        return "Hardware GPS Lock";
      case "browser_approximate":
        return "Network / Wi-Fi Triangulation";
      case "manual_pin":
        return "Manual Pin Placed";
      case "place_search":
        return "Searched Place / Address";
      case "saved_address":
        return "Saved Address Profile";
      default:
        return "Detected Location";
    }
  };

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${info.badgeClass} ${className}`}
      >
        <Crosshair className="h-3 w-3" />
        <span>±{info.accuracyMeters}m</span>
        <span className="opacity-60">•</span>
        <span>{info.label}</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${info.badgeClass} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight">
                {info.label} (±{info.accuracyMeters} meters)
              </span>
            </div>
            {locationSource && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/70 dark:bg-black/30 border border-current/20">
                <MapPin className="h-2.5 w-2.5" />
                {getSourceBadge()}
              </span>
            )}
          </div>

          <p className="text-xs mt-1 leading-relaxed opacity-90">
            {info.description}
          </p>

          <p className="text-[11px] mt-1.5 font-medium flex items-center gap-1">
            <span className="font-semibold">Note:</span> {info.recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}
