"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/safe-image";
import {
  Check,
  ChevronRight,
  ShoppingBag,
  RefreshCw,
  FileText,
  Clock,
  Truck,
  MapPin,
  XCircle,
  Package,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { AccountSidebar } from "@/components/account/account-sidebar";
import { useAtom, useAtomValue } from "jotai";
import {
  userProfileAtom,
  authSessionAtom,
  cartItemsAtom,
  isCartDrawerOpenAtom,
  isAuthDrawerOpenAtom,
} from "@/stores";
import { formatCurrency, slugify } from "@/lib/utils";
import { CartItem } from "@/types/cart";
import { BackendOrder, BackendOrderItem } from "@/types/order";
import { useMyOrdersQuery, useCancelOrderMutation } from "@/queries/order/use-order-queries";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function OrdersPage() {
  const user = useAtomValue(userProfileAtom);
  const session = useAtomValue(authSessionAtom);
  const [, setCartItems] = useAtom(cartItemsAtom);
  const [, setIsCartDrawerOpen] = useAtom(isCartDrawerOpenAtom);
  const [, setIsAuthDrawerOpen] = useAtom(isAuthDrawerOpenAtom);

  const [mounted, setMounted] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Live order query directly from backend API: GET /api/v1/orders
  const {
    data: orders = [],
    isLoading,
    isError,
    refetch,
  } = useMyOrdersQuery({
    page: 1,
    limit: 20,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const cancelOrderMutation = useCancelOrderMutation();

  const handleCancelOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to cancel this order?")) return;

    setCancellingOrderId(orderId);
    try {
      await cancelOrderMutation.mutateAsync({
        orderId,
        reason: "Customer cancelled via orders dashboard",
      });
      toast.success("Order cancelled successfully.");
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel order. Please contact support.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleReorder = (order: BackendOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!order.items || order.items.length === 0) {
      toast.error("No items found to reorder.");
      return;
    }

    const newItems: CartItem[] = order.items.map((item, idx) => {
      const name = item.productName || item.product_name || item.name || "Grocery Item";
      const unitPrice = Number(item.unitPrice || item.unit_price || item.price || 50);
      const qty = item.quantity || item.qty || 1;
      const imageUrl =
        item.imageUrl ||
        item.image_url ||
        item.thumbnail_url ||
        item.image ||
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200";

      return {
        id: item.variantId || item.variant_id || item.productId || item.product_id || `reorder-${order.id}-${idx}`,
        productId: item.productId || item.product_id || `prod-${order.id}-${idx}`,
        variantId: item.variantId || item.variant_id,
        name,
        slug: slugify(name),
        image_url: imageUrl,
        unit: item.unit || "1 pack",
        price: unitPrice,
        mrp: unitPrice + 10,
        quantity: qty,
        maxStock: 20,
      };
    });

    setCartItems(newItems);
    try {
      localStorage.setItem("tiding_cart", JSON.stringify(newItems));
    } catch {}
    setIsCartDrawerOpen(true);
    toast.success(`Reordering ${newItems.length} items from #${order.orderNumber || order.order_number || order.id.slice(0, 8)}!`);
  };

  const handleDownloadInvoice = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.print();
  };

  const getStatusBadge = (status: string) => {
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
  };

  if (!mounted) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#f4f6fb] py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-6 items-start animate-pulse">
          <div className="w-full md:w-64 h-64 bg-white rounded-2xl border border-gray-200/80" />
          <div className="flex-1 space-y-4 w-full">
            <div className="h-28 bg-white rounded-2xl border border-gray-200/80" />
            <div className="h-28 bg-white rounded-2xl border border-gray-200/80" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f4f6fb] py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-6 items-start">
        {/* Left Sidebar */}
        <AccountSidebar activeTab="orders" />

        {/* Right Content Panel */}
        <main className="flex-1 w-full space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-4 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-gray-200" />
                      <div className="space-y-1">
                        <div className="h-4 w-32 bg-gray-200 rounded" />
                        <div className="h-3 w-24 bg-gray-200 rounded" />
                      </div>
                    </div>
                    <div className="h-4 w-4 bg-gray-200 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-16 w-16 bg-gray-100 rounded-xl" />
                    <div className="h-16 w-16 bg-gray-100 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="bg-white rounded-2xl border border-rose-200/80 p-8 text-center space-y-3 shadow-xs">
              <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
              <h3 className="text-base font-bold text-gray-900">
                Failed to load your orders
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Could not connect to the orders service. Please check your network connection or try again.
              </p>
              <Button
                size="sm"
                onClick={() => refetch()}
                className="bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-xs"
              >
                Retry
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center space-y-4 shadow-xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <ShoppingBag className="h-8 w-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                No orders placed yet
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                You haven&apos;t placed any grocery orders yet. Start exploring fresh vegetables, dairy, and essentials!
              </p>
              <Link href="/" className="inline-block pt-2">
                <Button className="bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-xs px-6">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            orders.map((order) => {
              const isExpanded = selectedOrderId === order.id;
              const statusInfo = getStatusBadge(order.status);
              const orderNum = order.orderNumber || order.order_number || `#${order.id.slice(0, 8)}`;
              const grandTotal = Number(order.grandTotal || order.grand_total || order.totalAmount || order.total_amount || order.subtotal || 0);
              const dateDisplay = order.createdAt || order.created_at
                ? new Date(order.createdAt || order.created_at || "").toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
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

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(isExpanded ? null : order.id)}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 space-y-4 shadow-xs transition-all hover:border-gray-300 cursor-pointer"
                >
                  {/* Top Status & Price Row */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Status Icon */}
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${statusInfo.bg}`}>
                        {statusInfo.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900">
                            {statusInfo.title}
                          </h3>
                          <span className="text-[10px] font-mono font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {orderNum}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                          {formatCurrency(grandTotal)} • {dateDisplay}
                        </p>
                      </div>
                    </div>

                    {/* Chevron Right */}
                    <ChevronRight
                      className={`h-4 w-4 text-gray-400 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>

                  {/* Product Images in Square Bordered Boxes */}
                  <div className="flex items-center gap-3 overflow-x-auto pt-1 pb-0.5">
                    {order.items?.map((item: BackendOrderItem, idx: number) => {
                      const name = item.productName || item.product_name || item.name || "Product";
                      const img =
                        item.imageUrl ||
                        item.image_url ||
                        item.thumbnail_url ||
                        item.image ||
                        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200";

                      return (
                        <div
                          key={idx}
                          className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl border border-gray-200/90 bg-white p-1 flex items-center justify-center overflow-hidden relative group"
                          title={name}
                        >
                          <SafeImage
                            src={img}
                            alt={name}
                            width={60}
                            height={60}
                            className="h-full w-full object-contain"
                          />
                          {(item.quantity || item.qty || 1) > 1 && (
                            <span className="absolute bottom-1 right-1 bg-gray-900/80 text-white text-[9px] font-bold px-1 rounded">
                              {item.quantity || item.qty}x
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Expandable Order Details & Actions */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <div className="space-y-1.5 text-xs">
                        <p className="font-semibold text-gray-700">
                          Items ordered:
                        </p>
                        {order.items?.map((item: BackendOrderItem, idx: number) => {
                          const name = item.productName || item.product_name || item.name || "Item";
                          const qty = item.quantity || item.qty || 1;
                          const price = Number(item.unitPrice || item.unit_price || item.price || 0);
                          const total = Number(item.totalPrice || item.total_price || (price * qty) || 0);

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-gray-600 py-1 border-b border-gray-50 last:border-none"
                            >
                              <span className="truncate pr-2">
                                {name} {item.unit ? `(${item.unit})` : ""} × {qty}
                              </span>
                              <span className="font-bold text-gray-900 shrink-0">
                                {formatCurrency(total || price * qty)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Delivery Address */}
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1">
                        <MapPin className="h-3.5 w-3.5 text-[#0c831f] shrink-0" />
                        <span className="truncate">{deliveryAddress}</span>
                      </div>

                      {/* Payment info */}
                      {order.paymentMethod && (
                        <div className="text-[11px] text-gray-500 flex items-center gap-2">
                          <span>Payment Mode: <strong className="uppercase text-gray-700">{order.paymentMethod}</strong></span>
                          {order.paymentStatus && (
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                              order.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                            }`}>
                              {order.paymentStatus}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => handleDownloadInvoice(order.id, e)}
                            className="text-xs font-semibold text-gray-600 hover:text-[#0c831f] flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            <span>Download Receipt</span>
                          </button>

                          {isCancellable && (
                            <button
                              type="button"
                              disabled={cancellingOrderId === order.id}
                              onClick={(e) => handleCancelOrder(order.id, e)}
                              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {cancellingOrderId === order.id ? (
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
                          onClick={(e) => handleReorder(order, e)}
                          className="bg-[#0c831f] hover:bg-[#0a6f1a] text-white text-xs font-bold px-4 h-8 rounded-lg cursor-pointer"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          <span>Reorder</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}
