"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.warn("Global Error Boundary caught an error:", error?.message || error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4 shadow-sm border border-rose-100">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong!</h2>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        {error?.message || "An unexpected error occurred while loading this page. Please try again."}
      </p>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => reset()}
          className="bg-[#18A818] hover:bg-[#159015] text-white font-medium text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </Button>
        <Link href="/">
          <Button
            variant="outline"
            className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm px-5 py-2.5 rounded-xl flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
