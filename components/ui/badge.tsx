import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors border",
  {
    variants: {
      variant: {
        default:
          "border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-primary)]",
        brand:
          "border-[#18A818]/30 bg-[#18A818]/10 text-[#18A818] dark:text-[#4ADE80]",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        destructive:
          "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
        outline:
          "border-[var(--border)] text-[var(--text-secondary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0 animate-pulse" />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
