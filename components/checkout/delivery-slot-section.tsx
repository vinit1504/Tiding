"use client";

import React, { useState } from "react";
import { Clock, Zap, Calendar, CheckCircle2 } from "lucide-react";

interface DeliverySlotSectionProps {
  selectedDay: "today" | "tomorrow";
  onSelectDay: (day: "today" | "tomorrow") => void;
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
}

const SLOTS = [
  { id: "instant", label: "⚡ Instant (15–20 mins)", isExpress: true },
  { id: "10-12", label: "10 AM – 12 PM", isExpress: false },
  { id: "12-14", label: "12 PM – 2 PM", isExpress: false },
  { id: "14-16", label: "2 PM – 4 PM", isExpress: false },
  { id: "16-18", label: "4 PM – 6 PM", isExpress: false },
  { id: "18-20", label: "6 PM – 8 PM", isExpress: false },
];

export function DeliverySlotSection({
  selectedDay,
  onSelectDay,
  selectedSlot,
  onSelectSlot,
}: DeliverySlotSectionProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Clock className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">
            3. Delivery Date & Time Slot
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Choose when you would like your order delivered
          </p>
        </div>
      </div>

      {/* Date Switcher */}
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={() => onSelectDay("today")}
          className={`flex-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedDay === "today"
              ? "border-emerald-600 bg-emerald-50/50 shadow-2xs"
              : "border-[var(--border)] bg-white hover:bg-[var(--surface-secondary)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[var(--text-primary)]">
              Today
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Available
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            Instant or Scheduled
          </p>
        </button>

        <button
          type="button"
          onClick={() => onSelectDay("tomorrow")}
          className={`flex-1 p-3 rounded-xl border text-left transition-all cursor-pointer ${
            selectedDay === "tomorrow"
              ? "border-emerald-600 bg-emerald-50/50 shadow-2xs"
              : "border-[var(--border)] bg-white hover:bg-[var(--surface-secondary)]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[var(--text-primary)]">
              Tomorrow
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Available
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            Morning & Afternoon Slots
          </p>
        </button>
      </div>

      {/* Slot Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {SLOTS.map(({ id, label, isExpress }) => {
          // If tomorrow is selected, disable "instant"
          const disabled = selectedDay === "tomorrow" && isExpress;
          const isSelected = selectedSlot === id && !disabled;

          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectSlot(id)}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                disabled
                  ? "border-[var(--border)] bg-gray-50 text-gray-400 opacity-50 cursor-not-allowed"
                  : isSelected
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-2xs"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-emerald-200 hover:bg-[var(--surface-secondary)]"
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                {isExpress ? (
                  <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                ) : (
                  <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                )}
                <span className="truncate">{label}</span>
              </div>
              {isSelected && (
                <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-600 text-white shrink-0 ml-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
