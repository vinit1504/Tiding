"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Home, Briefcase, MapPin, Loader2 } from "lucide-react";
import {
  useCreateAddressMutation,
  useUpdateAddressMutation,
} from "@/queries/customer/use-address-queries";
import { locationService } from "@/lib/api/location-service";
import { isUuid } from "@/lib/api/catalog-service";
import { toast } from "sonner";
import { useAtomValue } from "jotai";
import { deliveryLocationAtom } from "@/stores";
import { AddressCardData } from "./delivery-address-section";

interface AddAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addressToEdit?: AddressCardData | null;
  onAddressCreated?: (address: any) => void;
  onAddressSaved?: (address: AddressCardData) => void;
}

export function AddAddressDialog({
  open,
  onOpenChange,
  addressToEdit,
  onAddressCreated,
  onAddressSaved,
}: AddAddressDialogProps) {
  const location = useAtomValue(deliveryLocationAtom);
  const createAddressMutation = useCreateAddressMutation();
  const updateAddressMutation = useUpdateAddressMutation();

  const isEditMode = !!addressToEdit;

  const [addressType, setAddressType] = useState<"HOME" | "WORK" | "OTHER">("HOME");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState(location.city || "Ahmedabad");
  const [state, setState] = useState(location.state || "Gujarat");
  const [pincode, setPincode] = useState(location.pincode || "380015");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever the dialog opens or addressToEdit changes
  useEffect(() => {
    if (open) {
      if (addressToEdit) {
        const typeNormalized = addressToEdit.type?.toUpperCase();
        setAddressType(
          typeNormalized === "WORK" ? "WORK" : typeNormalized === "OTHER" ? "OTHER" : "HOME"
        );
        setRecipientName(addressToEdit.recipientName || "");
        setRecipientPhone(addressToEdit.phone || "");
        setAddressLine1(addressToEdit.addressLine1 || "");
        setAddressLine2(addressToEdit.addressLine2 || "");
        setLandmark(addressToEdit.landmark || "");
        setCity(addressToEdit.city || location.city || "Ahmedabad");
        setState(addressToEdit.state || location.state || "Gujarat");
        setPincode(addressToEdit.pincode || location.pincode || "380015");
      } else {
        setAddressType("HOME");
        setRecipientName("");
        setRecipientPhone("");
        setAddressLine1("");
        setAddressLine2("");
        setLandmark("");
        setCity(location.city || "Ahmedabad");
        setState(location.state || "Gujarat");
        setPincode(location.pincode || "380015");
      }
    }
  }, [open, addressToEdit, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      toast.error("Please enter recipient name");
      return;
    }
    if (!recipientPhone.trim() || recipientPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (!addressLine1.trim()) {
      toast.error("Please enter house/flat/building details");
      return;
    }

    setIsSubmitting(true);
    try {
      const resolved = await locationService.resolveHierarchyUuids({
        areaName: addressLine2 || location.area || "Bodakdev",
        cityName: city,
      });

      let savedId = addressToEdit?.id || `addr_${Date.now()}`;

      if (isEditMode && addressToEdit?.id && isUuid(addressToEdit.id)) {
        // Edit existing server address
        await updateAddressMutation.mutateAsync({
          addressId: addressToEdit.id,
          payload: {
            address_type: addressType,
            recipient_name: recipientName.trim(),
            recipient_phone: recipientPhone.trim(),
            address_line_1: addressLine1.trim(),
            address_line_2: addressLine2.trim() || undefined,
            ...(isUuid(resolved.areaId) && resolved.areaId ? { area_id: resolved.areaId } : {}),
            ...(isUuid(resolved.cityId) && resolved.cityId ? { city_id: resolved.cityId } : {}),
            ...(isUuid(resolved.stateId) && resolved.stateId ? { state_id: resolved.stateId } : {}),
            ...(isUuid(resolved.countryId) && resolved.countryId ? { country_id: resolved.countryId } : {}),
            ...(isUuid(resolved.pincodeId) && resolved.pincodeId ? { pincode_id: resolved.pincodeId } : {}),
          },
        });
        toast.success("Delivery address updated successfully!");
      } else {
        // Create new address
        let createdAddress: any = null;
        if (
          isUuid(resolved.areaId) &&
          isUuid(resolved.cityId) &&
          isUuid(resolved.stateId) &&
          isUuid(resolved.countryId)
        ) {
          createdAddress = await createAddressMutation.mutateAsync({
            address_type: addressType,
            recipient_name: recipientName.trim(),
            recipient_phone: recipientPhone.trim(),
            address_line_1: addressLine1.trim(),
            address_line_2: addressLine2.trim() || undefined,
            landmark: landmark.trim() || undefined,
            area_id: resolved.areaId!,
            city_id: resolved.cityId!,
            state_id: resolved.stateId!,
            country_id: resolved.countryId!,
            pincode_id: isUuid(resolved.pincodeId) ? resolved.pincodeId! : null,
            is_default: true,
          });
        }
        savedId = createdAddress?.id || savedId;
        toast.success("Delivery address saved successfully!");
      }

      const returnAddress: AddressCardData = {
        id: savedId,
        type: addressType,
        recipientName: recipientName.trim(),
        phone: recipientPhone.trim(),
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city,
        state,
        pincode,
        latitude: addressToEdit?.latitude || location.coordinates?.latitude,
        longitude: addressToEdit?.longitude || location.coordinates?.longitude,
      };

      if (onAddressSaved) {
        onAddressSaved(returnAddress);
      }
      if (onAddressCreated) {
        onAddressCreated(returnAddress);
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save address");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white rounded-2xl p-6 shadow-xl border border-zinc-200/80">
        <DialogHeader>
          <DialogTitle className="text-base font-normal text-zinc-900">
            {isEditMode ? "Edit Delivery Address" : "Add New Delivery Address"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Address Type Selector */}
          <div className="flex gap-2">
            {[
              { type: "HOME" as const, label: "Home", icon: Home },
              { type: "WORK" as const, label: "Work", icon: Briefcase },
              { type: "OTHER" as const, label: "Other", icon: MapPin },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => setAddressType(type)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-normal flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  addressType === type
                    ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] shadow-2xs"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-normal text-zinc-500">
                Recipient Name *
              </label>
              <Input
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Full Name"
                className="h-10 text-xs rounded-xl border-zinc-200 focus-visible:border-[var(--primary)] font-normal"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-normal text-zinc-500">
                Phone Number *
              </label>
              <Input
                required
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number"
                className="h-10 text-xs rounded-xl border-zinc-200 focus-visible:border-[var(--primary)] font-normal"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-normal text-zinc-500">
              Flat / House No. / Building Name *
            </label>
            <Input
              required
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="e.g. Flat 202, ABC Residency"
              className="h-10 text-xs rounded-xl border-zinc-200 focus-visible:border-[var(--primary)] font-normal"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-normal text-zinc-500">
              Area / Street / Sector
            </label>
            <Input
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="e.g. Bodakdev, SG Highway"
              className="h-10 text-xs rounded-xl border-zinc-200 focus-visible:border-[var(--primary)] font-normal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-normal text-zinc-500">
                Landmark (Optional)
              </label>
              <Input
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near City Mall"
                className="h-10 text-xs rounded-xl border-zinc-200 focus-visible:border-[var(--primary)] font-normal"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-normal text-zinc-500">
                Pincode *
              </label>
              <Input
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="380015"
                className="h-10 text-xs rounded-xl border-zinc-200 focus-visible:border-[var(--primary)] font-normal"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 text-xs font-normal rounded-xl border-zinc-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-normal rounded-xl shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isEditMode ? (
                "Update Address"
              ) : (
                "Save & Deliver Here"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
