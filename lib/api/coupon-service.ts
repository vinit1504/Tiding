import { apiClient } from "./api-client";
import { API_ENDPOINTS } from "@/lib/constants/api-endpoints";
import {
  CouponRecord,
  CouponEligibilityResult,
  ValidateCouponPayload,
  CouponValidationResult,
  RedeemCouponCheckoutPayload,
  RollbackCouponPayload,
  CouponUsageRecord,
  CouponQueryFilter,
} from "@/types/coupon";

export class CouponService {
  /**
   * 1. GET /api/v1/coupons?page=1&limit=20&sortBy=created_at&sortOrder=desc
   * List Active Coupons (Storefront) - Fetched dynamically from Backend API
   */
  async listActiveCoupons(params?: CouponQueryFilter): Promise<{ coupons: CouponRecord[]; meta?: any }> {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const sortBy = params?.sortBy || "created_at";
    const sortOrder = params?.sortOrder || "desc";

    const query = new URLSearchParams({
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
   * 3. POST /api/v1/coupons/validate
   * Validate Coupon (Pre-Checkout Engine) directly via Backend API
   */
  async validateCoupon(payload: ValidateCouponPayload): Promise<CouponValidationResult> {
    return apiClient.post<CouponValidationResult, ValidateCouponPayload>(
      API_ENDPOINTS.COUPONS.VALIDATE,
      payload
    );
  }

  /**
   * 4. POST /api/v1/coupons/apply
   * Apply Coupon (Redeem on Checkout)
   */
  async applyCoupon(payload: RedeemCouponCheckoutPayload): Promise<{
    success: boolean;
    discountAmount: number;
    finalPayableAmount: number;
    message?: string;
  }> {
    return apiClient.post<{
      success: boolean;
      discountAmount: number;
      finalPayableAmount: number;
      message?: string;
    }, RedeemCouponCheckoutPayload>(API_ENDPOINTS.COUPONS.APPLY, payload);
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
