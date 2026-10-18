"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SafeImageProps extends Omit<ImageProps, "src" | "alt"> {
  src?: string | null;
  alt: string;
  fallback?: React.ReactNode;
  fallbackClassName?: string;
  fallbackIconClassName?: string;
  showFallbackIcon?: boolean;
}

/**
 * SafeImage provides a resilient wrapper around next/image.
 * If src is missing, empty, or fails to load over the network (e.g. 404, CORS),
 * it gracefully displays a clean, professional fallback UI instead of broken elements.
 */
export function SafeImage({
  src,
  alt,
  fallback,
  className,
  fallbackClassName,
  fallbackIconClassName,
  showFallbackIcon = true,
  fill,
  sizes,
  priority,
  ...restProps
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  const cleanSrc = typeof src === "string" ? src.trim() : "";
  const isValidSrc = cleanSrc.length > 0 && (cleanSrc.startsWith("http://") || cleanSrc.startsWith("https://") || cleanSrc.startsWith("/"));

  // Reset error state if the src prop changes
  useEffect(() => {
    setHasError(false);
  }, [cleanSrc]);

  if (!isValidSrc || hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div
        className={cn(
          "w-full h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-neutral-800/60 text-slate-400 select-none",
          fill ? "absolute inset-0" : "aspect-square min-h-[60px]",
          fallbackClassName
        )}
        aria-label={alt}
        title={alt}
      >
        {showFallbackIcon && (
          <Package
            className={cn(
              "w-6 h-6 sm:w-8 sm:h-8 text-slate-300 dark:text-neutral-500 stroke-[1.5]",
              fallbackIconClassName
            )}
          />
        )}
      </div>
    );
  }

  return (
    <Image
      src={cleanSrc}
      alt={alt}
      fill={fill}
      sizes={sizes || (fill ? "(max-width: 768px) 100vw, 50vw" : undefined)}
      priority={priority}
      className={className}
      onError={() => setHasError(true)}
      {...restProps}
    />
  );
}
