"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OrdersEmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center space-y-4 shadow-xs">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <ShoppingBag className="h-8 w-8 stroke-[1.5]" />
      </div>
      <h3 className="text-base font-bold text-gray-900">No orders placed yet</h3>
      <p className="text-xs text-gray-500 max-w-sm mx-auto">
        You haven&apos;t placed any grocery orders yet. Start exploring fresh
        vegetables, dairy, and essentials!
      </p>
      <Link href="/" className="inline-block pt-2">
        <Button className="bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-xs px-6 cursor-pointer">
          Start Shopping
        </Button>
      </Link>
    </div>
  );
}
