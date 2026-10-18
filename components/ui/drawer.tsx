"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Drawer = DialogPrimitive.Root;
const DrawerTrigger = DialogPrimitive.Trigger;
const DrawerPortal = DialogPrimitive.Portal;
const DrawerClose = DialogPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "drawer-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-xs",
      className
    )}
    {...props}
  />
));
DrawerOverlay.displayName = DialogPrimitive.Overlay.displayName;

const drawerVariants = cva(
  "fixed z-50 flex flex-col bg-[var(--surface)] text-[var(--text-primary)] shadow-2xl transition-all duration-300 ease-in-out border-[var(--border)]",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b drawer-content-top",
        bottom: "inset-x-0 bottom-0 border-t drawer-content-bottom",
        left: "inset-y-0 left-0 h-full border-r drawer-content-left",
        right: "inset-y-0 right-0 h-full border-l drawer-content-right",
      },
      size: {
        default: "w-full sm:max-w-lg",
        sm: "w-full sm:max-w-sm",
        md: "w-full sm:max-w-md",
        lg: "w-full sm:max-w-lg",
        xl: "w-full sm:max-w-xl",
        "2xl": "w-full sm:max-w-2xl",
        full: "w-full",
      },
    },
    defaultVariants: {
      side: "right",
      size: "lg",
    },
  }
);

interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof drawerVariants> {}

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ side = "right", size = "lg", className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(drawerVariants({ side, size }), className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = DialogPrimitive.Content.displayName;

const DrawerHeader = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-[var(--surface)] shrink-0",
      className
    )}
    {...props}
  >
    <div className="flex flex-col gap-1 min-w-0 pr-4">{children}</div>
    <DialogPrimitive.Close className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none">
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  </div>
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-base font-bold text-[var(--text-primary)] leading-tight",
      className
    )}
    {...props}
  />
));
DrawerTitle.displayName = DialogPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-xs text-[var(--text-secondary)]", className)}
    {...props}
  />
));
DrawerDescription.displayName = DialogPrimitive.Description.displayName;

const DrawerBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs",
      className
    )}
    {...props}
  />
);
DrawerBody.displayName = "DrawerBody";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "border-t border-[var(--border)] px-6 py-4 flex items-center justify-end gap-2.5 sm:gap-3 bg-[var(--surface)] shrink-0",
      className
    )}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerBody,
  DrawerFooter,
};
