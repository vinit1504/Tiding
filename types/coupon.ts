export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type CouponAppliesTo = "ALL" | "SPECIFIC_PRODUCTS" | "SPECIFIC_CATEGORIES";

export interface CouponRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: string | number;
  max_discount_amount: string | number | null;
  min_cart_amount: string | number;
  start_date: string | Date;
  end_date: string | Date;
  usage_limit_total: number | null;
  usage_limit_per_user: number;
  usage_limit_per_user_per_month: number;
  used_count: number;
  redemption_count?: number;
  is_active: boolean;
  applies_to: CouponAppliesTo;
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at?: string | null;
}

export interface CouponEligibilityResult {
  isEligible: boolean;
  couponId: string;
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  minCartAmount: number;
  maxDiscountAmount: number | null;
  monthlyUsagesUsed: number;
  monthlyUsagesRemaining: number;
  lifetimeUsagesUsed: number;
  lifetimeUsagesRemaining: number;
  expiresAt: string | Date;
  reason?: string;
}

export interface CartItemCouponInput {
  productId: string;
  categoryId: string;
  quantity: number;
  unitPrice: number;
}

export interface ValidateCouponPayload {
  code: string;
  cartTotal: number;
  items: CartItemCouponInput[];
}

export interface CouponValidationResult {
  isValid: boolean;
  couponId: string;
  code: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  finalPayableAmount: number;
  monthlyUsageRemaining: number;
  lifetimeUsageRemaining: number;
  message: string;
}

export interface RedeemCouponCheckoutPayload {
  couponId: string;
  orderId?: string;
  cartTotal: number;
  items: CartItemCouponInput[];
}

export interface RollbackCouponPayload {
  couponId: string;
  orderId: string;
}

export interface CouponUsageRecord {
  id: string;
  coupon_id: string;
  user_id: string;
  order_id: string | null;
  discount_amount: string | number;
  order_amount: string | number;
  used_at: string | Date;
  created_at: string | Date;
  code?: string;
  coupon_name?: string;
}

export interface CouponQueryFilter {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  discountType?: DiscountType;
  appliesTo?: CouponAppliesTo;
  sortBy?: "created_at" | "discount_value" | "end_date";
  sortOrder?: "asc" | "desc";
}
