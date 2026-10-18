"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAtom } from "jotai";
import {
  MapPin,
  ShoppingBag,
  FileText,
  CreditCard,
  ShieldCheck,
  LogOut,
  Home,
  User,
  Headphones,
  TicketPercent,
} from "lucide-react";
import { userProfileAtom, authSessionAtom } from "@/stores";
import { authService } from "@/services/auth-service";
import { toast } from "sonner";

interface AccountSidebarProps {
  activeTab?:
    | "addresses"
    | "orders"
    | "profile"
    | "wallet"
    | "offers"
    | "support"
    | "privacy"
    | "prescriptions";
}

export function AccountSidebar({ activeTab }: AccountSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useAtom(userProfileAtom);
  const [, setSession] = useAtom(authSessionAtom);

  const userName = user?.name || "Vinit";
  const displayContact = user?.phone || user?.email || "+91 75673 37686";

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    setUser(null);
    setSession({ user: null, token: null, isAuthenticated: false });
    toast.success("Logged out successfully");
    router.push("/");
  };

  const navItems = [
    {
      label: "My Addresses",
      href: "/addresses",
      id: "addresses",
      icon: Home,
    },
    {
      label: "My Orders",
      href: "/orders",
      id: "orders",
      icon: ShoppingBag,
    },
    {
      label: "My Profile",
      href: "/profile",
      id: "profile",
      icon: User,
    },
    {
      label: "Tiding Wallet",
      href: "/wallet",
      id: "wallet",
      icon: CreditCard,
    },
    {
      label: "Deals & Offers",
      href: "/offers",
      id: "offers",
      icon: TicketPercent,
    },
    {
      label: "24x7 Help & Support",
      href: "/contact",
      id: "support",
      icon: Headphones,
    },
    {
      label: "Account Privacy & Terms",
      href: "/privacy-policy",
      id: "privacy",
      icon: ShieldCheck,
    },
  ];

  return (
    <aside className="w-full sm:w-64 md:w-72 shrink-0 rounded-2xl bg-white border border-gray-200/80 p-5 space-y-5 shadow-xs self-start md:sticky md:top-36 z-20">
      {/* Top User Name & Contact Header (Matches Avatar Option exactly) */}
      <div className="border-b border-gray-100 pb-4 space-y-0.5">
        <p className="text-sm font-extrabold text-gray-900 truncate">
          {userName}
        </p>
        <p className="text-xs font-medium text-gray-500 truncate">
          {displayContact}
        </p>
      </div>

      {/* Nav List */}
      <nav className="space-y-1">
        {navItems.map((item) => {
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
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-gray-100/90 font-bold text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon
                className={`h-4.5 w-4.5 ${
                  isActive
                    ? "text-[#0c831f]"
                    : "text-gray-500"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-rose-600 transition-all cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5 text-gray-500" />
          <span>Log Out</span>
        </button>
      </nav>
    </aside>
  );
}
