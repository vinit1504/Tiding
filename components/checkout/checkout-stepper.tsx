"use client";

import React from "react";
import { Check, ShoppingBag, MapPin, CreditCard } from "lucide-react";

export interface CheckoutStepperProps {
  currentStep: 1 | 2 | 3;
  onStepClick: (step: 1 | 2 | 3) => void;
  canNavigateToStep?: (step: 1 | 2 | 3) => boolean;
}

const STEPS = [
  {
    step: 1 as const,
    title: "Product Details",
    shortTitle: "Items",
    description: "Review basket",
    icon: ShoppingBag,
  },
  {
    step: 2 as const,
    title: "Delivery Details",
    shortTitle: "Delivery",
    description: "Address & Notes",
    icon: MapPin,
  },
  {
    step: 3 as const,
    title: "Payment Option",
    shortTitle: "Payment",
    description: "Select method",
    icon: CreditCard,
  },
];

export function CheckoutStepper({
  currentStep,
  onStepClick,
  canNavigateToStep,
}: CheckoutStepperProps) {
  return (
    <div className="w-full rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {STEPS.map((item, index) => {
          const isCompleted = item.step < currentStep;
          const isActive = item.step === currentStep;
          const isClickable =
            item.step < currentStep || (canNavigateToStep ? canNavigateToStep(item.step) : false);
          const Icon = item.icon;

          return (
            <React.Fragment key={item.step}>
              {/* Step item */}
              <div
                onClick={() => {
                  if (isClickable || item.step <= currentStep) {
                    onStepClick(item.step);
                  }
                }}
                className={`flex items-center gap-3 sm:gap-3.5 transition-all select-none ${isClickable || item.step <= currentStep
                    ? "cursor-pointer"
                    : "cursor-default opacity-60"
                  }`}
              >
                {/* Clean Circular Badge */}
                <div
                  className={`relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full text-xs sm:text-sm transition-all duration-300 ${isCompleted
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : isActive
                        ? "bg-[var(--primary-light)] text-[var(--primary)] border-2 border-[var(--primary)] shadow-sm"
                        : "bg-[var(--surface-secondary)] text-[var(--text-muted)] border border-[var(--border)]"
                    }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2]" />
                  ) : (
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </div>

                {/* Text Details */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] uppercase tracking-wider ${isActive
                          ? "text-[var(--primary)]"
                          : isCompleted
                            ? "text-[var(--text-secondary)]"
                            : "text-[var(--text-muted)]"
                        }`}
                    >
                      Step {item.step}
                    </span>
                  </div>
                  <h3
                    className={`text-xs sm:text-sm leading-tight ${isActive
                        ? "text-[var(--text-primary)]"
                        : isCompleted
                          ? "text-[var(--text-primary)]"
                          : "text-[var(--text-muted)]"
                      }`}
                  >
                    <span className="hidden sm:inline">{item.title}</span>
                    <span className="sm:hidden">{item.shortTitle}</span>
                  </h3>
                  <p className="hidden md:block text-[11px] text-[var(--text-secondary)]">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Connecting line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-5">
                  <div className="relative h-[2px] w-full bg-[var(--surface-secondary)] rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-0 transition-all duration-300 ${currentStep > item.step ? "bg-[var(--primary)]" : "bg-transparent"
                        }`}
                    />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}