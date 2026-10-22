import React from "react";
import { SITE_CONFIG } from "@/lib/constants/site-config";
import { Award, Zap, ShieldCheck, Heart } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us - Farm-to-Fork Quick Commerce",
  description:
    "Learn how Tiding delivers farm fresh vegetables, fruits, and daily grocery staples directly from local farmers to your kitchen with express delivery.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-10">
      <div className="text-center space-y-3">
        <span className="rounded-full bg-[#18A818]/15 px-3 py-1 text-xs font-bold text-[#18A818]">
          Our Mission
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)]">
          Revolutionizing Fresh Grocery Delivery
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
          Tiding is built on a simple conviction: you shouldn&apos;t have to compromise between ultra-fresh produce and modern convenience.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#18A818]/15 text-[#18A818]">
            <Award className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Direct Farm Sourcing</h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            We partner directly with certified local farmers. Harvested at dawn, quality-checked, and delivered within hours.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#18A818]/15 text-[#18A818]">
            <Zap className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Express Dark Stores</h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Our neighborhood fulfillment hubs hold the freshest daily inventory, automated for 2-minute order packing.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#18A818]/15 text-[#18A818]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">100% Freshness Guarantee</h2>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            If any fruit, vegetable, or dairy item doesn&apos;t meet your standards, we refund it immediately with no hassle.
          </p>
        </div>
      </div>
    </div>
  );
}
