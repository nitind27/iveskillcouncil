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
  Mail,
  Phone,
  Calendar,
  Building2,
  BookOpen,
  MapPin,
  IndianRupee,
  Lock,
  Trash2,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { ROLES } from "@/lib/permissions";
import { usePincodeLookup } from "@/hooks/usePincodeLookup";
import { cn } from "@/lib/utils";

interface FranchiseOption {
  id: string;
  name: string;
  code?: string;
}

interface CourseOption {
  id: string;
  name: string;
  baseFee?: number;
  type?: string;
  durationMonths?: number;
}

interface EditStudentModalProps {
  studentId: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: (student: { id: string; studentCode: string; fullName: string }) => void;
}

type TabType = "personal" | "contact" | "course" | "address" | "media";

const labelClass = "mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#1E4A85]";
const inputClass =
  "w-full rounded-xl border border-[#1E4A85]/15 bg-white px-3.5 py-2.5 text-sm text-[#0B1F3A] outline-none transition placeholder:text-slate-400 focus:border-[#1E4A85]/40 focus:ring-2 focus:ring-[#1E4A85]/12 disabled:bg-slate-50 disabled:text-slate-500";

export function EditStudentModal({
  studentId,
  open,
  onClose,
  onSuccess,
}: EditStudentModalProps) {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const isSuperOrAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  const [activeTab, setActiveTab] = useState<TabType>("personal");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Franchise & course lists
  const [franchises, setFranchises] = useState<FranchiseOption[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Core identifiers
  const [studentCode, setStudentCode] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");

  // Form state
  const [franchiseId, setFranchiseId] = useState("");
  const [franchiseName, setFranchiseName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [relationship, setRelationship] = useState("FATHER");
  const [fatherHusbandName, setFatherHusbandName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [admissionDate, setAdmissionDate] = useState("");

  // Contact & account
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [alternateMobile, setAlternateMobile] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [userStatus, setUserStatus] = useState("ACTIVE");
  const [newPassword, setNewPassword] = useState("");

  // Course & Fees
  const [courseId, setCourseId] = useState("");
  const [totalFee, setTotalFee] = useState<number | string>(0);
  const [paidFee, setPaidFee] = useState<number>(0);

  // Address
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Media & Certificates
  const [showFatherOnCertificate, setShowFatherOnCertificate] = useState(true);
  const [showSurnameOnCertificate, setShowSurnameOnCertificate] = useState(true);
  const [currentProfileUrl, setCurrentProfileUrl] = useState<string | null>(null);
  const [currentSignatureUrl, setCurrentSignatureUrl] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [removeProfile, setRemoveProfile] = useState(false);
  const [removeSignature, setRemoveSignature] = useState(false);

  const profileRef = useRef<HTMLInputElement>(null);
  const signatureRef = useRef<HTMLInputElement>(null);

  const { fetchByPincode, loading: pincodeLoading, error: pincodeError, clearError: clearPincodeError } =
    usePincodeLookup((data) => {
      setArea(data.area);
      setCity(data.city);
      setState(data.state);
    });

  // Load franchises if admin
  useEffect(() => {
    if (!open || !isSuperOrAdmin) return;
    fetch("/api/franchises?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const list = d.data ?? d;
        const arr = Array.isArray(list) ? list : list?.franchises ?? [];
        setFranchises(
          arr.map((f: { id: string | number; name: string; code?: string }) => ({
            id: String(f.id),
            name: f.name,
            code: f.code,
          }))
        );
      })
      .catch(() => setFranchises([]));
  }, [open, isSuperOrAdmin]);

  // Load courses whenever franchiseId changes
  useEffect(() => {
    if (!open) return;
    const fid = franchiseId || user?.franchiseId;
    if (!fid) {
      // Load standard catalog
      fetch("/api/courses?limit=150", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          const list = Array.isArray(d) ? d : d.data ?? [];
          setCourses(
            list.map((c: { id: string | number; name: string; baseFee?: number; type?: string; durationMonths?: number }) => ({
              id: String(c.id),
              name: c.name,
              baseFee: c.baseFee ? Number(c.baseFee) : undefined,
              type: c.type,
              durationMonths: c.durationMonths,
            }))
          );
        })
        .catch(() => setCourses([]));
      return;
    }

    setLoadingCourses(true);
    const url = isSuperOrAdmin
      ? `/api/students/franchise-courses?franchiseId=${fid}`
      : "/api/students/franchise-courses";

    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then(async (d) => {
        if (d.success && d.data?.courses) {
          setCourses(
            d.data.courses.map((c: { id: string; name: string; baseFee?: number; type?: string; durationMonths?: number }) => ({
              id: String(c.id),
              name: c.name,
              baseFee: c.baseFee,
              type: c.type,
              durationMonths: c.durationMonths,
            }))
          );
        } else {
          // Fallback to all courses
          const res = await fetch("/api/courses?limit=150", { credentials: "include" });
          const cd = await res.json();
          const list = Array.isArray(cd) ? cd : cd.data ?? [];
          setCourses(
            list.map((c: { id: string | number; name: string; baseFee?: number; type?: string }) => ({
              id: String(c.id),
              name: c.name,
              baseFee: c.baseFee ? Number(c.baseFee) : undefined,
              type: c.type,
            }))
          );
        }
      })
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, [open, franchiseId, isSuperOrAdmin, user?.franchiseId]);

  // Load student data
  useEffect(() => {
    if (!open || !studentId) {
      setLoadError(null);
      return;
    }

    setLoading(true);
    setLoadError(null);
    setActiveTab("personal");
    setProfilePreview(null);
    setSignaturePreview(null);
    setRemoveProfile(false);
    setRemoveSignature(false);
    setNewPassword("");

    fetch(`/api/students/${studentId}`, { credentials: "include" })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Failed to load student details");
        const s = json.data;

        setStudentCode(s.studentCode || "");
        setFranchiseId(s.franchiseId ? String(s.franchiseId) : "");
        setFranchiseName(s.franchiseName || "");
        setFirstName(s.firstName || "");
        setSurname(s.surname || "");
        setRelationship(s.relationship || "FATHER");
        setFatherHusbandName(s.fatherHusbandName || "");
        setMotherName(s.motherName || "");
        setGender(s.gender || "");
        setDateOfBirth(s.dateOfBirth || "");
        setAdmissionDate(s.admissionDate || "");

        setEmail(s.email || "");
        setOriginalEmail(s.email || "");
        setPhone(s.phone || "");
        setOriginalPhone(s.phone || "");
        setAlternateMobile(s.alternateMobile || "");
        setStatus(s.status || "ACTIVE");
        setUserStatus(s.userStatus || "ACTIVE");

        setCourseId(s.courseId ? String(s.courseId) : "");
        setTotalFee(Number(s.totalFee || 0));
        setPaidFee(Number(s.paidFee || 0));

        setAddress(s.address || "");
        setArea(s.area || "");
        setPincode(s.pincode || "");
        setCity(s.city || "");
        setState(s.state || "");

        setShowFatherOnCertificate(s.showFatherOnCertificate ?? true);
        setShowSurnameOnCertificate(s.showSurnameOnCertificate ?? true);
        setCurrentProfileUrl(s.profileImageUrl || null);
        setCurrentSignatureUrl(s.signatureUrl || null);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : "Failed to load student");
      })
      .finally(() => setLoading(false));
  }, [open, studentId]);

  const handleImageFile = (file: File, kind: "profile" | "signature") => {
    if (!file.type.startsWith("image/")) {
      showError("Invalid file", "Please select an image file (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError("File too large", "Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      if (kind === "profile") {
        setProfilePreview(url);
        setRemoveProfile(false);
      } else {
        setSignaturePreview(url);
        setRemoveSignature(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCourseChange = (newCid: string) => {
    setCourseId(newCid);
    if (!newCid) return;
    const found = courses.find((c) => c.id === newCid);
    if (found?.baseFee != null && (Number(totalFee) === 0 || Number(totalFee) < Number(found.baseFee))) {
      setTotalFee(found.baseFee);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!studentId) return;

    const trimmedFirst = firstName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFirst) {
      setActiveTab("personal");
      await showError("First Name", "First name is required");
      return;
    }
    const nameV = validateName(trimmedFirst);
    if (!nameV.valid) {
      setActiveTab("personal");
      await showError("First Name", nameV.error!);
      return;
    }

    if (!trimmedEmail) {
      setActiveTab("contact");
      await showError("Email", "Email address is required");
      return;
    }
    const emailV = validateEmail(trimmedEmail);
    if (!emailV.valid) {
      setActiveTab("contact");
      await showError("Email", emailV.error!);
      return;
    }

    if (trimmedPhone) {
      const phoneV = validatePhone(trimmedPhone);
      if (!phoneV.valid) {
        setActiveTab("contact");
        await showError("Mobile", phoneV.error!);
        return;
      }
    }

    const numTotal = Number(totalFee);
    if (!Number.isFinite(numTotal) || numTotal < 0) {
      setActiveTab("course");
      await showError("Total Fee", "Please enter a valid total fee");
      return;
    }
    if (numTotal < paidFee) {
      setActiveTab("course");
      await showError(
        "Total Fee Error",
        `Total fee cannot be less than already paid amount (₹${paidFee.toLocaleString("en-IN")})`
      );
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setActiveTab("contact");
      await showError("Password", "New password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        firstName: trimmedFirst,
        surname: surname.trim() || null,
        relationship: relationship || null,
        fatherHusbandName: fatherHusbandName.trim() || null,
        motherName: motherName.trim() || null,
        gender: gender || null,
        dateOfBirth: dateOfBirth || null,
        admissionDate: admissionDate || undefined,

        email: trimmedEmail,
        phone: trimmedPhone || null,
        alternateMobile: alternateMobile.trim() || null,
        status,
        userStatus,

        courseId: courseId || null,
        totalFee: numTotal,

        address: address.trim() || null,
        area: area.trim() || null,
        pincode: pincode.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,

        showFatherOnCertificate,
        showSurnameOnCertificate,
      };

      if (isSuperOrAdmin && franchiseId) {
        payload.franchiseId = franchiseId;
      }

      if (newPassword.trim()) {
        payload.newPassword = newPassword.trim();
      }

      if (removeProfile) {
        payload.removeProfileImage = true;
      } else if (profilePreview) {
        payload.profileImageBase64 = profilePreview;
      }

      if (removeSignature) {
        payload.removeSignature = true;
      } else if (signaturePreview) {
        payload.signatureBase64 = signaturePreview;
      }

      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        await showError("Failed to update", json.error || "Could not save changes");
        return;
      }

      const updatedFullName = [trimmedFirst, surname.trim()].filter(Boolean).join(" ");
      await showSuccess(
        "Student Updated",
        `${updatedFullName} (${studentCode}) details have been saved successfully.`
      );

      onSuccess?.({
        id: studentId,
        studentCode,
        fullName: updatedFullName,
      });
      onClose();
    } catch (err) {
      console.error("Student edit submit error:", err);
      await showError("Error", "An unexpected error occurred while saving student");
    } finally {
      setSubmitting(false);
    }
  };

  const computedPending = Math.max(0, Number(totalFee || 0) - paidFee);

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title={`Edit Student: ${firstName ? `${firstName} ${surname}`.trim() : studentCode || "Student"}`}
      size="2xl"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#1E4A85]" />
          <p className="mt-3 text-sm font-semibold text-slate-600">Loading student details...</p>
        </div>
      ) : loadError ? (
        <div className="space-y-4 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <p className="text-base font-bold text-red-800">{loadError}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Header Sub-bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#1E4A85]/12 bg-gradient-to-r from-[#1E4A85]/8 via-[#C4A35A]/8 to-transparent px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1E4A85] text-white">
                <User className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-500">Unique Student Code</p>
                <p className="font-mono text-sm font-black text-[#1E4A85]">{studentCode || "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                <Building2 className="h-3.5 w-3.5 text-[#1E4A85]" />
                {franchiseName || "No franchise"}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
                  status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-800"
                    : status === "COMPLETED"
                    ? "bg-[#1E4A85]/10 text-[#1E4A85]"
                    : "bg-red-100 text-red-700"
                )}
              >
                {status}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-[#1E4A85]/10 pb-2">
            {[
              { id: "personal", label: "1. Personal", icon: User },
              { id: "contact", label: "2. Contact & Account", icon: Mail },
              { id: "course", label: "3. Course & Fees", icon: BookOpen },
              { id: "address", label: "4. Address", icon: MapPin },
              { id: "media", label: "5. Photo & Certificate", icon: FileCheck2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition",
                    isActive
                      ? "bg-[#1E4A85] text-white shadow-sm"
                      : "bg-[#1E4A85]/5 text-slate-600 hover:bg-[#1E4A85]/10 hover:text-[#1E4A85]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Personal Info */}
          {activeTab === "personal" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Rahul"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Surname / Last Name</label>
                  <input
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="e.g. Sharma"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Relationship</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className={inputClass}
                  >
                    <option value="FATHER">Father</option>
                    <option value="HUSBAND">Husband</option>
                    <option value="GUARDIAN">Guardian</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Father / Husband / Guardian Name</label>
                  <input
                    type="text"
                    value={fatherHusbandName}
                    onChange={(e) => setFatherHusbandName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Mother Name</label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="e.g. Sunita Sharma"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Admission Date</label>
                  <input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Contact & Account */}
          {activeTab === "contact" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      className={cn(inputClass, "pl-9")}
                      required
                    />
                    <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                  {originalEmail !== email && (
                    <p className="mt-1 text-[11px] font-semibold text-amber-600">
                      Changing email will update student's login ID.
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Mobile / Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10 digit number"
                      maxLength={15}
                      className={cn(inputClass, "pl-9")}
                    />
                    <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Alternate Mobile</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={alternateMobile}
                      onChange={(e) => setAlternateMobile(e.target.value)}
                      placeholder="Alternate number"
                      maxLength={15}
                      className={cn(inputClass, "pl-9")}
                    />
                    <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Student Academic Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={inputClass}
                  >
                    <option value="ACTIVE">ACTIVE (Enrolled & Studying)</option>
                    <option value="COMPLETED">COMPLETED (Course Finished)</option>
                    <option value="DROPPED">DROPPED (Discontinued)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>User Login Account Status</label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value)}
                    className={inputClass}
                  >
                    <option value="ACTIVE">ACTIVE (Can log into portal)</option>
                    <option value="INACTIVE">INACTIVE (Temporarily disabled)</option>
                    <option value="SUSPENDED">SUSPENDED (Access blocked)</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Reset Password <span className="font-normal lowercase text-slate-400">(optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Leave blank to keep existing password"
                      className={cn(inputClass, "pl-9")}
                      minLength={6}
                    />
                    <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Enter only if student forgot their password or needs reset (min 6 characters).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Course & Fees */}
          {activeTab === "course" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              {isSuperOrAdmin && (
                <div>
                  <label className={labelClass}>Assigned Franchise</label>
                  <select
                    value={franchiseId}
                    onChange={(e) => setFranchiseId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select Franchise</option>
                    {franchises.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} {f.code ? `(${f.code})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Super Admin / Admin can transfer student to another franchise if needed.
                  </p>
                </div>
              )}

              <div>
                <label className={labelClass}>Enrolled Course</label>
                <div className="relative">
                  <select
                    value={courseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className={cn(inputClass, "pl-9")}
                  >
                    <option value="">— No Course Assigned (Unassigned) —</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.type ? `[${c.type}]` : ""} {c.baseFee != null ? `(₹${c.baseFee})` : ""}
                      </option>
                    ))}
                  </select>
                  <BookOpen className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#C4A35A]" />
                </div>
                {loadingCourses && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading courses for franchise...
                  </p>
                )}
              </div>

              {/* Fee Management Card */}
              <div className="rounded-2xl border border-[#C4A35A]/30 bg-gradient-to-br from-[#C4A35A]/10 to-[#1E4A85]/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#8B6914]">
                    <IndianRupee className="h-4 w-4" />
                    Fee Breakdown & Due Status
                  </p>
                  <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                    Paid: ₹{paidFee.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Total Agreed Course Fee (₹)</label>
                    <input
                      type="number"
                      min={paidFee}
                      step="1"
                      value={totalFee}
                      onChange={(e) => setTotalFee(e.target.value)}
                      className={inputClass}
                      required
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Cannot be set lower than already collected amount (₹{paidFee.toLocaleString("en-IN")}).
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>Remaining Pending Balance</label>
                    <div className="flex h-[42px] items-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-bold">
                      <span className={computedPending > 0 ? "text-amber-700" : "text-emerald-700"}>
                        ₹{computedPending.toLocaleString("en-IN")}
                      </span>
                      <span className="ml-auto text-xs font-normal text-slate-500">
                        {computedPending === 0 ? "Fully paid" : "Payment pending"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Address */}
          {activeTab === "address" && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Pincode</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => {
                        clearPincodeError();
                        const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setPincode(v);
                        if (v.length === 6) fetchByPincode(v);
                      }}
                      placeholder="6-digit PIN code"
                      maxLength={6}
                      className={cn(inputClass, "pl-9")}
                    />
                    <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                  {pincodeLoading && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                      <Loader2 className="h-3 w-3 animate-spin" /> Looking up city & state...
                    </p>
                  )}
                  {pincodeError && (
                    <p className="mt-1 text-[11px] text-red-600">{pincodeError}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Area / Locality</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Near Bus Stand, Gandhi Road"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>City / District</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Surat"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Gujarat"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Street Address / Flat / Building</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter full residential address line"
                  rows={3}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Tab 5: Media & Certificate */}
          {activeTab === "media" && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              {/* Photo & Signature Uploads */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Profile Photo */}
                <div className="rounded-2xl border border-[#1E4A85]/15 bg-[#1E4A85]/[0.02] p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                    <ImageIcon className="h-4 w-4" />
                    Student Photo
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                      {profilePreview ? (
                        <img src={profilePreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : !removeProfile && currentProfileUrl ? (
                        <img src={currentProfileUrl} alt="Student" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-8 w-8 text-slate-300" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => profileRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#1E4A85]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/5"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {profilePreview || (!removeProfile && currentProfileUrl) ? "Replace photo" : "Upload photo"}
                      </button>
                      <input
                        ref={profileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageFile(f, "profile");
                        }}
                      />
                      {(profilePreview || (!removeProfile && currentProfileUrl)) && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfilePreview(null);
                            setRemoveProfile(true);
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove photo
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400">JPG, PNG under 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="rounded-2xl border border-[#1E4A85]/15 bg-[#1E4A85]/[0.02] p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                    <PenLine className="h-4 w-4" />
                    Student Signature
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1">
                      {signaturePreview ? (
                        <img src={signaturePreview} alt="Signature Preview" className="h-full w-full object-contain" />
                      ) : !removeSignature && currentSignatureUrl ? (
                        <img src={currentSignatureUrl} alt="Signature" className="h-full w-full object-contain" />
                      ) : (
                        <PenLine className="h-6 w-6 text-slate-300" />
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => signatureRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#1E4A85]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/5"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {signaturePreview || (!removeSignature && currentSignatureUrl) ? "Replace signature" : "Upload signature"}
                      </button>
                      <input
                        ref={signatureRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageFile(f, "signature");
                        }}
                      />
                      {(signaturePreview || (!removeSignature && currentSignatureUrl)) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSignaturePreview(null);
                            setRemoveSignature(true);
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove signature
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400">Clear sign image</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Certificate Options */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
                  Certificate Print Preferences
                </p>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Print Father / Husband Name</p>
                      <p className="text-xs text-slate-500">
                        Include D/S/O or W/O line on the official printed certificate
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showFatherOnCertificate}
                      onChange={(e) => setShowFatherOnCertificate(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-[#1E4A85] focus:ring-[#1E4A85]"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Print Surname on Certificate</p>
                      <p className="text-xs text-slate-500">
                        Show full name with last name on certificate title
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={showSurnameOnCertificate}
                      onChange={(e) => setShowSurnameOnCertificate(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-[#1E4A85] focus:ring-[#1E4A85]"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#1E4A85]/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== "personal" && (
                <button
                  type="button"
                  onClick={() => {
                    const tabs: TabType[] = ["personal", "contact", "course", "address", "media"];
                    const idx = tabs.indexOf(activeTab);
                    if (idx > 0) setActiveTab(tabs[idx - 1]);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Previous
                </button>
              )}
              {activeTab !== "media" ? (
                <button
                  type="button"
                  onClick={() => {
                    const tabs: TabType[] = ["personal", "contact", "course", "address", "media"];
                    const idx = tabs.indexOf(activeTab);
                    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
                  }}
                  className="rounded-xl bg-[#1E4A85]/10 px-4 py-2.5 text-xs font-bold text-[#1E4A85] hover:bg-[#1E4A85]/20"
                >
                  Next: {activeTab === "personal" ? "Contact" : activeTab === "contact" ? "Course" : activeTab === "course" ? "Address" : "Media"}
                </button>
              ) : null}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[#1E4A85]/20 transition hover:bg-[#163A6B] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Save All Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </GlassModal>
  );
}
