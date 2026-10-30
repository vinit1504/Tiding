"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ListPlus, Loader2 } from "lucide-react";
import { useCreateWishlistMutation } from "@/queries/wishlist/use-wishlist-queries";
import { toast } from "sonner";

interface CreateWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateWishlistModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateWishlistModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const createMutation = useCreateWishlistMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a wishlist name");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
      setName("");
      setDescription("");
      setIsPublic(false);
      onSuccess?.();
      onClose();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-white shadow-2xl border border-gray-100">
        <DialogHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#0c831f] border border-emerald-100">
            <ListPlus className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg font-black text-gray-900">
            Create Custom Wishlist
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-gray-500">
            Organize your saved items by occasion, recipe, or festival.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label htmlFor="wishlist-name" className="block text-xs font-bold text-gray-700">
              Wishlist Name *
            </label>
            <Input
              id="wishlist-name"
              placeholder="e.g. Weekly Organic Veggies, Diwali Party"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-xs rounded-xl border-gray-200 focus-visible:ring-[#0c831f]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="wishlist-desc" className="block text-xs font-bold text-gray-700">
              Description (Optional)
            </label>
            <textarea
              id="wishlist-desc"
              rows={3}
              placeholder="e.g. Items to order during monthly grocery restock"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 p-3 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0c831f]/20 focus:border-[#0c831f]"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <input
              type="checkbox"
              id="wishlist-public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 rounded text-[#0c831f] focus:ring-[#0c831f] cursor-pointer"
            />
            <label htmlFor="wishlist-public" className="text-xs font-medium text-gray-700 cursor-pointer">
              Make this wishlist shareable via public link
            </label>
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
              disabled={createMutation.isPending || !name.trim()}
              className="flex-1 h-10 rounded-xl text-xs font-bold bg-[#0c831f] hover:bg-[#0a6f1a] text-white cursor-pointer"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  <span>Create List</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
