"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckoutValidationWarning } from "@/types/cart";
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface InventoryValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  warnings: CheckoutValidationWarning[];
  onUpdateCartAndProceed: () => void;
  isUpdating?: boolean;
}

export function InventoryValidationModal({
  isOpen,
  onClose,
  warnings,
  onUpdateCartAndProceed,
  isUpdating = false,
}: InventoryValidationModalProps) {
  if (!warnings || warnings.length === 0) return null;

  const stockShortages = warnings.filter(
    (w) => w.type === "INSUFFICIENT_STOCK" || w.type === "ITEM_UNAVAILABLE"
  );
  const priceChanges = warnings.filter((w) => w.type === "PRICE_CHANGED");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-black text-[var(--text-primary)]">
              Basket Inventory Updates
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Some items in your basket have stock shortages or price updates from your local dark store.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[260px] overflow-y-auto space-y-2.5 my-2 pr-1">
          {stockShortages.map((item, idx) => {
            const isSoldOut = (item.availableStock ?? 0) <= 0 || item.type === "ITEM_UNAVAILABLE";
            return (
              <div
                key={`stock-${idx}`}
                className="flex items-start justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs gap-3"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                        isSoldOut
                          ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                          : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {isSoldOut ? "Sold Out" : "Limited Stock"}
                    </span>
                    <p className="font-bold text-[var(--text-primary)] line-clamp-1">
                      {item.productName}
                    </p>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {isSoldOut
                      ? "Item is currently out of stock and will be removed from your basket."
                      : `Only ${item.availableStock} available (requested ${item.requestedQuantity}). Quantity will be updated to ${item.availableStock}.`}
                  </p>
                </div>
              </div>
            );
          })}

          {priceChanges.map((item, idx) => (
            <div
              key={`price-${idx}`}
              className="flex items-start justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs gap-3"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-700 dark:text-blue-300 flex items-center gap-1">
                    <TrendingUp className="h-2.5 w-2.5" /> Price Changed
                  </span>
                  <p className="font-bold text-[var(--text-primary)] line-clamp-1">
                    {item.productName}
                  </p>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Price updated from{" "}
                  <span className="line-through">{formatCurrency(item.oldPrice || 0)}</span> to{" "}
                  <span className="font-bold text-[var(--text-primary)]">
                    {formatCurrency(item.newPrice || 0)}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto text-xs font-semibold"
          >
            Review Basket
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isUpdating}
            onClick={onUpdateCartAndProceed}
            className="w-full sm:w-auto flex-1 bg-[#18A818] hover:bg-[#148F14] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md h-9.5"
          >
            <span>Update Cart & Proceed</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
