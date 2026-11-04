"use client";

import React from "react";
import { BackendOrder, BackendOrderItem } from "@/types/order";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, FileText, CalendarClock } from "lucide-react";
import { OrderStatusBadge, getOrderStatusInfo } from "@/components/orders/order-status-badge";
import { OrderItemsThumbnails } from "@/components/orders/order-items-thumbnails";
import { OrderCardDetails } from "@/components/orders/order-card-details";
import { OrderInvoiceActions } from "@/components/orders/order-invoice-actions";

interface OrderCardProps {
  order: BackendOrder;
  isExpanded: boolean;
  onToggleExpand: () => void;
  cancellingOrderId: string | null;
  onCancelOrder: (orderId: string, e: React.MouseEvent) => void;
  onReorder: (order: BackendOrder, e: React.MouseEvent) => void;
}

export function OrderCard({
  order,
  isExpanded,
  onToggleExpand,
  cancellingOrderId,
  onCancelOrder,
  onReorder,
}: OrderCardProps) {
  const statusInfo = getOrderStatusInfo(order.status);
  const orderNum =
    order.orderNumber || order.order_number || `#${order.id.slice(0, 8)}`;
  const grandTotal = Number(
    order.grandTotal ||
      order.grand_total ||
      order.totalAmount ||
      order.total_amount ||
      order.amount ||
      order.subtotal ||
      0
  );
  const orderPdfUrl =
    order.pdf_url ||
    order.pdfUrl ||
    order.invoice_url ||
    order.invoiceUrl ||
    null;
  const orderInvoiceNum =
    order.invoice_number ||
    order.invoiceNumber ||
    (orderPdfUrl?.includes("INV-") ? orderPdfUrl.match(/INV-[\w-]+/)?.[0] : null);
  const hasPdf = Boolean(orderPdfUrl);

  const dateDisplay = order.date
    ? `${order.date}${order.time ? ` • ${order.time}` : ""}`
    : order.createdAt || order.created_at
    ? new Date(order.createdAt || order.created_at || "").toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }
      )
    : "Recent order";

  const deliveryAddress =
    order.shippingAddress?.addressLine1 ||
    order.shipping_address?.addressLine1 ||
    order.shippingAddress?.formattedAddress ||
    order.shipping_address?.formattedAddress ||
    order.shippingAddress?.area ||
    order.shipping_address?.area ||
    "Delivery Address Registered";

  const isCancellable =
    order.status === "PENDING" ||
    order.status === "CONFIRMED" ||
    order.status === "placed" ||
    order.status === "confirmed";

  // Support both rich items array or fallback image/count
  const displayItems: BackendOrderItem[] =
    order.items && order.items.length > 0
      ? order.items
      : order.image_url || order.image
      ? [
          {
            imageUrl: order.image_url || order.image,
            productName: "Grocery item",
            quantity: order.items_count || 1,
          },
        ]
      : [];

  const isCancelled = order.status?.toUpperCase() === "CANCELLED";

  // Keyboard support for the clickable card (ignore keys pressed on inner buttons/links)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggleExpand();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      onClick={onToggleExpand}
      onKeyDown={handleKeyDown}
      className={`group relative cursor-pointer overflow-hidden rounded-3xl border bg-white outline-none
        transition-all duration-300 motion-reduce:transition-none
        focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2
        ${
          isExpanded
            ? "border-gray-300 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)] ring-1 ring-gray-900/5"
            : "border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_12px_-6px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_10px_24px_-10px_rgba(0,0,0,0.16)]"
        }
        ${isCancelled && !isExpanded ? "bg-gray-50/70" : ""}`}
    >
      <div className="space-y-4 p-4 sm:p-6">
        {/* Header: status + meta on the left, total on the right */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <OrderStatusBadge status={order.status} />

            <div className="min-w-0">
              <h3
                className={`text-sm font-semibold leading-tight sm:text-base ${
                  isCancelled ? "text-gray-500" : "text-gray-900"
                }`}
              >
                {statusInfo.title}
              </h3>

              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 font-mono text-[11px] font-medium text-gray-600 shadow-xs">
                  {orderNum}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3 w-3 text-gray-400" />
                  {dateDisplay}
                </span>
              </div>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p
              className={`text-base font-bold tabular-nums sm:text-lg ${
                isCancelled ? "text-gray-400 line-through" : "text-gray-900"
              }`}
            >
              {formatCurrency(grandTotal)}
            </p>
            {order.items_count ? (
              <p className="text-xs text-gray-500">
                {order.items_count} {order.items_count === 1 ? "item" : "items"}
              </p>
            ) : null}
          </div>
        </div>

        {/* Product thumbnails */}
        <div
          className={`rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-3 ${
            isCancelled ? "opacity-60 grayscale-[30%]" : ""
          }`}
        >
          <OrderItemsThumbnails
            items={displayItems}
            itemsCount={order.items_count}
          />
        </div>

        {/* Footer: invoice status + actions + expand toggle */}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-dashed border-gray-200 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {!isCancelled &&
              (hasPdf ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">
                  <FileText className="h-3 w-3 text-emerald-600" />
                  {orderInvoiceNum || "Invoice ready"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 text-[11px] font-medium text-amber-700">
                  <FileText className="h-3 w-3 text-amber-600" />
                  Invoice pending
                </span>
              ))}

            {!isCancelled && (
              <div onClick={(e) => e.stopPropagation()}>
                <OrderInvoiceActions
                  orderId={order.id}
                  orderNumber={orderInvoiceNum || orderNum}
                  orderStatus={order.status}
                  pdfUrl={orderPdfUrl}
                  invoiceNumber={orderInvoiceNum}
                  showBadge={false}
                />
              </div>
            )}
          </div>

          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-xs transition-colors group-hover:border-gray-900 group-hover:bg-gray-900 group-hover:text-white">
            {isExpanded ? "Hide details" : "View details"}
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </span>
        </div>

        {/* Expandable order details */}
        {isExpanded && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="-mx-4 -mb-4 border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white p-4 sm:-mx-6 sm:-mb-6 sm:p-6"
          >
            <OrderCardDetails
              order={order}
              displayItems={displayItems}
              isCancellable={isCancellable}
              orderNum={orderNum}
              orderPdfUrl={orderPdfUrl}
              orderInvoiceNum={orderInvoiceNum}
              hasPdf={hasPdf}
              grandTotal={grandTotal}
              deliveryAddress={deliveryAddress}
              cancellingOrderId={cancellingOrderId}
              onCancelOrder={onCancelOrder}
              onReorder={onReorder}
            />
          </div>
        )}
      </div>
    </div>
  );
}