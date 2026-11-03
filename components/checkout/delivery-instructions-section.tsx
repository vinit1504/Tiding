"use client";

import React from "react";
import { MessageSquare, PhoneCall, BellOff, DoorClosed, Handshake } from "lucide-react";

interface DeliveryInstructionsSectionProps {
  selectedInstruction: string;
  onSelectInstruction: (instruction: string) => void;
  customNotes: string;
  onChangeCustomNotes: (notes: string) => void;
}

const INSTRUCTION_OPTIONS = [
  { id: "Leave at door", label: "Leave at the door", icon: DoorClosed },
  { id: "Call before delivery", label: "Call before delivery", icon: PhoneCall },
  { id: "Hand it to me", label: "Hand it to me", icon: Handshake },
  { id: "Don't ring bell", label: "Don't ring bell", icon: BellOff },
];

export function DeliveryInstructionsSection({
  selectedInstruction,
  onSelectInstruction,
  customNotes,
  onChangeCustomNotes,
}: DeliveryInstructionsSectionProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs space-y-3.5">
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-light)]">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base text-[var(--text-primary)]">
            Delivery Instructions
          </h2>
          <p className="text-[11px] text-[var(--text-secondary)]">
            Guide our delivery partner for seamless drop-off
          </p>
        </div>
      </div>

      {/* Selectable Quick Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {INSTRUCTION_OPTIONS.map(({ id, label, icon: Icon }) => {
          const isSelected = selectedInstruction === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectInstruction(id)}
              className={`p-2.5 rounded-xl border text-xs flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                isSelected
                  ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--text-primary)] shadow-2xs"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]/40 hover:bg-[var(--surface-secondary)]"
              }`}
            >
              <Icon className={`h-4 w-4 ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`} />
              <span className="line-clamp-1">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Additional Instructions Input */}
      <div>
        <input
          type="text"
          value={customNotes}
          onChange={(e) => onChangeCustomNotes(e.target.value)}
          placeholder="Additional notes (e.g. Leave with security guard, gate code...)"
          className="w-full h-10 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:bg-white transition-all"
        />
      </div>
    </div>
  );
}