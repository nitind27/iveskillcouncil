"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Copy,
  Check,
  MapPin,
  Building2,
  User,
  FileText,
  CreditCard,
  Upload,
  X,
  File,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import {
  validateName,
  validateEmail,
  validatePhone,
  validatePincode,
  validateFranchiseName,
  validatePan,
  validateAadhaar,
  validateGstin,
  validateMsme,
  validateIfsc,
  validateBankAccount,
  validateRequiredText,
  validateSubscriptionDates,
  type ValidationResult,
} from "@/lib/validation";
import { usePincodeLookup } from "@/hooks/usePincodeLookup";
import { cn } from "@/lib/utils";

const MAX_DOC_BYTES = 5 * 1024 * 1024;
const ALLOWED_DOC_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "application/pdf",
]);

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

function fieldBorder(hasError: boolean) {
  return hasError
    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
    : "border-[#1E4A85]/15 focus:border-[#1E4A85] focus:ring-[#1E4A85]/15";
}

interface Plan {
  id: number;
  name: string;
  price: number;
  durationInDays: number;
  status: string;
}

interface AddFranchiseFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface UploadedDoc {
  key: string;
  url: string;
  name: string;
  type: string;
  label: string;
}

interface DocDef {
  key: string;
  label: string;
  hint: string;
  required: boolean;
  accept: string;
}

const STEPS = [
  { id: "owner", label: "Owner & Plan", icon: User },
  { id: "business", label: "Business", icon: Building2 },
  { id: "kyc", label: "KYC & Bank", icon: CreditCard },
  { id: "docs", label: "Documents", icon: FileText },
  { id: "review", label: "Review", icon: CheckCircle2 },
] as const;

const BUSINESS_TYPES = [
  { value: "INDIVIDUAL", label: "Individual / Proprietor" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "PVT_LTD", label: "Private Limited" },
  { value: "LLP", label: "LLP" },
  { value: "TRUST", label: "Trust / Society" },
  { value: "OTHER", label: "Other" },
] as const;

const BASE_DOCS: DocDef[] = [
  { key: "pan", label: "PAN Card", hint: "Owner / entity PAN", required: true, accept: "image/*,.pdf" },
  { key: "aadhar", label: "Aadhaar Card", hint: "Owner or key person", required: true, accept: "image/*,.pdf" },
  { key: "photo", label: "Owner Photo", hint: "Clear passport-size photo", required: true, accept: "image/*" },
  { key: "signature", label: "Signature", hint: "Scanned signature", required: true, accept: "image/*" },
  { key: "address_proof", label: "Address Proof", hint: "Utility bill / rent / ownership", required: true, accept: "image/*,.pdf" },
  { key: "gst", label: "GST Certificate", hint: "If registered under GST", required: false, accept: "image/*,.pdf" },
  { key: "msme", label: "MSME / Udyam Certificate", hint: "Udyam registration certificate", required: false, accept: "image/*,.pdf" },
  { key: "bank", label: "Bank Passbook / Cancelled Cheque", hint: "Account proof for payouts", required: true, accept: "image/*,.pdf" },
  { key: "logo", label: "Institute Logo", hint: "PNG preferred, transparent", required: false, accept: "image/*" },
  { key: "centre_photo", label: "Centre / Premises Photo", hint: "Front view of centre", required: false, accept: "image/*" },
];

const ENTITY_EXTRA_DOCS: DocDef[] = [
  { key: "entity_reg", label: "Entity Registration", hint: "COI / Partnership deed / Trust deed", required: true, accept: "image/*,.pdf" },
  { key: "stamp", label: "Institute Stamp", hint: "Official stamp imprint", required: false, accept: "image/*" },
];

const inputClass =
  "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-[#0B132B] placeholder:text-slate-400 outline-none transition focus:ring-2";
const labelClass = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#1E4A85]/80";

interface Credentials {
  email: string;
  password?: string;
  loginUrl: string;
  firstTimeSetup?: boolean;
}

function normalizePan(v: string) {
  return v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
}
function normalizeAadhaar(v: string) {
  return v.replace(/\D/g, "").slice(0, 12);
}
function normalizeGst(v: string) {
  return v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 15);
}
function normalizeIfsc(v: string) {
  return v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 11);
}

export default function AddFranchiseForm({ onSuccess, onCancel }: AddFranchiseFormProps) {
  const [step, setStep] = useState(0);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [form, setForm] = useState({
    name: "",
    legalName: "",
    businessType: "INDIVIDUAL",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    alternatePhone: "",
    email: "",
    phone: "",
    planId: "",
    subscriptionStart: "",
    subscriptionEnd: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    panNumber: "",
    aadhaarNumber: "",
    gstNumber: "",
    msmeNumber: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankIfsc: "",
  });

  const isEntity = form.businessType !== "INDIVIDUAL";
  const docList = isEntity ? [...BASE_DOCS, ...ENTITY_EXTRA_DOCS] : BASE_DOCS;

  const loadPlans = React.useCallback(async () => {
    let list: Plan[] = [];
    let lastStatus = 0;
    try {
      const res = await fetch("/api/franchises/plans", { credentials: "include" });
      lastStatus = res.status;
      const data = await res.json();
      list = Array.isArray(data.data) ? data.data : [];
      if (list.length === 0) {
        const fallback = await fetch("/api/admin/plans", { credentials: "include" });
        lastStatus = fallback.status;
        const fallbackData = await fallback.json();
        list = Array.isArray(fallbackData.data) ? fallbackData.data : [];
      }
    } catch {
      try {
        const res = await fetch("/api/admin/plans", { credentials: "include" });
        lastStatus = res.status;
        const data = await res.json();
        list = Array.isArray(data.data) ? data.data : [];
      } catch {
        list = [];
      }
    }
    setPlans(list);
    if (list.length > 0) {
      setForm((f) => (f.planId ? f : { ...f, planId: String(list[0].id) }));
    } else if (lastStatus === 401) {
      showError("Session expired", "Please log in again.");
    } else if (lastStatus === 403) {
      showError("Access denied", "You don't have permission to view plans.");
    }
  }, []);

  useEffect(() => {
    loadPlans().finally(() => setLoadingPlans(false));
  }, [loadPlans]);

  const { fetchByPincode, loading: pincodeLoading, error: pincodeError, clearError: clearPincodeError } =
    usePincodeLookup((data) =>
      setForm((prev) => ({
        ...prev,
        address: prev.address || data.area,
        city: data.city,
        state: data.state,
      }))
    );

  const clearFieldError = (name: string) => {
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const setFieldError = (name: string, error?: string) => {
    setFieldErrors((prev) => {
      if (!error) {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      }
      return { ...prev, [name]: error };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let next = value;
    if (name === "panNumber") next = normalizePan(value);
    if (name === "aadhaarNumber") next = normalizeAadhaar(value);
    if (name === "gstNumber") next = normalizeGst(value);
    if (name === "bankIfsc") next = normalizeIfsc(value);
    if (name === "bankAccountNumber") next = value.replace(/\D/g, "").slice(0, 18);
    if (name === "msmeNumber") next = value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 26);
    if (name === "pincode") next = value.replace(/\D/g, "").slice(0, 6);
    setForm((prev) => ({ ...prev, [name]: next }));
    if (name === "pincode") clearPincodeError();
    clearFieldError(name);
    setFormError("");
  };

  const validateField = (name: string, value?: string): ValidationResult => {
    const v = value !== undefined ? value : (form as Record<string, string>)[name] ?? "";
    switch (name) {
      case "name":
        return validateFranchiseName(v);
      case "ownerName":
        return validateName(v);
      case "ownerEmail":
        return validateEmail(v);
      case "ownerPhone":
        return validatePhone(v);
      case "alternatePhone":
        return v.trim() ? validatePhone(v) : { valid: true };
      case "planId":
        return v ? { valid: true } : { valid: false, error: "Select a subscription plan" };
      case "subscriptionStart":
        return validateSubscriptionDates(v || form.subscriptionStart, form.subscriptionEnd || v);
      case "subscriptionEnd":
        return validateSubscriptionDates(form.subscriptionStart || v, v || form.subscriptionEnd);
      case "businessType":
        return v ? { valid: true } : { valid: false, error: "Select business type" };
      case "legalName":
        return v.trim() ? validateRequiredText(v, "Legal name", { min: 2, max: 200 }) : { valid: true };
      case "address":
        return validateRequiredText(v, "Address", { min: 5, max: 500 });
      case "city":
        return validateRequiredText(v, "City", { min: 2, max: 100 });
      case "state":
        return validateRequiredText(v, "State", { min: 2, max: 100 });
      case "pincode":
        return validatePincode(v, true);
      case "phone":
        return v.trim() ? validatePhone(v) : { valid: true };
      case "email":
        return v.trim() ? validateEmail(v) : { valid: true };
      case "panNumber":
        return validatePan(v, true);
      case "aadhaarNumber":
        return validateAadhaar(v, true);
      case "gstNumber":
        return validateGstin(v, isEntity);
      case "msmeNumber":
        return validateMsme(v, false);
      case "bankName":
        return validateRequiredText(v, "Bank name", { min: 2, max: 100 });
      case "bankAccountName":
        return validateName(v.trim() ? v : "");
      case "bankAccountNumber":
        return validateBankAccount(v, true);
      case "bankIfsc":
        return validateIfsc(v, true);
      default:
        return { valid: true };
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    const result = validateField(name);
    setFieldError(name, result.valid ? undefined : result.error);
  };

  const uploadDoc = async (key: string, label: string, file: File) => {
    if (!ALLOWED_DOC_TYPES.has(file.type) && !/\.(jpe?g|png|webp|pdf)$/i.test(file.name)) {
      setFormError("Only JPG, PNG, WebP or PDF files are allowed.");
      setFieldError(`doc_${key}`, "Invalid file type");
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setFormError("File too large — max 5MB per document.");
      setFieldError(`doc_${key}`, "Max 5MB");
      return;
    }
    setUploading(key);
    setFormError("");
    clearFieldError(`doc_${key}`);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("docType", key);
      const res = await fetch("/api/franchise-application/upload-doc", { method: "POST", body });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = data.error || "Upload failed";
        setFormError(msg);
        setFieldError(`doc_${key}`, msg);
        return;
      }
      setDocs((prev) => {
        const filtered = prev.filter((d) => d.key !== key);
        return [...filtered, { key, url: data.data.url, name: file.name, type: file.type, label }];
      });
    } catch {
      setFormError("Upload failed. Please try again.");
      setFieldError(`doc_${key}`, "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const removeDoc = (key: string) => {
    setDocs((prev) => prev.filter((d) => d.key !== key));
    if (fileRefs.current[key]) fileRefs.current[key]!.value = "";
    clearFieldError(`doc_${key}`);
  };

  const validateStep = (): string | null => {
    const errors: Record<string, string> = {};
    const fail = (key: string, result: ValidationResult) => {
      if (!result.valid && result.error) errors[key] = result.error;
    };

    if (step === 0) {
      fail("name", validateFranchiseName(form.name));
      fail("ownerName", validateName(form.ownerName));
      fail("ownerEmail", validateEmail(form.ownerEmail));
      fail("ownerPhone", validatePhone(form.ownerPhone));
      if (form.alternatePhone.trim()) fail("alternatePhone", validatePhone(form.alternatePhone));
      fail("planId", form.planId ? { valid: true } : { valid: false, error: "Select a subscription plan" });
      fail("subscriptionStart", validateSubscriptionDates(form.subscriptionStart, form.subscriptionEnd));
      if (!form.subscriptionStart) errors.subscriptionStart = "Start date is required";
      if (!form.subscriptionEnd) errors.subscriptionEnd = "End date is required";
      else if (form.subscriptionStart && form.subscriptionEnd < form.subscriptionStart) {
        errors.subscriptionEnd = "End date must be on or after start date";
      }
    }

    if (step === 1) {
      fail("businessType", form.businessType ? { valid: true } : { valid: false, error: "Select business type" });
      if (form.legalName.trim()) fail("legalName", validateRequiredText(form.legalName, "Legal name", { min: 2, max: 200 }));
      fail("address", validateRequiredText(form.address, "Address", { min: 5, max: 500 }));
      fail("city", validateRequiredText(form.city, "City", { min: 2, max: 100 }));
      fail("state", validateRequiredText(form.state, "State", { min: 2, max: 100 }));
      fail("pincode", validatePincode(form.pincode, true));
      if (form.phone.trim()) fail("phone", validatePhone(form.phone));
      if (form.email.trim()) fail("email", validateEmail(form.email));
    }

    if (step === 2) {
      fail("panNumber", validatePan(form.panNumber, true));
      fail("aadhaarNumber", validateAadhaar(form.aadhaarNumber, true));
      fail("gstNumber", validateGstin(form.gstNumber, isEntity));
      if (form.msmeNumber.trim()) fail("msmeNumber", validateMsme(form.msmeNumber, false));
      fail("bankName", validateRequiredText(form.bankName, "Bank name", { min: 2, max: 100 }));
      fail("bankAccountName", validateName(form.bankAccountName));
      fail("bankAccountNumber", validateBankAccount(form.bankAccountNumber, true));
      fail("bankIfsc", validateIfsc(form.bankIfsc, true));
    }

    if (step === 3) {
      const need = docList.filter((d) => d.required || (d.key === "gst" && isEntity));
      for (const d of need) {
        if (!docs.find((u) => u.key === d.key)) {
          errors[`doc_${d.key}`] = `${d.label} is required`;
        }
      }
    }

    if (step === 4) {
      fail("name", validateFranchiseName(form.name));
      fail("ownerName", validateName(form.ownerName));
      fail("ownerEmail", validateEmail(form.ownerEmail));
      fail("ownerPhone", validatePhone(form.ownerPhone));
      fail("address", validateRequiredText(form.address, "Address", { min: 5, max: 500 }));
      fail("pincode", validatePincode(form.pincode, true));
      fail("panNumber", validatePan(form.panNumber, true));
      fail("aadhaarNumber", validateAadhaar(form.aadhaarNumber, true));
      fail("gstNumber", validateGstin(form.gstNumber, isEntity));
      fail("bankName", validateRequiredText(form.bankName, "Bank name", { min: 2, max: 100 }));
      fail("bankAccountName", validateName(form.bankAccountName));
      fail("bankAccountNumber", validateBankAccount(form.bankAccountNumber, true));
      fail("bankIfsc", validateIfsc(form.bankIfsc, true));
      fail("planId", form.planId ? { valid: true } : { valid: false, error: "Select a subscription plan" });
      fail("subscriptionStart", validateSubscriptionDates(form.subscriptionStart, form.subscriptionEnd));
      const need = docList.filter((d) => d.required || (d.key === "gst" && isEntity));
      const missing = need.filter((d) => !docs.find((u) => u.key === d.key));
      if (missing.length) {
        errors.documents = `Missing documents: ${missing.map((d) => d.label).join(", ")}`;
      }
    }

    setFieldErrors(errors);
    const first = Object.values(errors)[0];
    return first || null;
  };

  const next = () => {
    const err = validateStep();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    setFieldErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => {
    setFormError("");
    setFieldErrors({});
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) {
      setFormError(err);
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/franchises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          legalName: form.legalName.trim() || undefined,
          businessType: form.businessType,
          ownerName: form.ownerName.trim(),
          ownerEmail: form.ownerEmail.trim(),
          ownerPhone: form.ownerPhone.trim() || undefined,
          alternatePhone: form.alternatePhone.trim() || undefined,
          email: form.email.trim() || form.ownerEmail.trim(),
          phone: form.phone.trim() || form.ownerPhone.trim() || undefined,
          planId: Number(form.planId),
          subscriptionStart: form.subscriptionStart,
          subscriptionEnd: form.subscriptionEnd,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          pincode: form.pincode.trim() || undefined,
          panNumber: form.panNumber,
          aadhaarNumber: form.aadhaarNumber,
          gstNumber: form.gstNumber || undefined,
          msmeNumber: form.msmeNumber.trim() || undefined,
          bankName: form.bankName.trim(),
          bankAccountName: form.bankAccountName.trim(),
          bankAccountNumber: form.bankAccountNumber.trim(),
          bankIfsc: form.bankIfsc,
          documents: docs,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        await showError("Error", data.error || "Failed to create franchise.");
        setSubmitting(false);
        return;
      }
      if (data?.data?.credentials) {
        setCredentials(data.data.credentials);
        setEmailSent(!!data.data.emailSent);
        await showSuccess("Created", "Franchise created. Copy credentials below and share with the owner.");
      } else {
        await showSuccess("Created", "Franchise created.");
        onSuccess();
      }
    } catch {
      await showError("Error", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      showError("Copy failed", "Could not copy to clipboard");
    }
  };

  if (credentials) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4">
          <p className="mb-2 font-semibold text-foreground">Franchise created successfully</p>
          {credentials.firstTimeSetup ? (
            <p className="mb-3 text-sm text-muted-foreground">
              Setup instructions sent to {credentials.email}. Owner will use OTP on first login, then set password.
            </p>
          ) : !emailSent ? (
            <p className="mb-3 text-sm text-amber-600 dark:text-amber-400">
              Email could not be sent. Copy these credentials and share with the franchise owner manually.
            </p>
          ) : (
            <p className="mb-3 text-sm text-muted-foreground">
              Credentials sent to {credentials.email}. Copy below as backup.
            </p>
          )}
        </div>
        <div className="space-y-3">
          {[
            { key: "email", label: "Username (Email)", value: credentials.email },
            ...(credentials.password
              ? [{ key: "password", label: "Password", value: credentials.password }]
              : []),
            { key: "url", label: "Login URL", value: credentials.loginUrl },
          ].map((row) => (
            <div key={row.key}>
              <label className="text-xs font-medium text-muted-foreground">{row.label}</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={row.value}
                  className="flex-1 rounded-lg border border-input bg-muted/50 px-3 py-2 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(row.value, row.key)}
                  className="rounded-lg border border-input px-3 py-2 transition-colors hover:bg-muted"
                >
                  {copied === row.key ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end border-t border-border pt-4">
          <button
            type="button"
            onClick={() => {
              setCredentials(null);
              onSuccess();
            }}
            className="rounded-lg bg-[#1E4A85] px-4 py-2 font-semibold text-white hover:bg-[#163A6B]"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (loadingPlans) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
      </div>
    );
  }

  const selectedPlan = plans.find((p) => String(p.id) === form.planId);

  return (
    <div className="space-y-5">
      {/* Stepper */}
      <div className="overflow-x-auto">
        <div className="flex min-w-[520px] items-center gap-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <React.Fragment key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (i < step) {
                      setFormError("");
                      setStep(i);
                    }
                  }}
                  className={cn(
                    "flex flex-1 items-center gap-2 rounded-xl px-2.5 py-2 text-left transition",
                    active && "bg-[#1E4A85] text-white shadow-md shadow-[#1E4A85]/25",
                    done && "bg-[#1E4A85]/10 text-[#1E4A85]",
                    !active && !done && "bg-slate-50 text-slate-400"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      active && "bg-white/20",
                      done && "bg-[#1E4A85] text-white",
                      !active && !done && "bg-slate-200 text-slate-500"
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <span className="hidden text-[11px] font-semibold leading-tight sm:block">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px w-3 shrink-0", i < step ? "bg-[#1E4A85]" : "bg-slate-200")} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {formError}
        </div>
      )}

      {/* Step 0 — Owner & Plan */}
      {step === 0 && (
        <section className="space-y-4">
          <div className="rounded-xl border border-[#C4A35A]/30 bg-gradient-to-r from-[#C4A35A]/10 to-transparent px-4 py-3">
            <p className="text-sm font-semibold text-[#0B132B]">Franchise owner & subscription</p>
            <p className="text-xs text-slate-600">Login credentials will be emailed to the owner.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>Franchise / Institute Name *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.name))} placeholder="e.g. IVESDC Mumbai Centre" />
              <FieldError message={fieldErrors.name} />
            </div>
            <div>
              <label className={labelClass}>Owner Full Name *</label>
              <input type="text" name="ownerName" value={form.ownerName} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.ownerName))} placeholder="As on PAN / Aadhaar" />
              <FieldError message={fieldErrors.ownerName} />
            </div>
            <div>
              <label className={labelClass}>Owner Email *</label>
              <input type="email" name="ownerEmail" value={form.ownerEmail} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.ownerEmail))} placeholder="owner@example.com" />
              <FieldError message={fieldErrors.ownerEmail} />
            </div>
            <div>
              <label className={labelClass}>Owner Phone *</label>
              <input type="tel" name="ownerPhone" value={form.ownerPhone} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.ownerPhone))} placeholder="10-digit mobile" maxLength={14} />
              <FieldError message={fieldErrors.ownerPhone} />
            </div>
            <div>
              <label className={labelClass}>Alternate Phone</label>
              <input type="tel" name="alternatePhone" value={form.alternatePhone} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.alternatePhone))} placeholder="Optional" maxLength={14} />
              <FieldError message={fieldErrors.alternatePhone} />
            </div>
            <div>
              <label className={labelClass}>Subscription Plan *</label>
              <select name="planId" value={form.planId} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.planId))} disabled={plans.length === 0}>
                <option value="">{plans.length === 0 ? "No plans — create in Subscription first" : "Select plan"}</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{Number(p.price).toLocaleString("en-IN")} / {p.durationInDays} days
                  </option>
                ))}
              </select>
              <FieldError message={fieldErrors.planId} />
            </div>
            <div>
              <label className={labelClass}>Subscription Start *</label>
              <input type="date" name="subscriptionStart" value={form.subscriptionStart} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.subscriptionStart))} min={today} />
              <FieldError message={fieldErrors.subscriptionStart} />
            </div>
            <div>
              <label className={labelClass}>Subscription End *</label>
              <input type="date" name="subscriptionEnd" value={form.subscriptionEnd} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.subscriptionEnd))} min={form.subscriptionStart || today} />
              <FieldError message={fieldErrors.subscriptionEnd} />
            </div>
          </div>
        </section>
      )}

      {/* Step 1 — Business & Address */}
      {step === 1 && (
        <section className="space-y-4">
          <div className="rounded-xl border border-[#1E4A85]/15 bg-[#1E4A85]/[0.04] px-4 py-3">
            <p className="text-sm font-semibold text-[#1E4A85]">Business & centre location</p>
            <p className="text-xs text-slate-600">Legal identity and registered centre address.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Business Type *</label>
              <select name="businessType" value={form.businessType} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.businessType))}>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <FieldError message={fieldErrors.businessType} />
            </div>
            <div>
              <label className={labelClass}>Legal / Registered Name</label>
              <input type="text" name="legalName" value={form.legalName} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.legalName))} placeholder="As on GST / registration" />
              <FieldError message={fieldErrors.legalName} />
            </div>
            <div>
              <label className={labelClass}>Centre Phone</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.phone))} placeholder="Public contact number" maxLength={14} />
              <FieldError message={fieldErrors.phone} />
            </div>
            <div>
              <label className={labelClass}>Centre Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.email))} placeholder="centre@example.com" />
              <FieldError message={fieldErrors.email} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Centre Address *</label>
              <textarea name="address" value={form.address} onChange={handleChange} onBlur={handleBlur} rows={2} className={cn(inputClass, fieldBorder(!!fieldErrors.address))} placeholder="Shop / floor, street, landmark" />
              <FieldError message={fieldErrors.address} />
            </div>
            <div>
              <label className={labelClass}>Pincode *</label>
              <div className="flex gap-2">
                <input type="text" name="pincode" value={form.pincode} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.pincode))} placeholder="6-digit" maxLength={6} inputMode="numeric" />
                <button
                  type="button"
                  onClick={() => {
                    const pin = validatePincode(form.pincode, true);
                    if (!pin.valid) {
                      setFieldError("pincode", pin.error);
                      return;
                    }
                    fetchByPincode(form.pincode);
                  }}
                  disabled={pincodeLoading || form.pincode.trim().replace(/\D/g, "").length !== 6}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-[#1E4A85]/10 px-3.5 py-2 text-sm font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/15 disabled:opacity-50"
                >
                  {pincodeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  Get area
                </button>
              </div>
              <FieldError message={fieldErrors.pincode} />
              {pincodeError && <p className="mt-1 text-xs text-amber-600">{pincodeError}</p>}
            </div>
            <div>
              <label className={labelClass}>City *</label>
              <input type="text" name="city" value={form.city} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.city))} placeholder="City" />
              <FieldError message={fieldErrors.city} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>State *</label>
              <input type="text" name="state" value={form.state} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.state))} placeholder="State" />
              <FieldError message={fieldErrors.state} />
            </div>
          </div>
        </section>
      )}

      {/* Step 2 — KYC numbers & Bank */}
      {step === 2 && (
        <section className="space-y-4">
          <div className="rounded-xl border border-[#C4A35A]/35 bg-gradient-to-r from-[#C4A35A]/12 to-transparent px-4 py-3">
            <p className="text-sm font-semibold text-[#0B132B]">KYC identifiers & bank details</p>
            <p className="text-xs text-slate-600">Numbers must match the uploaded documents on the next step.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>PAN Number *</label>
              <input type="text" name="panNumber" value={form.panNumber} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, "font-mono tracking-wider", fieldBorder(!!fieldErrors.panNumber))} placeholder="ABCDE1234F" maxLength={10} />
              <FieldError message={fieldErrors.panNumber} />
            </div>
            <div>
              <label className={labelClass}>Aadhaar Number *</label>
              <input type="text" name="aadhaarNumber" value={form.aadhaarNumber} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, "font-mono tracking-wider", fieldBorder(!!fieldErrors.aadhaarNumber))} placeholder="12-digit Aadhaar" maxLength={12} inputMode="numeric" />
              <FieldError message={fieldErrors.aadhaarNumber} />
            </div>
            <div>
              <label className={labelClass}>GSTIN {isEntity ? "*" : "(optional)"}</label>
              <input type="text" name="gstNumber" value={form.gstNumber} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, "font-mono tracking-wider", fieldBorder(!!fieldErrors.gstNumber))} placeholder="15-character GSTIN" maxLength={15} />
              <FieldError message={fieldErrors.gstNumber} />
            </div>
            <div>
              <label className={labelClass}>MSME / Udyam Number</label>
              <input type="text" name="msmeNumber" value={form.msmeNumber} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, "font-mono", fieldBorder(!!fieldErrors.msmeNumber))} placeholder="UDYAM-XX-00-0000000" maxLength={26} />
              <FieldError message={fieldErrors.msmeNumber} />
            </div>
          </div>
          <div className="border-t border-dashed border-[#1E4A85]/15 pt-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#1E4A85]">Bank account (for settlements)</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Bank Name *</label>
                <input type="text" name="bankName" value={form.bankName} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.bankName))} placeholder="e.g. HDFC Bank" />
                <FieldError message={fieldErrors.bankName} />
              </div>
              <div>
                <label className={labelClass}>Account Holder Name *</label>
                <input type="text" name="bankAccountName" value={form.bankAccountName} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, fieldBorder(!!fieldErrors.bankAccountName))} placeholder="As per passbook" />
                <FieldError message={fieldErrors.bankAccountName} />
              </div>
              <div>
                <label className={labelClass}>Account Number *</label>
                <input type="text" name="bankAccountNumber" value={form.bankAccountNumber} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, "font-mono", fieldBorder(!!fieldErrors.bankAccountNumber))} placeholder="9–18 digits" inputMode="numeric" maxLength={18} />
                <FieldError message={fieldErrors.bankAccountNumber} />
              </div>
              <div>
                <label className={labelClass}>IFSC *</label>
                <input type="text" name="bankIfsc" value={form.bankIfsc} onChange={handleChange} onBlur={handleBlur} className={cn(inputClass, "font-mono tracking-wider", fieldBorder(!!fieldErrors.bankIfsc))} placeholder="HDFC0001234" maxLength={11} />
                <FieldError message={fieldErrors.bankIfsc} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Step 3 — Documents */}
      {step === 3 && (
        <section className="space-y-4">
          <div className="rounded-xl border border-[#1E4A85]/15 bg-[#1E4A85]/[0.04] px-4 py-3">
            <p className="text-sm font-semibold text-[#1E4A85]">Upload verification documents</p>
            <p className="text-xs text-slate-600">JPG, PNG, WebP or PDF · max 5MB each. Required files marked.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {docList.map((doc) => {
              const uploaded = docs.find((d) => d.key === doc.key);
              const isUploading = uploading === doc.key;
              const required = doc.required || (doc.key === "gst" && isEntity);
              return (
                <div
                  key={doc.key}
                  className={cn(
                    "rounded-xl border p-3.5 transition",
                    fieldErrors[`doc_${doc.key}`]
                      ? "border-red-300 bg-red-50/40"
                      : uploaded
                        ? "border-emerald-300 bg-emerald-50/60"
                        : "border-[#1E4A85]/12 bg-white hover:border-[#1E4A85]/30"
                  )}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#0B132B]">
                        {doc.label}
                        {required && <span className="ml-1 text-red-500">*</span>}
                      </p>
                      <p className="text-[11px] text-slate-500">{doc.hint}</p>
                    </div>
                    {required && !uploaded && (
                      <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-600">
                        Required
                      </span>
                    )}
                    {uploaded && (
                      <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
                        Uploaded
                      </span>
                    )}
                  </div>
                  {uploaded ? (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-2.5 py-2">
                      <File className="h-4 w-4 shrink-0 text-emerald-600" />
                      <a href={uploaded.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs font-medium text-[#1E4A85] hover:underline">
                        {uploaded.name}
                      </a>
                      <button type="button" onClick={() => removeDoc(doc.key)} className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className={cn(
                      "flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-xs font-semibold transition",
                      isUploading
                        ? "border-slate-200 bg-slate-50 text-slate-400"
                        : "border-[#1E4A85]/25 bg-[#1E4A85]/[0.03] text-[#1E4A85] hover:bg-[#1E4A85]/10"
                    )}>
                      {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {isUploading ? "Uploading…" : "Choose file"}
                      <input
                        ref={(el) => { fileRefs.current[doc.key] = el; }}
                        type="file"
                        accept={doc.accept}
                        className="hidden"
                        disabled={!!uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadDoc(doc.key, doc.label, file);
                        }}
                      />
                    </label>
                  )}
                  <FieldError message={fieldErrors[`doc_${doc.key}`]} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Step 4 — Review */}
      {step === 4 && (
        <section className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-800">Review before creating</p>
            <p className="text-xs text-emerald-700/80">Confirm details. Owner will receive login email after create.</p>
          </div>
          {fieldErrors.documents && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {fieldErrors.documents}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Franchise", form.name],
              ["Legal name", form.legalName || "—"],
              ["Business type", BUSINESS_TYPES.find((t) => t.value === form.businessType)?.label || form.businessType],
              ["Owner", form.ownerName],
              ["Owner email", form.ownerEmail],
              ["Owner phone", form.ownerPhone || "—"],
              ["Plan", selectedPlan ? `${selectedPlan.name} · ₹${Number(selectedPlan.price).toLocaleString("en-IN")}` : "—"],
              ["Subscription", `${form.subscriptionStart} → ${form.subscriptionEnd}`],
              ["Address", [form.address, form.city, form.state, form.pincode].filter(Boolean).join(", ")],
              ["PAN", form.panNumber],
              ["Aadhaar", form.aadhaarNumber.replace(/(\d{4})(?=\d)/g, "$1 ")],
              ["GSTIN", form.gstNumber || "—"],
              ["MSME / Udyam", form.msmeNumber || "—"],
              ["Bank", `${form.bankName} · ${form.bankAccountNumber} · ${form.bankIfsc}`],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-[#1E4A85]/10 bg-slate-50/80 px-3.5 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-0.5 break-words text-sm font-medium text-[#0B132B]">{value}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Documents ({docs.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {docs.map((d) => (
                <a
                  key={d.key}
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                >
                  <File className="h-3 w-3" />
                  {d.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
          Cancel
        </button>
        <div className="flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#1E4A85]/20 px-4 py-2 text-sm font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/5"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A6B]"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || plans.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-[#C4A35A] px-5 py-2 text-sm font-bold text-[#0B132B] hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Building2 className="h-4 w-4" />}
              Create Franchise
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
