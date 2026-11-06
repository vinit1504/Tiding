"use client";

import { useQuery } from "@tanstack/react-query";
import { couponService } from "@/lib/api/coupon-service";
import { QUERY_KEYS } from "@/queries/query-keys";
import { CouponQueryFilter } from "@/types/coupon";
import { getStoredAccessToken } from "@/lib/auth/token-storage";
import { useCurrentUserId } from "@/hooks/use-auth";

export function useCouponsQuery(params?: CouponQueryFilter) {
  return useQuery({
    queryKey: QUERY_KEYS.COUPONS.LIST(params as Record<string, unknown>),
    queryFn: () => couponService.listActiveCoupons(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCouponEligibilityQuery(couponId?: string) {
  const userId = useCurrentUserId();
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  const isAuthed = !!token && token !== "token_vinit_default" && !!userId;

  return useQuery({
    queryKey: QUERY_KEYS.COUPONS.ELIGIBILITY(couponId || "", userId),
    queryFn: () => (couponId ? couponService.checkEligibility(couponId) : null),
    enabled: isAuthed && !!couponId,
    staleTime: 1000 * 30,
  });
}

export function useMyCouponUsagesQuery(params?: { page?: number; limit?: number }) {
  const userId = useCurrentUserId();
  const token = typeof window !== "undefined" ? getStoredAccessToken() : null;
  const isAuthed = !!token && token !== "token_vinit_default" && !!userId;

  return useQuery({
    queryKey: QUERY_KEYS.COUPONS.USAGES(userId, params),
    queryFn: () => couponService.getMyCouponUsages(params),
    enabled: isAuthed,
    staleTime: 1000 * 60,
  });
}
