"use client";

import React from "react";
import { MapPin, Edit3 } from "lucide-react";
import {
  PaymentMethodSection,
  PaymentOption,
} from "@/components/checkout/payment-method-section";
import { AddressCardData } from "@/components/checkout/delivery-address-section";

interface PaymentStepProps {
  selectedAddress: AddressCardData | null;
  selectedInstruction: string;
  customNotes: string;
  paymentMethod: PaymentOption;
  onSelectPaymentMethod: (method: PaymentOption) => void;
  onBackToDelivery?: () => void;
  onPlaceOrder?: () => void;
  isProcessing?: boolean;
  isVerifying?: boolean;
  grandTotal?: number;
}

export function PaymentStep({
  selectedAddress,
  selectedInstruction,
  customNotes,
  paymentMethod,
  onSelectPaymentMethod,
  onBackToDelivery,
}: PaymentStepProps) {
  return (
    <div className="space-y-4">
      {/* Address Confirmation Summary Banner */}
      {selectedAddress && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-light)]">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--primary-light)] text-[var(--primary)]">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs text-[var(--text-primary)]">
                Delivering To
              </span>
              <span className="rounded bg-[var(--surface-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--text-primary)] uppercase">
                {selectedAddress.type}
              </span>
            </div>

            {onBackToDelivery && (
              <button
                type="button"
                onClick={onBackToDelivery}
                className="inline-flex items-center gap-1 text-xs text-[var(--primary)] hover:underline cursor-pointer"
              >
                <Edit3 className="h-3 w-3" />
                <span>Change</span>
              </button>
            )}
          </div>

          <div className="text-xs text-[var(--text-secondary)] space-y-0.5">
            <p className="text-[var(--text-primary)]">
              {selectedAddress.recipientName} {selectedAddress.phone}
            </p>
            <p>
              {selectedAddress.addressLine1}
              {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ""}
              {selectedAddress.landmark ? `, Near ${selectedAddress.landmark}` : ""}
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {selectedAddress.city}, {selectedAddress.state} {selectedAddress.pincode}
            </p>
            {(selectedInstruction || customNotes) && (
              <p className="text-[11px] text-[var(--text-primary)] pt-1">
                <span className="text-[var(--text-secondary)]">Drop note:</span>{" "}
                {selectedInstruction}
                {customNotes ? ` (${customNotes})` : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Payment Options Section */}
      <PaymentMethodSection
        selectedMethod={paymentMethod}
        onSelectMethod={onSelectPaymentMethod}
      />
    </div>
  );
}