/**
 * @name invoice.api.ts
 * @description Frontend API client for order invoice preview, download, and on-demand generation.
 * Integrates with Tiding backend /api/v1/orders/:orderId/invoice endpoints.
 */

import { SITE_CONFIG } from "@/lib/constants/site-config";
import { getStoredAccessToken } from "@/lib/auth/token-storage";

const API_BASE = SITE_CONFIG.apiUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

function resolveToken(token?: string): string | null {
  if (token) return token;
  return getStoredAccessToken();
}

function getAuthHeaders(token?: string, extraHeaders?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    ...extraHeaders,
  };
  const activeToken = resolveToken(token);
  if (activeToken && activeToken !== "token_vinit_default") {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }
  return headers;
}

export interface InvoiceMetadata {
  id?: string;
  orderId?: string;
  order_id?: string;
  invoiceNumber?: string;
  invoice_number?: string;
  pdfUrl?: string | null;
  pdf_url?: string | null;
  status?: string;
  totalAmount?: number;
  total_amount?: number;
  createdAt?: string;
  created_at?: string;
}

/**
 * Downloads a binary PDF file from the server with filename header handling.
 * Automatically attempts on-the-fly invoice generation if not generated yet.
 */
export async function downloadOrderInvoicePdf(
  orderId: string,
  token?: string,
  directPdfUrl?: string | null,
  customFilename?: string
): Promise<void> {
  const headers = getAuthHeaders(token, { Accept: "application/pdf" });

  let response: Response | null = null;
  try {
    response = await fetch(`${API_BASE}/orders/${orderId}/invoice/download`, {
      headers,
      credentials: "include",
    });

    // If invoice not generated yet, try generating it first and retry once
    if (response.status === 404) {
      try {
        await generateOrderInvoice(orderId, token);
        response = await fetch(`${API_BASE}/orders/${orderId}/invoice/download`, {
          headers,
          credentials: "include",
        });
      } catch {
        // Continue to error check below
      }
    }
  } catch (err) {
    // Network or server unreachable, fallback to directPdfUrl if provided
  }

  if (!response || !response.ok) {
    if (directPdfUrl) {
      try {
        const directRes = await fetch(directPdfUrl);
        if (directRes.ok) {
          const blob = await directRes.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = blobUrl;
          anchor.download = customFilename || `INV-${orderId.slice(0, 8).toUpperCase()}.pdf`;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
          }, 1000);
          return;
        }
      } catch {
        // If direct fetch blocked by CORS, open in new tab
        window.open(directPdfUrl, "_blank");
        return;
      }
    }

    let errorDetail = "Failed to download invoice PDF.";
    if (response) {
      try {
        const errJson = await response.json();
        if (errJson?.message || errJson?.error?.message) {
          errorDetail = errJson?.error?.message || errJson?.message;
        }
      } catch {}
    }
    throw new Error(errorDetail);
  }

  // Extract filename from Content-Disposition or fallback
  const disposition = response.headers.get("content-disposition");
  let filename = customFilename || `INV-${orderId.slice(0, 8).toUpperCase()}.pdf`;
  if (disposition && disposition.includes("filename=")) {
    const matched = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (matched && matched[1]) {
      filename = matched[1].replace(/['"]/g, "").trim();
    }
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke object URL after short delay to allow browser download to start
  setTimeout(() => {
    window.URL.revokeObjectURL(blobUrl);
  }, 1000);
}

/**
 * Fetches inline preview Blob URL for iframe rendering or tab preview.
 * Automatically triggers generation if invoice record does not exist yet.
 */
export async function getOrderInvoicePreviewUrl(
  orderId: string,
  token?: string,
  directPdfUrl?: string | null
): Promise<string> {
  const headers = getAuthHeaders(token, { Accept: "application/pdf" });

  let response: Response | null = null;
  try {
    response = await fetch(`${API_BASE}/orders/${orderId}/invoice/preview`, {
      headers,
      credentials: "include",
    });

    // If invoice is missing, attempt to generate it on the fly
    if (response.status === 404) {
      await generateOrderInvoice(orderId, token);
      response = await fetch(`${API_BASE}/orders/${orderId}/invoice/preview`, {
        headers,
        credentials: "include",
      });
    }
  } catch (err) {
    // If preview endpoint fails and we have a directPdfUrl, use it directly
    if (directPdfUrl) return directPdfUrl;
  }

  if (!response || !response.ok) {
    if (directPdfUrl) {
      return directPdfUrl;
    }
    let errorDetail = "Failed to load invoice preview.";
    if (response) {
      try {
        const errJson = await response.json();
        if (errJson?.message || errJson?.error?.message) {
          errorDetail = errJson?.error?.message || errJson?.message;
        }
      } catch {}
    }
    throw new Error(errorDetail);
  }

  const blob = await response.blob();
  return window.URL.createObjectURL(blob);
}

/**
 * Fetches invoice metadata (invoice_number, status, pdf_url, etc.)
 */
export async function getOrderInvoice(orderId: string, token?: string): Promise<InvoiceMetadata | null> {
  const headers = getAuthHeaders(token, { "Content-Type": "application/json" });

  const response = await fetch(`${API_BASE}/orders/${orderId}/invoice`, {
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Failed to fetch invoice metadata: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}

/**
 * Generates an invoice and PDF on the fly if not already created.
 */
export async function generateOrderInvoice(orderId: string, token?: string): Promise<any> {
  const headers = getAuthHeaders(token, { "Content-Type": "application/json" });

  const response = await fetch(`${API_BASE}/orders/${orderId}/invoice/generate`, {
    method: "POST",
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errorMsg = "Unable to generate invoice. Please contact support.";
    try {
      const errJson = await response.json();
      if (errJson?.message || errJson?.error?.message) {
        errorMsg = errJson?.error?.message || errJson?.message;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  return response.json();
}
