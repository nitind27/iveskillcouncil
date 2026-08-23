/**
 * Centralized validation utilities for forms across the project.
 * Use for email, phone, name, and other common fields.
 */

/** Indian mobile: 10 digits, optionally prefixed with +91 or 0 */
const PHONE_REGEX = /^(\+91[\s-]?|0)?[6-9]\d{9}$/;

/** Standard email format */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** Name: letters, spaces, dots, hyphens, min 2 chars, max 150 */
const NAME_REGEX = /^[a-zA-Z\s.\-']{2,150}$/;

/** Pincode: 6 digits */
const PINCODE_REGEX = /^\d{6}$/;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Validate email. Returns error message if invalid. */
export function validateEmail(email: string): ValidationResult {
  const trimmed = (email || "").trim();
  if (!trimmed) return { valid: false, error: "Email is required" };
  if (trimmed.length > 150) return { valid: false, error: "Email is too long" };
  if (!EMAIL_REGEX.test(trimmed)) return { valid: false, error: "Enter a valid email (e.g. name@example.com)" };
  return { valid: true };
}

/** Validate Indian phone number. Accepts 10 digits, +91 prefix, or 0 prefix. */
export function validatePhone(phone: string): ValidationResult {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return { valid: false, error: "Phone number is required" };
  if (digits.length !== 10) return { valid: false, error: "Enter a valid 10-digit mobile number" };
  if (!/^[6-9]/.test(digits)) return { valid: false, error: "Mobile number must start with 6, 7, 8 or 9" };
  return { valid: true };
}

/** Validate full name. Letters, spaces, min 2 chars. */
export function validateName(name: string): ValidationResult {
  const trimmed = (name || "").trim();
  if (!trimmed) return { valid: false, error: "Name is required" };
  if (trimmed.length < 2) return { valid: false, error: "Name must be at least 2 characters" };
  if (trimmed.length > 150) return { valid: false, error: "Name is too long" };
  if (!NAME_REGEX.test(trimmed)) return { valid: false, error: "Name can only contain letters, spaces, and . - '" };
  return { valid: true };
}

/** Validate pincode (6 digits). Optional by default. */
export function validatePincode(pincode: string, required = false): ValidationResult {
  const trimmed = (pincode || "").trim().replace(/\s/g, "");
  if (!trimmed) return required ? { valid: false, error: "Pincode is required" } : { valid: true };
  if (!PINCODE_REGEX.test(trimmed)) return { valid: false, error: "Enter a valid 6-digit pincode" };
  return { valid: true };
}

/** Franchise / institute display name */
export function validateFranchiseName(name: string): ValidationResult {
  const trimmed = (name || "").trim();
  if (!trimmed) return { valid: false, error: "Franchise / institute name is required" };
  if (trimmed.length < 3) return { valid: false, error: "Name must be at least 3 characters" };
  if (trimmed.length > 150) return { valid: false, error: "Name is too long (max 150 characters)" };
  return { valid: true };
}

/** Indian PAN: ABCDE1234F */
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export function validatePan(pan: string, required = true): ValidationResult {
  const value = (pan || "").trim().toUpperCase();
  if (!value) return required ? { valid: false, error: "PAN number is required" } : { valid: true };
  if (value.length !== 10) return { valid: false, error: "PAN must be exactly 10 characters" };
  if (!PAN_REGEX.test(value)) return { valid: false, error: "Invalid PAN format (e.g. ABCDE1234F)" };
  return { valid: true };
}

/** Verhoeff checksum for Aadhaar */
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

function verhoeffCheck(num: string): boolean {
  let c = 0;
  const reversed = num.split("").reverse().map((d) => parseInt(d, 10));
  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c]![VERHOEFF_P[i % 8]![reversed[i]!]!]!;
  }
  return c === 0;
}

/** 12-digit Aadhaar with Verhoeff checksum */
export function validateAadhaar(aadhaar: string, required = true): ValidationResult {
  const digits = (aadhaar || "").replace(/\D/g, "");
  if (!digits) return required ? { valid: false, error: "Aadhaar number is required" } : { valid: true };
  if (digits.length !== 12) return { valid: false, error: "Aadhaar must be exactly 12 digits" };
  if (!/^[2-9]/.test(digits)) return { valid: false, error: "Aadhaar cannot start with 0 or 1" };
  if (/^(\d)\1{11}$/.test(digits)) return { valid: false, error: "Invalid Aadhaar number" };
  if (!verhoeffCheck(digits)) return { valid: false, error: "Invalid Aadhaar checksum — check the number" };
  return { valid: true };
}

/** GSTIN: 15 chars (state + PAN + entity + Z + check) */
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export function validateGstin(gstin: string, required = false): ValidationResult {
  const value = (gstin || "").trim().toUpperCase();
  if (!value) return required ? { valid: false, error: "GSTIN is required for this business type" } : { valid: true };
  if (value.length !== 15) return { valid: false, error: "GSTIN must be exactly 15 characters" };
  if (!GSTIN_REGEX.test(value)) return { valid: false, error: "Invalid GSTIN format (e.g. 27ABCDE1234F1Z5)" };
  const panPart = value.slice(2, 12);
  const panCheck = validatePan(panPart, true);
  if (!panCheck.valid) return { valid: false, error: "GSTIN contains an invalid PAN segment" };
  return { valid: true };
}

/** Udyam / MSME: UDYAM-XX-00-0000000 */
const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/i;
export function validateMsme(msme: string, required = false): ValidationResult {
  const value = (msme || "").trim().toUpperCase();
  if (!value) return required ? { valid: false, error: "MSME / Udyam number is required" } : { valid: true };
  if (!UDYAM_REGEX.test(value)) {
    return { valid: false, error: "Invalid Udyam format (e.g. UDYAM-MH-01-1234567)" };
  }
  return { valid: true };
}

/** IFSC: ABCD0XXXXXX */
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export function validateIfsc(ifsc: string, required = true): ValidationResult {
  const value = (ifsc || "").trim().toUpperCase();
  if (!value) return required ? { valid: false, error: "IFSC is required" } : { valid: true };
  if (value.length !== 11) return { valid: false, error: "IFSC must be exactly 11 characters" };
  if (!IFSC_REGEX.test(value)) return { valid: false, error: "Invalid IFSC (e.g. HDFC0001234)" };
  return { valid: true };
}

/** Bank account number: 9–18 digits */
export function validateBankAccount(account: string, required = true): ValidationResult {
  const digits = (account || "").replace(/\D/g, "");
  if (!digits) return required ? { valid: false, error: "Account number is required" } : { valid: true };
  if (digits.length < 9 || digits.length > 18) {
    return { valid: false, error: "Account number must be 9–18 digits" };
  }
  return { valid: true };
}

/** Required non-empty text (trimmed) */
export function validateRequiredText(
  value: string,
  label: string,
  opts?: { min?: number; max?: number }
): ValidationResult {
  const trimmed = (value || "").trim();
  const min = opts?.min ?? 1;
  const max = opts?.max ?? 500;
  if (!trimmed) return { valid: false, error: `${label} is required` };
  if (trimmed.length < min) return { valid: false, error: `${label} must be at least ${min} characters` };
  if (trimmed.length > max) return { valid: false, error: `${label} is too long` };
  return { valid: true };
}

/** Subscription date range (YYYY-MM-DD) */
export function validateSubscriptionDates(start: string, end: string): ValidationResult {
  if (!start) return { valid: false, error: "Subscription start date is required" };
  if (!end) return { valid: false, error: "Subscription end date is required" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return { valid: false, error: "Enter valid dates" };
  }
  if (end < start) return { valid: false, error: "End date must be on or after start date" };
  return { valid: true };
}

/** Format phone for display: 9876543210 -> 98765 43210 */
export function formatPhoneDisplay(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  return phone;
}

/** Normalize phone to digits only for storage. */
export function normalizePhone(phone: string): string {
  return (phone || "").replace(/\D/g, "").slice(-10);
}

/** Validate multiple fields at once. Returns first error or null. */
export function validateForm(fields: Record<string, ValidationResult>): string | null {
  for (const [, result] of Object.entries(fields)) {
    if (!result.valid && result.error) return result.error;
  }
  return null;
}
