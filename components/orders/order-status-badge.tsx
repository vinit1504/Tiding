"use client";

import React from "react";
import { Check, Truck, Package, XCircle, Clock } from "lucide-react";

export interface OrderStatusInfo {
  title: string;
  bg: string;
  icon: React.ReactNode;
}

export function getOrderStatusInfo(status: string): OrderStatusInfo {
  const s = (status || "").toUpperCase();
  switch (s) {
    case "DELIVERED":
      return {
        title: "Delivered",
        bg: "bg-[#e8f7ee] text-[#0c831f] border-emerald-200",
        icon: <Check className="h-4 w-4 stroke-[3]" />,
      };
    case "OUT_FOR_DELIVERY":
    case "SHIPPED":
      return {
        title: "Out for Delivery",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <Truck className="h-4 w-4" />,
      };
    case "PROCESSING":
      return {
        title: "Packing at Dark Store",
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        icon: <Package className="h-4 w-4" />,
      };
    case "CONFIRMED":
      return {
        title: "Order Confirmed",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <Check className="h-4 w-4" />,
      };
    case "CANCELLED":
      return {
        title: "Order Cancelled",
        bg: "bg-rose-50 text-rose-700 border-rose-200",
        icon: <XCircle className="h-4 w-4" />,
      };
    case "PENDING":
    default:
      return {
        title: "Order Placed",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <Clock className="h-4 w-4" />,
      };
  }
}

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const info = getOrderStatusInfo(status);

  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${info.bg} ${
        className || ""
      }`}
    >
      {info.icon}
    </div>
  );
}
