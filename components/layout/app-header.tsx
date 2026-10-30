"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAtom, useAtomValue } from "jotai";
import { ChevronDown, MapPin, Search, ShoppingCart, User, X, Heart } from "lucide-react";
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
import { getStoredAccessToken } from "@/lib/auth/token-storage";
import {
  formatCurrency,
  getUserDisplayInitials,
  getUserFirstName,
} from "@/lib/utils";
import { useCustomerAddressesQuery } from "@/queries";
import { useWishlist } from "@/hooks/use-wishlist";

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
  const { wishlistCount } = useWishlist();

  const [searchTerm, setSearchTerm] = useAtom(liveSearchQueryAtom);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayCartCount = mounted ? cartCount : 0;
  const displayCartTotal = mounted ? cartTotal : 0;
  const displayWishlistCount = mounted ? wishlistCount : 0;

  const storedToken = mounted ? getStoredAccessToken() : null;
  const hasValidToken = (!!session.token || !!storedToken) && session.token !== "token_vinit_default" && storedToken !== "token_vinit_default";

  const isAuthenticated =
    mounted &&
    (session.isAuthenticated || hasValidToken) &&
    session.token !== "token_vinit_default" &&
    storedToken !== "token_vinit_default";

  // Fetch saved customer addresses when authenticated
  const { data: savedAddresses = [] } = useCustomerAddressesQuery();
  const defaultAddress = useMemo(() => {
    if (!isAuthenticated || !savedAddresses.length) return null;
    return savedAddresses.find((a) => a.is_default) || savedAddresses[0];
  }, [isAuthenticated, savedAddresses]);

  // Compute clean, readable display address
  const displayAddress = useMemo(() => {
    // 1. Primary: Show the user's actively selected delivery location
    if (location) {
      if (location.houseNo && location.society && location.houseNo.toLowerCase().trim() !== location.society.toLowerCase().trim()) {
        return `${location.houseNo}, ${location.society}`;
      }
      if (location.society) {
        return `${location.society}${location.city ? `, ${location.city}` : ""}`;
      }
      if (location.area) {
        return `${location.area}${location.city ? `, ${location.city}` : ""}`;
      }
      if (location.formattedAddress) {
        return location.formattedAddress;
      }
    }

    // 2. Fallback: Show user's default saved address
    if (defaultAddress) {
      const parts = [
        defaultAddress.address_line_1,
        defaultAddress.address_line_2 || defaultAddress.landmark || defaultAddress.area_name,
        defaultAddress.city_name,
      ].filter(Boolean);
      return parts.join(", ") || "My Address";
    }

    return "Select delivery location";
  }, [location, defaultAddress]);

  const handleLogout = () => {
    setUser(null);
    setSession({ user: null, token: null, isAuthenticated: false });
    try {
      localStorage.removeItem("tiding_user");
      localStorage.removeItem("tiding_token");
      localStorage.setItem("tiding_logged_out", "true");
    } catch { }
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
      <div className="flex w-full items-center justify-between gap-3 px-3 sm:px-6 lg:px-8 xl:px-10 py-2 sm:py-2.5">
        {/* Left Section: Brand Logo & Proper Address Section */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 lg:gap-4 shrink-0">
          {/* Logo - Sleek & Properly Proportionate Size */}
          <Link
            href="/"
            className="flex items-center shrink-0 transition-opacity hover:opacity-90 active:scale-95 focus:outline-none"
            title={`${SITE_CONFIG.name} Home`}
          >
            <Image
              src={SITE_CONFIG.logoUrl}
              alt={SITE_CONFIG.name}
              width={120}
              height={80}
              priority
              style={{ width: "auto", height: "auto" }}
              className="h-7 sm:h-12 w-auto object-contain"
            />
          </Link>

          {/* Elegant vertical divider for structure */}
          <div className="h-7 w-px bg-slate-200 hidden sm:block shrink-0" />

          {/* Proper Address Section */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="group flex items-center gap-2 text-left cursor-pointer transition-all hover:bg-gray-100/80 px-2 sm:px-2.5 py-1.5 rounded-xl focus:outline-none max-w-[170px] sm:max-w-[270px] md:max-w-[340px] lg:max-w-[400px]"
            title="Change delivery location"
          >
            {/* MapPin Accent Icon */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#0c831f] group-hover:bg-emerald-100 transition-colors">
              <MapPin className="h-4 w-4" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  suppressHydrationWarning
                  className={`text-xs sm:text-[13px] font-black tracking-tight leading-tight whitespace-nowrap transition-colors ${location.isServiceable !== false
                    ? "text-gray-900 group-hover:text-[#0c831f]"
                    : "text-amber-600"
                    }`}
                >
                  {location.isServiceable !== false
                    ? `Delivery in ${location.deliveryEtaMinutes || 8} mins`
                    : "Unavailable"}
                </span>

                {((location as any)?.addressType || defaultAddress?.address_type) && (
                  <span className="hidden md:inline-block px-1.5 py-0.2 text-[9px] font-extrabold uppercase rounded bg-gray-100 text-gray-600 leading-tight">
                    {(location as any)?.addressType || defaultAddress?.address_type}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-500 leading-tight mt-0.5 min-w-0 w-full">
                <span className="truncate font-medium" suppressHydrationWarning>
                  {displayAddress}
                </span>
                <ChevronDown className="h-3 w-3 shrink-0 text-gray-400 group-hover:text-gray-800 transition-transform group-hover:translate-y-0.5" />
              </div>
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
              type="button"
              onClick={() => setIsAuthDrawerOpen(true)}
              aria-label="Login to account"
              className="h-10 sm:h-11 px-3.5 sm:px-4.5 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/60 text-[var(--text-primary)] font-bold text-xs sm:text-sm shadow-xs hover:bg-[var(--surface-hover)] hover:border-[var(--border-strong,var(--border))] transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <User className="h-4 w-4 text-[var(--text-primary)] shrink-0" />
              <span>Login</span>
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
                      : user?.name
                      ? user.name.trim().charAt(0).toUpperCase()
                      : "U"}
                  </div>
                  <span className="hidden sm:inline font-bold text-xs text-[var(--text-primary)] max-w-[95px] truncate">
                    {user ? getUserFirstName(user) : "My Account"}
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
                    {user?.name || "My Account"}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate mt-0.5 font-medium">
                    {user?.phone || user?.email || "Logged in"}
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
                    onClick={() => router.push("/wishlist")}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <span>My Wishlist</span>
                    {displayWishlistCount > 0 && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        {displayWishlistCount}
                      </span>
                    )}
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

          {/* Wishlist Header Target Button */}
          <button
            id="header-wishlist-target"
            type="button"
            onClick={() => router.push("/wishlist")}
            aria-label={`Wishlist (${displayWishlistCount} items)`}
            className="relative h-10 sm:h-11 w-10 sm:w-11 flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)]/60 text-[var(--text-primary)] hover:text-rose-600 hover:bg-rose-50/50 hover:border-rose-200 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Heart
              className={`h-4.5 w-4.5 transition-colors ${
                displayWishlistCount > 0
                  ? "fill-rose-500 text-rose-500"
                  : "text-[var(--text-secondary)]"
              }`}
            />
            {displayWishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs">
                {displayWishlistCount > 99 ? "99+" : displayWishlistCount}
              </span>
            )}
          </button>

          {/* Prominent Cart Pill Button - Always displayed for all users */}
          <Button
            onClick={() => setIsCartDrawerOpen(true)}
            size="sm"
            className="h-10 sm:h-11 px-3.5 sm:px-4 bg-[#0c831f] hover:bg-[#0a6f1a] text-white flex items-center gap-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <div className="relative flex items-center justify-center shrink-0">
              <ShoppingCart className="h-4.5 w-4.5" />
              {displayCartCount > 0 && (
                <span
                  className="absolute -top-2.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs"
                >
                  {displayCartCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 leading-none">
              <span>
                {displayCartCount === 0
                  ? "My Cart"
                  : `${displayCartCount} ${displayCartCount === 1 ? "item" : "items"}`}
              </span>
              {displayCartTotal > 0 && (
                <>
                  <span className="opacity-60 text-xs">•</span>
                  <span className="font-extrabold">
                    {formatCurrency(displayCartTotal)}
                  </span>
                </>
              )}
            </div>
          </Button>
        </div>
      </div>
    </header>
  );
}
