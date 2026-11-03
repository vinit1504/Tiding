"use client";

import React from "react";
import { Bike, Check, Star, ShieldCheck, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeliveryPartnerCardProps {
  rider: {
    name: string;
    rating: number;
    vehicle: string;
    phone?: string;
  };
}

export function DeliveryPartnerCard({ rider }: DeliveryPartnerCardProps) {
  const handleCallRider = () => {
    if (rider.phone) {
      window.location.href = `tel:${rider.phone}`;
      return;
    }
    toast.info(`Connecting you to ${rider.name}...`);
  };

  const handleChatRider = () => {
    toast.info(`Chat with ${rider.name.split(" ")[0]} will open shortly`);
  };

  return (
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="relative flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20 shadow-2xs">
          <Bike className="h-6 w-6" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[var(--primary)] text-white ring-2 ring-white">
            <Check className="h-2.5 w-2.5 stroke-[3]" />
          </span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm sm:text-base text-[var(--text-primary)] font-bold">
              {rider.name}
            </h3>
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800 ring-1 ring-amber-200">
              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
              <span>{rider.rating}</span>
            </span>
          </div>

          <p className="truncate text-xs text-[var(--text-secondary)]">
            {rider.vehicle}
          </p>

          <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--primary)]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Contactless delivery • Temperature checked</span>
          </p>
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleChatRider}
          className="h-10 flex-1 cursor-pointer gap-2 rounded-xl border-[var(--border)] text-xs text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] sm:flex-none"
        >
          <MessageCircle className="h-4 w-4 text-[var(--primary)]" />
          <span>Chat</span>
        </Button>

        <Button
          type="button"
          onClick={handleCallRider}
          className="h-10 flex-1 cursor-pointer gap-2 rounded-xl bg-[var(--primary)] text-xs text-white hover:bg-[var(--primary-hover)] sm:flex-none"
        >
          <Phone className="h-4 w-4" />
          <span>Call</span>
        </Button>
      </div>
    </div>
  );
}
