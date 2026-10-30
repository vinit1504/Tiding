"use client";

import React, { ReactNode } from "react";
import { AccountSidebar } from "./account-sidebar";

export interface AccountLayoutProps {
  activeTab?:
    | "addresses"
    | "orders"
    | "wishlist"
    | "profile"
    | "wallet"
    | "offers"
    | "support"
    | "privacy"
    | "prescriptions";
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  mainClassName?: string;
}

export function AccountLayout({
  activeTab,
  children,
  className = "",
  containerClassName = "",
  mainClassName = "",
}: AccountLayoutProps) {
  return (
    <div className={`min-h-[calc(100vh-80px)] bg-gray-50/60 py-6 sm:py-8 lg:py-10 transition-colors ${className}`}>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${containerClassName}`}>
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start relative">
          {/* Left Column: Fixed / Sticky Sidebar that stays anchored when scrolling */}
          <AccountSidebar
            activeTab={activeTab}
            className="w-full lg:w-80 shrink-0 self-start lg:sticky lg:top-20 z-20"
          />

          {/* Right Column: Dynamic Content that automatically changes */}
          <main className={`flex-1 min-w-0 w-full ${mainClassName}`}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
