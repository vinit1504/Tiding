"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAtom } from "jotai";
import {
  ShoppingBag,
  CreditCard,
  ShieldCheck,
  LogOut,
  Home,
  User,
  Headphones,
  TicketPercent,
  ChevronRight,
  Sparkles,
  BadgeCheck,
  Lock,
  Heart,
} from "lucide-react";
import { userProfileAtom, authSessionAtom } from "@/stores";
import { authService } from "@/services/auth-service";
import { toast } from "sonner";
import { getUserDisplayInitials } from "@/lib/utils";
import { useWishlist } from "@/hooks/use-wishlist";

interface AccountSidebarProps {
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
  className?: string;
}

export function AccountSidebar({ activeTab, className = "" }: AccountSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useAtom(userProfileAtom);
  const [, setSession] = useAtom(authSessionAtom);
  const { wishlistCount } = useWishlist();

  const userName = user?.name || user?.firstName || "Vinit";
  const displayContact = user?.phone || user?.email || "+91 75673 37686";
  const walletBalance = user?.walletBalance ?? 0;
  const userInitial = user ? getUserDisplayInitials(user) : "V";

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    setUser(null);
    setSession({ user: null, token: null, isAuthenticated: false });
    try {
      localStorage.removeItem("tiding_user");
      localStorage.removeItem("tiding_token");
      localStorage.setItem("tiding_logged_out", "true");
    } catch {
      // ignore
    }
    toast.success("Logged out successfully");
    router.push("/");
  };

  interface NavItem {
    label: string;
    href: string;
    id: string;
    icon: React.ElementType;
    badge?: React.ReactNode;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const navSections: NavSection[] = [
    {
      title: "ORDERS & ACCOUNT",
      items: [
        {
          label: "My Orders",
          href: "/orders",
          id: "orders",
          icon: ShoppingBag,
        },
        {
          label: "My Wishlist",
          href: "/wishlist",
          id: "wishlist",
          icon: Heart,
          badge: wishlistCount > 0 ? (
            <span className="inline-flex items-center text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              {wishlistCount}
            </span>
          ) : undefined,
        },
        {
          label: "My Addresses",
          href: "/addresses",
          id: "addresses",
          icon: Home,
        },
        {
          label: "My Profile",
          href: "/profile",
          id: "profile",
          icon: User,
        },
      ],
    },
    {
      title: "SAVINGS & REWARDS",
      items: [
        {
          label: "Tiding Wallet",
          href: "/wallet",
          id: "wallet",
          icon: CreditCard,
          badge: (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25">
              ₹{walletBalance}
            </span>
          ),
        },
        {
          label: "Deals & Offers",
          href: "/offers",
          id: "offers",
          icon: TicketPercent,
          badge: (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wider uppercase text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/25">
              <Sparkles className="h-2.5 w-2.5 text-amber-600" />
              OFFERS
            </span>
          ),
        },
      ],
    },
    {
      title: "HELP & POLICIES",
      items: [
        {
          label: "24x7 Help & Support",
          href: "/contact",
          id: "support",
          icon: Headphones,
        },
        {
          label: "Privacy & Terms",
          href: "/privacy-policy",
          id: "privacy",
          icon: ShieldCheck,
        },
      ],
    },
  ];

  return (
    <aside
      className={`w-full sm:w-64 md:w-72 lg:w-80 shrink-0 self-start lg:sticky lg:top-20 z-20 ${className}`}
    >
      <div className="rounded-2xl bg-white border border-gray-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06),0_1px_2px_0_rgba(0,0,0,0.03)] p-4 sm:p-5 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-none">
        {/* Top Profile Card Header */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500/[0.08] via-emerald-500/[0.03] to-transparent p-3.5 border border-emerald-500/15">
          <div className="flex items-center gap-3">
            {/* User Avatar */}
            <div className="relative shrink-0">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#18A818] via-[#149514] to-[#0c831f] text-white font-extrabold text-base shadow-sm ring-2 ring-emerald-500/25">
                {userInitial}
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-white flex items-center justify-center"
                title="Verified Customer"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 block" />
              </div>
            </div>

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {userName}
                </p>
                <BadgeCheck className="h-3.5 w-3.5 text-[#0c831f] shrink-0" />
              </div>
              <p className="text-xs font-medium text-gray-500 truncate mt-0.5">
                {displayContact}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-emerald-500/10 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-emerald-800 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Tiding Member
            </span>
            <Link
              href="/profile"
              className="font-bold text-[#0c831f] hover:text-emerald-700 hover:underline transition-colors"
            >
              Manage
            </Link>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-4 pt-1">
          {navSections.map((section, idx) => (
            <div key={section.title} className="space-y-1">
              {idx > 0 && <div className="border-t border-gray-100 my-2" />}
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {section.title}
              </p>

              <div className="space-y-0.5 mt-1.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activeTab === item.id ||
                    pathname === item.href ||
                    (item.id === "addresses" && pathname.includes("/addresses")) ||
                    (item.id === "orders" && pathname.includes("/orders")) ||
                    (item.id === "profile" && pathname.includes("/profile")) ||
                    (item.id === "wallet" && pathname.includes("/wallet")) ||
                    (item.id === "offers" && pathname.includes("/offers")) ||
                    (item.id === "support" && pathname.includes("/contact")) ||
                    (item.id === "privacy" && pathname.includes("/privacy-policy"));

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                        isActive
                          ? "bg-emerald-50/80 text-emerald-950 font-bold border border-emerald-200/60 shadow-xs"
                          : "text-gray-700 hover:bg-gray-50/90 hover:text-gray-950"
                      }`}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#0c831f] rounded-r-full" />
                      )}

                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${
                            isActive
                              ? "bg-[#0c831f] text-white shadow-xs shadow-emerald-700/20"
                              : "bg-gray-100/80 text-gray-500 group-hover:bg-emerald-50 group-hover:text-[#0c831f]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        {item.badge}
                        <ChevronRight
                          className={`h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 ${
                            isActive
                              ? "text-emerald-700"
                              : "text-gray-300 group-hover:text-gray-500"
                          }`}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Divider before logout */}
          <div className="border-t border-gray-100 pt-1" />

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:bg-rose-50/80 hover:text-rose-700 transition-all cursor-pointer border border-transparent hover:border-rose-200/60"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors shadow-xs">
                <LogOut className="h-4 w-4" />
              </div>
              <span>Log Out</span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </nav>

        {/* Security / Trust Footer micro-card */}
        <div className="pt-2">
          <div className="flex items-center gap-2 rounded-xl bg-gray-50/80 p-2.5 border border-gray-100 text-[11px] text-gray-500">
            <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">100% Safe & Secure Experience</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
