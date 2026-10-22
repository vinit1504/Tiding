import { cn } from "@/lib/utils";

export interface DualRingLoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
}

export function DualRingLoader({
  size = "md",
  text,
  className,
}: DualRingLoaderProps) {
  const sizeMap = {
    sm: { ring: 40, border: 3 },
    md: { ring: 56, border: 4 },
    lg: { ring: 72, border: 4 },
    xl: { ring: 96, border: 5 },
  };

  const { ring, border } = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5",
        className
      )}
    >
      {/* Dual ring container */}
      <div
        className="dual-ring-container"
        style={{ width: ring, height: ring }}
      >
        {/* Outer ring — clockwise */}
        <div
          className="dual-ring dual-ring-outer"
          style={{
            width: ring,
            height: ring,
            borderWidth: border,
          }}
        />
        {/* Inner ring — counter-clockwise */}
        <div
          className="dual-ring dual-ring-inner"
          style={{
            width: ring * 0.6,
            height: ring * 0.6,
            borderWidth: border - 1 || 2,
          }}
        />
      </div>

      {text && (
        <p className="text-sm font-medium text-[var(--text-secondary)] animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}
