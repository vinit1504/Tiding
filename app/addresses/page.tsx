"use client";

import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import {
  Home,
  Building,
  User as UserIcon,
  MoreVertical,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Navigation,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { AddressModal } from "@/components/account/address-modal";
import {
  userProfileAtom,
  authSessionAtom,
  persistentLocationAtom,
  isAuthDrawerOpenAtom,
} from "@/stores";
import { SavedAddress, DeliveryLocation } from "@/types/location";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AddressesPage() {
  const [user, setUser] = useAtom(userProfileAtom);
  const [session] = useAtom(authSessionAtom);
  const [, setCurrentLocation] = useAtom(persistentLocationAtom);
  const [, setIsAuthDrawerOpen] = useAtom(isAuthDrawerOpenAtom);

  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthenticated = mounted && !!user && session.isAuthenticated;
  const addresses: SavedAddress[] =
    user?.savedAddresses && user.savedAddresses.length > 0
      ? user.savedAddresses
      : [];

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleSaveModal = (data: Partial<SavedAddress>) => {
    let updated: SavedAddress[];
    if (editingAddress) {
      updated = addresses.map((a) => (a.id === editingAddress.id ? ({ ...a, ...data } as SavedAddress) : a));
      toast.success("Address updated successfully!");
    } else {
      const newAddress = {
        ...data,
        id: `addr-${Date.now()}`,
      } as SavedAddress;
      updated = [newAddress, ...addresses];
      toast.success("New address added successfully!");
    }

    if (user) {
      const updatedUser = { ...user, savedAddresses: updated };
      setUser(updatedUser);
      try {
        localStorage.setItem("tiding_user", JSON.stringify(updatedUser));
      } catch {}
    }
  };

  const handleSetDefault = (address: SavedAddress) => {
    const updated = addresses.map((addr) => ({
      ...addr,
      isDefault: addr.id === address.id,
    }));

    if (user) {
      const updatedUser = { ...user, savedAddresses: updated };
      setUser(updatedUser);
      try {
        localStorage.setItem("tiding_user", JSON.stringify(updatedUser));
      } catch {}
    }

    const newLoc: DeliveryLocation = {
      area: address.area,
      society: address.addressLine,
      formattedAddress: `${address.addressLine}, ${address.city} ${address.pincode}`,
      city: address.city,
      state: "Gujarat",
      pincode: address.pincode,
      deliveryEtaMinutes: 9,
      isServiceable: true,
    };
    setCurrentLocation(newLoc);
    toast.success(`Delivering to ${address.title}: ${address.area}`);
  };

  const handleDeleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    if (user) {
      const updatedUser = { ...user, savedAddresses: updated };
      setUser(updatedUser);
      try {
        localStorage.setItem("tiding_user", JSON.stringify(updatedUser));
      } catch {}
    }
    toast.success("Address removed");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f4f6fb] py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-6 items-start">
        {/* Left Sidebar matching Screenshot 3 */}
        <AccountSidebar activeTab="addresses" />

        {/* Right Content Panel matching Screenshot 3 */}
        <main className="flex-1 bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Header Row: My addresses & + Add new address */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              My addresses
            </h1>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="text-sm font-bold text-[#0c831f] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add new address</span>
            </button>
          </div>

          {/* List of Addresses exactly matching Screenshot 3 */}
          <div className="divide-y divide-gray-100">
            {addresses.map((addr) => {
              const isWork = addr.type === "work" || addr.title.toLowerCase().includes("work");
              const isCustom = addr.type === "other" || (!isWork && addr.title.toLowerCase() !== "home");

              return (
                <div
                  key={addr.id}
                  className="py-4.5 flex items-start justify-between gap-4 group"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Light Amber Rounded Square Icon matching Screenshot 3 */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff9e6] text-amber-500 mt-0.5">
                      {isWork ? (
                        <Building className="h-5 w-5" />
                      ) : isCustom ? (
                        <UserIcon className="h-5 w-5" />
                      ) : (
                        <Home className="h-5 w-5" />
                      )}
                    </div>

                    {/* Address Content */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">
                          {addr.title}
                        </h3>
                        {addr.isDefault && (
                          <span className="text-[10px] font-bold text-[#0c831f] bg-[#0c831f]/10 px-2 py-0.5 rounded-full">
                            Current Location
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {addr.addressLine}
                      </p>
                    </div>
                  </div>

                  {/* 3-Dots Dropdown Menu matching Screenshot 3 */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label="Address actions"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-44 rounded-xl border border-gray-200 shadow-lg p-1 bg-white"
                    >
                      <DropdownMenuItem
                        onClick={() => handleSetDefault(addr)}
                        className="text-xs font-semibold flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <Navigation className="h-3.5 w-3.5 text-[#0c831f]" />
                        <span>Deliver to this</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleOpenEdit(addr)}
                        className="text-xs font-semibold flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                        <span>Edit Address</span>
                      </DropdownMenuItem>
                      {addresses.length > 1 && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-xs font-semibold flex items-center gap-2 p-2 rounded-lg cursor-pointer text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Enter Complete Address Modal matching Screenshot 2 */}
      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveModal}
        initialData={editingAddress}
      />
    </div>
  );
}
