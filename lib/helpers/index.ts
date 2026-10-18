/**
 * Shared calculation and transformation helpers
 */

/**
 * Calculate percentage discount between MRP and selling price
 */
export function calculateDiscountPercentage(mrp: number, sellingPrice: number): number {
  if (!mrp || mrp <= 0 || !sellingPrice || sellingPrice >= mrp) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
}

/**
 * Extract first name or display initials from UserProfile or string
 */
export function getUserFirstName(user: { name?: string; firstName?: string } | null | undefined): string {
  if (!user) return "Customer";
  if (user.firstName?.trim()) return user.firstName.trim();
  if (user.name?.trim()) return user.name.trim().split(" ")[0];
  return "Customer";
}

export function getUserDisplayInitials(user: { name?: string; firstName?: string; email?: string } | null | undefined): string {
  if (!user) return "T";
  if (user.email?.trim()) return user.email.trim().charAt(0).toUpperCase();
  if (user.firstName?.trim()) return user.firstName.trim().charAt(0).toUpperCase();
  if (user.name?.trim()) return user.name.trim().charAt(0).toUpperCase();
  return "T";
}
