"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import {
  getOrderInvoicePreviewUrl,
  downloadOrderInvoicePdf,
} from "@/lib/api/invoice.api";
import { toast } from "sonner";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber?: string;
  token?: string;
  pdfUrl?: string | null;
  invoiceNumber?: string | null;
  onInvoiceGenerated?: () => void;
}

export function InvoicePreviewModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  token,
  pdfUrl,
  invoiceNumber,
  onInvoiceGenerated,
}: InvoicePreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayOrderNumber = invoiceNumber || orderNumber || `#${orderId.slice(0, 8).toUpperCase()}`;

  const loadPreview = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const url = await getOrderInvoicePreviewUrl(orderId, token, pdfUrl);
      setPreviewUrl(url);
      if (!pdfUrl) {
        onInvoiceGenerated?.();
      }
    } catch (err: any) {
      console.error("[InvoicePreviewModal] Error loading preview:", err);
      setError(err?.message || "Unable to render invoice preview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      loadPreview();
    }
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        window.URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    };
  }, [isOpen, orderId, pdfUrl]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadOrderInvoicePdf(
        orderId,
        token,
        pdfUrl,
        invoiceNumber ? `${invoiceNumber}.pdf` : undefined
      );
      toast.success("Invoice downloaded successfully.");
      if (!pdfUrl) {
        onInvoiceGenerated?.();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to download invoice.");
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, "_blank");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden sm:rounded-2xl border-[var(--border)] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--border-light)] bg-white flex items-center justify-between">
          <div>
            <DialogTitle className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
              Tax Invoice
              <span className="text-xs font-mono font-medium text-[var(--primary)] bg-[var(--primary-light)] px-2 py-0.5 rounded-md border border-[var(--primary)]/20">
                {displayOrderNumber}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[var(--text-secondary)] mt-0.5">
              Official GST receipt & order breakdown
            </DialogDescription>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 pr-8">
            {previewUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenNewTab}
                className="h-8 px-2.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)]"
                title="Open in new window"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Open Tab</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleDownload}
              disabled={downloading}
              className="h-8 px-3 text-xs bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold cursor-pointer shadow-xs"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  <span>Download PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[var(--surface-secondary)] min-h-[520px] max-h-[calc(92vh-80px)] flex items-center justify-center relative p-2 sm:p-4 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-[var(--text-secondary)] py-12">
              <div className="w-10 h-10 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Generating & streaming invoice...
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Preparing official GST document
              </p>
            </div>
          ) : error ? (
            <div className="text-center p-6 bg-white rounded-2xl border border-[var(--border)] max-w-sm mx-auto shadow-xs space-y-3">
              <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Preview Unavailable
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {error}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadPreview}
                  className="text-xs h-8"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Retry
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="text-xs h-8 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Download Directly
                </Button>
              </div>
            </div>
          ) : previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full min-h-[500px] rounded-xl border border-[var(--border)] shadow-xs bg-white"
              title={`Invoice ${displayOrderNumber}`}
            />
          ) : (
            <div className="text-center text-xs text-[var(--text-muted)]">
              No invoice preview available.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
