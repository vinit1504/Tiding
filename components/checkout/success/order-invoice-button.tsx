"use client";

import React from "react";
import {
  OrderInvoiceActions,
  OrderInvoiceActionsProps,
} from "@/components/orders/order-invoice-actions";
import { cn } from "@/lib/utils";

export interface OrderInvoiceButtonProps extends Partial<OrderInvoiceActionsProps> {
  orderId: string;
  orderNumber?: string;
  token?: string;
  orderStatus?: string;
  pdfUrl?: string | null;
  invoiceUrl?: string | null;
  invoiceNumber?: string | null;
  className?: string;
  onInvoiceGenerated?: () => void;
}

export const OrderInvoiceButton: React.FC<OrderInvoiceButtonProps> = ({
  orderId,
  orderNumber,
  token,
  orderStatus,
  pdfUrl,
  invoiceUrl,
  invoiceNumber,
  className,
  onInvoiceGenerated,
  ...props
}) => {
  return (
    <div
      className={cn(
        "pt-3.5 border-t border-[var(--border-light)]",
        className
      )}
    >
      <OrderInvoiceActions
        orderId={orderId}
        orderNumber={orderNumber}
        token={token}
        orderStatus={orderStatus}
        pdfUrl={pdfUrl}
        invoiceUrl={invoiceUrl}
        invoiceNumber={invoiceNumber}
        showBadge={false}
        onInvoiceGenerated={onInvoiceGenerated}
        {...props}
      />
    </div>
  );
};
