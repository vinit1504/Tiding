"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  ArrowRight,
  Apple,
  Milk,
  Cookie,
  Carrot,
  Zap,
  Leaf,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Update the hrefs to match your real category routes.
const QUICK_CATEGORIES = [
  {
    label: "Fruits & vegetables",
    href: "/",
    icon: Apple,
    tone: "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100",
  },
  {
    label: "Dairy & eggs",
    href: "/",
    icon: Milk,
    tone: "bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100",
  },
  {
    label: "Snacks",
    href: "/",
    icon: Cookie,
    tone: "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100",
  },
  {
    label: "Daily essentials",
    href: "/",
    icon: Carrot,
    tone: "bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100",
  },
];

const PERKS = [
  { label: "15 min delivery", icon: Zap },
  { label: "Fresh every day", icon: Leaf },
  { label: "Quality checked", icon: ShieldCheck },
];

export function CartEmptyState() {
  return (
    <section
      aria-labelledby="cart-empty-title"
      className="relative mx-auto my-8 max-w-xl overflow-hidden rounded-[2rem] border border-[var(--primary)]/10 bg-gradient-to-b from-white via-white to-[var(--primary-light)]/50 px-5 py-12 text-center shadow-sm sm:my-12 sm:px-10 sm:py-16"
    >
      <style>{`
        @keyframes cart-float {
          0%, 100% { transform: translateY(0) rotate(var(--r, 0deg)); }
          50% { transform: translateY(-8px) rotate(var(--r, 0deg)); }
        }
        @keyframes cart-twinkle {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>

      {/* Soft pastel glows */}
      <div aria-hidden className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-[var(--primary-light)] opacity-80 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-14 top-24 h-44 w-44 rounded-full bg-yellow-100 opacity-70 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-sky-100 opacity-70 blur-3xl" />

      {/* Tiny confetti dots */}
      <span aria-hidden className="absolute left-[12%] top-[14%] h-2 w-2 rounded-full bg-rose-200" />
      <span aria-hidden className="absolute right-[14%] top-[10%] h-2.5 w-2.5 rounded-full bg-amber-200" />
      <span aria-hidden className="absolute left-[8%] top-[46%] h-1.5 w-1.5 rounded-full bg-sky-200" />
      <span aria-hidden className="absolute right-[9%] top-[52%] h-2 w-2 rounded-full bg-[var(--primary)]/30" />

      <div className="relative flex flex-col items-center">
        {/* Illustration */}
        <div className="relative mb-8 flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white to-[var(--primary-light)] ring-1 ring-[var(--primary)]/10" />
          <div className="absolute inset-5 rounded-full border border-dashed border-[var(--primary)]/25" />
          <div className="absolute inset-10 rounded-full bg-white/90" />

          {/* Cart tile: light, with a colored icon */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-[var(--primary)]/15 bg-white text-[var(--primary)] shadow-md shadow-[var(--primary)]/10 sm:h-24 sm:w-24">
            <ShoppingCart className="h-10 w-10 stroke-[1.75] sm:h-12 sm:w-12" />
            <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-100 text-amber-500 ring-2 ring-white">
              <Sparkles
                className="h-4 w-4"
                style={{ animation: "cart-twinkle 2.4s ease-in-out infinite" }}
              />
            </span>
          </div>

          <FloatingChip className="-left-1 top-6 bg-rose-50 text-rose-500" style={{ ["--r" as string]: "-10deg", animationDelay: "0s" }}>
            <Apple className="h-5 w-5" />
          </FloatingChip>
          <FloatingChip className="-right-2 top-10 bg-sky-50 text-sky-500" style={{ ["--r" as string]: "8deg", animationDelay: "0.6s" }}>
            <Milk className="h-5 w-5" />
          </FloatingChip>
          <FloatingChip className="-left-3 bottom-8 bg-amber-50 text-amber-500" style={{ ["--r" as string]: "6deg", animationDelay: "1.2s" }}>
            <Cookie className="h-5 w-5" />
          </FloatingChip>
          <FloatingChip className="-right-1 bottom-4 bg-orange-50 text-orange-500" style={{ ["--r" as string]: "-8deg", animationDelay: "1.8s" }}>
            <Carrot className="h-5 w-5" />
          </FloatingChip>
        </div>

        {/* Copy */}
        <h2
          id="cart-empty-title"
          className="text-2xl font-black tracking-tight text-[var(--text-primary)] sm:text-3xl"
        >
          Your cart is empty
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
          Add fresh groceries, dairy, snacks and daily essentials. We deliver in
          15 minutes.
        </p>

        {/* Primary action */}
        <Link href="/" className="mt-6 inline-block">
          <Button
            size="lg"
            className="group h-12 cursor-pointer gap-2 rounded-full bg-[var(--primary)] px-8 text-sm font-black text-white shadow-sm shadow-[var(--primary)]/20 transition-all hover:bg-[var(--primary-hover)] hover:shadow-md active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          >
            <span>Start shopping</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>

        {/* Quick categories */}
        <div className="mt-9 w-full">
          <p className="mb-3 text-xs font-semibold text-[var(--text-secondary)]">
            Or jump straight to
          </p>
          <ul className="flex flex-wrap justify-center gap-2">
            {QUICK_CATEGORIES.map(({ label, href, icon: Icon, tone }) => (
              <li key={label}>
                <Link
                  href={href}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] ${tone}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Perks */}
        <ul className="mt-9 grid w-full grid-cols-3 gap-2 sm:gap-3">
          {PERKS.map(({ label, icon: Icon }) => (
            <li
              key={label}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-[var(--primary)]/10 bg-white/80 px-2 py-3 text-[11px] font-semibold text-[var(--text-secondary)] backdrop-blur-sm sm:text-xs"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-light)] text-[var(--primary)]">
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FloatingChip({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden
      style={{ animation: "cart-float 4s ease-in-out infinite", ...style }}
      className={`absolute flex h-10 w-10 items-center justify-center rounded-2xl border border-white shadow-sm motion-reduce:!animate-none ${className}`}
    >
      {children}
    </span>
  );
}