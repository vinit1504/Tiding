"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Share2, Globe, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { SITE_CONFIG } from "@/lib/constants/site-config";

interface WishlistShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareToken?: string | null;
  wishlistName?: string;
}

export function WishlistShareModal({
  isOpen,
  onClose,
  shareToken,
  wishlistName = "Wishlist",
}: WishlistShareModalProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" && shareToken
    ? `${window.location.origin}/wishlist/share/${shareToken}`
    : `${SITE_CONFIG.url}/wishlist/share/${shareToken || ""}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Check out my wishlist "${wishlistName}" on Tiding: ${shareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6 bg-white shadow-2xl border border-gray-100">
        <DialogHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#0c831f] border border-emerald-100">
            <Share2 className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-lg font-black text-gray-900">
            Share &quot;{wishlistName}&quot;
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-gray-500">
            Anyone with this secure link can view your curated wishlist items and current prices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={shareUrl}
              className="h-10 text-xs font-mono bg-gray-50 border-gray-200 text-gray-700 selection:bg-emerald-100"
            />
            <Button
              type="button"
              onClick={handleCopy}
              className="h-10 px-3.5 bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-xs shrink-0 flex items-center gap-1.5 rounded-xl cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleWhatsAppShare}
              className="w-full h-11 border-[#25D366]/40 text-[#128C7E] hover:bg-[#25D366]/10 font-bold text-xs flex items-center justify-center gap-2 rounded-xl cursor-pointer"
            >
              <MessageCircle className="h-4.5 w-4.5 text-[#25D366]" />
              <span>Share via WhatsApp</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-400 justify-center">
            <Globe className="h-3.5 w-3.5" />
            <span>Public read-only link • No login required for viewers</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
