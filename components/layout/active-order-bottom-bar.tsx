"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAtom, useAtomValue } from "jotai";
import {
  Bike,
  Clock,
  ChevronRight,
  X,
  PackageCheck,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  activeOrderAtom,
  isBottomTrackerVisibleAtom,
} from "@/stores/order-atom";
import { useOrderTrackingSummaryQuery } from "@/queries/order/use-order-queries";
import { formatCurrency } from "@/lib/utils";

export function ActiveOrderBottomBar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const activeOrder = useAtomValue(activeOrderAtom);
  const [isVisible, setIsVisible] = useAtom(isBottomTrackerVisibleAtom);

  useEffect(() => {
    setMounted(true);
  }, []);

  const orderId = activeOrder?.orderId;
  const { data: trackingSummary } = useOrderTrackingSummaryQuery(orderId);

  if (!mounted || !activeOrder || !isVisible) {
    return null;
  }

  // Do not show the small floating bottom bar if the user is already on the full checkout success screen
  if (pathname === "/checkout") {
    return null;
  }

  const liveStatus = (
    trackingSummary?.status ||
    activeOrder.status ||
    "CONFIRMED"
  ).toUpperCase();

  // If delivered or cancelled, don't show the active live banner
  if (liveStatus === "DELIVERED" || liveStatus === "CANCELLED") {
    return null;
  }

  const assignedPartner = trackingSummary?.assignedPartner || activeOrder.rider;
  const partnerName = assignedPartner?.name
    ? assignedPartner.name.split(" ")[0]
    : null;

  const etaMinutes =
    trackingSummary?.orderTiming?.estimatedMinutesRemaining ??
    activeOrder.etaMinutes ??
    15;

  const orderNumber = activeOrder.orderNumber || activeOrder.orderId;
  const itemCount =
    activeOrder.items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 1;

  // Milestone headline
  let statusHeadline = "Order Placed & Confirmed";
  let statusSub = "Store is preparing your fresh order";

  if (liveStatus === "PROCESSING" || liveStatus === "PACKED") {
    statusHeadline = "Packing Your Order";
    statusSub = "Dark store is sanitizing and packing items";
  } else if (liveStatus === "REACHED_GATE") {
    statusHeadline = partnerName
      ? `${partnerName} has arrived at your gate`
      : "Rider has arrived at gate";
    statusSub = "Check email for delivery OTP code";
  } else if (
    liveStatus === "OUT_FOR_DELIVERY" ||
    liveStatus === "IN_TRANSIT" ||
    liveStatus === "ON_THE_WAY" ||
    liveStatus === "PICKED_UP"
  ) {
    statusHeadline = partnerName
      ? `${partnerName} is on the way`
      : "Out for Instant Delivery";
    statusSub = `Arriving at your doorstep in ~${etaMinutes} mins`;
  }

  return (
    <aside
      aria-label="Active order status"
      className="fixed bottom-3 left-3 right-3 sm:left-6 sm:right-6 md:left-auto md:right-8 md:max-w-xl md:w-full z-40 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-2xl p-3.5 sm:p-4 text-zinc-900 dark:text-zinc-100">
        {/* Animated Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 animate-pulse" />

        <div className="flex items-center justify-between gap-3">
          {/* Left: Icon & Live Pulse */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#18A818] border border-emerald-200/50 dark:border-emerald-800/40">
              {liveStatus === "OUT_FOR_DELIVERY" ||
              liveStatus === "IN_TRANSIT" ? (
                <Bike className="h-5 w-5 animate-bounce" />
              ) : (
                <PackageCheck className="h-5 w-5" />
              )}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  Live Order • {orderNumber.slice(-8)}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <Clock className="h-3 w-3" />
                  <span>~{etaMinutes} mins</span>
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold truncate mt-0.5 text-zinc-900 dark:text-zinc-100">
                {statusHeadline}
              </h4>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {statusSub}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/checkout"
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-[#18A818] hover:bg-[#148F14] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <span>Track Live</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setIsVisible(false)}
              aria-label="Dismiss active order tracker"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Hide tracker"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

