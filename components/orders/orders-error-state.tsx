"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrdersErrorStateProps {
  onRetry: () => void;
}

export function OrdersErrorState({ onRetry }: OrdersErrorStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-rose-200/80 p-8 text-center space-y-3 shadow-xs">
      <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
      <h3 className="text-base font-bold text-gray-900">
        Failed to load your orders
      </h3>
      <p className="text-xs text-gray-500 max-w-sm mx-auto">
        Could not connect to the orders service. Please check your network
        connection or try again.
      </p>
      <Button
        size="sm"
        onClick={onRetry}
        className="bg-[#0c831f] hover:bg-[#0a6f1a] text-white font-bold text-xs cursor-pointer"
      >
        Retry
      </Button>
    </div>
  );
}
