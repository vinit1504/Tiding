"use client";

import React, { useState } from "react";
import { MapPin, Plus, CheckCircle2, Home, Briefcase, Phone, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCustomerAddressesQuery } from "@/queries/customer/use-address-queries";
import { AddAddressDialog } from "./add-address-dialog";
import { useAtomValue } from "jotai";
import { deliveryLocationAtom } from "@/stores";

export interface AddressCardData {
  id: string;
  type: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

interface DeliveryAddressSectionProps {
  selectedAddressId: string | null;
  onSelectAddress: (address: AddressCardData) => void;
}

export function DeliveryAddressSection({
  selectedAddressId,
  onSelectAddress,
}: DeliveryAddressSectionProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<AddressCardData | null>(null);

  const location = useAtomValue(deliveryLocationAtom);
  const { data: addressList } = useCustomerAddressesQuery();

  // Fallback default address derived from location atom if none saved in profile
  const fallbackAddress: AddressCardData = {
    id: "default-location-addr",
    type: "HOME",
    recipientName: "Default Delivery Address",
    phone: "+91 98765 43210",
    addressLine1: location.society || "Current Society",
    addressLine2: location.area || "Area",
    city: location.city || "Ahmedabad",
    state: location.state || "Gujarat",
    pincode: location.pincode || "380015",
    latitude: location.coordinates?.latitude,
    longitude: location.coordinates?.longitude,
  };

  const savedAddresses: AddressCardData[] =
    addressList && addressList.length > 0
      ? addressList.map((a: any) => ({
          id: a.id,
          type: a.address_type || "HOME",
          recipientName: a.recipient_name || "Customer",
          phone: a.recipient_phone || "",
          addressLine1: a.address_line_1 || "",
          addressLine2: a.address_line_2 || "",
          city: a.city || location.city || "Ahmedabad",
          state: a.state || location.state || "Gujarat",
          pincode: a.pincode || location.pincode || "380015",
          landmark: a.landmark || "",
          latitude: a.latitude ? Number(a.latitude) : location.coordinates?.latitude,
          longitude: a.longitude ? Number(a.longitude) : location.coordinates?.longitude,
        }))
      : [fallbackAddress];

  // Auto-select first address if none selected
  React.useEffect(() => {
    if (!selectedAddressId && savedAddresses.length > 0) {
      onSelectAddress(savedAddresses[0]);
    }
  }, [selectedAddressId, savedAddresses, onSelectAddress]);

  const handleOpenAdd = () => {
    setAddressToEdit(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (addr: AddressCardData, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddressToEdit(addr);
    setIsAddOpen(true);
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)]">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-normal text-[var(--text-primary)]">
              Delivery Address
            </h2>
            <p className="text-[11px] font-normal text-[var(--text-secondary)]">
              Choose or edit where you want your groceries delivered
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenAdd}
          className="h-8.5 px-3 rounded-xl border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-light)] text-xs font-normal gap-1.5 cursor-pointer shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add New</span>
        </Button>
      </div>

      {/* Selectable Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {savedAddresses.map((addr) => {
          const isSelected = selectedAddressId === addr.id;
          const isWork = addr.type.toUpperCase() === "WORK";

          return (
            <div
              key={addr.id}
              onClick={() => onSelectAddress(addr)}
              className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "border-[var(--primary)] bg-[var(--primary-light)]/40 shadow-xs"
                  : "border-[var(--border)] hover:border-[var(--primary)]/40 bg-white"
              }`}
            >
              <div className="space-y-2">
                {/* Card Top: Type Badge & Status */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--surface-secondary)] px-2 py-0.5 text-[11px] font-normal text-[var(--text-primary)] uppercase">
                    {isWork ? <Briefcase className="h-3 w-3" /> : <Home className="h-3 w-3" />}
                    {addr.type}
                  </span>

                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-normal text-[var(--primary)]">
                      <CheckCircle2 className="h-4 w-4 fill-[var(--primary)] text-white" />
                      Selected
                    </span>
                  ) : (
                    <span className="text-[11px] font-normal text-[var(--text-muted)] hover:text-[var(--primary)]">
                      Select
                    </span>
                  )}
                </div>

                {/* Recipient & Address Body */}
                <div>
                  <h4 className="text-xs sm:text-sm font-normal text-[var(--text-primary)]">
                    {addr.recipientName}
                  </h4>
                  <p className="text-xs font-normal text-[var(--text-secondary)] line-clamp-2 mt-0.5 leading-relaxed">
                    {addr.addressLine1}
                    {addr.addressLine2 ? `, ${addr.addressLine2}` : ""}
                    {addr.landmark ? `, Near ${addr.landmark}` : ""}
                  </p>
                  <p className="text-[11px] font-normal text-[var(--text-muted)] mt-0.5">
                    {addr.city}, {addr.state} — {addr.pincode}
                  </p>
                </div>
              </div>

              {/* Bottom Row: Phone Number & Edit Action Button */}
              <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)] pt-2.5 mt-2.5 border-t border-[var(--border-light)]">
                {addr.phone ? (
                  <div className="flex items-center gap-1 font-normal text-zinc-500">
                    <Phone className="h-3 w-3 text-zinc-400" />
                    <span>{addr.phone}</span>
                  </div>
                ) : (
                  <span />
                )}

                <button
                  type="button"
                  onClick={(e) => handleOpenEdit(addr, e)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-normal text-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors cursor-pointer"
                  title="Edit address"
                >
                  <Pencil className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Address Dialog Modal */}
      <AddAddressDialog
        open={isAddOpen}
        onOpenChange={(isOpen) => {
          setIsAddOpen(isOpen);
          if (!isOpen) setAddressToEdit(null);
        }}
        addressToEdit={addressToEdit}
        onAddressSaved={(saved) => {
          onSelectAddress(saved);
          setAddressToEdit(null);
        }}
        onAddressCreated={(created) => {
          onSelectAddress({
            id: created.id,
            type: created.type || "HOME",
            recipientName: created.recipientName || created.recipient_name,
            phone: created.phone || created.recipient_phone,
            addressLine1: created.addressLine1 || created.address_line_1,
            addressLine2: created.addressLine2 || created.address_line_2,
            city: created.city,
            state: created.state,
            pincode: created.pincode,
            landmark: created.landmark,
          });
          setAddressToEdit(null);
        }}
      />
    </div>
  );
}