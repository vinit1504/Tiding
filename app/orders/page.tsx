"use client";

import React, { useState, useEffect } from "react";
import { AccountLayout } from "@/components/account/account-layout";
import { useAtom } from "jotai";
import { cartItemsAtom, isCartDrawerOpenAtom } from "@/stores";
import { slugify } from "@/lib/utils";
import { CartItem } from "@/types/cart";
import { BackendOrder } from "@/types/order";
import {
  useMyOrdersQuery,
  useCancelOrderMutation,
} from "@/queries/order/use-order-queries";
import { toast } from "sonner";
import { OrdersSkeleton } from "@/components/orders/orders-skeleton";
import { OrdersEmptyState } from "@/components/orders/orders-empty-state";
import { OrdersErrorState } from "@/components/orders/orders-error-state";
import { OrderCard } from "@/components/orders/order-card";

const DEFAULT_ORDERS_PARAMS = {
  page: 1,
  limit: 20,
  sortBy: "created_at",
  sortOrder: "desc" as const,
};

export default function OrdersPage() {
  const [, setCartItems] = useAtom(cartItemsAtom);
  const [, setIsCartDrawerOpen] = useAtom(isCartDrawerOpenAtom);

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
  } = useMyOrdersQuery(DEFAULT_ORDERS_PARAMS);

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
      const name =
        item.productName || item.product_name || item.name || "Grocery Item";
      const unitPrice = Number(
        item.unitPrice || item.unit_price || item.price || 50
      );
      const qty = item.quantity || item.qty || 1;
      const imageUrl =
        item.imageUrl ||
        item.image_url ||
        item.thumbnail_url ||
        item.image ||
        "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200";

      return {
        id:
          item.variantId ||
          item.variant_id ||
          item.productId ||
          item.product_id ||
          `reorder-${order.id}-${idx}`,
        productId:
          item.productId || item.product_id || `prod-${order.id}-${idx}`,
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
    toast.success(
      `Reordering ${newItems.length} items from #${
        order.orderNumber || order.order_number || order.id.slice(0, 8)
      }!`
    );
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
    <AccountLayout activeTab="orders" mainClassName="space-y-4">
      {isLoading ? (
        <OrdersSkeleton count={3} />
      ) : isError ? (
        <OrdersErrorState onRetry={() => refetch()} />
      ) : orders.length === 0 ? (
        <OrdersEmptyState />
      ) : (
        orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            isExpanded={selectedOrderId === order.id}
            onToggleExpand={() =>
              setSelectedOrderId(selectedOrderId === order.id ? null : order.id)
            }
            cancellingOrderId={cancellingOrderId}
            onCancelOrder={handleCancelOrder}
            onReorder={handleReorder}
          />
        ))
      )}
    </AccountLayout>
  );
}
