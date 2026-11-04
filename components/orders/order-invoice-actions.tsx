"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  downloadOrderInvoicePdf,
  generateOrderInvoice,
} from "@/lib/api/invoice.api";
import { InvoicePreviewModal } from "@/components/orders/invoice-preview-modal";
import {
  FileText,
  Eye,
  Download,
  Loader2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { QUERY_KEYS } from "@/queries/query-keys";

export interface OrderInvoiceActionsProps {
  orderId: string;
  orderNumber?: string;
  orderStatus?: string;
  pdfUrl?: string | null;
  invoiceUrl?: string | null;
  invoiceNumber?: string | null;
  token?: string;
  className?: string;
  variant?: "row" | "inline" | "stacked";
  showBadge?: boolean;
  onInvoiceGenerated?: () => void;
}

export const OrderInvoiceActions: React.FC<OrderInvoiceActionsProps> = ({
  orderId,
  orderNumber,
  orderStatus,
  pdfUrl,
  invoiceUrl,
  invoiceNumber,
  token,
  className,
  variant = "row",
  showBadge = true,
  onInvoiceGenerated,
}) => {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const isCancelled = orderStatus?.toUpperCase() === "CANCELLED";
  const effectivePdfUrl = pdfUrl || invoiceUrl || null;
  const hasPdf = Boolean(effectivePdfUrl);
  const displayInvoiceNumber =
    invoiceNumber ||
    (effectivePdfUrl?.includes("INV-")
      ? effectivePdfUrl.match(/INV-[\w-]+/)?.[0]
      : null);

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCancelled) {
      toast.error("Invoices are not available for cancelled orders.");
      return;
    }

    setGenerating(true);
    try {
      const res = await generateOrderInvoice(orderId, token);
      const generatedInvNum =
        res?.data?.invoice_number || res?.invoice_number || res?.invoiceNumber;
      toast.success(
        generatedInvNum
          ? `Invoice ${generatedInvNum} generated successfully!`
          : "Invoice generated successfully!"
      );
      // Invalidate queries so lists and details update automatically
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.ORDERS.DETAIL(orderId),
      });
      onInvoiceGenerated?.();
    } catch (err: any) {
      console.error("[OrderInvoiceActions] generate error:", err);
      toast.error(
        err?.message || "Unable to generate invoice. Please try again later."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCancelled) {
      toast.error("Invoices are not available for cancelled orders.");
      return;
    }

    setDownloading(true);
    try {
      await downloadOrderInvoicePdf(
        orderId,
        token,
        effectivePdfUrl,
        displayInvoiceNumber ? `${displayInvoiceNumber}.pdf` : undefined
      );
      toast.success("Invoice downloaded successfully!");
      if (!hasPdf) {
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.ORDERS.ALL,
        });
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.ORDERS.DETAIL(orderId),
        });
        onInvoiceGenerated?.();
      }
    } catch (err: any) {
      console.error("[OrderInvoiceActions] download error:", err);
      toast.error(
        err?.message || "Unable to download invoice. Please try again later."
      );
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCancelled) {
      toast.error("Invoices are not available for cancelled orders.");
      return;
    }
    setPreviewOpen(true);
  };

  const handlePreviewGenerated = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORDERS.ALL });
    await queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.ORDERS.DETAIL(orderId),
    });
    onInvoiceGenerated?.();
  };

  if (isCancelled) {
    return (
      <div
        className={cn(
          "text-[11px] text-gray-400 italic flex items-center gap-1.5",
          className
        )}
      >
        <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
        <span>Invoices are not generated for cancelled orders.</span>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          variant === "stacked" && "flex-col items-stretch",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Invoice status badge */}
        {showBadge && (
          <div className="shrink-0 mr-1">
            {hasPdf ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-mono">
                  {displayInvoiceNumber || "Invoice Available"}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Invoice Not Generated</span>
              </span>
            )}
          </div>
        )}

        {/* Buttons: State 1 - PDF is available */}
        {hasPdf ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              size="sm"
              className="h-8 px-3 text-xs font-semibold bg-[#0c831f] hover:bg-[#0a6f1a] text-white rounded-lg transition cursor-pointer shadow-none"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5" />
              )}
              <span>{downloading ? "Preparing..." : "Download Invoice"}</span>
            </Button>

            <Button
              type="button"
              onClick={handlePreview}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border-gray-200 rounded-lg transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
              <span>Preview</span>
            </Button>
          </div>
        ) : (
          /* Buttons: State 2 - PDF is NOT generated yet (generate invoice, download, preview) */
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generating || downloading}
              size="sm"
              className="h-8 px-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition cursor-pointer shadow-none"
            >
              {generating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              )}
              <span>{generating ? "Generating..." : "Generate Invoice"}</span>
            </Button>

            <Button
              type="button"
              onClick={handleDownload}
              disabled={downloading || generating}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200 rounded-lg transition cursor-pointer"
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <Download className="w-3.5 h-3.5 mr-1.5" />
              )}
              <span>{downloading ? "Preparing..." : "Download Invoice"}</span>
            </Button>

            <Button
              type="button"
              onClick={handlePreview}
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              <span>Preview</span>
            </Button>
          </div>
        )}
      </div>

      {/* Embedded PDF Preview Modal */}
      <InvoicePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        orderId={orderId}
        orderNumber={displayInvoiceNumber || orderNumber}
        token={token}
        pdfUrl={effectivePdfUrl}
        invoiceNumber={displayInvoiceNumber}
        onInvoiceGenerated={handlePreviewGenerated}
      />
    </>
  );
};
