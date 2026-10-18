"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService, GetOrdersParams } from "@/lib/api/order-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import { BackendOrder } from "@/types/order";
import { getStoredAccessToken } from "@/lib/auth/token-storage";

export function useMyOrdersQuery(params?: GetOrdersParams) {
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  const page = params?.page || 1;
  const limit = params?.limit || 20;

  return useQuery<BackendOrder[]>({
    queryKey: QUERY_KEYS.ORDERS.LIST(page, limit),
    queryFn: () => orderService.getMyOrders(params),
    enabled: !!token,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 15, // poll every 15 seconds for live status updates
  });
}

export function useOrderDetailQuery(orderId: string) {
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;

  return useQuery<BackendOrder | null>({
    queryKey: QUERY_KEYS.ORDERS.DETAIL(orderId),
    queryFn: () => orderService.getOrder(orderId),
    enabled: !!token && !!orderId,
    staleTime: 1000 * 15,
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
