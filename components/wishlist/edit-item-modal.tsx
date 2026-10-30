"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WishlistItem, WishlistPriority } from "@/types/wishlist";
import { useUpdateWishlistItemMutation } from "@/queries/wishlist/use-wishlist-queries";
import { Loader2, Settings2, Bell, Tag } from "lucide-react";

interface EditItemModalProps {
  item: WishlistItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditItemModal({ item, isOpen, onClose }: EditItemModalProps) {
  const [priority, setPriority] = useState<WishlistPriority>("MEDIUM");
  const [notifyOnPriceDrop, setNotifyOnPriceDrop] = useState(true);
  const [notifyOnRestock, setNotifyOnRestock] = useState(true);
  const [notes, setNotes] = useState("");

  const updateMutation = useUpdateWishlistItemMutation();

  useEffect(() => {
    if (item) {
      setPriority(item.priority || "MEDIUM");
      setNotifyOnPriceDrop(item.notifyOnPriceDrop ?? true);
      setNotifyOnRestock(item.notifyOnRestock ?? true);
      setNotes(item.notes || "");
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        itemId: item.id,
        payload: {
          priority,
          notifyOnPriceDrop,
          notifyOnRestock,
          notes: notes.trim() || undefined,
        },
      });
      onClose();
    } catch {
      // Handled by mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-white shadow-2xl border border-gray-100">
        <DialogHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
            <Settings2 className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg font-black text-gray-900">
            Item Preferences
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-gray-500">
            {item.productName || item.product?.name || "Wishlist item"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Priority */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-gray-400" />
              <span>Purchase Priority</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["HIGH", "MEDIUM", "LOW"] as WishlistPriority[]).map((p) => {
                const isSelected = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`h-9 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? p === "HIGH"
                          ? "bg-rose-50 border-rose-300 text-rose-700 shadow-xs"
                          : p === "MEDIUM"
                          ? "bg-amber-50 border-amber-300 text-amber-700 shadow-xs"
                          : "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label htmlFor="item-notes" className="block text-xs font-bold text-gray-700">
              Personal Notes
            </label>
            <Input
              id="item-notes"
              placeholder="e.g. Wait for Diwali sale, Birthday gift idea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 text-xs rounded-xl border-gray-200 focus-visible:ring-[#0c831f]"
            />
          </div>

          {/* Notifications */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <input
                type="checkbox"
                id="notify-price"
                checked={notifyOnPriceDrop}
                onChange={(e) => setNotifyOnPriceDrop(e.target.checked)}
                className="h-4 w-4 rounded text-[#0c831f] focus:ring-[#0c831f] cursor-pointer"
              />
              <label htmlFor="notify-price" className="text-xs font-medium text-gray-700 cursor-pointer flex-1">
                Notify me when the price drops
              </label>
              <Bell className="h-4 w-4 text-emerald-600 shrink-0" />
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <input
                type="checkbox"
                id="notify-restock"
                checked={notifyOnRestock}
                onChange={(e) => setNotifyOnRestock(e.target.checked)}
                className="h-4 w-4 rounded text-[#0c831f] focus:ring-[#0c831f] cursor-pointer"
              />
              <label htmlFor="notify-restock" className="text-xs font-medium text-gray-700 cursor-pointer flex-1">
                Notify me when item restocks
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl text-xs font-bold border-gray-200 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex-1 h-10 rounded-xl text-xs font-bold bg-[#0c831f] hover:bg-[#0a6f1a] text-white cursor-pointer"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
