"use client";

import React from "react";
import { MapPin } from "lucide-react";

interface OrderDeliveryAddressCardProps {
  recipientName?: string;
  phone?: string;
  address?: string;
  instruction?: string;
}

export function OrderDeliveryAddressCard({
  recipientName,
  phone,
  address,
  instruction,
}: OrderDeliveryAddressCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-xs">
      <h3 className="mb-3 text-sm sm:text-base text-[var(--text-primary)] font-normal pb-2 border-b border-[var(--border-light)]">
        Delivery Destination
      </h3>

      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)] mt-0.5">
          <MapPin className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0 space-y-0.5 text-xs sm:text-sm">
          <p className="font-normal text-[var(--text-primary)]">
            {recipientName || "Delivery Recipient"}
            {phone ? (
              <span className="font-normal text-[var(--text-secondary)]"> • {phone}</span>
            ) : null}
          </p>
          <p className="font-normal text-[var(--text-secondary)]">
            {address || "Saved Delivery Address"}
          </p>
          {instruction && (
            <p className="pt-1 text-xs text-[var(--primary)] font-normal">
              <span className="text-[var(--text-secondary)]">Note for rider:</span> {instruction}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
