"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Package,
  Wallet,
  Headphones,
  ChevronRight,
  X,
  ArrowLeft,
  Sparkles,
  Zap,
  Edit2,
  Loader2,
  Lock,
  Clock,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
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
import { getUserDisplayInitials, getUserFirstName } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth-service";
import { cartService } from "@/lib/api/cart-service";

const EMPTY_OTP = ["", "", "", "", "", ""];

/** Mask contact so the OTP screen feels safer: ab***@gmail.com / 98****3210 */
function maskContact(method: "email" | "phone", value: string) {
  if (method === "email") {
    const [name = "", domain = ""] = value.split("@");
    if (!domain) return value;
    return `${name.slice(0, 2)}${"•".repeat(Math.max(name.length - 2, 2))}@${domain}`;
  }
  return value.length === 10 ? `${value.slice(0, 2)}••••••${value.slice(-2)}` : value;
}

/** Reusable account menu row */
function MenuItem({
  icon: Icon,
  title,
  subtitle,
  tint,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  tint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full cursor-pointer items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-left transition-all hover:-translate-y-px hover:border-[#0c831f]/30 hover:bg-[var(--surface-secondary)]/60 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0c831f]/30"
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${tint}`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</p>
          <p className="text-xs font-normal text-[var(--text-muted)]">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[#0c831f]" />
    </button>
  );
}

export function AuthDrawer() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useAtom(isAuthDrawerOpenAtom);
  const [, setIsLocationModalOpen] = useAtom(isLocationModalOpenAtom);
  const [user, setUser] = useAtom(userProfileAtom);
  const [, setSession] = useAtom(authSessionAtom);

  // Auth mode: email or phone
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // 6-digit OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>(EMPTY_OTP);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [hasError, setHasError] = useState(false);

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
      setOtpDigits(EMPTY_OTP);
      setIsLoading(false);
      setHasError(false);
    }
  }, [isOpen, user]);

  // Auto-focus first OTP box when entering OTP step
  useEffect(() => {
    if (step === "otp") {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const goTo = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch { }
    setUser(null);
    setSession({ user: null, token: null, isAuthenticated: false });
    toast.success("Logged out successfully");
    setIsOpen(false);
    router.push("/");
  };

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

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
        setOtpDigits(EMPTY_OTP);
        toast.success(data?.message || `Verification code sent to ${trimmedEmail}`);
      } catch (err: any) {
        toast.error(err?.message || "Failed to send verification code. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      const cleanPhone = phone.trim().replace(/\D/g, "");
      if (!cleanPhone || cleanPhone.length !== 10) {
        toast.error("Please enter a valid 10-digit mobile number");
        return;
      }

      setIsLoading(true);
      try {
        const data = await authService.sendOtp(cleanPhone);
        setStep("otp");
        setCooldown(60);
        setOtpDigits(EMPTY_OTP);
        toast.success(data?.message || `Verification code sent to +91 ${cleanPhone}`);
      } catch (err: any) {
        toast.error(err?.message || "Failed to send SMS code. Please try with Email.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      if (authMethod === "email") {
        await authService.sendEmailOtp(email.trim().toLowerCase());
      } else {
        await authService.sendOtp(phone.trim());
      }
      setCooldown(60);
      setOtpDigits(EMPTY_OTP);
      setHasError(false);
      inputRefs.current[0]?.focus();
      toast.success("New verification code sent!");
    } catch (err: any) {
      toast.error(err?.message || "Could not resend OTP. Please try again shortly.");
    } finally {
      setIsResending(false);
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
    setHasError(false);

    try {
      let result;
      if (authMethod === "email") {
        result = await authService.verifyEmailOtp(email.trim().toLowerCase(), cleanOtp);
      } else {
        result = await authService.verifyOtp(phone.trim(), cleanOtp);
      }

      const { accessToken, user: newUser } = result;

      setUser(newUser);
      setSession({
        user: newUser,
        token: accessToken,
        isAuthenticated: true,
      });

      // Merge anonymous cart into account
      cartService.mergeGuestCart().catch((err) => {
        console.warn("Guest cart merge warning:", err);
      });

      setIsOpen(false);
      setStep("input");
      setOtpDigits(EMPTY_OTP);
      setEmail("");
      setPhone("");
      toast.success(`Welcome back, ${getUserFirstName(newUser)}!`);

      // Check redirect if user was trying to access checkout
      if (typeof window !== "undefined") {
        const redirectPath = sessionStorage.getItem("tiding_auth_redirect");
        if (redirectPath) {
          sessionStorage.removeItem("tiding_auth_redirect");
          router.push(redirectPath);
        }
      }
    } catch (err: any) {
      // Shake the boxes, clear them and refocus so the user can retry immediately
      setHasError(true);
      setOtpDigits(EMPTY_OTP);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
      setTimeout(() => setHasError(false), 600);
      toast.error(err?.message || "Invalid or expired verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");

    // Handling pasted multi-digit string
    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split("");
      const updated = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        if (chars[i]) updated[i] = chars[i];
      }
      setOtpDigits(updated);
      const nextIndex = Math.min(chars.length, 5);
      inputRefs.current[nextIndex]?.focus();
      if (chars.length >= 6) {
        executeVerifyOtp(chars.slice(0, 6).join(""));
      }
      return;
    }

    const singleDigit = cleaned.slice(-1);
    const updated = [...otpDigits];
    updated[index] = singleDigit;
    setOtpDigits(updated);

    // Auto-focus next input
    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto trigger verification on 6th digit
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

  const inputClass =
    "h-12 rounded-2xl border-[var(--border)] bg-[var(--surface)] pl-11 text-sm font-normal shadow-xs transition-all focus-visible:border-[#0c831f] focus-visible:ring-4 focus-visible:ring-[#0c831f]/10";

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerContent
        side="right"
        size="md"
        // Wider: full width on mobile, 520px on tablet, 560px on desktop
        className="flex h-full w-full flex-col overflow-hidden border-l border-[var(--border)] bg-[var(--surface)] p-0 text-[var(--text-primary)] shadow-2xl sm:!max-w-[520px] lg:!max-w-[560px]"
      >
        {/* Local keyframes for the OTP shake + soft hero glow */}
        <style>{`
          @keyframes tiding-shake {
            0%,100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
          }
          @keyframes tiding-step-in {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .tiding-shake { animation: tiding-shake 0.45s ease-in-out; }
          .tiding-step { animation: tiding-step-in 0.28s ease-out; }
          @media (prefers-reduced-motion: reduce) {
            .tiding-shake, .tiding-step { animation: none; }
          }
        `}</style>

        {/* Hidden Accessible Headings for Radix Accessibility */}
        <DrawerTitle className="sr-only">
          {user ? "My Account" : step === "otp" ? "Verify OTP" : "Login to Tiding"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          {user
            ? "Manage profile, orders and addresses"
            : "Sign in with one-time verification code"}
        </DrawerDescription>

        {/* ============================ HERO HEADER ============================ */}
        <div className="relative h-48 w-full shrink-0 select-none overflow-hidden bg-black sm:h-56">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover opacity-70 brightness-95"
          >
            <source src={SITE_CONFIG.loginVideoUrl} type="video/mp4" />
          </video>

          {/* Layered gradients: depth + brand glow from the bottom-left */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-black/50 to-black/30" />
          <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-[#0c831f]/40 blur-3xl" />

          {/* Top bar: back (OTP step) + close */}
          <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
            {step === "otp" && !user ? (
              <button
                type="button"
                onClick={() => {
                  setStep("input");
                  setOtpDigits(EMPTY_OTP);
                }}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 text-white shadow-sm backdrop-blur-md transition-all hover:bg-black/60 active:scale-95"
                aria-label="Back to contact input"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <div />
            )}

            <DrawerClose asChild>
              <button
                type="button"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/40 text-white shadow-sm backdrop-blur-md transition-all hover:bg-black/60 active:scale-95"
                aria-label="Close drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </DrawerClose>
          </div>

          {/* Headline, badges and step progress */}
          <div className="absolute bottom-4 left-6 right-6 z-10 space-y-2 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0c831f] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
                <Zap className="h-2.5 w-2.5 fill-white" />
                Express Access
              </span>
              {!user && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-medium text-white/95 backdrop-blur-md">
                  <Sparkles className="h-2.5 w-2.5 text-amber-300" />
                  ₹100 welcome bonus
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold tracking-tight drop-shadow-sm sm:text-2xl">
              {user
                ? `Hello, ${user.name}`
                : step === "otp"
                  ? "Enter verification code"
                  : "Welcome to Tiding"}
            </h3>

            <p className="line-clamp-1 text-[13px] font-normal text-white/80">
              {user
                ? "Manage your orders, wallet & saved addresses"
                : step === "otp"
                  ? `We sent a 6-digit code to your ${authMethod}`
                  : "Instant grocery delivery in 10 minutes"}
            </p>

            {/* Two-step progress indicator (login flow only) */}
            {!user && (
              <div className="flex items-center gap-1.5 pt-1" aria-hidden="true">
                <span className="h-1 w-10 rounded-full bg-[#2fd152]" />
                <span
                  className={`h-1 w-10 rounded-full transition-colors duration-300 ${step === "otp" ? "bg-[#2fd152]" : "bg-white/30"
                    }`}
                />
              </div>
            )}
          </div>
        </div>

        {/* ============================ MAIN CONTENT ============================ */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {user ? (
            /* ---------------------- LOGGED-IN VIEW ---------------------- */
            <div className="tiding-step space-y-5">
              {/* Profile card */}
              <div className="flex items-center gap-4 rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface-secondary)]/70 to-[var(--surface)] p-4 shadow-xs">
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0c831f] to-[#18A818] text-lg font-bold tracking-wider text-white shadow-md">
                  {user.email
                    ? user.email.trim().charAt(0).toUpperCase()
                    : getUserDisplayInitials(user)}
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[var(--surface)] bg-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-[15px] font-semibold text-[var(--text-primary)]">
                      {user.name}
                    </h4>
                    {user.roles && user.roles.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        <BadgeCheck className="h-3 w-3" />
                        {user.roles[0].replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs font-normal text-[var(--text-secondary)]">
                    {user.email || user.phone || "Tiding Customer"}
                  </p>
                  {user.phone && user.email && (
                    <p className="truncate text-[11px] font-normal text-[var(--text-muted)]">
                      {user.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Wallet tile */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => goTo("/wallet")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") goTo("/wallet");
                }}
                className="group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-3xl border border-[#0c831f]/25 bg-gradient-to-r from-[#0c831f]/15 via-[#0c831f]/5 to-transparent p-5 shadow-xs transition-all hover:border-[#0c831f]/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0c831f]/30"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#0c831f]/10 blur-2xl" />
                <div className="relative">
                  <p className="text-xs font-medium text-[var(--text-secondary)]">
                    Tiding Cash balance
                  </p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-[#0c831f]">
                    ₹{user.walletBalance ?? 0}
                  </p>
                </div>
                <div className="relative flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-xl bg-[#0c831f] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors group-hover:bg-[#0a6f1a]">
                    <Wallet className="h-3.5 w-3.5" />
                    Manage
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#0c831f] transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>

              {/* Menu */}
              <div className="space-y-2">
                <p className="px-1 text-xs font-semibold text-[var(--text-muted)]">
                  Your account
                </p>

                <MenuItem
                  icon={MapPin}
                  title="My addresses"
                  subtitle={`${user.savedAddresses?.length || 0} saved address${user.savedAddresses?.length === 1 ? "" : "es"
                    }`}
                  tint="bg-teal-500/10 text-teal-600 dark:text-teal-400"
                  onClick={() => goTo("/addresses")}
                />
                <MenuItem
                  icon={Package}
                  title="My orders"
                  subtitle="Track live deliveries & history"
                  tint="bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  onClick={() => goTo("/orders")}
                />
                <MenuItem
                  icon={User}
                  title="Personal details"
                  subtitle="Edit name, phone & account info"
                  tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  onClick={() => goTo("/profile")}
                />
                <MenuItem
                  icon={TicketPercent}
                  title="Deals & coupons"
                  subtitle="Claim promo discounts & vouchers"
                  tint="bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  onClick={() => goTo("/offers")}
                />
                <MenuItem
                  icon={Headphones}
                  title="24x7 help & support"
                  subtitle="Customer care & order help"
                  tint="bg-purple-500/10 text-purple-600 dark:text-purple-400"
                  onClick={() => goTo("/contact")}
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="h-11 w-full cursor-pointer rounded-2xl border-rose-200 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          ) : step === "input" ? (
            /* ---------------------- INPUT STEP ---------------------- */
            <div className="tiding-step space-y-5">
              {/* Segmented selector */}
              <div
                role="tablist"
                aria-label="Sign in method"
                className="flex items-center gap-1 rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-secondary)] p-1"
              >
                {(
                  [
                    { id: "email", label: "Email address", Icon: Mail },
                    { id: "phone", label: "Mobile number", Icon: Phone },
                  ] as const
                ).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={authMethod === id}
                    onClick={() => setAuthMethod(id)}
                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${authMethod === id
                      ? "bg-[var(--surface)] font-semibold text-[#0c831f] shadow-sm"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendOtp} className="space-y-5">
                {authMethod === "email" ? (
                  <div className="space-y-2">
                    <label
                      htmlFor="auth-email"
                      className="flex items-center justify-between text-[13px] font-medium text-[var(--text-secondary)]"
                    >
                      <span>Email ID</span>
                      <span className="text-xs font-normal text-[var(--text-muted)]">
                        We&apos;ll send a 6-digit code
                      </span>
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                      <Input
                        id="auth-email"
                        type="email"
                        placeholder="yourname@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                        autoFocus
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label
                      htmlFor="auth-phone"
                      className="flex items-center justify-between text-[13px] font-medium text-[var(--text-secondary)]"
                    >
                      <span>Mobile number</span>
                      <span className="text-xs font-normal text-[var(--text-muted)]">
                        10-digit number
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex h-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/70 px-4 text-sm font-semibold text-[var(--text-primary)]">
                        +91
                      </div>
                      <div className="relative flex-1">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                        <Input
                          id="auth-phone"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          className={`${inputClass} tabular-nums tracking-wide`}
                          autoFocus
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || (authMethod === "email" ? !email : phone.length !== 10)}
                  className="h-12 w-full cursor-pointer rounded-2xl bg-[#0c831f] text-sm font-semibold text-white shadow-md shadow-[#0c831f]/20 transition-all hover:bg-[#0a6f1a] active:scale-[0.99] disabled:opacity-50 disabled:shadow-none"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending code...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Continue with OTP
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>

                {/* Perks */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { Icon: Zap, label: "10-min delivery", color: "text-[#0c831f]" },
                    { Icon: ShieldCheck, label: "Safe & encrypted", color: "text-emerald-600" },
                    { Icon: TicketPercent, label: "Exclusive deals", color: "text-amber-500" },
                  ].map(({ Icon, label, color }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-1.5 rounded-2xl border border-[var(--border)]/60 bg-[var(--surface-secondary)]/40 px-2 py-3 text-center text-[11px] font-normal leading-tight text-[var(--text-secondary)]"
                    >
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Terms */}
                <p className="pt-1 text-center text-xs font-normal leading-relaxed text-[var(--text-muted)]">
                  By continuing, you agree to Tiding&apos;s{" "}
                  <button
                    type="button"
                    onClick={() => goTo("/terms")}
                    className="cursor-pointer font-medium text-[#0c831f] hover:underline"
                  >
                    Terms of Service
                  </button>{" "}
                  &{" "}
                  <button
                    type="button"
                    onClick={() => goTo("/privacy-policy")}
                    className="cursor-pointer font-medium text-[#0c831f] hover:underline"
                  >
                    Privacy Policy
                  </button>
                </p>
              </form>
            </div>
          ) : (
            /* ---------------------- OTP STEP ---------------------- */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeVerifyOtp();
              }}
              className="tiding-step space-y-6"
            >
              {/* Contact pill */}
              <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)]/40 p-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0c831f]/10 text-[#0c831f]">
                    {authMethod === "email" ? (
                      <Mail className="h-[18px] w-[18px]" />
                    ) : (
                      <Phone className="h-[18px] w-[18px]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-normal text-[var(--text-muted)]">
                      Code sent to
                    </p>
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {authMethod === "email"
                        ? maskContact("email", email.trim().toLowerCase())
                        : `+91 ${maskContact("phone", phone.trim())}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep("input");
                    setOtpDigits(EMPTY_OTP);
                  }}
                  className="ml-2 inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[#0c831f] transition-colors hover:bg-[#0c831f]/10"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Change</span>
                </button>
              </div>

              {/* OTP boxes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-medium text-[var(--text-secondary)]">
                    Enter 6-digit code
                  </label>
                  <span className="text-xs font-normal text-[var(--text-muted)]">
                    Submits automatically
                  </span>
                </div>

                <div
                  className={`flex items-center justify-between gap-2 py-1 sm:gap-3 ${hasError ? "tiding-shake" : ""
                    }`}
                >
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className={`h-14 w-full max-w-[56px] select-none rounded-2xl border text-center text-2xl font-medium tabular-nums outline-none transition-all duration-150 sm:h-16 ${hasError
                        ? "border-rose-400 bg-rose-500/5 text-rose-600"
                        : digit
                          ? "border-[#0c831f] bg-[#0c831f]/[0.06] text-[var(--text-primary)] shadow-xs ring-4 ring-[#0c831f]/10"
                          : "border-[var(--border)] bg-[var(--surface-secondary)]/40 text-[var(--text-primary)] hover:border-neutral-300 focus:border-[#0c831f] focus:bg-[var(--surface)] focus:ring-4 focus:ring-[#0c831f]/15 dark:hover:border-neutral-700"
                        }`}
                      disabled={isLoading}
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Resend row */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-normal text-[var(--text-muted)]">
                    Didn&apos;t receive the code?
                  </span>
                  {cooldown > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)]/70 bg-[var(--surface-secondary)] px-3 py-1 text-xs font-normal tabular-nums text-[var(--text-secondary)]">
                      <Clock className="h-3 w-3 text-[#0c831f]" />
                      Resend in {cooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isResending || isLoading}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-[#0c831f] transition-colors hover:bg-[#0c831f]/10 disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3 w-3 ${isResending ? "animate-spin" : ""}`} />
                      <span>Resend code</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Verify */}
              <Button
                type="submit"
                disabled={otpDigits.join("").length !== 6 || isLoading}
                className="h-12 w-full cursor-pointer rounded-2xl bg-[#0c831f] text-sm font-semibold text-white shadow-md shadow-[#0c831f]/20 transition-all hover:bg-[#0a6f1a] active:scale-[0.99] disabled:opacity-50 disabled:shadow-none"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Verify & continue
                    <CheckCircle className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs font-normal text-[var(--text-muted)]">
                <Lock className="h-3 w-3 text-[#0c831f]" />
                <span>This code is valid for 5 minutes</span>
              </div>
            </form>
          )}
        </div>

        {/* ============================ FOOTER ============================ */}
        <div className="flex shrink-0 items-center justify-between border-t border-[var(--border)] bg-[var(--surface)] px-6 py-3 sm:px-8">
          <p className="flex items-center gap-1.5 text-[11px] font-normal text-[var(--text-muted)]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#0c831f]" />
            <span>256-bit SSL secured authentication</span>
          </p>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 cursor-pointer rounded-lg px-3 text-xs font-normal text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Dismiss
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}