import { cn } from "@/lib/utils";
import { DualRingLoader } from "@/components/ui/dual-ring-loader";

export interface LoaderProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
}

export function Loading({ size = "md", text, className }: LoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-6 text-[var(--text-secondary)]",
        className
      )}
    >
      <DualRingLoader size={size} text={text} />
    </div>
  );
}

export function FullPageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)]/80 backdrop-blur-xs">
      <Loading size="lg" text={text} />
    </div>
  );
}

export { DualRingLoader };

export default function RootLoading() {
  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center">
      <Loading size="lg" text="Loading..." />
    </div>
  );
}
