import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export function formatEta(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} mins`;
  }
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function getUserDisplayInitials(user: {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  };
} | null): string {
  if (!user) return "U";

  // Prioritize user's email first character
  if (user.email && user.email.trim().length > 0) {
    const emailChar = user.email.trim().charAt(0).toUpperCase();
    if (emailChar) return emailChar;
  }

  // Fallback to first character of name or display name
  const name = user.firstName || user.profile?.firstName || user.name || user.profile?.displayName;
  if (name && name.trim().length > 0) {
    return name.trim().charAt(0).toUpperCase();
  }

  return "U";
}

export function getUserFirstName(user: {
  name?: string;
  firstName?: string;
  profile?: {
    firstName?: string | null;
    displayName?: string | null;
  };
} | null): string {
  if (!user) return "Account";
  if (user.firstName) return user.firstName;
  if (user.profile?.firstName) return user.profile.firstName;
  if (user.profile?.displayName) return user.profile.displayName.split(" ")[0];
  if (user.name) return user.name.split(" ")[0];
  return "Account";
}

