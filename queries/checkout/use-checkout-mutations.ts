"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkoutService } from "@/lib/api/checkout-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import {
  InitiateCheckoutDto,
  SelectAddressDto,
  SelectDeliveryDto,
  CompleteCheckoutDto,
  VerifyPaymentDto,
} from "@/types/checkout";
import { getStoredAccessToken } from "@/lib/auth/token-storage";
import { useCurrentUserId } from "@/hooks/use-auth";

export function useActiveCheckoutQuery() {
  const userId = useCurrentUserId();
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  const isAuthed = !!token && token !== "token_vinit_default" && !!userId;

  return useQuery({
    queryKey: QUERY_KEYS.CHECKOUT.ACTIVE(userId),
    queryFn: () => checkoutService.getActiveCheckout(),
    enabled: isAuthed,
    staleTime: 1000 * 30,
  });
}

export function useInitiateCheckoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto?: InitiateCheckoutDto) => checkoutService.initiateCheckout(dto),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.CHECKOUT.ACTIVE(), data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.ALL });
    },
  });
}

export function useSelectAddressMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkoutId, dto }: { checkoutId: string; dto: SelectAddressDto }) =>
      checkoutService.selectAddress(checkoutId, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.CHECKOUT.ACTIVE(), data);
    },
  });
}

export function useSelectDeliveryOptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkoutId, dto }: { checkoutId: string; dto: SelectDeliveryDto }) =>
      checkoutService.selectDeliveryOption(checkoutId, dto),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.CHECKOUT.ACTIVE(), data);
    },
  });
}

export function useApplyCheckoutCouponMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkoutId, code }: { checkoutId: string; code: string }) =>
      checkoutService.applyCoupon(checkoutId, code),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.CHECKOUT.ACTIVE(), data);
    },
  });
}

export function useRemoveCheckoutCouponMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (checkoutId: string) => checkoutService.removeCoupon(checkoutId),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.CHECKOUT.ACTIVE(), data);
    },
  });
}

export function useRecalculateCheckoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (checkoutId: string) => checkoutService.recalculate(checkoutId),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.CHECKOUT.ACTIVE(), data);
    },
  });
}

export function useCheckoutPaymentIntentMutation() {
  return useMutation({
    mutationFn: ({
      checkoutId,
      paymentMethod,
    }: {
      checkoutId: string;
      paymentMethod?: "COD" | "RAZORPAY" | "WALLET";
    }) => checkoutService.createPaymentIntent(checkoutId, paymentMethod),
  });
}

export function useCheckoutVerifyPaymentMutation() {
  return useMutation({
    mutationFn: ({ checkoutId, dto }: { checkoutId: string; dto: VerifyPaymentDto }) =>
      checkoutService.verifyPayment(checkoutId, dto),
  });
}

export function useCompleteCheckoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkoutId, dto }: { checkoutId: string; dto?: CompleteCheckoutDto }) =>
      checkoutService.completeCheckout(checkoutId, dto),
    onSuccess: () => {
      // Stock has committed, cart is converted, order is created
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHECKOUT.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INVENTORY.ALL });
    },
  });
}

export function useCancelCheckoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (checkoutId: string) => checkoutService.cancelCheckout(checkoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHECKOUT.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.ALL });
    },
  });
}
