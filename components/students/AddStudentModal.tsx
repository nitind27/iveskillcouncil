"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/common/GlassModal";
import { Loader2, ArrowRight, Check, GraduationCap, User, FileCheck } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { ROLES } from "@/lib/permissions";
import { usePincodeLookup } from "@/hooks/usePincodeLookup";

interface Franchise {
  id: string;
  name: string;
}

interface Course {
  id: string;
  name: string;
  baseFee: number;
}

const STEPS = [
  { id: 1, label: "Course", icon: GraduationCap },
  { id: 2, label: "Personal Info", icon: User },
  { id: 3, label: "Review & Submit", icon: FileCheck },
];

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddStudentModal({ open, onClose, onSuccess }: AddStudentModalProps) {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const isSubAdmin = roleId === ROLES.SUB_ADMIN;

  const [step, setStep] = useState(1);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingFranchises, setLoadingFranchises] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [franchiseName, setFranchiseName] = useState("");

  const [form, setForm] = useState({
    franchiseId: "",
    courseId: "",
    totalFee: "",
    fullName: "",
    email: "",
    phone: "",
    address: "",
    area: "",
    pincode: "",
    city: "",
    state: "",
    initialPayment: "",
    paymentMode: "CASH" as "CASH" | "UPI" | "CARD" | "BANK_TRANSFER",
    password: "Student@123",
    admissionDate: new Date().toISOString().split("T")[0],
  });

  const { fetchByPincode, loading: pincodeLoading, error: pincodeError, clearError: clearPincodeError } = usePincodeLookup((data) => {
    setForm((f) => ({ ...f, area: data.area, city: data.city, state: data.state }));
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setForm({
        franchiseId: isSubAdmin && user?.franchiseId ? String(user.franchiseId) : "",
        courseId: "",
        totalFee: "",
        fullName: "",
        email: "",
        phone: "",
        address: "",
        area: "",
        pincode: "",
        city: "",
        state: "",
        initialPayment: "",
        paymentMode: "CASH",
        password: "Student@123",
        admissionDate: new Date().toISOString().split("T")[0],
      });
      setFranchiseName("");
      setCourses([]);
    }
  }, [open, isSubAdmin, user?.franchiseId]);

  // Fetch franchises (Super Admin / Admin only)
  useEffect(() => {
    if (!open) return;
    if (!isSubAdmin) {
      setLoadingFranchises(true);
      fetch("/api/franchises?limit=200", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          const x = d.data ?? d;
          return Array.isArray(x) ? x : (x?.franchises ?? []);
        })
        .then((fl: Franchise[]) => setFranchises(Array.isArray(fl) ? fl : []))
        .catch(() => setFranchises([]))
        .finally(() => setLoadingFranchises(false));
    } else if (user?.franchiseId) {
      setForm((f) => ({ ...f, franchiseId: String(user.franchiseId) }));
    }
  }, [open, isSubAdmin, user?.franchiseId]);

  // Fetch courses when franchise is known
  useEffect(() => {
    if (!open) return;
    const fid = form.franchiseId;
    if (!fid) {
      setCourses([]);
      return;
    }
    setLoadingCourses(true);
    const url = isSubAdmin
      ? "/api/students/franchise-courses"
      : `/api/students/franchise-courses?franchiseId=${fid}`;
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const raw = d.data ?? d;
        if (raw && typeof raw === "object" && Array.isArray(raw.courses)) {
          setFranchiseName(raw.franchise?.name ?? "");
          return raw.courses;
        }
        return Array.isArray(raw) ? raw : [];
      })
      .then((cl: Course[]) => {
        setCourses(cl);
        if (cl.length) {
          setForm((f) => {
            const first = cl[0]!;
            const currentInList = cl.some((c) => String(c.id) === f.courseId);
            if (!currentInList) {
              return { ...f, courseId: first.id, totalFee: String(first.baseFee) };
            }
            return f;
          });
        } else {
          setForm((f) => ({ ...f, courseId: "", totalFee: "" }));
        }
      })
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, [open, form.franchiseId, isSubAdmin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (name === "courseId") {
      const c = courses.find((x) => String(x.id) === value);
      if (c) setForm((p) => ({ ...p, totalFee: String(c.baseFee) }));
    }
    if (name === "franchiseId") {
      setForm((p) => ({ ...p, courseId: "", totalFee: "" }));
    }
  };

  const canProceedStep1 = form.franchiseId && form.courseId && form.totalFee;
  const canProceedStep2 = form.fullName.trim() && form.email.trim();
  const canSubmit = canProceedStep1 && canProceedStep2;

  const validatePersonalInfo = () => {
    const nameR = validateName(form.fullName);
    const emailR = validateEmail(form.email);
    const phoneR = form.phone.trim() ? validatePhone(form.phone) : { valid: true };
    if (!nameR.valid) return nameR.error;
    if (!emailR.valid) return emailR.error;
    if (!phoneR.valid) return phoneR.error;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validatePersonalInfo();
    if (err) {
      await showError("Validation", err);
      return;
    }
    if (!canSubmit) {
      await showError("Validation", "Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password || "Student@123",
          franchiseId: form.franchiseId,
          courseId: form.courseId,
          totalFee: parseFloat(form.totalFee),
          admissionDate: form.admissionDate,
          address: form.address.trim() || undefined,
          area: form.area.trim() || undefined,
          pincode: form.pincode.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          initialPayment: form.initialPayment ? parseFloat(form.initialPayment) : undefined,
          paymentMode: form.initialPayment ? form.paymentMode : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        await showError("Add Student Failed", data.error || data.message || "Failed to add student");
        return;
      }
      await showSuccess("Success", "Student added successfully");
      onClose();
      onSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to add student";
      await showError("Add Student Failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";
  const labelClass = "block text-sm font-medium text-foreground mb-1";

  const displayFranchiseName =
    isSubAdmin ? franchiseName || "Your Franchise" : franchises.find((f) => f.id === form.franchiseId)?.name ?? "";

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title="Add Student"
      size="lg"
      closeOnOverlayClick={!submitting}
      closeOnEscape={!submitting}
    >
      <div className="space-y-4">
        {/* Step indicator */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 min-w-0">
              <div
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs sm:text-sm truncate ${
                  step === s.id ? "bg-primary text-primary-foreground" : step > s.id ? "bg-primary/20" : "bg-muted"
                }`}
              >
                <s.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium truncate">{s.label}</span>
                {step > s.id && <Check className="w-3.5 h-3.5 shrink-0" />}
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-0.5 mx-0.5 bg-border min-w-[8px]" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Select Course</h3>
              {!isSubAdmin && (
                <div>
                  <label className={labelClass}>Franchise *</label>
                  <select
                    name="franchiseId"
                    value={form.franchiseId}
                    onChange={handleChange}
                    className={inputClass}
                    required
                    disabled={loadingFranchises}
                  >
                    <option value="">Select franchise</option>
                    {franchises.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                  {loadingFranchises && <p className="text-xs text-muted-foreground mt-1">Loading...</p>}
                </div>
              )}
              {isSubAdmin && form.franchiseId && (
                <div>
                  <label className={labelClass}>Franchise</label>
                  <input
                    type="text"
                    value={displayFranchiseName}
                    readOnly
                    className={inputClass + " bg-muted cursor-not-allowed"}
                  />
                </div>
              )}
              <div>
                <label className={labelClass}>Course *</label>
                <select
                  name="courseId"
                  value={form.courseId}
                  onChange={handleChange}
                  className={inputClass}
                  required
                  disabled={!form.franchiseId || loadingCourses}
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (₹{Number(c.baseFee).toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
                {loadingCourses && <p className="text-xs text-muted-foreground mt-1">Loading...</p>}
                {form.franchiseId && !loadingCourses && courses.length === 0 && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                    No courses assigned. Add courses in Franchise Courses first.
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>Total Fee (₹) *</label>
                <input
                  type="number"
                  name="totalFee"
                  value={form.totalFee}
                  onChange={handleChange}
                  className={inputClass}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Personal Information</h3>
              <div>
                <label className={labelClass}>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Full name (min 2 characters)"
                  maxLength={150}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. name@example.com"
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. 9876543210" maxLength={14} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input type="text" name="address" value={form.address} onChange={handleChange} placeholder="House no., Street, Landmark" maxLength={500} className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Pincode</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="pincode"
                      value={form.pincode}
                      onChange={(e) => {
                        handleChange(e);
                        clearPincodeError();
                      }}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => fetchByPincode(form.pincode)}
                      disabled={form.pincode.length !== 6 || pincodeLoading}
                      className="px-3 py-2 rounded-lg border border-border bg-muted hover:bg-muted/80 text-sm shrink-0 disabled:opacity-50"
                    >
                      {pincodeLoading ? "..." : "Lookup"}
                    </button>
                  </div>
                  {pincodeError && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">{pincodeError}</p>}
                </div>
                <div>
                  <label className={labelClass}>Area</label>
                  <input type="text" name="area" value={form.area} onChange={handleChange} placeholder="Area / Block" maxLength={150} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>City</label>
                  <input type="text" name="city" value={form.city} onChange={handleChange} placeholder="City / District" maxLength={100} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input type="text" name="state" value={form.state} onChange={handleChange} placeholder="State" maxLength={100} className={inputClass} />
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const err = validatePersonalInfo();
                    if (err) { showError("Validation", err); return; }
                    setStep(3);
                  }}
                  disabled={!canProceedStep2}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Review & Submit</h3>
              <div className="rounded-lg border border-border p-4 space-y-2 bg-muted/30 text-sm">
                <p><span className="text-muted-foreground">Franchise:</span> {displayFranchiseName || form.franchiseId}</p>
                <p><span className="text-muted-foreground">Course:</span> {courses.find((c) => c.id === form.courseId)?.name}</p>
                <p><span className="text-muted-foreground">Total Fee:</span> ₹{form.totalFee}</p>
                <p><span className="text-muted-foreground">Name:</span> {form.fullName}</p>
                <p><span className="text-muted-foreground">Email:</span> {form.email}</p>
                {form.phone && <p><span className="text-muted-foreground">Phone:</span> {form.phone}</p>}
                {(form.address || form.area || form.pincode || form.city || form.state) && (
                  <p><span className="text-muted-foreground">Address:</span> {[form.address, form.area, form.city, form.state, form.pincode].filter(Boolean).join(", ")}</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>First-time Payment (₹)</label>
                  <input
                    type="number"
                    name="initialPayment"
                    value={form.initialPayment}
                    onChange={handleChange}
                    className={inputClass}
                    min="0"
                    max={form.totalFee ? parseFloat(form.totalFee) : undefined}
                    step="0.01"
                    placeholder="Optional – amount paid at admission"
                  />
                </div>
                {form.initialPayment && parseFloat(form.initialPayment) > 0 && (
                  <div>
                    <label className={labelClass}>Payment Mode</label>
                    <select name="paymentMode" value={form.paymentMode} onChange={handleChange} className={inputClass}>
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Password (default: Student@123)</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Admission Date</label>
                <input
                  type="date"
                  name="admissionDate"
                  value={form.admissionDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Student"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </GlassModal>
  );
}
