"use client";

import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DeliveryAddressSection,
  AddressCardData,
} from "@/components/checkout/delivery-address-section";
import { DeliveryInstructionsSection } from "@/components/checkout/delivery-instructions-section";
import { toast } from "sonner";

interface DeliveryStepProps {
  selectedAddress: AddressCardData | null;
  onSelectAddress: (address: AddressCardData) => void;
  selectedInstruction: string;
  onSelectInstruction: (instruction: string) => void;
  customNotes: string;
  onChangeCustomNotes: (notes: string) => void;
  onBackToProducts: () => void;
  onProceedToPayment: () => void;
}

export function DeliveryStep({
  selectedAddress,
  onSelectAddress,
  selectedInstruction,
  onSelectInstruction,
  customNotes,
  onChangeCustomNotes,
  onBackToProducts,
  onProceedToPayment,
}: DeliveryStepProps) {
  const handleProceed = () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address before proceeding");
      return;
    }
    onProceedToPayment();
  };

  return (
    <div className="space-y-4">
      {/* Delivery Address Section */}
      <DeliveryAddressSection
        selectedAddressId={selectedAddress?.id || null}
        onSelectAddress={onSelectAddress}
      />

      {/* Delivery Instructions Section (No delivery date & time) */}
      <DeliveryInstructionsSection
        selectedInstruction={selectedInstruction}
        onSelectInstruction={onSelectInstruction}
        customNotes={customNotes}
        onChangeCustomNotes={onChangeCustomNotes}
      />

      {/* Navigation Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBackToProducts}
          className="w-full sm:w-auto h-11 px-5 border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] text-xs rounded-xl gap-2 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Product Details</span>
        </Button>

      </div>
    </div>
  );
}
