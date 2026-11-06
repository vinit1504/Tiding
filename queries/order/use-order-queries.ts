"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService, GetOrdersParams } from "@/lib/api/order-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import { BackendOrder } from "@/types/order";
import { getStoredAccessToken } from "@/lib/auth/token-storage";
import { useCurrentUserId } from "@/hooks/use-auth";

export interface UseMyOrdersOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useMyOrdersQuery(
  params?: GetOrdersParams,
  options?: UseMyOrdersOptions
) {
  const userId = useCurrentUserId();
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  const isAuthed = !!token && token !== "token_vinit_default" && !!userId;

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const sortBy = params?.sortBy || "created_at";
  const sortOrder = params?.sortOrder || "desc";
  const status = params?.status;

  const queryKey = QUERY_KEYS.ORDERS.LIST(
    userId,
    {
      page,
      limit,
      sortBy,
      sortOrder,
      ...(status ? { status } : {}),
    }
  );

  return useQuery<BackendOrder[]>({
    queryKey,
    queryFn: () => orderService.getMyOrders({ page, limit, sortBy, sortOrder, status }),
    enabled: options?.enabled !== undefined ? options.enabled && isAuthed : isAuthed,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    refetchInterval: options?.refetchInterval ?? false,
  });
}

export function useOrderDetailQuery(orderId: string) {
  const userId = useCurrentUserId();
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  const isAuthed = !!token && token !== "token_vinit_default" && !!userId;

  return useQuery<BackendOrder | null>({
    queryKey: QUERY_KEYS.ORDERS.DETAIL(orderId, userId),
    queryFn: () => orderService.getOrder(orderId),
    enabled: isAuthed && !!orderId,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      orderService.cancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.USER(userId) });
      }
    },
  });
}

export function useOrderTrackingEventsQuery(orderId?: string) {
  const userId = useCurrentUserId();
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  const isAuthed = !!token && token !== "token_vinit_default" && !!userId;

  return useQuery({
    queryKey: QUERY_KEYS.ORDERS.TRACKING(orderId || "", userId),
    queryFn: () => (orderId ? orderService.getOrderTrackingEvents(orderId) : Promise.resolve([])),
    enabled: isAuthed && !!orderId,
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 15,
  });
}

export function useUpdateOrderStatusMutation() {
  const queryClient = useQueryClient();
  const userId = useCurrentUserId();

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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.DETAIL(variables.orderId, userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.TRACKING(variables.orderId, userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
    },
  });
}
