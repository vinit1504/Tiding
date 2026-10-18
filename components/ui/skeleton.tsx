import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--surface-secondary)] border border-[var(--border-light)]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
