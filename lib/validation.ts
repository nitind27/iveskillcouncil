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

/** Validate pincode (6 digits). */
export function validatePincode(pincode: string): ValidationResult {
  const trimmed = (pincode || "").trim();
  if (!trimmed) return { valid: true }; // optional
  if (!PINCODE_REGEX.test(trimmed.replace(/\s/g, ""))) return { valid: false, error: "Enter a valid 6-digit pincode" };
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
