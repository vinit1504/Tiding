"use client";

import React from "react";
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Home,
} from "lucide-react";

interface OrderStatusTimelineProps {
  status?: string;
  dateString: string;
}

const STEPS = [
  { id: "placed", title: "Placed", icon: CheckCircle2 },
  { id: "confirmed", title: "Confirmed", icon: CheckCircle2 },
  { id: "packed", title: "Packed", icon: Package },
  { id: "out", title: "Out for Delivery", icon: Truck },
  { id: "delivered", title: "Delivered", icon: Home },
] as const;

export function OrderStatusTimeline({
  status,
  dateString,
}: OrderStatusTimelineProps) {
  const statusUpper = (status || "CONFIRMED").toUpperCase();

  const currentStepIndex =
    statusUpper === "DELIVERED"
      ? 4
      : statusUpper === "OUT_FOR_DELIVERY"
      ? 3
      : statusUpper === "PROCESSING" || statusUpper === "PACKED"
      ? 2
      : statusUpper === "CONFIRMED"
      ? 1
      : 0; // PENDING / PLACED

  const progressPercentage = (currentStepIndex / (STEPS.length - 1)) * 100;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-gray-900">
            Order Status Tracking
          </h4>
        </div>
        <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
          {dateString}
        </span>
      </div>

      {/* Stepper Progress Bar */}
      <div className="relative px-2 sm:px-4">
        {/* Background track line */}
        <div className="absolute top-4 left-6 right-6 h-1 -translate-y-1/2 bg-gray-100 z-0 rounded-full" />
        
        {/* Active progress track line */}
        <div
          className="absolute top-4 left-6 h-1 -translate-y-1/2 bg-emerald-500 z-0 rounded-full transition-all duration-500 ease-out"
          style={{ width: `calc(${progressPercentage}% - 24px)` }}
        />

        {/* Steps */}
        <div className="relative z-10 flex items-start justify-between">
          {STEPS.map((step, idx) => {
            const isPassed = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const Icon = step.icon;

            return (
              <div
                key={step.id}
                className="flex flex-col items-center gap-2 text-center group flex-1"
              >
                {/* Step Circle Badge */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100 scale-105"
                      : isPassed
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-gray-100 text-gray-400 border border-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>

                {/* Step Title */}
                <span
                  className={`text-[10px] sm:text-[11px] font-medium transition-colors max-w-[70px] sm:max-w-none leading-tight ${
                    isCurrent
                      ? "text-emerald-700 font-bold"
                      : isPassed
                      ? "text-gray-900 font-semibold"
                      : "text-gray-400"
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

