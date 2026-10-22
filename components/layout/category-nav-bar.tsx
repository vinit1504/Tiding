"use client";

import React, { useRef } from "react";
import { useAtom } from "jotai";
import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MASTER_CATEGORIES } from "@/lib/constants/categories";
import { selectedCategorySlugAtom } from "@/stores";
import { useCategoriesQuery } from "@/queries/catalog";
import { cn } from "@/lib/utils";

export function CategoryNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedCategory, setSelectedCategory] = useAtom(selectedCategorySlugAtom);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: apiCategories } = useCategoriesQuery();

  const categories = React.useMemo(() => {
    if (apiCategories && apiCategories.length > 0) {
      return [
        { id: "cat-all", name: "All", slug: "all", icon: "🌟", itemCount: undefined as number | undefined },
        ...apiCategories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          icon: c.icon || c.icon_url || "🛒",
          itemCount: c.itemCount,
        })),
      ];
    }
    return MASTER_CATEGORIES;
  }, [apiCategories]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -240 : 240;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const handleCategoryClick = (slug: string, id?: string) => {
    setSelectedCategory(slug);
    if (slug === "all") {
      if (pathname !== "/") {
        router.push("/");
      } else {
        const el = document.getElementById("shelves-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push(`/category/${slug}`);
    }
  };

  return (
    <nav
      aria-label="Product categories"
      className="sticky top-[65px] z-30 w-full border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md transition-colors"
    >
      <div className="mx-auto flex max-w-7xl items-center relative px-2 sm:px-6">
        {/* Left Arrow (Desktop) */}
        <button
          onClick={() => handleScroll("left")}
          aria-label="Scroll categories left"
          className="hidden md:flex absolute left-1 z-10 h-7 w-7 items-center justify-center rounded-full bg-[var(--surface)] shadow-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:scale-105 transition-all cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Scrollable Category Pill List */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 overflow-x-auto py-2.5 px-2 no-scrollbar scroll-smooth w-full"
        >
          {categories.map((category) => {
            const isActive =
              pathname === `/category/${category.slug}` ||
              (pathname === "/" && selectedCategory === category.slug);

            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.slug, category.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 select-none",
                  isActive
                    ? "bg-[#18A818] text-white shadow-xs font-bold scale-[1.02]"
                    : "bg-[var(--surface-secondary)]/70 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border)]"
                )}
              >
                {category.icon && <span className="text-sm">{category.icon}</span>}
                <span>{category.name}</span>
                {category.itemCount && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full",
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-[var(--surface)] text-[var(--text-muted)]"
                    )}
                  >
                    {category.itemCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Arrow (Desktop) */}
        <button
          onClick={() => handleScroll("right")}
          aria-label="Scroll categories right"
          className="hidden md:flex absolute right-1 z-10 h-7 w-7 items-center justify-center rounded-full bg-[var(--surface)] shadow-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:scale-105 transition-all cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
