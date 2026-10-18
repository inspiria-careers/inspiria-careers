/**
 * Payment Utilities for Manual QR & UPI Flow (Zero Gateway)
 */

export interface UtrValidationResult {
  valid: boolean;
  formatted: string;
  error?: string;
}

/**
 * Validates and formats a UPI Transaction / UTR reference number.
 * Typical UPI UTRs are 12 digits, but IMPS/NEFT references can be 8-20 alphanumeric characters.
 */
export function validateUtr(rawUtr: string): UtrValidationResult {
  if (!rawUtr) {
    return { valid: false, formatted: "", error: "Transaction / UTR number is required." };
  }

  // Remove spaces, hyphens, and whitespace
  const cleaned = rawUtr.replace(/[\s\-]/g, "").toUpperCase();

  if (cleaned.length < 8) {
    return {
      valid: false,
      formatted: cleaned,
      error: "UTR number is too short (must be at least 8 characters).",
    };
  }

  if (cleaned.length > 25) {
    return {
      valid: false,
      formatted: cleaned,
      error: "UTR number is too long (maximum 25 characters).",
    };
  }

  // Must only contain alphanumeric characters
  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return {
      valid: false,
      formatted: cleaned,
      error: "UTR number must contain only letters and numbers (no special symbols).",
    };
  }

  return { valid: true, formatted: cleaned };
}

/**
 * Generates mobile upi://pay deep link for 1-click payment via GPay / PhonePe / Paytm / BHIM.
 */
export function createUpiDeepLink({
  upiId,
  payeeName,
  amount,
  appointmentId,
  note,
}: {
  upiId: string;
  payeeName: string;
  amount: number;
  appointmentId: string;
  note?: string;
}): string {
  const cleanUpi = upiId.trim();
  const cleanPayee = payeeName.trim() || "Counsellor";
  const formattedAmount = amount > 0 ? amount.toFixed(2) : "0.00";
  const transactionNote = note || `Consultation Fee (${appointmentId.slice(-6).toUpperCase()})`;

  return `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanPayee)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
}

/**
 * Generates an immutable computer-generated receipt number.
 * Format: REC-YYYYMMDD-XXXX
 */
export function generateReceiptNumber(appointmentId: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = appointmentId.slice(-4).toUpperCase();
  return `REC-${dateStr}-${suffix}`;
}

/**
 * Formats Indian Currency (INR).
 */
export function formatInr(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
