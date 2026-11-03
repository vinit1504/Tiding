"use client";

import React from "react";
import { Check, CheckCircle2, Store, UserCheck, Bike, Home } from "lucide-react";

interface OrderStatusTimelineProps {
  placedAt?: string;
  riderName: string;
  distanceKm: string;
  etaMins: number;
  currentStatus?: string; // "CONFIRMED" | "PROCESSING" | "OUT_FOR_DELIVERY" | "DELIVERED"
  timelineEvents?: Array<{
    status?: string;
    event_type?: string;
    notes?: string;
    created_at?: string;
  }>;
}

export function OrderStatusTimeline({
  placedAt,
  riderName,
  distanceKm,
  etaMins,
  currentStatus = "OUT_FOR_DELIVERY",
  timelineEvents = [],
}: OrderStatusTimelineProps) {
  // Normalize current milestone index: 0=PLACED, 1=PACKED, 2=ASSIGNED, 3=OUT_FOR_DELIVERY, 4=DELIVERED
  const statusUpper = (currentStatus || "OUT_FOR_DELIVERY").toUpperCase();
  const currentStepIndex =
    statusUpper === "DELIVERED"
      ? 4
      : statusUpper === "OUT_FOR_DELIVERY"
      ? 3
      : statusUpper === "ASSIGNED" || statusUpper === "PICKED_UP"
      ? 2
      : statusUpper === "PROCESSING" || statusUpper === "PACKED"
      ? 1
      : 0; // CONFIRMED / PLACED

  const getStepState = (idx: number) => {
    if (idx < currentStepIndex) return "completed" as const;
    if (idx === currentStepIndex) return "active" as const;
    return "upcoming" as const;
  };

  // Find matching event notes if available
  const findEventNote = (keys: string[]) => {
    const ev = timelineEvents.find((e) =>
      keys.includes((e.status || e.event_type || "").toUpperCase())
    );
    if (!ev) return null;
    const timeStr = ev.created_at
      ? new Date(ev.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";
    return ev.notes ? `${ev.notes}${timeStr ? ` • ${timeStr}` : ""}` : timeStr;
  };

  const steps = [
    {
      id: "placed",
      title: "Order placed",
      note: findEventNote(["CONFIRMED", "PLACED", "ORDER_PLACED"]) || placedAt || "Just now",
      status: getStepState(0),
      icon: CheckCircle2,
    },
    {
      id: "packed",
      title: "Packed at store",
      note: findEventNote(["PROCESSING", "PACKED", "IN_PROCESS"]) || "Quality checked and sealed",
      status: getStepState(1),
      icon: Store,
    },
    {
      id: "assigned",
      title: "Picked up by delivery partner",
      note: findEventNote(["ASSIGNED", "PICKED_UP"]) || `${riderName} has your order`,
      status: getStepState(2),
      icon: UserCheck,
    },
    {
      id: "out",
      title: "On the way",
      note: findEventNote(["OUT_FOR_DELIVERY"]) || `${distanceKm} km away`,
      status: getStepState(3),
      icon: Bike,
    },
    {
      id: "delivered",
      title: "Delivered",
      note: findEventNote(["DELIVERED"]) || (currentStepIndex === 4 ? "Delivered to your doorstep" : `Arriving in ~${etaMins} mins`),
      status: getStepState(4),
      icon: Home,
    },
  ];

  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-5 sm:p-6 shadow-xs transition-all">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Order Status
        </h3>
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-xs font-medium text-[var(--primary)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--primary)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--primary)]" />
          </span>
          <span>Live Tracking</span>
        </span>
      </div>

      {/* Timeline List */}
      <ol className="relative space-y-0">
        {steps.map((step, idx) => {
          const isCompleted = step.status === "completed";
          const isActive = step.status === "active";
          const isLast = idx === steps.length - 1;
          const Icon = step.icon;

          return (
            <li key={step.id} className="relative flex gap-4.5 pb-6 last:pb-0 group">
              {/* Vertical Connecting Line */}
              {!isLast && (
                <span
                  className={`absolute left-[17px] top-9 h-[calc(100%-1.5rem)] w-[2px] transition-colors duration-300 ${isCompleted
                      ? "bg-[var(--primary)]"
                      : "bg-zinc-200 dark:bg-zinc-800"
                    }`}
                  aria-hidden
                />
              )}

              {/* Step Node Icon Container */}
              <div
                className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${isCompleted
                    ? "bg-[var(--primary)] text-white shadow-sm shadow-[var(--primary)]/20"
                    : isActive
                      ? "bg-white dark:bg-zinc-900 text-[var(--primary)] ring-4 ring-[var(--primary)]/15 border-2 border-[var(--primary)] shadow-sm scale-105"
                      : "border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500"
                  }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4 stroke-[2.5]" />
                ) : (
                  <Icon className="h-4 w-4 stroke-[2]" />
                )}
              </div>

              {/* Step Content */}
              <div className="min-w-0 flex-1 pt-1">
                <p
                  className={`text-xs sm:text-sm transition-colors ${isCompleted || isActive
                      ? "text-zinc-900 dark:text-zinc-100 font-semibold"
                      : "text-zinc-400 dark:text-zinc-500 font-medium"
                    }`}
                >
                  {step.title}
                </p>
                <p
                  className={`text-xs mt-0.5 ${isActive
                      ? "text-[var(--primary)] font-semibold"
                      : "text-zinc-500 dark:text-zinc-400 font-normal"
                    }`}
                >
                  {step.note}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}