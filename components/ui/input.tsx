"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, onChange, onFocus, onKeyDown, ...props }, ref) => {
    // Tier 1: Auto-select 0 on focus
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (type === "number" && (e.target.value === "0" || e.target.value === "00")) {
        e.target.select();
      }
      onFocus?.(e);
    };

    // Tier 2: Keydown zero-replacement intercept
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (
        type === "number" &&
        e.currentTarget.value === "0" &&
        /^[1-9]$/.test(e.key) &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        // Replace 0 with the pressed key directly
        e.currentTarget.value = e.key;
        e.preventDefault();
        const event = new Event("input", { bubbles: true });
        e.currentTarget.dispatchEvent(event);
      }
      onKeyDown?.(e);
    };

    // Tier 3: Change sanitization
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === "number" && e.target.value.length > 1) {
        // Strip leading zeros while preserving valid decimals e.g. "0.5"
        e.target.value = e.target.value.replace(/^0+(?=\d)/, "");
      }
      onChange?.(e);
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        value={value}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
