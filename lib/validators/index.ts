/**
 * Validation helpers & schemas
 */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || (digits.length === 12 && digits.startsWith("91"));
}

export function isValidPincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode.trim());
}

export function isValidOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp.trim());
}
