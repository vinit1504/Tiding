"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Product } from "@/types/product";
import { ProductCard } from "./product-card";

interface ProductShelfProps {
  title: string;
  categorySlug: string;
  seeAllHref?: string;
  subtitle?: string;
  products: Product[];
  className?: string;
}

export function ProductShelf({
  title,
  categorySlug,
  seeAllHref,
  subtitle,
  products,
  className = "",
}: ProductShelfProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atStart = el.scrollLeft <= 5;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 5;
    setCanScrollLeft(!atStart);
    setCanScrollRight(!atEnd);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [products]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(300, el.clientWidth * 0.75);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!products || products.length === 0) return null;

  const targetHref = seeAllHref || `/category/${categorySlug}`;

  return (
    <section className={`w-full py-4 sm:py-6 border-b border-slate-100 last:border-b-0 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Shelf Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {subtitle}
              </p>
            )}
          </div>

          <Link
            href={targetHref}
            className="flex items-center gap-0.5 text-xs sm:text-sm font-bold text-[#18A818] hover:text-[#148F14] transition-colors group"
          >
            <span>See All</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Scrollable Container with Floating Arrow Buttons */}
        <div className="relative group/shelf">
          {/* Scroll Left Button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 w-9 h-9 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer hidden sm:flex"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Cards Track: 8 items in a single line on desktop */}
          <div
            ref={scrollContainerRef}
            className="flex gap-2.5 sm:gap-3 xl:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[120px] sm:w-[130px] md:w-[138px] shrink-0"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Scroll Right Button (matches Zepto round black button) */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 w-9 h-9 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer hidden sm:flex"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
