import { apiClient } from "./api-client";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
import {
  CouponRecord,
  CouponEligibilityResult,
  ValidateCouponPayload,
  CouponValidationResult,
  RedeemCouponCheckoutPayload,
  ApplyCouponResult,
  RollbackCouponPayload,
  CouponUsageRecord,
  CouponQueryFilter,
} from "@/types/coupon";

export class CouponService {
  /**
   * 1. GET /api/v1/coupons?scope=customer&page=1&limit=20&sortBy=created_at&sortOrder=desc
   * List Active Coupons for Customer (Storefront)
   */
  async listActiveCoupons(params?: CouponQueryFilter): Promise<{ coupons: CouponRecord[]; meta?: any }> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const sortBy = params?.sortBy || "created_at";
    const sortOrder = params?.sortOrder || "desc";
    const scope = params?.scope || "customer";

    const query = new URLSearchParams({
      scope,
      page: String(page),
      limit: String(limit),
      sortBy,
      sortOrder,
    });

    if (params?.search) query.set("search", params.search);
    if (typeof params?.isActive !== "undefined") query.set("isActive", String(params.isActive));

    try {
      const res = await apiClient.getWithMeta<CouponRecord[]>(
        `${API_ENDPOINTS.COUPONS.LIST}?${query.toString()}`
      );

      return {
        coupons: Array.isArray(res.data) ? res.data : [],
        meta: res.meta,
      };
    } catch {
      return {
        coupons: [],
      };
    }
  }

  /**
   * 2. GET /api/v1/coupons/:couponId/eligibility
   * Check User Coupon Eligibility & Monthly Quota directly from API
   */
  async checkEligibility(couponId: string): Promise<CouponEligibilityResult> {
    return apiClient.get<CouponEligibilityResult>(
      API_ENDPOINTS.COUPONS.ELIGIBILITY(couponId)
    );
  }

  /**
   * 3. POST /api/v1/coupons/validate (Step 1: Validate Coupon in Cart - Preview Discount)
   * Validates conditions without burning the user's quota.
   */
  async validateCoupon(payload: ValidateCouponPayload): Promise<CouponValidationResult> {
    const res = await apiClient.post<any, ValidateCouponPayload>(
      API_ENDPOINTS.COUPONS.VALIDATE,
      payload
    );

    const couponObj = res?.coupon || {
      id: res?.couponId || "",
      code: res?.code || payload.code,
      name: res?.name || payload.code,
      discount_type: res?.discountType || "FIXED_AMOUNT",
      discount_value: res?.discountValue ?? res?.discountAmount ?? 0,
    };

    const discountAmount = Number(res?.discountAmount ?? 0);
    const finalPayableAmount = Number(
      res?.finalPayableAmount ?? Math.max(0, payload.cartTotal - discountAmount)
    );
    const remainingUserUsages = Number(res?.remainingUserUsages ?? res?.lifetimeUsageRemaining ?? 1);
    const remainingMonthlyUsages = Number(res?.remainingMonthlyUsages ?? res?.monthlyUsageRemaining ?? 0);

    return {
      coupon: couponObj,
      discountAmount,
      finalPayableAmount,
      remainingUserUsages,
      remainingMonthlyUsages,
      isValid: true,
      couponId: couponObj.id,
      code: couponObj.code,
      name: couponObj.name,
      discountType: couponObj.discount_type,
      discountValue:
        typeof couponObj.discount_value === "number"
          ? couponObj.discount_value
          : Number(couponObj.discount_value || 0),
      monthlyUsageRemaining: remainingMonthlyUsages,
      lifetimeUsageRemaining: remainingUserUsages,
      message: res?.message || "Coupon is valid and applicable",
    };
  }

  /**
   * 4. POST /api/v1/coupons/apply (Step 2: Apply & Lock Coupon at Checkout / Order Placement)
   * Locks the redemption and increments usage counters.
   */
  async applyCoupon(payload: RedeemCouponCheckoutPayload): Promise<ApplyCouponResult> {
    const res = await apiClient.post<any, RedeemCouponCheckoutPayload>(
      API_ENDPOINTS.COUPONS.APPLY,
      payload
    );

    return {
      usageId: res?.usageId || res?.id || "",
      discountAmount: Number(res?.discountAmount ?? 0),
      finalPayableAmount: Number(res?.finalPayableAmount ?? 0),
      remainingUserUsages: Number(res?.remainingUserUsages ?? 0),
      remainingMonthlyUsages: Number(res?.remainingMonthlyUsages ?? 0),
      message: res?.message || "Coupon applied successfully",
      success: true,
    };
  }

  /**
   * 5. POST /api/v1/coupons/rollback
   * Rollback Coupon Usage (On Order Cancellation)
   */
  async rollbackCoupon(payload: RollbackCouponPayload): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }, RollbackCouponPayload>(
      API_ENDPOINTS.COUPONS.ROLLBACK,
      payload
    );
  }

  /**
   * 6. GET /api/v1/coupons/usages/my?page=1&limit=10
   * My Coupon Redemption History
   */
  async getMyCouponUsages(params?: { page?: number; limit?: number }): Promise<{
    usages: CouponUsageRecord[];
    meta?: any;
  }> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;

    try {
      const res = await apiClient.getWithMeta<CouponUsageRecord[]>(
        `${API_ENDPOINTS.COUPONS.MY_USAGES}?page=${page}&limit=${limit}`,
        { fallbackData: [] }
      );
      return {
        usages: Array.isArray(res.data) ? res.data : [],
        meta: res.meta,
      };
    } catch {
      return { usages: [] };
    }
  }
}

export const couponService = new CouponService();
