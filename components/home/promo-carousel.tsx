"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useAtom } from "jotai";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { PROMOTIONAL_BANNERS } from "@/lib/constants/promotions";
import { selectedCategorySlugAtom } from "@/stores";

export function PromoCarousel() {
  const [, setSelectedCategory] = useAtom(selectedCategorySlugAtom);
  const [currentPage, setCurrentPage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Group banners into pages of 3 for desktop (total 2 pages for 6 banners)
  const itemsPerPage = 3;
  const totalPages = Math.ceil(PROMOTIONAL_BANNERS.length / itemsPerPage);

  // Auto-advance carousel every 5 seconds when not hovered
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, totalPages]);

  const handlePrev = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handleCtaClick = (slug: string) => {
    setSelectedCategory(slug);
    const element = document.getElementById("shelves-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      aria-label="Promotions and Featured Services"
      className="w-full py-3 sm:py-5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden">
          {/* Slider Container with Smooth Animated Transition */}
          <div
            className="flex transition-transform duration-600 ease-out"
            style={{
              transform: `translateX(-${currentPage * 100}%)`,
            }}
          >
            {/* Render 3 Banners in One Row Per Slide Page */}
            {Array.from({ length: totalPages }).map((_, pageIdx) => {
              const pageBanners = PROMOTIONAL_BANNERS.slice(
                pageIdx * itemsPerPage,
                pageIdx * itemsPerPage + itemsPerPage
              );

              return (
                <div
                  key={pageIdx}
                  className="w-full shrink-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5"
                >
                  {pageBanners.map((banner) => (
                    <div
                      key={banner.id}
                      onClick={() => handleCtaClick(banner.categorySlug)}
                      className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${banner.bgGradient} p-4 sm:p-5 flex items-center justify-between shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer min-h-[180px] sm:min-h-[200px] border border-white/15`}
                    >
                      {/* Left: Text Content & Action Button */}
                      <div className="relative z-10 flex flex-col justify-between h-full max-w-[62%] sm:max-w-[60%] space-y-2">
                        <div>
                          {banner.badge && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/20 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider mb-1.5 border border-white/20">
                              <Zap className="h-2.5 w-2.5 text-amber-300 fill-amber-300" />
                              {banner.badge}
                            </span>
                          )}
                          <h3 className="text-base sm:text-lg font-black leading-tight text-white drop-shadow-xs line-clamp-2">
                            {banner.headline}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-white/90 line-clamp-2 font-medium mt-1">
                            {banner.subtext}
                          </p>
                        </div>

                        {/* Order Now Pill Button (Matching Blinkit Style) */}
                        <div className="pt-1">
                          <span className="inline-flex items-center gap-1 rounded-xl bg-white text-neutral-900 font-extrabold text-xs px-4 py-2 shadow-xs group-hover:bg-neutral-100 group-hover:scale-105 active:scale-95 transition-transform">
                            <span>{banner.cta}</span>
                            <ChevronRight className="h-3.5 w-3.5 text-neutral-700 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>

                      {/* Right: Realistic High-Resolution Image Container */}
                      <div className="relative w-[36%] sm:w-[38%] h-36 sm:h-40 shrink-0 overflow-hidden rounded-2xl flex items-center justify-center">
                        <Image
                          src={banner.image}
                          alt={banner.headline}
                          fill
                          priority={pageIdx === 0}
                          loading={pageIdx === 0 ? "eager" : "lazy"}
                          sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 18vw"
                          className="object-cover rounded-2xl transition-transform duration-500 group-hover:scale-110 drop-shadow-md"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Floating Navigation Arrows */}
          <button
            onClick={handlePrev}
            aria-label="Previous promo banner page"
            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-100 shadow-md border border-[var(--border)] hover:bg-white dark:hover:bg-neutral-900 hover:scale-105 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next promo banner page"
            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-100 shadow-md border border-[var(--border)] hover:bg-white dark:hover:bg-neutral-900 hover:scale-105 transition-all cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Carousel Pagination Dots Indicator */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              aria-label={`Go to slide page ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentPage === idx
                  ? "w-7 bg-[#18A818]"
                  : "w-2 bg-[var(--border)] hover:bg-[var(--text-muted)]"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
