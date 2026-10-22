"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, ShieldCheck, Clock, Award, ArrowUpRight } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants/site-config";

export function Footer() {
  const pathname = usePathname();

  // Hide footer when moving to any page other than the home page
  if (pathname !== "/") {
    return null;
  }

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[#FCFCFD] text-[#2D3748] pt-10 pb-12 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 sm:gap-6 border-b border-slate-200/80 pb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#18A818]/15 text-[#18A818]">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Express Delivery</h4>
              <p className="text-xs text-slate-500">From local dark stores to your doorstep</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#18A818]/15 text-[#18A818]">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Farm-to-Fork Fresh</h4>
              <p className="text-xs text-slate-500">Harvested at 4 AM every morning</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#18A818]/15 text-[#18A818]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">100% Quality Assurance</h4>
              <p className="text-xs text-slate-500">Instant refund if not fresh</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#18A818]/15 text-[#18A818]">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">6 AM to 11:30 PM</h4>
              <p className="text-xs text-slate-500">Round-the-clock grocery support</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links Grid: Useful Links (Left) & Categories (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 text-[13px] text-slate-600">
          {/* Useful Links - 3 Columns (Takes 5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Useful Links
            </h3>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 leading-relaxed">
              <ul className="space-y-2.5">
                <li><Link href="/about" className="hover:text-[#18A818] transition-colors">About Us</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-[#18A818] transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-[#18A818] transition-colors">Terms</Link></li>
                <li><Link href="/faq" className="hover:text-[#18A818] transition-colors">FAQs</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-[#18A818] transition-colors">Security</Link></li>
                <li><Link href="/contact" className="hover:text-[#18A818] transition-colors">Contact</Link></li>
              </ul>

              <ul className="space-y-2.5">
                <li><Link href="/contact" className="hover:text-[#18A818] transition-colors">Partner</Link></li>
                <li><Link href="/contact" className="hover:text-[#18A818] transition-colors">Franchise</Link></li>
                <li><Link href="/contact" className="hover:text-[#18A818] transition-colors">Seller</Link></li>
                <li><Link href="/delivery-areas" className="hover:text-[#18A818] transition-colors">Warehouse</Link></li>
                <li><Link href="/contact" className="hover:text-[#18A818] transition-colors">Deliver</Link></li>
                <li><Link href="/faq" className="hover:text-[#18A818] transition-colors">Resources</Link></li>
              </ul>

              <ul className="space-y-2.5">
                <li><Link href="/category/fruits-vegetables" className="hover:text-[#18A818] transition-colors">Recipes</Link></li>
                <li><Link href="/category/dairy-breakfast" className="hover:text-[#18A818] transition-colors">Bistro</Link></li>
                <li><Link href="/delivery-areas" className="hover:text-[#18A818] transition-colors">District</Link></li>
                <li><Link href="/about" className="hover:text-[#18A818] transition-colors">Ambulance</Link></li>
                <li><Link href="/about" className="hover:text-[#18A818] transition-colors">Feeding Hope</Link></li>
                <li><Link href="/wallet" className="hover:text-[#18A818] transition-colors">Tiding Credit</Link></li>
              </ul>
            </div>
          </div>

          {/* Categories - 3 Columns (Takes 7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                Categories
              </h3>
              <Link
                href="/search"
                className="text-[#18A818] hover:text-[#159015] font-semibold text-xs sm:text-sm flex items-center gap-0.5 transition-colors"
              >
                see all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 leading-relaxed">
              <ul className="space-y-2.5">
                <li><Link href="/category/fruits-vegetables" className="hover:text-[#18A818] transition-colors">Vegetables & Fruits</Link></li>
                <li><Link href="/category/dairy-breakfast" className="hover:text-[#18A818] transition-colors">Dairy, Bread & Eggs</Link></li>
                <li><Link href="/category/atta-rice-dal" className="hover:text-[#18A818] transition-colors">Atta, Rice & Dal</Link></li>
                <li><Link href="/category/bakery-biscuits" className="hover:text-[#18A818] transition-colors">Bakery & Biscuits</Link></li>
                <li><Link href="/category/snacks-munchies" className="hover:text-[#18A818] transition-colors">Snacks & Munchies</Link></li>
                <li><Link href="/category/cold-drinks-juices" className="hover:text-[#18A818] transition-colors">Drinks & Juices</Link></li>
                <li><Link href="/category/tea-coffee-milk-drinks" className="hover:text-[#18A818] transition-colors">Tea, Coffee & Drinks</Link></li>
                <li><Link href="/category/breakfast-instant-food" className="hover:text-[#18A818] transition-colors">Instant Food</Link></li>
                <li><Link href="/category/sweet-tooth" className="hover:text-[#18A818] transition-colors">Sweets & Chocolates</Link></li>
                <li><Link href="/category/atta-rice-dal" className="hover:text-[#18A818] transition-colors">Oil, Ghee & Masala</Link></li>
              </ul>

              <ul className="space-y-2.5">
                <li><Link href="/category/pharma-wellness" className="hover:text-[#18A818] transition-colors">Bath & Body</Link></li>
                <li><Link href="/category/pharma-wellness" className="hover:text-[#18A818] transition-colors">Beauty & Cosmetics</Link></li>
                <li><Link href="/category/pharma-wellness" className="hover:text-[#18A818] transition-colors">Health & Pharma</Link></li>
                <li><Link href="/category/cleaners-repellents" className="hover:text-[#18A818] transition-colors">Cleaners & Repellents</Link></li>
                <li><Link href="/category/home-lifestyle" className="hover:text-[#18A818] transition-colors">Home & Lifestyle</Link></li>
                <li><Link href="/category/paan-corner" className="hover:text-[#18A818] transition-colors">Paan Corner</Link></li>
                <li><Link href="/category/baby-care" className="hover:text-[#18A818] transition-colors">Baby Care</Link></li>
                <li><Link href="/category/pet-care" className="hover:text-[#18A818] transition-colors">Pet Care Supplies</Link></li>
                <li><Link href="/category/home-lifestyle" className="hover:text-[#18A818] transition-colors">Kitchenware & Tools</Link></li>
                <li><Link href="/category/home-lifestyle" className="hover:text-[#18A818] transition-colors">Print Store & Station</Link></li>
              </ul>

              <ul className="space-y-2.5">
                <li><Link href="/category/pharma-wellness" className="hover:text-[#18A818] transition-colors">Skin & Face</Link></li>
                <li><Link href="/category/pharma-wellness" className="hover:text-[#18A818] transition-colors">Hair Care</Link></li>
                <li><Link href="/category/pharma-wellness" className="hover:text-[#18A818] transition-colors">Feminine Hygiene</Link></li>
                <li><Link href="/category/pharma-wellness" className="hover:text-[#18A818] transition-colors">Sexual Wellness</Link></li>
                <li><Link href="/category/sweet-tooth" className="hover:text-[#18A818] transition-colors">Ice Creams & More</Link></li>
                <li><Link href="/category/snacks-munchies" className="hover:text-[#18A818] transition-colors">Sauces & Spreads</Link></li>
                <li><Link href="/category/meat-fish" className="hover:text-[#18A818] transition-colors">Chicken, Meat & Fish</Link></li>
                <li><Link href="/category/home-lifestyle" className="hover:text-[#18A818] transition-colors">Electronics & Cords</Link></li>
                <li><Link href="/category/sweet-tooth" className="hover:text-[#18A818] transition-colors">Festive & Gift Packs</Link></li>
                <li><Link href="/wallet" className="hover:text-[#18A818] transition-colors">E-Gift Cards</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Download App, Social Icons */}
        <div className="border-t border-slate-200/80 pt-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
            {/* Copyright */}
            <div className="order-1 text-center md:text-left">
              <p className="font-medium text-slate-600">
                © {new Date().getFullYear()} {SITE_CONFIG.name} Commerce Private Limited
              </p>
            </div>

            {/* Download App Buttons */}
            <div className="order-2 flex items-center gap-3">
              <span className="font-semibold text-slate-800 text-xs sm:text-sm">Download App</span>
              
              {/* App Store Badge */}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-left transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.64-.78 1.08-1.87.96-2.96-.93.04-2.06.62-2.73 1.4-.59.68-1.11 1.79-.97 2.85 1.04.08 2.1-.51 2.74-1.29" />
                </svg>
                <div className="text-[9px] leading-tight font-medium">
                  <span className="block text-[8px] text-slate-300">Download on the</span>
                  <span className="font-bold text-[10px]">App Store</span>
                </div>
              </a>

              {/* Google Play Badge */}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-left transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a1.996 1.996 0 01-.61-.92L3 2.735c0-.34.094-.657.609-.921zm11.236 11.24l2.42 2.42-12.064 6.89 9.644-9.31zm0-2.108L5.2 1.636l12.064 6.89-2.419 2.42zm1.485 1.054l3.056 1.746c.866.495.866 1.303 0 1.798l-3.056 1.746-2.05-2.05 2.05-2.05z" />
                </svg>
                <div className="text-[9px] leading-tight font-medium">
                  <span className="block text-[8px] text-slate-300">GET IT ON</span>
                  <span className="font-bold text-[10px]">Google Play</span>
                </div>
              </a>
            </div>

            {/* Social Media Circular Buttons */}
            <div className="order-3 flex items-center gap-2.5">
              {/* Facebook */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-900 hover:bg-[#18A818] text-white flex items-center justify-center transition-all hover:scale-105"
                title="Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </a>

              {/* X (Twitter) */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-900 hover:bg-[#18A818] text-white flex items-center justify-center transition-all hover:scale-105"
                title="X (Twitter)"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-900 hover:bg-[#18A818] text-white flex items-center justify-center transition-all hover:scale-105"
                title="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-900 hover:bg-[#18A818] text-white flex items-center justify-center transition-all hover:scale-105"
                title="LinkedIn"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>

              {/* Threads */}
              <a
                href="https://threads.net"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-slate-900 hover:bg-[#18A818] text-white flex items-center justify-center transition-all hover:scale-105"
                title="Threads"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.186 24c-3.793 0-6.953-1.39-8.904-3.914-1.844-2.385-2.613-5.748-2.222-9.724.398-4.043 2.115-7.447 4.966-9.843C8.618 1.134 11.874 0 15.656 0c3.904 0 7.125 1.258 9.07 3.541 1.792 2.103 2.508 5.034 2.068 8.472l-2.946-.379c.35-2.74-.183-5.012-1.543-6.57-1.464-1.678-3.953-2.618-7.001-2.618-3.084 0-5.713.915-7.404 2.576-2.28 2.24-3.593 5.48-3.896 9.366-.356 4.566.924 7.95 3.606 9.544 1.833 1.089 4.195 1.48 7.02 1.16 2.65-.3 4.887-1.385 6.471-3.136.195-.216.377-.442.548-.679l2.25 1.956c-.347.473-.74 1.014-1.253 1.503-2.128 2.03-5.084 3.245-8.79 3.245zm-1.07-6.95c-1.892 0-3.33-.61-4.161-1.764-.789-1.096-.948-2.684-.45-4.475.642-2.308 2.45-3.811 4.718-3.923 1.75-.086 3.16.536 3.972 1.752.791 1.185.836 2.825.132 4.62-.647 1.65-2.106 3.79-4.21 3.79zm.447-2.696c1.162-.057 2.104-.98 2.454-2.408.31-1.265.17-2.25-.39-2.775-.436-.407-1.155-.589-2.023-.513-1.127.098-2.046.994-2.394 2.338-.344 1.332-.178 2.327.469 2.802.435.318 1.144.521 1.884.556z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Legal Disclaimer Line (matching Blinkit footer) */}
          <p className="text-[11px] leading-relaxed text-slate-400 text-center md:text-left">
            &quot;{SITE_CONFIG.name}&quot; is owned &amp; managed by &quot;{SITE_CONFIG.name} Express Commerce Technologies Private Limited&quot; and is not related, linked or interconnected in whatsoever manner or nature to any other quick-commerce or grocery retail brands.
          </p>
        </div>
      </div>
    </footer>
  );
}
