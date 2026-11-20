"use client";

import React, { useState } from "react";
import { useCustomerLocation } from "../hooks/useCustomerLocation";

export interface LocationHeaderPillProps {
  className?: string;
  onLocationConfirmed?: () => void;
}

export function LocationHeaderPill({ className = "", onLocationConfirmed }: LocationHeaderPillProps) {
  const { activeLocation, isLoading, error, detectLocation, confirmAndSaveLocation } = useCustomerLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [houseNo, setHouseNo] = useState("");
  const [landmark, setLandmark] = useState("");
  const [tag, setTag] = useState<"Home" | "Work" | "Other">("Home");
  const [isSaving, setIsSaving] = useState(false);

  const displayTitle = activeLocation?.address?.locality || activeLocation?.address?.city || "Select Location";
  const displaySubtitle = activeLocation?.address?.fullAddress || "Detecting your location...";

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseNo.trim()) {
      alert("Please enter your House / Flat / Floor Number to ensure correct delivery.");
      return;
    }
    setIsSaving(true);
    try {
      await confirmAndSaveLocation({
        houseNo: houseNo.trim(),
        landmark: landmark.trim() || undefined,
        tag,
      });
      setIsModalOpen(false);
      onLocationConfirmed?.();
    } catch (err: any) {
      alert(err.message || "Failed to save delivery location.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Clickable Header Delivery Address Pill */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 p-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition border border-gray-200 text-left max-w-xs cursor-pointer ${className}`}
        title="Delivery Address & Store Selection"
      >
        <span className="text-xl shrink-0" aria-hidden="true">📍</span>
        <div className="overflow-hidden min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate flex items-center gap-1.5">
            <span className="truncate">{displayTitle}</span>
            {!activeLocation?.isConfirmed && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                Unconfirmed
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate">{displaySubtitle}</p>
        </div>
      </button>

      {/* Confirmation & Address Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer"
              aria-label="Close modal"
            >
              ✕
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-1">Confirm Delivery Location</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Your location ensures quick 10-30 minute delivery from your nearest dark store.
            </p>

            {/* GPS Detection Button */}
            <button
              type="button"
              onClick={detectLocation}
              disabled={isLoading}
              className="w-full mb-3 py-2.5 px-4 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
            >
              <span aria-hidden="true">🎯</span>
              <span>{isLoading ? "Detecting GPS Location..." : "Use Current GPS Location"}</span>
            </button>

            {/* Approximate City / IP Fallback Notice */}
            {activeLocation?.locationSource === "ip_location" && (
              <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <span className="text-amber-600 text-base">⚠️</span>
                <div>
                  <span className="font-semibold block mb-0.5">Approximate Location (IP Fallback)</span>
                  <p className="text-amber-800">
                    GPS was unavailable. We detected your general city. Please verify your exact address details below.
                  </p>
                </div>
              </div>
            )}

            {/* Error / Status Notice */}
            {error && (
              <div className="mb-3 p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600">
                {error}
              </div>
            )}

            {/* Detected Area Card */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 mb-4">
              <span className="text-xs font-semibold text-gray-700 block mb-1">Detected Area:</span>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                {activeLocation?.address?.fullAddress || "Locating coordinates..."}
              </p>
              {activeLocation?.accuracy && (
                <span className="inline-block mt-2 text-[10px] text-gray-500 font-mono">
                  Accuracy: ±{Math.round(activeLocation.accuracy)}m ({activeLocation.locationSource})
                </span>
              )}
            </div>

            <form onSubmit={handleConfirm} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  House / Flat / Floor No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 301, 3rd Floor"
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near HDFC Bank ATM"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>

              {/* Tag Selection */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Save Address As
                </label>
                <div className="flex items-center gap-2">
                  {(["Home", "Work", "Other"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition ${
                        tag === t
                          ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving || !activeLocation}
                className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {isSaving ? "Saving Address..." : "Confirm & Deliver Here"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
