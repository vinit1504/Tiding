"use client";

import React from "react";
import { MapPin, Phone, CreditCard } from "lucide-react";

interface OrderDeliveryAddressCardProps {
  recipientName?: string | null;
  fullAddress: string;
  recipientPhone?: string | null;
  paymentMethod?: string | null;
  paymentStatus?: string | null;
}

export function OrderDeliveryAddressCard({
  recipientName,
  fullAddress,
  recipientPhone,
  paymentMethod = "RAZORPAY",
  paymentStatus,
}: OrderDeliveryAddressCardProps) {
  const normStatus = (paymentStatus || "").toUpperCase();
  const isPaid = normStatus === "PAID" || normStatus === "COMPLETED";
  const isPending = normStatus === "PENDING" || normStatus === "INITIATED";

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-gray-200">
      <div>
        {/* Header */}
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-gray-100">
          <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-gray-900">
            Delivery Address
          </h4>
        </div>

        {/* Recipient and Address Details */}
        <div className="space-y-1.5 text-xs text-gray-600">
          {recipientName && (
            <p className="font-bold text-gray-900 text-sm">{recipientName}</p>
          )}

          <p className="leading-relaxed text-gray-700 font-normal">
            {fullAddress}
          </p>

          {recipientPhone && (
            <div className="flex items-center gap-2 text-gray-500 pt-1 font-medium">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>{recipientPhone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method & Status Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-gray-500">
          <CreditCard className="w-3.5 h-3.5 text-gray-400" />
          <span>Payment:</span>
          <span className="font-bold text-gray-800 uppercase tracking-wide bg-gray-100 px-2 py-0.5 rounded-md text-[11px]">
            {paymentMethod || "RAZORPAY"}
          </span>
        </div>

        {paymentStatus && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
              isPaid
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : isPending
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {paymentStatus}
          </span>
        )}
      </div>
    </div>
  );
}

