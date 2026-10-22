import React from "react";
import { SITE_CONFIG } from "@/lib/constants/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Conditions of Use",
  description: "Terms and conditions governing the use of Tiding instant grocery delivery services.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-6 text-xs text-[var(--text-secondary)] leading-relaxed">
      <h1 className="text-2xl font-black text-[var(--text-primary)]">
        Terms of Service
      </h1>
      <p className="text-[11px] text-[var(--text-muted)]">
        Last updated: October 2026
      </p>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Tiding web storefront, you agree to be bound by these Terms of Service and all applicable laws and regulations.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">2. Product Availability & Pricing</h2>
        <p>
          We strive to provide accurate stock quantities and pricing for all farm produce, dairy, and grocery items. In the rare event of an out-of-stock item after order placement, an instant refund will be processed to your source payment method.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold text-[var(--text-primary)]">3. Freshness Guarantee</h2>
        <p>
          We stand by the freshness of our fruits and vegetables. Quality complaints lodged within 24 hours of delivery are eligible for immediate replacement or full refund.
        </p>
      </section>
    </div>
  );
}
