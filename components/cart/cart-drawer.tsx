"use client";

import React, { useState, useEffect } from "react";
import { SafeImage } from "@/components/ui/safe-image";
import { useRouter } from "next/navigation";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Bookmark,
  Clock,
  CheckCircle2,
  ArrowRight,
  Tag,
  Truck,
  RotateCcw,
  AlertTriangle,
  Info,
  Loader2,
  X,
  ChevronRight,
  Copy,
  Check,
  Percent,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { isCartDrawerOpenAtom, deliveryLocationAtom, activeCouponsAtom } from "@/stores";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";
import { CheckoutValidationWarning } from "@/types/cart";
import { CouponSheet } from "@/components/cart/coupon-sheet";
import { useCouponsQuery } from "@/queries/coupon/use-coupon-queries";

export function CartDrawer() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useAtom(isCartDrawerOpenAtom);
  const location = useAtomValue(deliveryLocationAtom);
  const setActiveCoupons = useSetAtom(activeCouponsAtom);

  const {
    items,
    savedItems,
    cartCount,
    savedCount,
    bill,
    appliedCoupon,
    deliveryPincode,
    isEstimating,
    isSyncing,
    updateQuantity,
    removeItem,
    saveForLater,
    moveToCart,
    validateCheckout,
    estimateShipping,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [activeTab, setActiveTab] = useState<"cart" | "saved">("cart");
  const [couponInput, setCouponInput] = useState("");
  const [isCouponSheetOpen, setIsCouponSheetOpen] = useState(false);
  const [pincodeInput, setPincodeInput] = useState(deliveryPincode || "");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<
    CheckoutValidationWarning[] | null
  >(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: couponsData } = useCouponsQuery();
  const coupons = couponsData?.coupons || [];

  // Sync loaded coupons with global atom
  useEffect(() => {
    if (coupons && coupons.length > 0) {
      setActiveCoupons(coupons);
    }
  }, [coupons, setActiveCoupons]);

  // Auto-remove or revoke coupon if current cart total drops below minimum criteria
  useEffect(() => {
    if (!appliedCoupon || coupons.length === 0) return;
    const currentRecord = coupons.find(
      (c) => c.code.toUpperCase() === appliedCoupon.code.toUpperCase()
    );
    if (currentRecord) {
      const minCart = Number(currentRecord.min_cart_amount || 0);
      if (minCart > 0 && bill.itemTotal < minCart) {
        removeCoupon();
        toast.error(
          `Coupon '${appliedCoupon.code}' removed: Cart value ₹${bill.itemTotal} is below required minimum of ₹${minCart}.`
        );
      }
    }
  }, [appliedCoupon, coupons, bill.itemTotal, removeCoupon]);

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Copied code "${code}" to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Handle coupon apply
  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      toast.error("Please enter a promo code");
      return;
    }

    // Check minimum criteria before applying
    const matched = coupons.find((c) => c.code.toUpperCase() === code);
    if (matched) {
      const minAmount = Number(matched.min_cart_amount || 0);
      if (minAmount > 0 && bill.itemTotal < minAmount) {
        toast.error(
          `Code '${matched.code}' requires a minimum order of ₹${minAmount}. Add ₹${minAmount - bill.itemTotal} more to apply.`
        );
        return;
      }
    }

    setIsApplyingCoupon(true);
    try {
      await applyCoupon(code);
      setCouponInput("");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Handle pincode shipping estimate
  const handleEstimateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeInput.trim()) {
      toast.error("Please enter a PIN code");
      return;
    }
    await estimateShipping(pincodeInput.trim());
  };

  // Handle checkout pre-flight integrity check
  const handleProceedToCheckout = async () => {
    setIsValidating(true);
    try {
      const result = await validateCheckout();
      if (!result.isCheckoutReady && result.warnings.length > 0) {
        setValidationWarnings(result.warnings);
        return;
      }
      setIsOpen(false);
      router.push("/checkout");
    } finally {
      setIsValidating(false);
    }
  };

  const handleDismissWarningsAndProceed = () => {
    setValidationWarnings(null);
    setIsOpen(false);
    router.push("/checkout");
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent
        side="right"
        size="2xl"
        className="w-full sm:max-w-xl md:w-[540px] lg:w-[600px] bg-[var(--background)] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <DrawerHeader className="border-b border-[var(--border-light)] pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#18A818]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#18A818]/10 text-[#18A818]">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <DrawerTitle className="text-base font-black text-[var(--text-primary)]">
                  My Shopping Cart
                </DrawerTitle>
                <DrawerDescription className="text-xs text-[var(--text-secondary)]">
                  Delivering in{" "}
                  <strong>{location.deliveryEtaMinutes || 10} mins</strong>
                </DrawerDescription>
              </div>
            </div>

          </div>

          {/* Segmented Tab Switcher with Green Active State */}
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[var(--surface-secondary)] p-1.5 mt-3 border border-[var(--border-light)]">
            <button
              type="button"
              onClick={() => setActiveTab("cart")}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-black rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === "cart"
                  ? "bg-[#18A818] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
              }`}
            >
              <ShoppingCart className={`h-4 w-4 ${activeTab === "cart" ? "text-white" : "text-[#18A818]"}`} />
              <span>Basket ({cartCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("saved")}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-black rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === "saved"
                  ? "bg-[#18A818] text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${activeTab === "saved" ? "text-white" : "text-[var(--text-muted)]"}`} />
              <span>Saved for Later ({savedCount})</span>
            </button>
          </div>
        </DrawerHeader>

        {/* Body */}
        <DrawerBody className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Pre-Checkout Integrity Warnings Banner */}
          {validationWarnings && validationWarnings.length > 0 && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Pre-Checkout Verification Updates</span>
              </div>
              <ul className="space-y-1 text-[11px] text-amber-900 dark:text-amber-200">
                {validationWarnings.map((warning, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-600">•</span>
                    <span>{warning.message}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDismissWarningsAndProceed}
                  className="h-7 text-[11px] border-amber-500/50 bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-bold"
                >
                  Accept & Continue
                </Button>
              </div>
            </div>
          )}

          {/* TAB 1: ACTIVE BASKET ITEMS */}
          {activeTab === "cart" && (
            <>
              {/* Delivery ETA & Dark Store Reassurance Card */}
              <div className="flex items-center justify-between rounded-xl bg-[#18A818]/10 border border-[#18A818]/25 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#18A818] text-white">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-[#18A818]">
                      Delivery in {location.deliveryEtaMinutes || 10} mins
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      From {location.darkStoreName || "Express Hub"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#18A818] bg-white dark:bg-neutral-900 px-2 py-0.5 rounded-full border border-[#18A818]/30">
                  INSTANT DELIVERY
                </span>
              </div>

              {/* Free Delivery Goal Tracker */}
              {bill.amountNeededForFreeDelivery > 0 ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      Add {formatCurrency(bill.amountNeededForFreeDelivery)}{" "}
                      more for <strong>FREE Delivery</strong>
                    </span>
                    <Truck className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-amber-200 dark:bg-amber-900/50 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          (bill.itemTotal / bill.freeDeliveryThreshold) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-[#18A818]/30 bg-[#18A818]/10 p-2.5 text-xs text-[#18A818] font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Congratulations! You unlocked FREE Delivery</span>
                </div>
              )}

              {/* Items List */}
              {items.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1">
                    Your Basket Items ({cartCount})
                  </p>
                  <div className="divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                    {items.map((item) => (
                      <div key={item.id} className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          {/* Thumbnail */}
                          <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-[var(--surface-secondary)] shrink-0 border border-[var(--border)]">
                            <SafeImage
                              src={item.image_url}
                              alt={item.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)]">
                              {item.unit}
                            </p>

                            {/* Custom Attributes tags (e.g. Color, Size) */}
                            {item.customAttributes &&
                              Object.keys(item.customAttributes).length > 0 && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {Object.entries(item.customAttributes).map(
                                    ([k, v]) => (
                                      <span
                                        key={k}
                                        className="text-[10px] font-medium bg-[var(--surface-secondary)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded border border-[var(--border-light)] capitalize"
                                      >
                                        {k}: {String(v)}
                                      </span>
                                    ),
                                  )}
                                </div>
                              )}

                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs font-black text-[var(--text-primary)]">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                              {item.mrp > item.price && (
                                <span className="text-[10px] text-[var(--text-muted)] line-through">
                                  {formatCurrency(item.mrp * item.quantity)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stepper */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center rounded-lg bg-[#18A818] text-white shadow-xs">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.cartItemId || item.id,
                                    item.quantity - 1,
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center hover:bg-[#148F14] transition-colors"
                                title="Decrease quantity"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-black select-none">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.cartItemId || item.id,
                                    item.quantity + 1,
                                  )
                                }
                                className="flex h-7 w-7 items-center justify-center hover:bg-[#148F14] transition-colors"
                                title="Increase quantity"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons: Save for later & Delete */}
                        <div className="flex items-center justify-end gap-3 pt-1 border-t border-[var(--border-light)] text-[11px]">
                          <button
                            onClick={() =>
                              saveForLater(item.cartItemId || item.id)
                            }
                            className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[#18A818] transition-colors"
                            title="Move item to saved for later"
                          >
                            <Bookmark className="h-3 w-3" />
                            <span>Save for later</span>
                          </button>
                          <button
                            onClick={() =>
                              removeItem(item.cartItemId || item.id)
                            }
                            className="flex items-center gap-1 text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon & Promotional Discount Module */}
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                      <div className="flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-[#18A818]" />
                        <span>Apply Coupon & Offers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {appliedCoupon && (
                          <span className="text-[10px] text-[#18A818] font-black uppercase tracking-wider bg-[#18A818]/10 px-2 py-0.5 rounded-full border border-[#18A818]/20">
                            Active
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsCouponSheetOpen(true)}
                          className="text-[11px] font-bold text-[#18A818] hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>View All ({coupons.length})</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Applied Banner if Coupon is Active and strictly eligible */}
                    {appliedCoupon && bill.couponDiscount > 0 && (
                      <div className="flex items-center justify-between rounded-xl bg-[#18A818]/10 border border-[#18A818]/30 p-2.5 text-xs">
                        <div className="space-y-0.5">
                          <p className="font-bold text-[#18A818] flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Code &apos;{appliedCoupon.code}&apos; Applied!</span>
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)]">
                            You saved {formatCurrency(bill.couponDiscount)} with this order
                          </p>
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:underline px-2 py-1"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {/* Promo Code Manual Input Form */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Enter promo code (e.g. SUPER55)"
                        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs uppercase font-medium placeholder:normal-case focus:outline-none focus:border-[#18A818]"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleApplyCoupon()}
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        className="h-8 bg-[#18A818] hover:bg-[#148F14] text-white text-xs font-bold shrink-0"
                      >
                        {isApplyingCoupon ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>

                    {/* Available Live Coupons List */}
                    {coupons.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          Best Available Coupons
                        </p>
                        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-0.5">
                          {coupons.map((coupon) => {
                            const minAmount = Number(coupon.min_cart_amount || 0);
                            const isEligible = bill.itemTotal >= minAmount;
                            const isCurrentApplied =
                              appliedCoupon?.code?.toUpperCase() === coupon.code.toUpperCase() && isEligible;
                            const amountNeeded = Math.max(0, minAmount - bill.itemTotal);

                            const discountDisplay =
                              coupon.discount_type === "PERCENTAGE"
                                ? `${coupon.discount_value}% OFF`
                                : `FLAT ₹${Number(coupon.discount_value)} OFF`;

                            const maxCap = coupon.max_discount_amount
                              ? Number(coupon.max_discount_amount)
                              : null;

                            return (
                              <div
                                key={coupon.id}
                                className={`rounded-xl border p-2.5 transition-all text-xs ${
                                  isCurrentApplied
                                    ? "border-[#18A818] bg-[#18A818]/10 shadow-xs"
                                    : isEligible
                                    ? "border-[var(--border)] bg-[var(--surface-secondary)]/40 hover:border-[#18A818]/50"
                                    : "border-[var(--border-light)] bg-[var(--surface)] opacity-75"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-[#18A818]/60 bg-[#18A818]/10 text-[#18A818] font-mono font-black text-[11px] tracking-wider">
                                        <span>{coupon.code}</span>
                                        <button
                                          type="button"
                                          onClick={(e) => handleCopyCode(coupon.code, e)}
                                          className="hover:text-emerald-700 transition-colors"
                                          title="Copy coupon code"
                                        >
                                          {copiedCode === coupon.code ? (
                                            <Check className="h-2.5 w-2.5 text-emerald-600" />
                                          ) : (
                                            <Copy className="h-2.5 w-2.5" />
                                          )}
                                        </button>
                                      </div>
                                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                        {discountDisplay}
                                      </span>
                                    </div>

                                    <p className="font-bold text-[var(--text-primary)] text-xs truncate">
                                      {coupon.name}
                                    </p>

                                    <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1">
                                      {coupon.description ||
                                        `Valid on orders above ₹${minAmount}${
                                          maxCap ? ` • Max savings ₹${maxCap}` : ""
                                        }`}
                                    </p>

                                    {/* Eligibility status */}
                                    <div className="pt-0.5">
                                      {isEligible ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#18A818]">
                                          <CheckCircle2 className="h-2.5 w-2.5" />
                                          Eligible on this basket
                                        </span>
                                      ) : (
                                        <div className="space-y-0.5">
                                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                            Add {formatCurrency(amountNeeded)} more to unlock (Min order ₹{minAmount})
                                          </span>
                                          <div className="h-1 w-full bg-[var(--border)] rounded-full overflow-hidden">
                                            <div
                                              className="h-full bg-amber-500 rounded-full"
                                              style={{
                                                width: `${Math.min(
                                                  100,
                                                  (bill.itemTotal / minAmount) * 100
                                                )}%`,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Right side Apply / Applied button */}
                                  <div className="shrink-0 self-center">
                                    {isCurrentApplied ? (
                                      <span className="text-[10px] font-black text-[#18A818] bg-[#18A818]/15 px-2 py-1 rounded">
                                        Applied ✓
                                      </span>
                                    ) : isEligible ? (
                                      <Button
                                        size="sm"
                                        onClick={() => handleApplyCoupon(coupon.code)}
                                        disabled={isApplyingCoupon}
                                        className="h-7 px-3 text-[11px] font-black bg-[#18A818] hover:bg-[#148F14] text-white shadow-xs"
                                      >
                                        APPLY
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        disabled
                                        variant="outline"
                                        className="h-6 px-2 text-[10px] font-semibold text-[var(--text-muted)] opacity-60"
                                      >
                                        Add Items
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delivery Pincode Estimator */}
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-[var(--text-primary)]">
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-[#18A818]" />
                        <span>Estimate Delivery by PIN Code</span>
                      </div>
                      {bill.deliveryPincode && (
                        <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                          PIN: {bill.deliveryPincode}
                        </span>
                      )}
                    </div>

                    <form
                      onSubmit={handleEstimateShipping}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        maxLength={6}
                        value={pincodeInput}
                        onChange={(e) =>
                          setPincodeInput(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="Enter 6-digit PIN code"
                        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium placeholder:font-normal focus:outline-none focus:border-[#18A818]"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        disabled={isEstimating || pincodeInput.length !== 6}
                        className="h-8 text-xs font-bold border-[#18A818]/40 text-[#18A818] hover:bg-[#18A818]/10"
                      >
                        {isEstimating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Check"
                        )}
                      </Button>
                    </form>
                  </div>

                  {/* Bill Summary - Clean, Transparent, and Mathematically Consistent */}
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-2">
                      <span className="font-bold text-[var(--text-primary)]">Bill Summary</span>
                      <span className="text-[11px] text-[var(--text-muted)] font-medium">({cartCount} {cartCount === 1 ? "item" : "items"})</span>
                    </div>

                    {/* Struck-through MRP if items are discounted */}
                    {bill.mrpTotal > bill.itemTotal && (
                      <div className="flex justify-between text-[var(--text-muted)]">
                        <span>Items MRP</span>
                        <span className="line-through">{formatCurrency(bill.mrpTotal)}</span>
                      </div>
                    )}

                    {/* Item Total (Actual discounted price of items) */}
                    <div className="flex justify-between text-[var(--text-primary)] font-semibold">
                      <span>Item Total</span>
                      <span>{formatCurrency(bill.itemTotal)}</span>
                    </div>

                    {/* Handling & Packaging Fee */}
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Handling & Packaging</span>
                      <span>{formatCurrency(bill.handlingFee)}</span>
                    </div>

                    {/* Delivery Fee */}
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Delivery Partner Fee</span>
                      {bill.deliveryFee === 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[var(--text-muted)] line-through">₹25</span>
                          <span className="font-bold text-[#18A818]">FREE</span>
                        </div>
                      ) : (
                        <span>{formatCurrency(bill.deliveryFee)}</span>
                      )}
                    </div>

                    {/* Coupon Discount (if applied) */}
                    {bill.couponDiscount > 0 && (
                      <div className="flex justify-between font-bold text-[#18A818] bg-[#18A818]/10 px-2 py-1 rounded-md">
                        <span>Coupon Savings ({bill.couponCode})</span>
                        <span>-{formatCurrency(bill.couponDiscount)}</span>
                      </div>
                    )}

                    {/* Grand Total */}
                    <div className="flex justify-between border-t border-[var(--border)] pt-2.5 text-sm font-black text-[var(--text-primary)]">
                      <span>To Pay</span>
                      <span className="text-base text-[#18A818]">{formatCurrency(bill.grandTotal)}</span>
                    </div>

                    {/* Total Order Savings Celebration Banner */}
                    {(bill.discountTotal > 0 || bill.deliveryFee === 0) && (
                      <div className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 py-1.5 px-2 text-center text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          You saved {formatCurrency(
                            (bill.mrpTotal > bill.itemTotal ? bill.mrpTotal - bill.itemTotal : 0) +
                            bill.couponDiscount +
                            (bill.deliveryFee === 0 ? 25 : 0)
                          )} on this order
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)]">
                    <ShoppingCart className="h-8 w-8 stroke-[1.5]" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Your basket is empty
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
                    Explore fresh vegetables, fruits, dairy, and snacks
                    delivered to your doorstep in 10 minutes.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="bg-[#18A818] hover:bg-[#148F14] text-white font-bold"
                  >
                    Start Shopping
                  </Button>
                </div>
              )}
            </>
          )}

          {/* TAB 2: SAVED FOR LATER ITEMS */}
          {activeTab === "saved" && (
            <div className="space-y-3">
              {savedItems.length > 0 ? (
                <>
                  <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1">
                    Saved Items ({savedCount})
                  </p>
                  <div className="divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                    {savedItems.map((item) => (
                      <div key={item.id} className="p-3 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-[var(--surface-secondary)] shrink-0 border border-[var(--border)]">
                            <SafeImage
                              src={item.image_url}
                              alt={item.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                              {item.name}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)]">
                              {item.unit}
                            </p>
                            <span className="text-xs font-black text-[var(--text-primary)] mt-0.5 inline-block">
                              {formatCurrency(item.price)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              onClick={() =>
                                moveToCart(item.cartItemId || item.id)
                              }
                              className="h-7 text-xs bg-[#18A818] hover:bg-[#148F14] text-white font-bold flex items-center gap-1 shadow-xs"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>Move to Cart</span>
                            </Button>
                            <button
                              onClick={() =>
                                removeItem(item.cartItemId || item.id)
                              }
                              className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 transition-colors"
                              title="Delete from saved items"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)]">
                    <Bookmark className="h-8 w-8 stroke-[1.5]" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    No items saved for later
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
                    Items you save from your basket will appear here so you can
                    buy them anytime.
                  </p>
                </div>
              )}
            </div>
          )}
        </DrawerBody>

        {/* Footer */}
        <DrawerFooter className="border-t border-[var(--border-light)] p-3">
          <div className="flex items-center justify-between gap-3 w-full">
            <DrawerClose asChild>
              <Button variant="outline" size="sm" className="font-semibold">
                Close
              </Button>
            </DrawerClose>

            {items.length > 0 && activeTab === "cart" && (
              <Button
                onClick={handleProceedToCheckout}
                disabled={isValidating}
                size="sm"
                className="bg-[#18A818] hover:bg-[#148F14] text-white flex-1 flex items-center justify-center gap-2 font-black shadow-md h-10"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Basket...</span>
                  </>
                ) : (
                  <>
                    <span>Checkout • {formatCurrency(bill.grandTotal)}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
      <CouponSheet
        open={isCouponSheetOpen}
        onOpenChange={setIsCouponSheetOpen}
      />
    </Drawer>
  );
}
