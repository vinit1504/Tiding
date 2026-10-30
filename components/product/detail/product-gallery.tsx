"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { HangingOfferRibbon } from "./offer-ribbon";

export interface ProductGalleryProps {
  images: string[];
  productName: string;
  discount: number;
  available: boolean;
}

export function ProductGallery({
  images,
  productName,
  discount,
  available,
}: ProductGalleryProps) {
  const [activeImg, setActiveImg] = useState(0);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setActiveImg(0);
    setImageError(false);
  }, [images]);

  const currentImage = images[activeImg];

  const handleSelectImage = (index: number) => {
    setActiveImg(index);
    setImageError(false);
  };

  return (
    <div className="w-full">
      {/* Main Image Frame */}
      <div className="relative mx-auto aspect-square w-full max-w-[480px] overflow-hidden rounded-xl bg-[#f5f1ea]">
        {/* Hanging Offer Ribbon */}
        <HangingOfferRibbon discount={discount} />

        {currentImage && !imageError ? (
          <Image
            src={currentImage}
            alt={productName}
            fill
            priority
            unoptimized={currentImage.includes("localhost")}
            sizes="(max-width: 1024px) 100vw, 480px"
            className={`object-contain transition-opacity duration-200 ${
              available ? "" : "opacity-50 grayscale"
            }`}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-300">
            <ShoppingBag className="h-20 w-20" />
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => handleSelectImage(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white transition cursor-pointer ${
                i === activeImg
                  ? "border-[#318616] ring-2 ring-[#318616]/20 shadow-sm"
                  : "border-slate-200 opacity-75 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt={`${productName} thumbnail ${i + 1}`}
                fill
                unoptimized={src.includes("localhost")}
                sizes="64px"
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
