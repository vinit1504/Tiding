"use client";

import React from "react";
import { BackendOrder, BackendOrderItem } from "@/types/order";
import { useOrderDetailQuery } from "@/queries/order/use-order-queries";
import {
  OrderGstBanner,
  OrderStatusTimeline,
  OrderItemsDetailList,
  OrderDeliveryAddressCard,
  OrderBillSummaryCard,
  OrderActionsBar,
} from "./details";

export interface OrderCardDetailsProps {
  order: BackendOrder;
  displayItems: BackendOrderItem[];
  isCancellable: boolean;
  orderNum: string;
  orderPdfUrl?: string | null;
  orderInvoiceNum?: string | null;
  hasPdf: boolean;
  grandTotal: number;
  deliveryAddress: string;
  cancellingOrderId: string | null;
  onCancelOrder: (orderId: string, e: React.MouseEvent) => void;
  onReorder: (order: BackendOrder, e: React.MouseEvent) => void;
}

export function OrderCardDetails({
  order,
  displayItems: fallbackItems,
  isCancellable,
  orderNum,
  orderPdfUrl: propPdfUrl,
  orderInvoiceNum: propInvoiceNum,
  grandTotal: propGrandTotal,
  deliveryAddress: propAddress,
  cancellingOrderId,
  onCancelOrder,
  onReorder,
}: OrderCardDetailsProps) {
  // Fetch detailed order payload on demand when expanded
  const { data: detailOrder, isLoading: isDetailLoading } = useOrderDetailQuery(order.id);

  // Merge shallow list order data with detailed order data
  const fullOrder: BackendOrder = detailOrder ? { ...order, ...detailOrder } : order;

  const isCancelled = fullOrder.status?.toUpperCase() === "CANCELLED";

  // Effective invoice properties
  const effectivePdfUrl =
    fullOrder.pdf_url ||
    fullOrder.pdfUrl ||
    fullOrder.invoice_url ||
    fullOrder.invoiceUrl ||
    propPdfUrl ||
    null;

  const effectiveInvoiceNum =
    fullOrder.invoice_number ||
    fullOrder.invoiceNumber ||
    propInvoiceNum ||
    (effectivePdfUrl?.includes("INV-")
      ? effectivePdfUrl.match(/INV-[\w-]+/)?.[0]
      : null);

  const effectiveHasPdf = Boolean(effectivePdfUrl);

  // Items extraction
  const detailedItems: BackendOrderItem[] =
    fullOrder.items && fullOrder.items.length > 0
      ? fullOrder.items
      : fallbackItems;

  // Price calculations
  const totalAmount = Number(
    fullOrder.grandTotal ||
      fullOrder.grand_total ||
      fullOrder.totalAmount ||
      fullOrder.total_amount ||
      fullOrder.amount ||
      propGrandTotal ||
      0
  );

  const subtotal = Number(
    fullOrder.subtotal ||
      fullOrder.totalAmount ||
      totalAmount
  );

  const discountTotal = Number(
    fullOrder.discountTotal ||
      fullOrder.discount_total ||
      0
  );

  const shippingTotal = Number(
    fullOrder.shippingTotal ||
      fullOrder.shipping_total ||
      0
  );

  const taxTotal = Number(
    fullOrder.taxTotal ||
      fullOrder.tax_total ||
      0
  );

  // Shipping Address extraction
  const addr =
    fullOrder.shippingAddress ||
    fullOrder.shipping_address ||
    fullOrder.billingAddress ||
    fullOrder.billing_address;

  const recipientName =
    addr?.name ||
    addr?.fullName ||
    addr?.recipient_name ||
    addr?.recipientName;

  const recipientPhone =
    addr?.phone ||
    addr?.contactPhone ||
    addr?.contact_phone;

  const addressLine1 =
    addr?.addressLine1 ||
    addr?.address_line1 ||
    addr?.address;

  const addressLine2 =
    addr?.addressLine2 ||
    addr?.address_line2;

  const area = addr?.area || addr?.landmark;
  const city = addr?.city;
  const state = addr?.state;
  const pincode = addr?.pincode || addr?.postalCode || addr?.postal_code;

  const fullAddressString =
    addr?.formattedAddress ||
    addr?.formatted_address ||
    [addressLine1, addressLine2, area, city, state, pincode]
      .filter(Boolean)
      .join(", ") ||
    propAddress;

  const dateString = fullOrder.date
    ? `${fullOrder.date}${fullOrder.time ? ` at ${fullOrder.time}` : ""}`
    : fullOrder.createdAt || fullOrder.created_at
    ? new Date(fullOrder.createdAt || fullOrder.created_at || "").toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      )
    : "Recently placed";

  return (
    <div className="pt-4 border-t border-gray-100 space-y-4">
      {/* 1. GST Invoice Details Banner */}
      {!isCancelled && (
        <OrderGstBanner
          orderId={fullOrder.id}
          orderNumber={effectiveInvoiceNum || orderNum}
          orderStatus={fullOrder.status}
          pdfUrl={effectivePdfUrl}
          invoiceNumber={effectiveInvoiceNum}
          hasPdf={effectiveHasPdf}
        />
      )}

      {/* 2. Order Lifecycle Timeline Bar */}
      {!isCancelled && (
        <OrderStatusTimeline
          status={fullOrder.status}
          dateString={dateString}
        />
      )}

      {/* 3. Items Ordered Full List */}
      <OrderItemsDetailList
        items={detailedItems}
        isLoading={isDetailLoading}
      />

      {/* 4. Two Column Layout: Delivery Address & Bill Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Delivery Address Card */}
        <OrderDeliveryAddressCard
          recipientName={recipientName}
          fullAddress={fullAddressString}
          recipientPhone={recipientPhone}
          paymentMethod={fullOrder.paymentMethod || fullOrder.payment_method}
          paymentStatus={fullOrder.paymentStatus}
        />

        {/* Bill Summary Card */}
        <OrderBillSummaryCard
          subtotal={subtotal}
          shippingTotal={shippingTotal}
          discountTotal={discountTotal}
          taxTotal={taxTotal}
          totalAmount={totalAmount}
        />
      </div>

      {/* 5. Footer Action Controls: Cancel & Reorder */}
      <OrderActionsBar
        order={fullOrder}
        isCancellable={isCancellable}
        cancellingOrderId={cancellingOrderId}
        itemsCount={detailedItems.length}
        onCancelOrder={onCancelOrder}
        onReorder={onReorder}
      />
    </div>
  );
}

// Re-export subcomponents for modular usage elsewhere if needed
export {
  OrderGstBanner,
  OrderStatusTimeline,
  OrderItemsDetailList,
  OrderDeliveryAddressCard,
  OrderBillSummaryCard,
  OrderActionsBar,
};
