"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { couponService } from "@/lib/api/coupon-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import {
  ValidateCouponPayload,
  RedeemCouponCheckoutPayload,
  RollbackCouponPayload,
} from "@/types/coupon";

export function useValidateCouponMutation() {
  return useMutation({
    mutationFn: (payload: ValidateCouponPayload) => couponService.validateCoupon(payload),
  });
}

export function useApplyCouponEngineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RedeemCouponCheckoutPayload) => couponService.applyCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.DETAIL() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COUPONS.ALL });
    },
  });
}

export function useRollbackCouponMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RollbackCouponPayload) => couponService.rollbackCoupon(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CART.DETAIL() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COUPONS.ALL });
    },
  });
}
