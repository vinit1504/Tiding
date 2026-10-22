"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAtom } from "jotai";
import {
  User,
  Mail,
  Phone,
  CheckCircle,
  LogOut,
  ArrowRight,
  ShieldCheck,
  TicketPercent,
  MapPin,
  RefreshCw,
  KeyRound,
  Package,
  Wallet,
  Headphones,
  ChevronRight,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  isAuthDrawerOpenAtom,
  isLocationModalOpenAtom,
  userProfileAtom,
  authSessionAtom,
} from "@/stores";
import { SITE_CONFIG } from "@/lib/constants/site-config";
import { UserProfile } from "@/types/user";
import { getUserDisplayInitials, getUserFirstName } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService, parseBackendUserToProfile } from "@/services/auth-service";
import { cartService } from "@/lib/api/cart-service";

function parseBackendUser(backendUser: any, fallbackContact: string): UserProfile {
  const profile = backendUser?.profile || {};
  const firstName = profile.firstName || "";
  const lastName = profile.lastName || "";
  const displayName = profile.displayName || (firstName ? `${firstName} ${lastName}`.trim() : "");
  const name = displayName || backendUser?.name || fallbackContact.split("@")[0] || "Valued Customer";

  const savedAddresses = (backendUser?.addresses || []).map((addr: any) => ({
    id: addr.id || `addr-${Date.now()}`,
    type: (addr.addressType?.toLowerCase() === "office" || addr.addressType?.toLowerCase() === "work") ? "work" : "home",
    title: addr.addressType || "Home",
    addressLine: [addr.addressLine1, addr.addressLine2, addr.landmark].filter(Boolean).join(", "),
    area: addr.areaName || "",
    city: addr.cityName || "",
    pincode: addr.pincode || "",
    isDefault: !!addr.isDefault,
  }));

  return {
    id: backendUser?.id || `usr-${Date.now()}`,
    name,
    firstName: firstName || name.split(" ")[0],
    lastName: lastName || "",
    email: backendUser?.email || (fallbackContact.includes("@") ? fallbackContact : undefined),
    phone: backendUser?.phone || (!fallbackContact.includes("@") ? fallbackContact : undefined),
    avatar_url: profile.avatarUrl || backendUser?.avatar_url || undefined,
    roles: backendUser?.roles || [],
    status: backendUser?.status || "ACTIVE",
    walletBalance: backendUser?.walletBalance ?? 100,
    savedAddresses,
    profile,
  };
}

export function AuthDrawer() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useAtom(isAuthDrawerOpenAtom);
  const [, setIsLocationModalOpen] = useAtom(isLocationModalOpenAtom);
  const [user, setUser] = useAtom(userProfileAtom);
  const [session, setSession] = useAtom(authSessionAtom);

  // Auth mode: email or phone
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  // 6 square OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Reset form state when drawer closes
  useEffect(() => {
    if (!isOpen && !user) {
      setStep("input");
      setOtpDigits(["", "", "", "", "", ""]);
    }
  }, [isOpen, user]);

  // Auto-focus first OTP box when entering OTP step
  useEffect(() => {
    if (step === "otp") {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {}
    setUser(null);
    setSession({ user: null, token: null, isAuthenticated: false });
    toast.success("Logged out successfully");
    setIsOpen(false);
    router.push("/");
  };

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMethod === "email") {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        toast.error("Please enter a valid email address");
        return;
      }

      setIsLoading(true);
      try {
        const data = await authService.sendEmailOtp(trimmedEmail);
        setStep("otp");
        setCooldown(60);
        toast.success(data?.message || `6-digit OTP sent to ${trimmedEmail}`);
      } catch (err: any) {
        toast.error(err?.message || "Failed to send email verification code");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle Verify OTP
  const executeVerifyOtp = async (codeToVerify?: string) => {
    const cleanOtp = (codeToVerify || otpDigits.join("")).trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    setIsLoading(true);

    if (authMethod === "email") {
      const trimmedEmail = email.trim().toLowerCase();
      try {
        const { accessToken, user: newUser } = await authService.verifyEmailOtp(trimmedEmail, cleanOtp);

        setUser(newUser);
        setSession({
          user: newUser,
          token: accessToken,
          isAuthenticated: true,
        });

        // Merges anonymous guest session cart into user account upon sign-in (Postman Endpoint #10)
        cartService.mergeGuestCart().catch((err) => {
          console.warn("Guest cart merge sync warning:", err);
        });

        setIsOpen(false);
        setStep("input");
        setOtpDigits(["", "", "", "", "", ""]);
        setEmail("");
        toast.success(`Welcome back, ${getUserFirstName(newUser)}!`);

        // Check if there was a pending redirect (e.g. to /checkout)
        if (typeof window !== "undefined") {
          const redirectPath = sessionStorage.getItem("tiding_auth_redirect");
          if (redirectPath) {
            sessionStorage.removeItem("tiding_auth_redirect");
            router.push(redirectPath);
          }
        }
      } catch (err: any) {
        toast.error(err?.message || "Invalid or expired verification code");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");

    // If user pasted multiple characters into a single square box
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split("");
      const updated = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        if (chars[i]) updated[i] = chars[i];
      }
      setOtpDigits(updated);
      const lastIndex = Math.min(chars.length, 6) - 1;
      inputRefs.current[Math.min(lastIndex + 1, 5)]?.focus();
      if (chars.length >= 6) {
        executeVerifyOtp(chars.slice(0, 6).join(""));
      }
      return;
    }

    const singleDigit = cleaned.slice(-1);
    const updated = [...otpDigits];
    updated[index] = singleDigit;
    setOtpDigits(updated);

    // Auto advance to next square box if digit entered
    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // When the 6th digit is entered, automatically trigger the API!
    const fullCode = updated.join("");
    if (fullCode.length === 6 && !updated.includes("")) {
      executeVerifyOtp(fullCode);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const updated = [...otpDigits];
        updated[index - 1] = "";
        setOtpDigits(updated);
        inputRefs.current[index - 1]?.focus();
      } else {
        const updated = [...otpDigits];
        updated[index] = "";
        setOtpDigits(updated);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const chars = pasted.split("");
    const updated = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      updated[i] = chars[i] || "";
    }
    setOtpDigits(updated);
    if (chars.length >= 6) {
      executeVerifyOtp(chars.slice(0, 6).join(""));
    } else {
      inputRefs.current[chars.length]?.focus();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent side="right" size="md" className="w-full sm:max-w-md p-0 overflow-hidden">
        {/* Hero Video Banner */}
        <div className="relative h-44 w-full overflow-hidden bg-black">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover opacity-75"
          >
            <source src={SITE_CONFIG.loginVideoUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
          <div className="absolute bottom-3 left-6 right-6 text-white space-y-1">
            <span className="rounded-full bg-[#18A818] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
              ⚡ Express Sign In
            </span>
            <h3 className="text-base font-black leading-tight text-white">
              {user ? `Hello, ${user.name}` : "Login to Tiding"}
            </h3>
            <p className="text-[11px] text-white/80">
              {user
                ? "Manage your profile, orders & saved addresses"
                : "Passwordless OTP login & ₹100 welcome bonus"}
            </p>
          </div>
        </div>

        {/* Drawer Header */}
        <DrawerHeader>
          <DrawerTitle>{user ? "My Account" : "Passwordless OTP Login"}</DrawerTitle>
          <DrawerDescription>
            {user
              ? "View personal account details and wallet balance"
              : "Zero password hassle — login securely with Email or Mobile OTP"}
          </DrawerDescription>
        </DrawerHeader>

        {/* Drawer Body */}
        <DrawerBody className="p-6 space-y-4">
          {user ? (
            /* Logged In View - Beautifully Styled Profile & Options */
            <div className="space-y-4">
              {/* Profile Card with ONLY Email First Character in Avatar */}
              <div className="flex items-center gap-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/60 p-4 shadow-xs">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#18A818] to-[#0c831f] text-white font-black text-xl shadow-md tracking-wider ring-2 ring-[#18A818]/30">
                  {user.email ? user.email.trim().charAt(0).toUpperCase() : getUserDisplayInitials(user)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-extrabold text-[var(--text-primary)] truncate">
                      {user.name}
                    </h4>
                    {user.roles && user.roles.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {user.roles[0].replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5 font-medium">
                    {user.email || user.phone || "Tiding Member"}
                  </p>
                  {user.phone && user.email && (
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {user.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Wallet Card */}
              <div
                onClick={() => {
                  setIsOpen(false);
                  router.push("/wallet");
                }}
                className="rounded-2xl border border-[#18A818]/30 bg-[#18A818]/10 p-4 flex items-center justify-between text-xs shadow-xs cursor-pointer hover:bg-[#18A818]/15 transition-colors group"
              >
                <div>
                  <p className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    Tiding Cash Wallet
                  </p>
                  <p className="text-lg font-black text-[#18A818]">
                    ₹{user.walletBalance ?? 0}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-[#18A818] px-3 py-1 text-[11px] font-black text-white shadow-xs">
                    <ArrowRight className="h-3.5 w-3.5" />
                    Manage
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#18A818] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Styled Option Section matching Sidebar & Avatar Dropdown */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
                  Account Options
                </p>

                {/* 1. My Addresses Option */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/addresses");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">My Addresses</p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {user.savedAddresses?.length || 0} saved address{user.savedAddresses?.length === 1 ? "" : "es"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 2. My Orders Option */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/orders");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">My Orders</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Track live deliveries & past items</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 3. My Profile Option */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/profile");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">My Profile</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Edit personal details & account info</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 4. Tiding Wallet */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/wallet");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">Tiding Wallet</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Instant cash & refunds</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 5. Deals & Offers */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/offers");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:scale-105 transition-transform">
                      <TicketPercent className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">Deals & Offers</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Coupons, discounts & flash sales</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 6. 24x7 Help & Support */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/contact");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                      <Headphones className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">24x7 Help & Support</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Contact customer care & issues</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* 7. Account Privacy & Terms */}
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/privacy-policy");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">Account Privacy & Terms</p>
                      <p className="text-[10px] text-[var(--text-muted)]">Terms of service & safety</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Sign Out Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full h-10 text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-xs rounded-xl cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Log Out
              </Button>
            </div>
          ) : step === "input" ? (
            /* Input Step: Email or Mobile Selector & Form */
            <div className="space-y-4">
              {/* Toggle Buttons: Email vs Mobile */}
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-secondary)] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("email");
                    setOtpDigits(["", "", "", "", "", ""]);
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                    authMethod === "email"
                      ? "bg-[var(--surface)] text-[#18A818] shadow-xs"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email ID</span>
                </button>
                <button
                  type="button"
                  disabled
                  title="Mobile SMS login coming soon"
                  className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-gray-400 opacity-80 cursor-not-allowed bg-transparent"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span>Mobile SMS</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                    Coming Soon
                  </span>
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendOtp} className="space-y-4">
                {authMethod === "email" ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between">
                      <span>Email Address</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-normal">
                        6-digit OTP will be sent
                      </span>
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                      <Input
                        type="email"
                        placeholder="e.g. customer@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 text-xs sm:text-sm rounded-xl"
                        autoFocus
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between">
                      <span>Mobile Number</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-normal">
                        SMS OTP
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-3 text-xs font-bold text-[var(--text-primary)]">
                        +91
                      </span>
                      <Input
                        type="tel"
                        maxLength={10}
                        placeholder="Enter 10-digit number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        className="flex-1 h-11 text-xs sm:text-sm rounded-xl"
                        autoFocus
                        required
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full h-11 bg-[#18A818] hover:bg-[#148F14] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-transform active:scale-98"
                >
                  <span>Send Verification Code</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)] pt-2">
                  <ShieldCheck className="h-4 w-4 text-[#18A818]" />
                  <span>Secure 256-bit encrypted authentication</span>
                </div>
              </form>
            </div>
          ) : (
            /* OTP Verification Step with 6 Square Boxes and Auto API Trigger */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeVerifyOtp();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text-primary)]">
                    Enter 6-Digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("input");
                      setOtpDigits(["", "", "", "", "", ""]);
                    }}
                    className="text-[11px] font-bold text-[#18A818] hover:underline cursor-pointer"
                  >
                    Change {authMethod === "email" ? "Email" : "Phone"}
                  </button>
                </div>

                {/* 6 Individual Square Boxes */}
                <div className="flex items-center justify-between gap-2 sm:gap-2.5 py-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className={`h-12 w-11 sm:h-14 sm:w-12 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border-2 transition-all duration-150 outline-none select-none ${
                        digit
                          ? "border-[#18A818] bg-[#18A818]/10 text-[#18A818] shadow-sm ring-2 ring-[#18A818]/20"
                          : "border-[var(--border)] bg-[var(--surface-secondary)]/50 text-[var(--text-primary)] focus:border-[#18A818] focus:bg-[var(--surface)] focus:ring-2 focus:ring-[#18A818]/25"
                      }`}
                      disabled={isLoading}
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
                  <span>
                    Sent to: <strong className="text-[var(--text-primary)]">{authMethod === "email" ? email : `+91 ${phone}`}</strong>
                  </span>
                  {cooldown > 0 ? (
                    <span className="font-semibold text-[var(--text-muted)]">
                      Resend in {cooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="text-[#18A818] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Resend OTP
                    </button>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                disabled={otpDigits.join("").length !== 6 || isLoading}
                className="w-full h-11 bg-[#18A818] hover:bg-[#148F14] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-transform active:scale-98"
              >
                <span>{isLoading ? "Verifying code..." : "Verify & Login"}</span>
                <CheckCircle className="h-4 w-4 ml-1.5" />
              </Button>
            </form>
          )}
        </DrawerBody>

        {/* Drawer Footer */}
        <DrawerFooter className="border-t border-[var(--border)] pt-3">
          <DrawerClose asChild>
            <Button variant="outline" size="sm" className="w-full rounded-xl text-xs">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
