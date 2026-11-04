"use client";

import React from "react";
import { BackendOrder, BackendOrderItem } from "@/types/order";
import { formatCurrency } from "@/lib/utils";
import {
  MapPin,
  Phone,
  CreditCard,
  Clock,
  Calendar,
  CheckCircle2,
  Package,
  Truck,
  Home,
  XCircle,
  RefreshCw,
  Loader2,
  FileText,
  Sparkles,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SafeImage } from "@/components/ui/safe-image";
import { OrderInvoiceActions } from "@/components/orders/order-invoice-actions";
import { useOrderDetailQuery } from "@/queries/order/use-order-queries";

interface OrderCardDetailsProps {
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
  hasPdf: propHasPdf,
  grandTotal: propGrandTotal,
  deliveryAddress: propAddress,
  cancellingOrderId,
  onCancelOrder,
  onReorder,
}: OrderCardDetailsProps) {
  // Fetch full order details on-demand when expanded
  const { data: detailOrder, isLoading: isDetailLoading } = useOrderDetailQuery(order.id);

  // Merge list order data with detailed order data
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

  // Order timeline calculations
  const statusUpper = (fullOrder.status || "CONFIRMED").toUpperCase();
  const currentStepIndex =
    statusUpper === "DELIVERED"
      ? 4
      : statusUpper === "OUT_FOR_DELIVERY"
      ? 3
      : statusUpper === "PROCESSING" || statusUpper === "PACKED"
      ? 2
      : statusUpper === "CONFIRMED"
      ? 1
      : 0; // PENDING / PLACED

  const steps = [
    { id: "placed", title: "Placed", icon: CheckCircle2 },
    { id: "confirmed", title: "Confirmed", icon: CheckCircle2 },
    { id: "packed", title: "Packed", icon: Package },
    { id: "out", title: "Out for Delivery", icon: Truck },
    { id: "delivered", title: "Delivered", icon: Home },
  ];

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
      {/* 1. GST Invoice Details Box */}
      {!isCancelled && (
        <div className="bg-gradient-to-r from-emerald-50/60 via-white to-gray-50/60 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-[#0c831f]" />
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                GST Tax Invoice
              </h4>
              {effectiveHasPdf ? (
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-white border border-emerald-200/90 px-2 py-0.5 rounded-md shadow-2xs">
                  {effectiveInvoiceNum || "Generated"}
                </span>
              ) : (
                <span className="text-[10px] font-medium text-amber-700 bg-amber-100/70 border border-amber-200/60 px-2 py-0.5 rounded-md">
                  Ready to Generate
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {effectiveHasPdf
                ? `Official tax receipt for order ${orderNum}. Download PDF or preview inline.`
                : "Invoice not generated yet. You can generate, preview, and download your GST invoice below."}
            </p>
          </div>

          <OrderInvoiceActions
            orderId={fullOrder.id}
            orderNumber={effectiveInvoiceNum || orderNum}
            orderStatus={fullOrder.status}
            pdfUrl={effectivePdfUrl}
            invoiceNumber={effectiveInvoiceNum}
            showBadge={false}
          />
        </div>
      )}

      {/* 2. Order Lifecycle Timeline Bar */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                Order Status Tracking
              </h4>
            </div>
            <span className="text-[11px] font-medium text-gray-500">
              {dateString}
            </span>
          </div>

          <div className="relative flex items-center justify-between">
            {/* Background connecting line */}
            <div className="absolute top-4 left-6 right-6 h-1 bg-gray-100 -translate-y-1/2 z-0" />
            <div
              className="absolute top-4 left-6 h-1 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500"
              style={{
                width: `${(currentStepIndex / (steps.length - 1)) * 90}%`,
              }}
            />

            {steps.map((step, idx) => {
              const isPassed = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className="relative z-10 flex flex-col items-center gap-1.5"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isPassed
                        ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30 ring-4 ring-emerald-50"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[11px] text-center font-medium ${
                      isCurrent
                        ? "text-emerald-700 font-bold"
                        : isPassed
                        ? "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Items Ordered Full List */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
          <h4 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Items Ordered ({detailedItems.length})</span>
          </h4>
          {isDetailLoading && (
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
              <span>Fetching details...</span>
            </span>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {detailedItems.map((item, idx) => {
            const name =
              item.productName ||
              item.product_name ||
              item.name ||
              `Item #${idx + 1}`;
            const qty = item.quantity || item.qty || 1;
            const price = Number(
              item.unitPrice || item.unit_price || item.price || 0
            );
            const itemTotal = Number(
              item.totalPrice || item.total_price || price * qty || 0
            );
            const img =
              item.imageUrl ||
              item.image_url ||
              item.thumbnail_url ||
              item.image ||
              "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200";

            return (
              <div
                key={idx}
                className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl border border-gray-100 bg-gray-50/60 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                    <SafeImage
                      src={img}
                      alt={name}
                      width={48}
                      height={48}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                      {name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                      {item.unit && (
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-medium">
                          {item.unit}
                        </span>
                      )}
                      <span>
                        {formatCurrency(price || itemTotal / qty)} × {qty}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs sm:text-sm font-bold text-gray-900">
                    {formatCurrency(itemTotal || price * qty)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Two Column Layout: Delivery Address & Bill Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Delivery Address Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">
              Delivery Address
            </h4>
          </div>

          <div className="space-y-1.5 text-xs text-gray-600">
            {recipientName && (
              <p className="font-bold text-gray-900 text-sm">{recipientName}</p>
            )}
            <p className="leading-relaxed text-gray-700">
              {fullAddressString}
            </p>
            {recipientPhone && (
              <p className="flex items-center gap-1.5 text-gray-500 pt-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{recipientPhone}</span>
              </p>
            )}
          </div>

          {/* Payment Method Details */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-gray-400" />
              <span>Payment Mode:</span>
              <strong className="uppercase text-gray-800 font-semibold">
                {fullOrder.paymentMethod || fullOrder.payment_method || "RAZORPAY"}
              </strong>
            </span>
            {fullOrder.paymentStatus && (
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  fullOrder.paymentStatus === "PAID"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {fullOrder.paymentStatus}
              </span>
            )}
          </div>
        </div>

        {/* Bill Summary Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">
              Bill Summary
            </h4>
          </div>

          <dl className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <dt>Items Subtotal</dt>
              <dd className="font-medium text-gray-900">
                {formatCurrency(subtotal)}
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt>Delivery Charge</dt>
              <dd className="text-emerald-700 font-bold">
                {shippingTotal > 0 ? formatCurrency(shippingTotal) : "FREE"}
              </dd>
            </div>

            {discountTotal > 0 && (
              <div className="flex items-center justify-between text-emerald-700 font-medium">
                <dt>Savings & Discount</dt>
                <dd>-{formatCurrency(discountTotal)}</dd>
              </div>
            )}

            {taxTotal > 0 && (
              <div className="flex items-center justify-between">
                <dt>Taxes & GST</dt>
                <dd className="font-medium text-gray-900">
                  {formatCurrency(taxTotal)}
                </dd>
              </div>
            )}
          </dl>

          <div className="pt-2.5 border-t border-dashed border-gray-200 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900">Total Paid</span>
            <span className="text-base sm:text-lg font-extrabold text-gray-900">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Footer Action Controls: Cancel & Reorder */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-3">
          {isCancellable && (
            <button
              type="button"
              disabled={cancellingOrderId === fullOrder.id}
              onClick={(e) => onCancelOrder(fullOrder.id, e)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {cancellingOrderId === fullOrder.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              <span>Cancel Order</span>
            </button>
          )}
        </div>

        <Button
          size="sm"
          onClick={(e) => onReorder(fullOrder, e)}
          className="bg-[#0c831f] hover:bg-[#0a6f1a] text-white text-xs font-bold px-5 h-9 rounded-xl cursor-pointer shadow-xs"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          <span>Reorder {detailedItems.length > 0 ? `(${detailedItems.length} items)` : ""}</span>
        </Button>
      </div>
    </div>
  );
}
