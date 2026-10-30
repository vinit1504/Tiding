"use client";

import React from "react";
import { Timer, BadgePercent, ShoppingBasket } from "lucide-react";

export interface ProductWhyShopProps {
  deliveryEtaMinutes?: number;
}

export function ProductWhyShop({ deliveryEtaMinutes = 8 }: ProductWhyShopProps) {
  return (
    <div className="mt-10">
      <h3 className="text-lg font-extrabold text-slate-900">Why shop from Tiding?</h3>
      <div className="mt-4 space-y-5">
        <WhyShopRow
          icon={<Timer className="h-6 w-6 text-amber-600" />}
          bg="bg-amber-50"
          title="Superfast Delivery"
          text={`Get items delivered to your doorstep from dark stores near you in about ${deliveryEtaMinutes} minutes.`}
        />
        <WhyShopRow
          icon={<BadgePercent className="h-6 w-6 text-emerald-700" />}
          bg="bg-emerald-50"
          title="Best Prices & Offers"
          text="Great prices with offers directly from verified brands and farms."
        />
        <WhyShopRow
          icon={<ShoppingBasket className="h-6 w-6 text-orange-600" />}
          bg="bg-orange-50"
          title="Wide Assortment"
          text="Choose from fresh produce, groceries, household and daily essentials."
        />
      </div>
    </div>
  );
}

function WhyShopRow({
  icon,
  bg,
  title,
  text,
}: {
  icon: React.ReactNode;
  bg: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs leading-relaxed text-slate-500">{text}</p>
      </div>
    </div>
  );
}
