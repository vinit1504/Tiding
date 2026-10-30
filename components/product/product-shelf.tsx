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
    const firstCard = el.firstElementChild as HTMLElement | null;
    const cardWidth = firstCard?.offsetWidth || 185;
    const style = window.getComputedStyle(el);
    const gap = parseFloat(style.columnGap || style.gap || "20") || 20;
    const scrollStep = cardWidth + gap;

    el.scrollBy({
      left: direction === "left" ? -scrollStep : scrollStep,
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
            prefetch={false}
            className="flex items-center gap-0.5 text-xs sm:text-sm font-bold text-[#18A818] hover:text-[#148F14] transition-colors group"
          >
            <span>See All</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Scrollable Container with Pure Icon Arrow Buttons */}
        <div className="relative group/shelf">
          {/* Scroll Left Button: pure icon without background color */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll left"
              className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 text-slate-700 hover:text-[#18A818] transition-all hover:scale-125 active:scale-90 cursor-pointer hidden sm:flex items-center justify-center p-1"
            >
              <ChevronLeft className="w-8 h-8 stroke-[2.5]" />
            </button>
          )}

          {/* Cards Track: one-by-one snap scroll with proper size and balanced spacing */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 lg:gap-5 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2 px-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="w-[155px] sm:w-[calc((100%-2*16px)/3)] md:w-[calc((100%-3*16px)/4)] lg:w-[calc((100%-4*20px)/5)] xl:w-[calc((100%-5*20px)/6)] shrink-0 snap-start"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Scroll Right Button: pure icon without background color */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll right"
              className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 text-slate-700 hover:text-[#18A818] transition-all hover:scale-125 active:scale-90 cursor-pointer hidden sm:flex items-center justify-center p-1"
            >
              <ChevronRight className="w-8 h-8 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
