"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  MapPin,
  Navigation,
  Home,
  Building,
  Bed,
  Compass,
  Check,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SavedAddress } from "@/types/location";
import { toast } from "sonner";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (addressData: Partial<SavedAddress> & { floor?: string }) => void;
  initialData?: SavedAddress | null;
}

export function AddressModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AddressModalProps) {
  const [addressType, setAddressType] = useState<"home" | "work" | "hotel" | "other">(
    (initialData?.type as any) || "home"
  );
  const [houseNo, setHouseNo] = useState("");
  const [floor, setFloor] = useState("");
  const [area, setArea] = useState("Bapunagar, Ahmedabad");
  const [landmark, setLandmark] = useState("");
  const [name, setName] = useState("Vinit");
  const [phone, setPhone] = useState("7567337686");
  const [searchMapQuery, setSearchMapQuery] = useState(
    "Shop no. 1, Kahan Park, nr. Varsa Society, nr..."
  );

  useEffect(() => {
    if (initialData) {
      setAddressType((initialData.type as any) || "home");
      setHouseNo(initialData.addressLine.split(",")[0] || "");
      setArea(initialData.area ? `${initialData.area}, ${initialData.city || "Ahmedabad"}` : "Bapunagar, Ahmedabad");
      setLandmark(initialData.landmark || "");
      setName(initialData.receiverName || "Vinit");
      setPhone(initialData.receiverPhone || "7567337686");
    } else {
      setAddressType("home");
      setHouseNo("8 Kahan Park Socity");
      setFloor("");
      setArea("Bapunagar, Ahmedabad");
      setLandmark("Bapunagar near Chandraprashad Desai hall");
      setName("Vinit");
      setPhone("7567337686");
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseNo.trim()) {
      toast.error("Please enter Flat/House no/Building name");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    const fullAddress = [
      houseNo.trim(),
      floor.trim() ? `${floor.trim()} Floor` : "",
      landmark.trim(),
      area.trim(),
    ]
      .filter(Boolean)
      .join(", ");

    onSave({
      id: initialData?.id || `addr-${Date.now()}`,
      type: addressType === "hotel" ? "other" : addressType,
      title:
        addressType === "home"
          ? "Home"
          : addressType === "work"
          ? "Work"
          : addressType === "hotel"
          ? "Hotel"
          : name.trim() || "Other",
      addressLine: fullAddress,
      area: area.split(",")[0]?.trim() || "Bapunagar",
      city: area.split(",")[1]?.trim() || "Ahmedabad",
      pincode: initialData?.pincode || "380024",
      landmark: landmark.trim(),
      receiverName: name.trim(),
      receiverPhone: phone.trim(),
      isDefault: initialData?.isDefault ?? true,
      floor: floor.trim(),
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:bg-[#181818] shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[540px]">
          {/* Left Column: Interactive Map Preview Matching Screenshot 2 */}
          <div className="relative bg-[#e9ecef] dark:bg-[#202020] flex flex-col justify-between p-4 overflow-hidden select-none border-r border-gray-200 dark:border-gray-800">
            {/* Top Search Input */}
            <div className="relative z-10 w-full">
              <div className="flex items-center gap-2 bg-white dark:bg-[#282828] rounded-xl px-3 py-2.5 shadow-md border border-gray-200/80 dark:border-gray-700">
                <Search className="h-4 w-4 text-[#0c831f] shrink-0" />
                <input
                  type="text"
                  value={searchMapQuery}
                  onChange={(e) => setSearchMapQuery(e.target.value)}
                  placeholder="Search society, building, area..."
                  className="w-full text-xs font-medium text-gray-800 dark:text-gray-100 bg-transparent outline-none truncate"
                />
                {searchMapQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchMapQuery("")}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Stylized Realistic Map Illustration with Center Marker */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* SVG Vector Map Canvas mimicking Google/Apple Maps in screenshot */}
              <svg
                viewBox="0 0 600 600"
                className="w-full h-full object-cover opacity-85"
                preserveAspectRatio="xMidYMid slice"
              >
                <rect width="600" height="600" fill="#E8EDF2" />
                {/* Road networks */}
                <path
                  d="M0,150 Q200,120 400,200 T600,240"
                  stroke="#FFFFFF"
                  strokeWidth="28"
                  fill="none"
                />
                <path
                  d="M100,0 L180,600"
                  stroke="#FFFFFF"
                  strokeWidth="26"
                  fill="none"
                />
                <path
                  d="M320,0 L280,600"
                  stroke="#FFFFFF"
                  strokeWidth="32"
                  fill="none"
                />
                <path
                  d="M480,0 L520,600"
                  stroke="#FFFFFF"
                  strokeWidth="24"
                  fill="none"
                />
                <path
                  d="M50,380 L550,420"
                  stroke="#FFFFFF"
                  strokeWidth="24"
                  fill="none"
                />
                {/* City Blocks */}
                <rect x="130" y="240" width="130" height="120" rx="12" fill="#DDE4EC" />
                <rect x="330" y="260" width="120" height="110" rx="12" fill="#DDE4EC" />
                <rect x="130" y="60" width="140" height="70" rx="8" fill="#DDE4EC" />
                <rect x="340" y="80" width="110" height="90" rx="8" fill="#DDE4EC" />
                {/* Secondary pathways */}
                <path d="M140,300 L250,300" stroke="#CBD5E1" strokeWidth="6" strokeDasharray="4 4" />
                <path d="M340,320 L440,320" stroke="#CBD5E1" strokeWidth="6" strokeDasharray="4 4" />
              </svg>

              {/* Pinpoint Location Marker */}
              <div className="relative z-10 flex flex-col items-center animate-bounce -mt-6">
                <div className="relative flex items-center justify-center">
                  <div className="h-9 w-9 rounded-full bg-rose-500/20 animate-ping absolute" />
                  <div className="h-8 w-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
                    <MapPin className="h-5 w-5 fill-white text-rose-600" />
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-black/40 blur-[1px] mt-0.5" />
              </div>
            </div>

            {/* Go to Current Location Button */}
            <div className="relative z-10 pt-44 pb-2">
              <button
                type="button"
                onClick={() => {
                  toast.success("GPS Location updated: Bapunagar, Ahmedabad");
                  setArea("Bapunagar, Ahmedabad");
                }}
                className="inline-flex items-center gap-2 bg-white dark:bg-[#282828] text-gray-800 dark:text-gray-100 px-3 py-2 rounded-xl text-xs font-semibold shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                <Navigation className="h-3.5 w-3.5 text-[#0c831f] fill-[#0c831f]/20" />
                <span>Go to current location</span>
              </button>
            </div>

            {/* Bottom Delivering Order To Card */}
            <div className="relative z-10 bg-white dark:bg-[#282828] rounded-2xl p-3.5 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Delivering your order to
                </p>
                <p className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                  {area.split(",")[0] || "Bapunagar"}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {area.split(",")[1] || "Ahmedabad"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Enter Complete Address Form Matching Screenshot 2 */}
          <div className="p-6 sm:p-7 flex flex-col justify-between bg-white dark:bg-[#181818]">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Enter complete address
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Save Address As Category Pills */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Save address as *
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: "home", label: "Home", icon: Home },
                      { id: "work", label: "Work", icon: Building },
                      { id: "hotel", label: "Hotel", icon: Bed },
                      { id: "other", label: "Other", icon: MapPin },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = addressType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setAddressType(item.id as any)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#0c831f] bg-[#0c831f]/10 text-[#0c831f] font-bold"
                              : "border-gray-300 dark:border-gray-700 bg-white dark:bg-[#202020] text-gray-700 dark:text-gray-300 hover:border-gray-400"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 text-amber-500" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Flat / House No */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                    Flat / House no / Building name *
                  </label>
                  <Input
                    value={houseNo}
                    onChange={(e) => setHouseNo(e.target.value)}
                    placeholder="8 Kahan Park Socity"
                    className="h-9 text-xs rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-[#202020]"
                    required
                  />
                </div>

                {/* Floor Optional */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                    Floor (optional)
                  </label>
                  <Input
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="e.g. 2nd Floor"
                    className="h-9 text-xs rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-[#202020]"
                  />
                </div>

                {/* Area / Sector / Locality */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                    Area / Sector / Locality *
                  </label>
                  <Input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Bapunagar, Ahmedabad"
                    className="h-9 text-xs rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-[#202020]"
                    required
                  />
                </div>

                {/* Nearby Landmark */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                    Nearby landmark (optional)
                  </label>
                  <Input
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Bapunagar near Chandraprashad Desai hall"
                    className="h-9 text-xs rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-[#202020]"
                  />
                </div>

                {/* Section Separator */}
                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    Enter your details for seamless delivery experience
                  </p>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                    Your name *
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Vinit"
                    className="h-9 text-xs rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-[#202020]"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                    Your phone number (optional)
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="7567337686"
                    className="h-9 text-xs rounded-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-[#202020]"
                  />
                </div>

                {/* Big Solid Green Save Address Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-11 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-sm rounded-xl cursor-pointer shadow-md transition-all active:scale-[0.99]"
                  >
                    Save Address
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
