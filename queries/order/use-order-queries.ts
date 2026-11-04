"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService, GetOrdersParams } from "@/lib/api/order-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import { BackendOrder } from "@/types/order";
import { getStoredAccessToken } from "@/lib/auth/token-storage";

export interface UseMyOrdersOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useMyOrdersQuery(
  params?: GetOrdersParams,
  options?: UseMyOrdersOptions
) {
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const sortBy = params?.sortBy || "created_at";
  const sortOrder = params?.sortOrder || "desc";
  const status = params?.status;

  const queryKey = QUERY_KEYS.ORDERS.LIST({
    page,
    limit,
    sortBy,
    sortOrder,
    ...(status ? { status } : {}),
  });

  return useQuery<BackendOrder[]>({
    queryKey,
    queryFn: () => orderService.getMyOrders({ page, limit, sortBy, sortOrder, status }),
    enabled: options?.enabled !== undefined ? options.enabled && !!token : !!token,
    staleTime: 1000 * 60 * 2, // 2 minutes: reuse cached data and avoid redundant re-fetches
    refetchOnWindowFocus: false, // avoid re-fetching when switching between browser tabs or devtools
    refetchInterval: options?.refetchInterval ?? false, // Disabled by default to prevent spamming the backend
  });
}

export function useOrderDetailQuery(orderId: string) {
  return useQuery<BackendOrder | null>({
    queryKey: QUERY_KEYS.ORDERS.DETAIL(orderId),
    queryFn: () => orderService.getOrder(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      orderService.cancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
    },
  });
}

export function useOrderTrackingEventsQuery(orderId?: string) {
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;

  return useQuery({
    queryKey: ["tracking", "orders", orderId, "events"],
    queryFn: () => (orderId ? orderService.getOrderTrackingEvents(orderId) : Promise.resolve([])),
    enabled: !!token && !!orderId,
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 15,
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      status,
      notes,
    }: {
      orderId: string;
      status: "CONFIRMED" | "PROCESSING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
      notes?: string;
    }) => orderService.updateOrderStatus(orderId, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.DETAIL(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: ["tracking", "orders", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
    },
  });
}
