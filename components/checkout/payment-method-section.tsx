"use client";

import React from "react";
import {
  CreditCard,
  Smartphone,
  Banknote,
  Building,
  Wallet,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

export type PaymentOption = "upi" | "card" | "netbanking" | "cod" | "wallet";

interface PaymentMethodSectionProps {
  selectedMethod: PaymentOption;
  onSelectMethod: (method: PaymentOption) => void;
  walletBalance?: number;
}

const PAYMENT_METHODS = [
  {
    id: "upi" as PaymentOption,
    name: "UPI",
    description: "Google Pay, PhonePe, Paytm, BHIM",
    icon: Smartphone,
    badge: "Instant & Zero Fee",
  },
  {
    id: "card" as PaymentOption,
    name: "Cards",
    description: "Credit / Debit Card (Visa, Mastercard, RuPay)",
    icon: CreditCard,
    badge: "Secure Razorpay",
  },
  {
    id: "netbanking" as PaymentOption,
    name: "Net Banking",
    description: "All Indian banks supported",
    icon: Building,
  },
  {
    id: "cod" as PaymentOption,
    name: "Cash on Delivery",
    description: "Pay with Cash or UPI when your order arrives",
    icon: Banknote,
    badge: "Pay at Doorstep",
  },
  {
    id: "wallet" as PaymentOption,
    name: "Tiding Wallet",
    description: "Instant one-tap checkout",
    icon: Wallet,
  },
];

export function PaymentMethodSection({
  selectedMethod,
  onSelectMethod,
  walletBalance = 0,
}: PaymentMethodSectionProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)]">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base text-[var(--text-primary)]">
              Payment Options
            </h2>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Select your preferred way to pay
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[11px] text-[var(--primary)]">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>100% Safe</span>
        </span>
      </div>

      {/* Selectable Options */}
      <div className="space-y-2.5">
        {PAYMENT_METHODS.map(({ id, name, description, icon: Icon, badge }) => {
          const isSelected = selectedMethod === id;
          return (
            <div
              key={id}
              onClick={() => onSelectMethod(id)}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${isSelected
                  ? "border-[var(--primary)] bg-[var(--primary-light)]/40 shadow-2xs"
                  : "border-[var(--border)] bg-white hover:border-[var(--primary)]/40"
                }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${isSelected
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-secondary)] text-[var(--text-secondary)]"
                    }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-primary)]">
                      {name}
                    </span>
                    {badge && (
                      <span className="rounded-md bg-[var(--primary-light)] px-1.5 py-0.5 text-[9px] text-[var(--primary)]">
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {id === "wallet" ? `Available balance: ₹${walletBalance}` : description}
                  </p>
                </div>
              </div>

              {/* Radio Indicator */}
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--border)] bg-white"
                  }`}
              >
                {isSelected && <CheckCircle2 className="h-3.5 w-3.5 fill-current text-white" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}