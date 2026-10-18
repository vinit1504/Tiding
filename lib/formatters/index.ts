/**
 * Common formatting utilities for Currency, Dates, Phone Numbers, and Units
 */

/**
 * Format number to Indian Rupee (INR) currency format
 * e.g. 499 -> ₹499
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  if (amount === undefined || amount === null || isNaN(num)) return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(num);
}

/**
 * Format date string into human readable Indian standard format
 * e.g. "2026-10-18T09:30:00Z" -> "18 Oct 2026, 03:00 PM"
 */
export function formatDate(dateInput: string | Date | number | undefined | null): string {
  if (!dateInput) return "";
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Format 10 or 12 digit phone numbers into standard Indian format
 * e.g. "9876543210" -> "+91 98765 43210"
 */
export function formatPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}
