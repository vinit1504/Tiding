"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { paymentService, orderService } from "@/lib/api";
import { QUERY_KEYS } from "@/queries/query-keys";
import {
  PaymentIntentPayload,
  PaymentVerifyPayload,
  CreateOrderPayload,
} from "@/types/payment";
import { getStoredAccessToken } from "@/lib/auth/token-storage";
import { useCurrentUserId } from "@/hooks/use-auth";

export function useCreatePaymentIntentMutation() {
  return useMutation({
    mutationFn: (payload: PaymentIntentPayload) =>
      paymentService.createPaymentIntent(payload),
  });
}

export function useVerifyPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentVerifyPayload) =>
      paymentService.verifyPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PAYMENTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
    },
  });
}

export function useCreateOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) =>
      orderService.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
    },
  });
}

export function useMyPaymentsQuery() {
  const userId = useCurrentUserId();
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  const isAuthed = !!token && token !== "token_vinit_default" && !!userId;

  return useQuery({
    queryKey: QUERY_KEYS.PAYMENTS.LIST(userId),
    queryFn: () => paymentService.getMyPayments(),
    enabled: isAuthed,
    staleTime: 1000 * 60,
  });
}
