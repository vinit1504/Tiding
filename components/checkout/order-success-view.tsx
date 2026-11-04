"use client";

import React from "react";
import { CartItem } from "@/types/cart";
import { OrderSuccessTopBanner } from "./success/order-success-top-banner";
import { LiveDeliveryMap, useRiderProgress } from "./success/live-delivery-map";
import { DeliveryPartnerCard } from "./success/delivery-partner-card";
import { OrderStatusTimeline } from "./success/order-status-timeline";
import { OrderDeliveryAddressCard } from "./success/order-delivery-address-card";
import { OrderItemsCard } from "./success/order-items-card";
import { OrderBillCard } from "./success/order-bill-card";
import { useOrderTrackingEventsQuery } from "@/queries/order/use-order-queries";

export interface PlacedOrderDetails {
  orderId: string;
  orderNumber: string;
  paymentMethod: string;
  totalAmount: number;
  items: CartItem[];
  placedAt: string;
  etaMinutes: number;
  address?: string;
  recipientName?: string;
  phone?: string;
  instruction?: string;
  slot?: string;
  bill?: any;
  status?: string; // CONFIRMED, PROCESSING, OUT_FOR_DELIVERY, DELIVERED
  userCoordinates?: { latitude: number; longitude: number };
  storeCoordinates?: { latitude: number; longitude: number };
  storeName?: string;
  rider?: {
    name: string;
    rating?: number;
    vehicle?: string;
    phone?: string;
  };
}

interface OrderSuccessViewProps {
  order: PlacedOrderDetails;
}

export function OrderSuccessView({ order }: OrderSuccessViewProps) {
  const progress = useRiderProgress();
  const { data: realEvents = [] } = useOrderTrackingEventsQuery(order.orderId);

  const rider = {
    name: order.rider?.name ?? "Rajesh Kumar",
    rating: order.rider?.rating ?? 4.9,
    vehicle: order.rider?.vehicle ?? "Two-Wheeler • GJ-01-ET-4821",
    phone: order.rider?.phone,
  };

  const displayOrderNumber = order.orderNumber || order.orderId;
  const totalUnits = order.items.reduce((s, it) => s + (it.quantity || 1), 0);

  const itemsSubtotal = order.items.reduce(
    (sum, it) => sum + Number(it.price || 0) * (it.quantity || 1),
    0
  );

  const itemsTotalSavings = order.items.reduce((sum, it) => {
    const unitPrice = Number(it.price || 0);
    const mrp = Number(it.mrp || 0);
    return sum + (mrp > unitPrice ? (mrp - unitPrice) * (it.quantity || 1) : 0);
  }, 0);

  // Live simulation values derived from rider progress
  const remaining = Math.max(0, 1 - progress);
  const distanceKm = (remaining * 2.8).toFixed(1);
  const liveEta = Math.max(2, Math.round(remaining * (order.etaMinutes + 4)));

  return (
    <div className="min-h-screen bg-[var(--surface-secondary)] pb-12">
      {/* 1. Top Confirmation Banner */}
      <OrderSuccessTopBanner
        orderNumber={displayOrderNumber}
        etaMinutes={order.etaMinutes}
        slot={order.slot}
      />

      {/* 2. Main 2-Column Responsive Layout */}
      <div className="container mx-auto grid max-w-5xl gap-5 px-4 py-5 sm:py-8 lg:grid-cols-[1fr_380px]">
        {/* Left Column: Live Map, Rider Info, Status Timeline, Address */}
        <div className="space-y-5">
          {/* Live Map & Rider Section */}
          <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-xs">
            <LiveDeliveryMap
              userCoordinates={order.userCoordinates}
              storeCoordinates={order.storeCoordinates}
              storeName={order.storeName}
              destinationAddress={order.address}
              progress={progress}
              distanceKm={distanceKm}
              etaMins={liveEta}
              riderName={rider.name.split(" ")[0]}
            />

            <DeliveryPartnerCard rider={rider} />
          </section>

          {/* Vertical Live Order Status Timeline */}
          <OrderStatusTimeline
            placedAt={order.placedAt}
            riderName={rider.name.split(" ")[0]}
            distanceKm={distanceKm}
            etaMins={liveEta}
            currentStatus={order.status || "OUT_FOR_DELIVERY"}
            timelineEvents={realEvents}
          />

          {/* Delivery Address Card */}
          <OrderDeliveryAddressCard
            recipientName={order.recipientName}
            phone={order.phone}
            address={order.address}
            instruction={order.instruction}
          />
        </div>

        {/* Right Column: Order Items, Full Bill Summary, Next CTAs */}
        <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
          {/* Product Items Details Card */}
          <OrderItemsCard
            items={order.items}
            totalUnits={totalUnits}
          />

          {/* Bill Details & Actions Card */}
          <OrderBillCard
            itemsSubtotal={itemsSubtotal}
            handlingFee={order.bill?.handlingFee || 0}
            totalSavings={itemsTotalSavings}
            totalAmount={order.totalAmount}
            paymentMethod={order.paymentMethod}
            orderId={order.orderId}
            orderNumber={displayOrderNumber}
            orderStatus={order.status}
          />
        </aside>
      </div>
    </div>
  );
}