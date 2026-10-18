"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAtom, useAtomValue } from "jotai";
import { ChevronDown, Search, ShoppingCart, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  deliveryLocationAtom,
  isLocationModalOpenAtom,
  isCartDrawerOpenAtom,
  isAuthDrawerOpenAtom,
  cartCountAtom,
  cartItemTotalAtom,
  userProfileAtom,
  authSessionAtom,
  liveSearchQueryAtom,
} from "@/stores";
import { SITE_CONFIG } from "@/lib/constants/site-config";
import {
  formatCurrency,
  getUserDisplayInitials,
  getUserFirstName,
} from "@/lib/utils";

const SEARCH_PLACEHOLDERS = [
  "Search 'farm fresh tomatoes'...",
  "Search 'organic milk & curd'...",
  "Search 'crisp red apples'...",
  "Search 'whole wheat bread'...",
  "Search 'tender green coconut'...",
  "Search 'fresh paneer'...",
  "Search 'aloo bhujia & snacks'...",
];

export function AppHeader() {
  const router = useRouter();
  const location = useAtomValue(deliveryLocationAtom);
  const [, setIsLocationModalOpen] = useAtom(isLocationModalOpenAtom);
  const [, setIsCartDrawerOpen] = useAtom(isCartDrawerOpenAtom);
  const [, setIsAuthDrawerOpen] = useAtom(isAuthDrawerOpenAtom);

  const cartCount = useAtomValue(cartCountAtom);
  const cartTotal = useAtomValue(cartItemTotalAtom);
  const [user, setUser] = useAtom(userProfileAtom);
  const [session, setSession] = useAtom(authSessionAtom);

  const [searchTerm, setSearchTerm] = useAtom(liveSearchQueryAtom);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthenticated = mounted && !!user && session.isAuthenticated;

  const handleLogout = () => {
    setUser(null);
    setSession({ user: null, token: null, isAuthenticated: false });
    try {
      localStorage.removeItem("tiding_user");
      localStorage.removeItem("tiding_token");
      localStorage.setItem("tiding_logged_out", "true");
    } catch {}
    toast.success("Logged out successfully");
  };

  // Rotating search bar placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)]/98 backdrop-blur-md shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] transition-colors">
      <div className="flex w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 xl:px-10 py-2.5 sm:py-3">
        {/* Left Section: Brand Logo & Address Section */}
        <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 shrink-0">
          {/* Logo - Matching Footer Size & Clean Design */}
          <Link
            href="/"
            className="flex items-center shrink-0 transition-opacity hover:opacity-90 active:scale-95 focus:outline-none"
            title={`${SITE_CONFIG.name} Home`}
          >
            <Image
              src={SITE_CONFIG.logoUrl}
              alt={SITE_CONFIG.name}
              width={140}
              height={55}
              priority
              style={{ width: "auto", height: "100px" }}
              className="h-9 w-auto object-contain"
            />
          </Link>

          {/* Elegant vertical divider for structure */}
          <div className="h-8 w-px bg-slate-200/80 hidden sm:block shrink-0" />

          {/* Premium & Simple Address Section */}
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="group flex flex-col items-start text-left cursor-pointer transition-all hover:bg-[var(--surface-hover)] px-2.5 py-1.5 rounded-xl focus:outline-none max-w-[160px] sm:max-w-[260px] md:max-w-[320px] lg:max-w-[380px]"
            title="Change delivery location"
          >
            <span
              suppressHydrationWarning
              className={`text-xs sm:text-[13px] md:text-sm font-extrabold tracking-tight leading-tight whitespace-nowrap transition-colors ${location.isServiceable !== false ? "text-[var(--text-primary)] group-hover:text-[#18A818]" : "text-amber-600 dark:text-amber-400"}`}
            >
              {location.isServiceable !== false
                ? `Delivery in ${location.deliveryEtaMinutes || 8} minutes`
                : "Delivery Unavailable"}
            </span>
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-[var(--text-secondary)] leading-tight mt-0.5 min-w-0 w-full">
              <span className="truncate font-medium" suppressHydrationWarning>
                {location.area ||
                  location.society ||
                  location.formattedAddress ||
                  "Select location"}
              </span>
              <ChevronDown className="h-3 w-3 shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-transform group-hover:translate-y-0.5" />
            </div>
          </button>
        </div>

        {/* Center: Full-Width Expanding Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 min-w-0 max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-2 sm:mx-6"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
            className="h-10 sm:h-11 w-full rounded-xl pl-10 pr-9 text-xs sm:text-sm font-medium bg-[var(--surface-secondary)]/60 border-[var(--border)] focus:bg-[var(--surface)] transition-all placeholder:text-[var(--text-muted)]"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        {/* Right Section: Login/Profile & Cart Button */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {/* Login Button (When Unauthenticated) OR Profile Avatar Dropdown (When Authenticated) */}
          {!isAuthenticated ? (
            <button
              onClick={() => setIsAuthDrawerOpen(true)}
              aria-label="Login to account"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-[var(--text-primary)] hover:text-[#18A818] hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
            >
              <User className="h-4 w-4 text-[var(--text-secondary)]" />
              <span className="font-bold">Login</span>
            </button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="User Account Menu"
                  className="group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/50 hover:bg-[var(--surface-hover)] hover:border-[#18A818]/40 transition-all cursor-pointer outline-none focus:ring-2 focus:ring-[#18A818]/20"
                >
                  {/* Avatar displaying strictly user email first character */}
                  <div className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-full bg-gradient-to-br from-[#18A818] to-[#0c831f] text-white font-black text-xs shadow-xs tracking-wider ring-2 ring-[#18A818]/25">
                    {user?.email
                      ? user.email.trim().charAt(0).toUpperCase()
                      : getUserDisplayInitials(user)}
                  </div>
                  <span className="hidden sm:inline font-bold text-xs text-[var(--text-primary)] max-w-[95px] truncate">
                    {getUserFirstName(user)}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)] transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-60 p-2 shadow-xl rounded-2xl border border-gray-200 bg-white"
              >
                {/* User Header Summary */}
                <div className="px-3 py-2.5 border-b border-gray-100">
                  <p className="text-xs font-extrabold text-gray-900 truncate">
                    {user?.name || "Vinit"}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5 font-medium">
                    {user?.phone || user?.email || "+91 75673 37686"}
                  </p>
                </div>

                {/* Simple Options without Icons */}
                <div className="py-1 space-y-0.5">
                  <DropdownMenuItem
                    onClick={() => router.push("/addresses")}
                    className="w-full px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  >
                    My Addresses
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => router.push("/orders")}
                    className="w-full px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  >
                    My Orders
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => router.push("/profile")}
                    className="w-full px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  >
                    My Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => router.push("/wallet")}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <span>Tiding Wallet</span>
                    <span className="text-[11px] font-bold text-[#0c831f] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      ₹{user?.walletBalance ?? 0}
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => router.push("/offers")}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <span>Deals & Offers</span>
                    <span className="text-[9px] font-extrabold uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      OFFERS
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => router.push("/contact")}
                    className="w-full px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  >
                    24x7 Help & Support
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => router.push("/privacy-policy")}
                    className="w-full px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  >
                    Account Privacy & Terms
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-1 border-gray-100" />

                {/* Log Out without icons */}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                >
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Prominent Cart Pill Button - Displayed ONLY when authenticated */}
          {isAuthenticated && (
            <Button
              onClick={() => setIsCartDrawerOpen(true)}
              size="sm"
              className="h-10 sm:h-11 px-3.5 sm:px-4 bg-[#0c831f] hover:bg-[#0a6f1a] text-white flex items-center gap-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <div className="relative flex items-center justify-center shrink-0">
                <ShoppingCart className="h-4.5 w-4.5" />
                {cartCount > 0 && (
                  <span
                    suppressHydrationWarning
                    className="absolute -top-2.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs"
                  >
                    {cartCount}
                  </span>
                )}
              </div>
              <div
                className="flex items-center gap-1.5 leading-none"
                suppressHydrationWarning
              >
                <span>
                  {cartCount === 0
                    ? "My Cart"
                    : `${cartCount} ${cartCount === 1 ? "item" : "items"}`}
                </span>
                {cartTotal > 0 && (
                  <>
                    <span className="opacity-60 text-xs">•</span>
                    <span className="font-extrabold">
                      {formatCurrency(cartTotal)}
                    </span>
                  </>
                )}
              </div>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
