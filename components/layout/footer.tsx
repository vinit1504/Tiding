"use client";

import React from "react";
import Link from "next/link";
import { Zap, ShieldCheck, Clock, Award, ArrowUpRight } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants/site-config";

const APP_STORE_URL = "https://apps.apple.com/";
const PLAY_STORE_URL = "https://play.google.com/store/apps/";

// Config Data for Value Propositions
const VALUE_PROPS = [
  { icon: Zap, title: "Express Delivery", desc: "From local dark stores to your doorstep" },
  { icon: Award, title: "Farm-to-Fork Fresh", desc: "Harvested at 4 AM every morning" },
  { icon: ShieldCheck, title: "100% Quality Assurance", desc: "Instant refund if not fresh" },
  { icon: Clock, title: "6 AM to 11:30 PM", desc: "Round-the-clock grocery support" },
];

// Config Data for Useful Links (3 Columns)
const USEFUL_LINKS = [
  [
    { label: "About Us", href: "/about" },
    { label: "Privacy", href: "/privacy-policy" },
    { label: "Terms", href: "/terms" },
    { label: "FAQs", href: "/faq" },
    { label: "Security", href: "/privacy-policy" },
    { label: "Contact", href: "/contact" },
  ],
  [
    { label: "Partner", href: "/contact" },
    { label: "Franchise", href: "/contact" },
    { label: "Seller", href: "/contact" },
    { label: "Warehouse", href: "/delivery-areas" },
    { label: "Deliver", href: "/contact" },
    { label: "Resources", href: "/faq" },
  ],
  [
    { label: "Recipes", href: "/category/fruits-vegetables", prefetch: false },
    { label: "Bistro", href: "/category/dairy-breakfast", prefetch: false },
    { label: "District", href: "/delivery-areas" },
    { label: "Ambulance", href: "/about" },
    { label: "Feeding Hope", href: "/about" },
    { label: "Tiding Credit", href: "/wallet" },
  ],
];

// Config Data for Categories (3 Columns)
const CATEGORIES = [
  [
    { label: "Vegetables & Fruits", href: "/category/fruits-vegetables" },
    { label: "Dairy, Bread & Eggs", href: "/category/dairy-breakfast" },
    { label: "Atta, Rice & Dal", href: "/category/atta-rice-dal" },
    { label: "Bakery & Biscuits", href: "/category/bakery-biscuits" },
    { label: "Snacks & Munchies", href: "/category/snacks-munchies" },
    { label: "Drinks & Juices", href: "/category/cold-drinks-juices" },
    { label: "Tea, Coffee & Drinks", href: "/category/tea-coffee-milk-drinks" },
    { label: "Instant Food", href: "/category/breakfast-instant-food" },
    { label: "Sweets & Chocolates", href: "/category/sweet-tooth" },
    { label: "Oil, Ghee & Masala", href: "/category/atta-rice-dal" },
  ],
  [
    { label: "Bath & Body", href: "/category/pharma-wellness" },
    { label: "Beauty & Cosmetics", href: "/category/pharma-wellness" },
    { label: "Health & Pharma", href: "/category/pharma-wellness" },
    { label: "Cleaners & Repellents", href: "/category/cleaners-repellents" },
    { label: "Home & Lifestyle", href: "/category/home-lifestyle" },
    { label: "Paan Corner", href: "/category/paan-corner" },
    { label: "Baby Care", href: "/category/baby-care" },
    { label: "Pet Care Supplies", href: "/category/pet-care" },
    { label: "Kitchenware & Tools", href: "/category/home-lifestyle" },
    { label: "Print Store & Station", href: "/category/home-lifestyle" },
  ],
  [
    { label: "Skin & Face", href: "/category/pharma-wellness" },
    { label: "Hair Care", href: "/category/pharma-wellness" },
    { label: "Feminine Hygiene", href: "/category/pharma-wellness" },
    { label: "Sexual Wellness", href: "/category/pharma-wellness" },
    { label: "Ice Creams & More", href: "/category/sweet-tooth" },
    { label: "Sauces & Spreads", href: "/category/snacks-munchies" },
    { label: "Chicken, Meat & Fish", href: "/category/meat-fish" },
    { label: "Electronics & Cords", href: "/category/home-lifestyle" },
    { label: "Festive & Gift Packs", href: "/category/sweet-tooth" },
    { label: "E-Gift Cards", href: "/wallet", prefetch: false },
  ],
];

const SOCIALS = [
  {
    name: "Facebook",
    href: "https://facebook.com",
    bg: "#1877F2",
    path: "M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z",
  },
  {
    name: "X",
    href: "https://x.com",
    bg: "#000000",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    name: "Instagram",
    href: "https://instagram.com",
    bg: "linear-gradient(45deg,#FEDA75 0%,#FA7E1E 25%,#D62976 50%,#962FBF 75%,#4F5BD5 100%)",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
    bg: "#0A66C2",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.56V9h3.56v11.45z",
  },
  {
    name: "YouTube",
    href: "https://youtube.com",
    bg: "#FF0000",
    path: "M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z",
  },
];

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.87.96-2.96-.93.04-2.06.62-2.73 1.4-.59.68-1.11 1.79-.97 2.85 1.04.08 2.1-.51 2.74-1.29" />
    </svg>
  );
}

function PlayLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 512 512" aria-hidden="true">
      <path fill="#00A0FF" d="M48 59.49v393a4.33 4.33 0 007.37 3.07L260 256 55.37 56.42A4.33 4.33 0 0048 59.49z" />
      <path fill="#00E176" d="M345.8 174L89.22 32.64l-.16-.09c-4.42-2.4-8.62.58-9.43 1.41L260 256z" />
      <path fill="#FFD500" d="M449.38 231l-71.65-39.46L297.29 256l80.44 64.46L449.38 281c12.58-7.29 12.58-26.7 0-50z" />
      <path fill="#FF3A44" d="M89.22 479.36L345.8 338 260 256 79.63 478.5c.81.83 5.01 3.81 9.59.86z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="relative w-full overflow-hidden border-t border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] pt-14 pb-28 sm:pb-16 transition-colors">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-[var(--primary-light)] opacity-60 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 sm:gap-6 border-b border-[var(--border-light)] pb-8">
          {VALUE_PROPS.map(({ icon: Icon, title, desc }, idx) => (
            <div key={idx} className="group flex items-center gap-3 rounded-2xl border border-[var(--border-light)] bg-[var(--surface)] p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/40 hover:shadow-lg">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-light)] text-[var(--primary)] shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)]">{title}</h4>
                <p className="text-xs text-[var(--text-secondary)]">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Footer Links Grid: Useful Links & Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 text-[13px] text-[var(--text-secondary)]">

          {/* Useful Links (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="relative pl-3 text-base sm:text-lg font-extrabold text-[var(--text-primary)] tracking-tight before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-[var(--primary)] before:content-['']">
              Useful Links
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 leading-relaxed">
              {USEFUL_LINKS.map((column, colIdx) => (
                <ul key={colIdx} className="space-y-2.5">
                  {column.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link href={link.href} prefetch={link.prefetch} className="inline-block hover:translate-x-1 hover:text-[var(--primary)] transition-all duration-200">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>

          {/* Categories (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="relative pl-3 text-base sm:text-lg font-extrabold text-[var(--text-primary)] tracking-tight before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-[var(--primary)] before:content-['']">
                Categories
              </h3>
              <Link
                href="/search"
                className="group flex items-center gap-0.5 rounded-full bg-[var(--primary-light)] px-3 py-1 text-xs font-semibold text-[var(--primary)] transition-all hover:bg-[var(--primary)] hover:text-white sm:text-sm"
              >
                see all <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 leading-relaxed">
              {CATEGORIES.map((column, colIdx) => (
                <ul key={colIdx} className="space-y-2.5">
                  {column.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link href={link.href} prefetch={link.prefetch ?? false} className="inline-block hover:translate-x-1 hover:text-[var(--primary)] transition-all duration-200">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Download App, Social Icons */}
        <div className="space-y-6 pt-8">
          <div aria-hidden="true" className="h-px w-full bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[var(--text-secondary)]">

            {/* Copyright */}
            <div className="order-1 text-center md:text-left">
              <p className="font-medium text-[var(--text-secondary)]">
                © {new Date().getFullYear()} {SITE_CONFIG.name} Commerce Private Limited
              </p>
            </div>

            {/* Download App Buttons */}
            <div className="order-2 flex flex-col sm:flex-row items-center gap-3">
              <span className="font-semibold text-[var(--text-primary)] text-xs sm:text-sm">Download App</span>
              <div className="flex items-center gap-2">
                <a
                  href={APP_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Download on the App Store"
                  className="flex h-11 min-w-[132px] items-center gap-2 rounded-xl border border-[#A6A6A6] bg-black px-3 text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:shadow-xl"
                >
                  <AppleLogo className="h-6 w-6" />
                  <div className="leading-none">
                    <span className="block text-[9px]">Download on the</span>
                    <span className="block text-[17px] font-semibold tracking-tight -mt-0.5">App Store</span>
                  </div>
                </a>

                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Get it on Google Play"
                  className="flex h-11 min-w-[132px] items-center gap-2 rounded-xl border border-[#A6A6A6] bg-black px-3 text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:shadow-xl"
                >
                  <PlayLogo className="h-5 w-5" />
                  <div className="leading-none">
                    <span className="block text-[8px] uppercase tracking-wide">Get it on</span>
                    <span className="block text-[17px] font-semibold tracking-tight -mt-0.5">Google Play</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Social Media Buttons */}
            <div className="order-3 flex items-center gap-2.5">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  title={s.name}
                  aria-label={s.name}
                  style={{ background: s.bg }}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-md ring-1 ring-[var(--border)] transition-all duration-200 hover:-translate-y-1 hover:scale-110 hover:shadow-lg"
                >
                  <svg className="h-[18px] w-[18px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Legal Disclaimer Line */}
          <p className="rounded-xl border border-[var(--border-light)] bg-[var(--primary-light)]/30 px-4 py-3 text-[11px] leading-relaxed text-[var(--text-muted)] text-center md:text-left">
            &quot;{SITE_CONFIG.name}&quot; is owned &amp; managed by &quot;{SITE_CONFIG.name} Express Commerce Technologies Private Limited&quot; and is not related, linked or interconnected in whatsoever manner or nature to any other quick-commerce or grocery retail brands.
          </p>
        </div>
      </div>
    </footer>
  );
}