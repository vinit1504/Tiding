"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { selectedCategorySlugAtom } from "@/stores";
import { useBannersQuery } from "@/queries";
import { CmsBanner } from "@/types/cms-banner";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Smart helper to match banner text to known store category slugs
 */
function resolveCategorySlugFromText(text?: string | null): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (lower.includes("veg") || lower.includes("fruit")) return "vegetables-fruits";
  if (
    lower.includes("dairy") ||
    lower.includes("milk") ||
    lower.includes("egg") ||
    lower.includes("bread")
  )
    return "dairy-bread-eggs";
  if (lower.includes("snack") || lower.includes("munch")) return "snacks-munchies";
  if (
    lower.includes("drink") ||
    lower.includes("juice") ||
    lower.includes("beverage") ||
    lower.includes("soda")
  )
    return "cold-drinks-juices";
  if (lower.includes("baby")) return "baby-care";
  if (lower.includes("pet")) return "pet-care";
  if (lower.includes("clean") || lower.includes("house")) return "cleaning-essentials";
  if (lower.includes("personal") || lower.includes("beauty")) return "personal-care";
  if (lower.includes("tea") || lower.includes("coffee")) return "tea-coffee";
  if (lower.includes("meat") || lower.includes("fish")) return "meat-fish";
  return null;
}

export function PromoCarousel() {
  const router = useRouter();
  const [, setSelectedCategory] = useAtom(selectedCategorySlugAtom);

  // Fetch active customer CMS banners directly from the backend API
  const { data: banners = [], isLoading } = useBannersQuery({
    placement: "HOME_HERO",
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [isMobile, setIsMobile] = useState(false);

  // Touch gesture state for mobile swiping
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Responsive calculation: Desktop = 3, Tablet/Small screen = 2, Mobile = 1
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setItemsPerPage(3);
        setIsMobile(false);
      } else if (width >= 640) {
        setItemsPerPage(2);
        setIsMobile(false);
      } else {
        setItemsPerPage(1);
        setIsMobile(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = Math.max(1, Math.ceil(banners.length / itemsPerPage));

  // Keep currentPage strictly within valid bounds when itemsPerPage changes
  useEffect(() => {
    setCurrentPage((prev) => {
      const maxPage = Math.max(0, Math.ceil(banners.length / itemsPerPage) - 1);
      return Math.min(prev, maxPage);
    });
  }, [itemsPerPage, banners.length]);

  // Auto-advance carousel every 5 seconds when not hovered or touched
  useEffect(() => {
    if (isHovered || totalPages <= 1) return;
    const timer = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, totalPages]);

  const handlePrev = useCallback(() => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  const handleNext = useCallback(() => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  // Touch handlers for fluid mobile swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    setIsHovered(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const handleBannerClick = (banner: CmsBanner) => {
    // 1. External link
    if (
      banner.link_url &&
      (banner.link_url.startsWith("http://") ||
        banner.link_url.startsWith("https://") ||
        banner.link_target === "_blank")
    ) {
      if (banner.link_target === "_blank") {
        window.open(banner.link_url, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = banner.link_url;
      }
      return;
    }

    // 2. Internal link route (e.g. /category/xyz or /collections/xyz)
    if (banner.link_url && banner.link_url.startsWith("/")) {
      const match = banner.link_url.match(/\/(collections|category)\/([^/?#]+)/);
      if (match) {
        setSelectedCategory(match[2]);
        document.getElementById("shelves-section")?.scrollIntoView({ behavior: "smooth" });
      }
      router.push(banner.link_url);
      return;
    }

    // 3. Direct category slug on banner
    if (banner.category_slug) {
      setSelectedCategory(banner.category_slug);
      document.getElementById("shelves-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // 4. Inferred category slug from title or subtitle
    const inferredSlug =
      resolveCategorySlugFromText(banner.title) || resolveCategorySlugFromText(banner.subtitle);
    if (inferredSlug) {
      setSelectedCategory(inferredSlug);
      document.getElementById("shelves-section")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // 5. Fallback action: smoothly scroll to shelves section
    const shelves = document.getElementById("shelves-section");
    if (shelves) {
      shelves.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Loading skeleton while fetching banners from CMS API
  if (isLoading) {
    return (
      <section aria-label="Loading Banners" className="w-full py-3 sm:py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
            {Array.from({ length: itemsPerPage }).map((_, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-neutral-100 dark:bg-neutral-800/60 h-[180px] sm:h-[210px] md:h-[230px] border border-neutral-200/50 dark:border-neutral-700/50 p-4 flex flex-col justify-end"
              >
                <div className="space-y-2 max-w-[65%]">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-6 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Do not render section if no banners in database
  if (banners.length === 0) {
    return null;
  }

  const gridColsClass =
    itemsPerPage === 1
      ? "grid-cols-1"
      : itemsPerPage === 2
      ? "grid-cols-2"
      : "grid-cols-3";

  return (
    <section
      aria-label="Featured Promotions & Exclusive Offers"
      className="w-full py-3 sm:py-5 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl">
          {/* Slider Container with Smooth Cubic-Bezier Animated Transition */}
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              transform: `translateX(-${currentPage * 100}%)`,
            }}
          >
            {/* Render Slide Pages (3 on desktop, 2 on tablet, 1 on mobile) */}
            {Array.from({ length: totalPages }).map((_, pageIdx) => {
              const pageBanners = banners.slice(
                pageIdx * itemsPerPage,
                pageIdx * itemsPerPage + itemsPerPage
              );

              return (
                <div
                  key={pageIdx}
                  className={`w-full shrink-0 grid ${gridColsClass} gap-3.5 sm:gap-4 lg:gap-5`}
                >
                  {pageBanners.map((banner, bannerIdx) => {
                    const displayImage =
                      isMobile && banner.mobile_image_url
                        ? banner.mobile_image_url
                        : banner.image_url;

                    const isLocalImage =
                      Boolean(displayImage && (displayImage.includes("localhost") || displayImage.includes("127.0.0.1")));

                    return (
                      <div
                        key={banner.id || bannerIdx}
                        onClick={() => handleBannerClick(banner)}
                        className="group relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-[180px] sm:h-[210px] md:h-[230px] border border-neutral-200/60 dark:border-neutral-800 select-none bg-neutral-900"
                      >
                        {/* 1. Full Cover Background Image */}
                        {displayImage ? (
                          <Image
                            src={displayImage}
                            alt={banner.title || "Promotional banner"}
                            fill
                            priority={pageIdx === 0}
                            loading={pageIdx === 0 ? "eager" : "lazy"}
                            unoptimized={isLocalImage}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className={`w-full h-full bg-gradient-to-br ${
                              banner.bg_gradient || "from-[#087838] via-[#0D873F] to-[#18A818]"
                            }`}
                          />
                        )}

                        {/* 2. Soft Bottom Gradient Vignette for Depth & Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                        {/* 3. Top Badge (Optional, rendered if badge_text is provided) */}
                        {banner.badge_text && (
                          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 pointer-events-none">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider border border-white/20 shadow-sm">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                              </span>
                              <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300/40" />
                              <span className="truncate max-w-[140px]">{banner.badge_text}</span>
                            </span>
                          </div>
                        )}

                        {/* 4. Bottom Overlay Content: Title, Subtitle, and Call To Action Button */}
                        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 z-10 flex items-end justify-between gap-3 pointer-events-none">
                          {/* Title & Subtitle */}
                          <div className="max-w-[70%] space-y-0.5">
                            {banner.title && (
                              <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md line-clamp-1">
                                {banner.title}
                              </h3>
                            )}
                            {banner.subtitle && (
                              <p className="text-[11px] sm:text-xs text-white/90 line-clamp-1 font-medium drop-shadow-sm">
                                {banner.subtitle}
                              </p>
                            )}
                          </div>

                          {/* CTA Button */}
                          <div className="shrink-0 pointer-events-auto">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white text-neutral-900 font-extrabold text-xs sm:text-[13px] px-3.5 sm:px-4 py-2 shadow-md hover:bg-neutral-100 group-hover:scale-105 active:scale-95 transition-all">
                              <span>{banner.button_text || "Shop Now"}</span>
                              <ChevronRight className="h-3.5 w-3.5 text-neutral-800 transition-transform duration-300 group-hover:translate-x-1" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Floating Navigation Controls (Shown when multiple pages exist) */}
          {totalPages > 1 && (
            <>
              <button
                onClick={handlePrev}
                aria-label="Previous banner page"
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-100 shadow-lg border border-neutral-200/80 dark:border-neutral-700/80 backdrop-blur-md hover:bg-white dark:hover:bg-neutral-800 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={handleNext}
                aria-label="Next banner page"
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/90 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-100 shadow-lg border border-neutral-200/80 dark:border-neutral-700/80 backdrop-blur-md hover:bg-white dark:hover:bg-neutral-800 hover:scale-110 active:scale-95 transition-all cursor-pointer"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </>
          )}
        </div>

        {/* Carousel Pagination Indicator Dots */}
        {totalPages > 1 && (
          <div className="mt-3.5 flex items-center justify-center gap-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentPage(idx)}
                aria-label={`Go to banner slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  currentPage === idx
                    ? "w-8 bg-[#18A818] shadow-xs"
                    : "w-2.5 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
