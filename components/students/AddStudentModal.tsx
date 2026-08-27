"use client";

import { useState, useEffect, useRef } from "react";
import { GlassModal } from "@/components/common/GlassModal";
import {
  Loader2,
  Check,
  Hash,
  Upload,
  User,
  ImageIcon,
  PenLine,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { ROLES } from "@/lib/permissions";
import { usePincodeLookup } from "@/hooks/usePincodeLookup";
import { cn } from "@/lib/utils";

interface Franchise {
  id: string;
  name: string;
}

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (payload: { id: string; studentCode: string; fullName: string }) => void;
}

const emptyForm = {
  franchiseId: "",
  firstName: "",
  surname: "",
  relationship: "",
  fatherHusbandName: "",
  motherName: "",
  email: "",
  phone: "",
  alternateMobile: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  area: "",
  pincode: "",
  city: "",
  state: "",
  password: "",
  confirmPassword: "",
  showFatherOnCertificate: true,
  showSurnameOnCertificate: true,
  admissionDate: new Date().toISOString().split("T")[0],
};

const labelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#1E4A85]";
const inputClass =
  "w-full rounded-xl border border-[#1E4A85]/15 bg-white px-3.5 py-2.5 text-sm text-[#0B1F3A] outline-none transition placeholder:text-slate-400 focus:border-[#1E4A85]/40 focus:ring-2 focus:ring-[#1E4A85]/12";

export function AddStudentModal({ open, onClose, onSuccess }: AddStudentModalProps) {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const isSubAdmin = roleId === ROLES.SUB_ADMIN;

  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loadingFranchises, setLoadingFranchises] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const profileRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);

  const { fetchByPincode, loading: pincodeLoading, error: pincodeError, clearError: clearPincodeError } =
    usePincodeLookup((data) => {
      setForm((f) => ({ ...f, area: data.area, city: data.city, state: data.state }));
    });

  useEffect(() => {
    if (!open) return;
    setCreatedCode(null);
    setProfilePreview(null);
    setSignaturePreview(null);
    setForm({
      ...emptyForm,
      franchiseId: isSubAdmin && user?.franchiseId ? String(user.franchiseId) : "",
      password: "Student@123",
      confirmPassword: "Student@123",
    });
  }, [open, isSubAdmin, user?.franchiseId]);

  useEffect(() => {
    if (!open || isSubAdmin) return;
    setLoadingFranchises(true);
    fetch("/api/franchises?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const x = d.data ?? d;
        return Array.isArray(x) ? x : x?.franchises ?? [];
      })
      .then((fl: Franchise[]) => setFranchises(Array.isArray(fl) ? fl : []))
      .catch(() => setFranchises([]))
      .finally(() => setLoadingFranchises(false));
  }, [open, isSubAdmin]);

  const set = (key: keyof typeof emptyForm, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const readFile = (file: File, kind: "profile" | "signature") => {
    if (!file.type.startsWith("image/")) {
      showError("Invalid file", "Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError("Too large", "Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      if (kind === "profile") setProfilePreview(url);
      else setSignaturePreview(url);
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!form.franchiseId) {
      await showError("Franchise", "Select a franchise");
      return;
    }
    const n = validateName(form.firstName.trim());
    const e = validateEmail(form.email.trim());
    const p = form.phone ? validatePhone(form.phone.trim()) : { valid: true };
    if (!n.valid) {
      await showError("First name", n.error!);
      return;
    }
    if (!e.valid) {
      await showError("Email", e.error!);
      return;
    }
    if (!p.valid) {
      await showError("Mobile", p.error!);
      return;
    }
    if (form.password !== form.confirmPassword) {
      await showError("Password", "Password and confirm password do not match");
      return;
    }
    if (!form.password || form.password.length < 6) {
      await showError("Password", "Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          franchiseId: form.franchiseId,
          firstName: form.firstName.trim(),
          surname: form.surname.trim() || null,
          relationship: form.relationship || null,
          fatherHusbandName: form.fatherHusbandName.trim() || null,
          motherName: form.motherName.trim() || null,
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          alternateMobile: form.alternateMobile.trim() || null,
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender || null,
          password: form.password,
          confirmPassword: form.confirmPassword,
          admissionDate: form.admissionDate,
          address: form.address || null,
          area: form.area || null,
          pincode: form.pincode || null,
          city: form.city || null,
          state: form.state || null,
          profileImageBase64: profilePreview,
          signatureBase64: signaturePreview,
          showFatherOnCertificate: form.showFatherOnCertificate,
          showSurnameOnCertificate: form.showSurnameOnCertificate,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        await showError("Error", json.error || "Failed to add student");
        return;
      }
      const code = json.data?.studentCode as string;
      const fullName = [form.firstName.trim(), form.surname.trim()].filter(Boolean).join(" ");
      setCreatedCode(code);
      await showSuccess(
        "Student added",
        json.data?.emailSent
          ? `ID ${code} created. Account details emailed to ${form.email.trim()}. Assign a course next.`
          : `ID ${code} created. Assign a course next.`
      );
      onSuccess?.({
        id: String(json.data?.id),
        studentCode: code,
        fullName,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlassModal open={open} onClose={onClose} title="Add Student" size="2xl">
      {createdCode ? (
        <div className="space-y-4 py-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Check className="h-7 w-7" />
          </div>
          <p className="text-lg font-bold text-[#1E4A85]">
            {[form.firstName, form.surname].filter(Boolean).join(" ")}
          </p>
          <p className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E4A85]/10 px-3 py-1.5 font-mono text-sm font-bold text-[#1E4A85]">
            <Hash className="h-4 w-4" />
            {createdCode}
          </p>
          <p className="text-sm text-muted-foreground">
            Account details have been emailed to the student. Next step: assign a course.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#1E4A85] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Continue
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.06] to-[#C4A35A]/10 px-4 py-3">
            <p className="text-sm font-semibold text-[#1E4A85]">Student registration</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Fill personal details first. Course is assigned in a separate step. Unique Student ID
              is generated automatically.
            </p>
          </div>

          {!isSubAdmin && (
            <div>
              <label className={labelClass}>Franchise *</label>
              <select
                value={form.franchiseId}
                onChange={(e) => set("franchiseId", e.target.value)}
                disabled={loadingFranchises}
                className={inputClass}
              >
                <option value="">Select franchise</option>
                {franchises.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Row: First Name | Relationship | Father/Husband | Mother */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="First Name *">
              <input
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="Enter First Name"
                className={inputClass}
              />
            </Field>
            <Field label="Relationship">
              <select
                value={form.relationship}
                onChange={(e) => set("relationship", e.target.value)}
                className={inputClass}
              >
                <option value="">Select</option>
                <option value="FATHER">Father</option>
                <option value="HUSBAND">Husband</option>
                <option value="GUARDIAN">Guardian</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Father / Husband Name">
              <input
                value={form.fatherHusbandName}
                onChange={(e) => set("fatherHusbandName", e.target.value)}
                placeholder="Enter Father/Husband Name"
                className={inputClass}
              />
            </Field>
            <Field label="Mother Name">
              <input
                value={form.motherName}
                onChange={(e) => set("motherName", e.target.value)}
                placeholder="Enter Mother Name"
                className={inputClass}
              />
            </Field>
          </div>

          {/* Surname | Mobile | Alternate | Email */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Surname">
              <input
                value={form.surname}
                onChange={(e) => set("surname", e.target.value)}
                placeholder="Enter Surname"
                className={inputClass}
              />
            </Field>
            <Field label="Mobile">
              <input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="Enter Mobile Number"
                className={inputClass}
              />
            </Field>
            <Field label="Alternate Mobile">
              <input
                value={form.alternateMobile}
                onChange={(e) => set("alternateMobile", e.target.value)}
                placeholder="Enter Alternate Mobile Number"
                className={inputClass}
              />
            </Field>
            <Field label="Email Address *">
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="Enter Email Address"
                className={inputClass}
              />
            </Field>
          </div>

          {/* DOB | Gender | Profile | Signature */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Date of Birth">
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => set("dateOfBirth", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Gender">
              <select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                className={inputClass}
              >
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Profile Image">
              <FilePick
                preview={profilePreview}
                inputRef={profileRef}
                icon={ImageIcon}
                onPick={(f) => readFile(f, "profile")}
                onClear={() => {
                  setProfilePreview(null);
                  if (profileRef.current) profileRef.current.value = "";
                }}
              />
            </Field>
            <Field label="Signature">
              <FilePick
                preview={signaturePreview}
                inputRef={signatureRef}
                icon={PenLine}
                onPick={(f) => readFile(f, "signature")}
                onClear={() => {
                  setSignaturePreview(null);
                  if (signatureRef.current) signatureRef.current.value = "";
                }}
              />
            </Field>
          </div>

          {/* Pincode | Password | Confirm | Admission */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Pincode">
              <input
                value={form.pincode}
                onChange={(e) => {
                  clearPincodeError();
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  set("pincode", v);
                  if (v.length === 6) fetchByPincode(v);
                }}
                placeholder="Pincode"
                className={inputClass}
              />
              {pincodeLoading && (
                <p className="mt-1 text-[10px] text-muted-foreground">Looking up area…</p>
              )}
              {pincodeError && <p className="mt-1 text-[10px] text-red-600">{pincodeError}</p>}
            </Field>
            <Field label="Password *">
              <input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Enter Password"
                className={inputClass}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm Password *">
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                placeholder="Confirm Password"
                className={inputClass}
                autoComplete="new-password"
              />
            </Field>
            <Field label="Admission Date">
              <input
                type="date"
                value={form.admissionDate}
                onChange={(e) => set("admissionDate", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Area">
              <input
                value={form.area}
                onChange={(e) => set("area", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="City">
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="State">
              <input
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Address">
            <textarea
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Enter your address"
              rows={3}
              className={cn(inputClass, "resize-y")}
            />
          </Field>

          <div className="rounded-2xl border border-[#1E4A85]/12 bg-slate-50/80 p-4">
            <p className={labelClass}>Show On Certificate</p>
            <div className="mt-2 flex flex-wrap gap-5">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-[#0B1F3A]">
                <input
                  type="checkbox"
                  checked={form.showFatherOnCertificate}
                  onChange={(e) => set("showFatherOnCertificate", e.target.checked)}
                  className="h-4 w-4 rounded border-[#1E4A85]/30 text-[#1E4A85] focus:ring-[#1E4A85]/30"
                />
                Father/Husband Name
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-[#0B1F3A]">
                <input
                  type="checkbox"
                  checked={form.showSurnameOnCertificate}
                  onChange={(e) => set("showSurnameOnCertificate", e.target.checked)}
                  className="h-4 w-4 rounded border-[#1E4A85]/30 text-[#1E4A85] focus:ring-[#1E4A85]/30"
                />
                Surname
              </label>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#163a6b] disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <User className="h-4 w-4" />
              )}
              Save student
            </button>
          </div>
        </div>
      )}
    </GlassModal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function FilePick({
  preview,
  inputRef,
  icon: Icon,
  onPick,
  onClear,
}: {
  preview: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  icon: typeof ImageIcon;
  onPick: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[#1E4A85]/25 bg-white px-3 py-2.5 text-left text-xs font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/5"
      >
        <Upload className="h-3.5 w-3.5 shrink-0" />
        {preview ? "Change file" : "Choose File"}
      </button>
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-[#1E4A85]/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-16 w-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white"
          >
            Remove
          </button>
        </div>
      ) : (
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Icon className="h-3 w-3" />
          No file chosen
        </p>
      )}
    </div>
  );
}
