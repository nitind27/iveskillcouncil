"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase,
  FiUpload, FiCheckCircle, FiArrowRight, FiArrowLeft,
  FiX, FiFile, FiLoader, FiAlertCircle,
} from "react-icons/fi";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";

// ── Document types required ──────────────────────────────────────────────────
const INDIVIDUAL_DOCS = [
  { key: "pan",          label: "PAN Card",           required: true,  accept: "image/*,.pdf" },
  { key: "aadhar",       label: "Aadhar Card",         required: true,  accept: "image/*,.pdf" },
  { key: "photo",        label: "Applicant Photo",     required: true,  accept: "image/*" },
  { key: "signature",    label: "Signature",           required: true,  accept: "image/*" },
  { key: "logo",         label: "Institute Logo",      required: false, accept: "image/*" },
  { key: "centre_photo", label: "Centre Photo",        required: false, accept: "image/*" },
];

const ENTITY_DOCS = [
  { key: "pan",          label: "PAN Card",                    required: true,  accept: "image/*,.pdf" },
  { key: "aadhar",       label: "Aadhar (Key Personnel)",      required: true,  accept: "image/*,.pdf" },
  { key: "photo",        label: "Applicant Photo",             required: true,  accept: "image/*" },
  { key: "signature",    label: "Signature",                   required: true,  accept: "image/*" },
  { key: "logo",         label: "Institute Logo",              required: false, accept: "image/*" },
  { key: "centre_photo", label: "Centre Photo",                required: false, accept: "image/*" },
  { key: "udyam",        label: "Udyam Registration",          required: false, accept: "image/*,.pdf" },
  { key: "entity_reg",   label: "Entity Registration + GST",   required: false, accept: "image/*,.pdf" },
  { key: "bank",         label: "Bank Passbook / Cheque",      required: false, accept: "image/*,.pdf" },
  { key: "stamp",        label: "Institute Stamp",             required: false, accept: "image/*" },
];

interface UploadedDoc { key: string; url: string; name: string; type: string; label: string; }

const STEPS = ["Personal Info", "Business Info", "Documents", "Review & Submit"];

const inputCls = "w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white focus:border-[#2D5DA8] focus:ring-2 focus:ring-[#2D5DA8]/15 outline-none transition-all text-sm text-[#1A1A1A] placeholder-[#9CA3AF]";
const labelCls = "block text-sm font-semibold text-[#374151] mb-1.5";

export default function ApplyFranchisePage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Personal
  const [fullName,       setFullName]       = useState("");
  const [email,          setEmail]          = useState("");
  const [phone,          setPhone]          = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");

  // Step 2 — Business
  const [instituteName, setInstituteName] = useState("");
  const [businessType,  setBusinessType]  = useState("INDIVIDUAL");
  const [address,       setAddress]       = useState("");
  const [city,          setCity]          = useState("");
  const [stateName,     setStateName]     = useState("");
  const [pincode,       setPincode]       = useState("");
  const [message,       setMessage]       = useState("");

  // Step 3 — Documents
  const [docs,         setDocs]         = useState<UploadedDoc[]>([]);
  const [uploading,    setUploading]    = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const docList = businessType === "INDIVIDUAL" ? INDIVIDUAL_DOCS : ENTITY_DOCS;

  const uploadDoc = async (key: string, label: string, file: File) => {
    setUploading(key);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("docType", key);
      const res = await fetch("/api/franchise-application/upload-doc", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || "Upload failed"); return; }
      setDocs((prev) => {
        const filtered = prev.filter((d) => d.key !== key);
        return [...filtered, { key, url: data.data.url, name: file.name, type: file.type, label }];
      });
      setError("");
    } catch { setError("Upload failed. Please try again."); }
    finally { setUploading(null); }
  };

  const removeDoc = (key: string) => {
    setDocs((prev) => prev.filter((d) => d.key !== key));
    if (fileRefs.current[key]) fileRefs.current[key]!.value = "";
  };

  const validateStep = (): string | null => {
    if (step === 0) {
      const nr = validateName(fullName);   if (!nr.valid)  return nr.error!;
      const er = validateEmail(email);     if (!er.valid)  return er.error!;
      const pr = validatePhone(phone);     if (!pr.valid)  return pr.error!;
    }
    if (step === 1) {
      if (!instituteName.trim()) return "Institute name is required";
      if (!address.trim() || !city.trim() || !stateName.trim() || !pincode.trim()) return "Complete address is required";
    }
    if (step === 2) {
      const required = docList.filter((d) => d.required);
      const missing  = required.filter((d) => !docs.find((u) => u.key === d.key));
      if (missing.length) return `Required documents missing: ${missing.map((d) => d.label).join(", ")}`;
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/franchise-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(), email: email.trim(), phone: phone.trim(),
          alternatePhone: alternatePhone.trim() || undefined,
          instituteName: instituteName.trim(), businessType,
          address: address.trim(), city: city.trim(), state: stateName.trim(), pincode: pincode.trim(),
          message: message.trim() || undefined,
          documents: docs,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || "Submission failed"); setSubmitting(false); return; }
      setSubmitted(true);
    } catch { setError("Network error. Please try again."); setSubmitting(false); }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-16">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#E5E7EB] p-10 text-center">
          <div className="w-20 h-20 rounded-full bg-[#A8C63A]/15 flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="w-10 h-10 text-[#A8C63A]" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-3">Application Submitted!</h2>
          <p className="text-[#6B7280] mb-2">Thank you, <strong>{fullName}</strong>.</p>
          <p className="text-[#6B7280] text-sm mb-8">Our team will review your application and contact you at <strong>{email}</strong> within 2–3 business days.</p>
          <Link href="/userpanel">
            <motion.span whileHover={{ scale: 1.03 }} className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#2D5DA8] text-white font-bold hover:bg-[#1E4A85] transition-all cursor-pointer">
              Back to Home <FiArrowRight className="w-4 h-4" />
            </motion.span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-[#2D5DA8] via-[#1E4A85] to-[#1a3d70] py-14 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(168,198,58,0.12),transparent)]" />
        <div className="absolute -bottom-1 left-0 right-0 h-10 bg-[#F8FAFC]" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto text-center relative">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-sm font-semibold uppercase tracking-wider mb-4">
            <FiBriefcase className="w-4 h-4 text-[#A8C63A]" /> Franchise Application
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">Apply for a Franchise</h1>
          <p className="text-white/70">Fill in your details and upload KYC documents. We&apos;ll review and get back to you.</p>
        </motion.div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#E5E7EB] -z-10" />
          <div className="absolute top-4 left-0 h-0.5 bg-[#2D5DA8] -z-10 transition-all duration-500" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                i < step ? "bg-[#A8C63A] border-[#A8C63A] text-white" :
                i === step ? "bg-[#2D5DA8] border-[#2D5DA8] text-white" :
                "bg-white border-[#E5E7EB] text-[#9CA3AF]"
              }`}>
                {i < step ? <FiCheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-semibold hidden sm:block ${i === step ? "text-[#2D5DA8]" : "text-[#9CA3AF]"}`}>{s}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-3xl border border-[#E5E7EB] shadow-lg p-8"
          >
            {/* ── STEP 0: Personal Info ── */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-xl font-extrabold text-[#1A1A1A] mb-6">Personal Information</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                    <div className="relative"><FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className={`${inputCls} pl-10`} /></div>
                  </div>
                  <div>
                    <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                    <div className="relative"><FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={`${inputCls} pl-10`} /></div>
                  </div>
                  <div>
                    <label className={labelCls}>Phone <span className="text-red-500">*</span></label>
                    <div className="relative"><FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className={`${inputCls} pl-10`} /></div>
                  </div>
                  <div>
                    <label className={labelCls}>Alternate Phone</label>
                    <div className="relative"><FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input type="tel" value={alternatePhone} onChange={(e) => setAlternatePhone(e.target.value)} placeholder="Optional" className={`${inputCls} pl-10`} /></div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 1: Business Info ── */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl font-extrabold text-[#1A1A1A] mb-6">Business Information</h2>
                <div>
                  <label className={labelCls}>Institute / Centre Name <span className="text-red-500">*</span></label>
                  <input type="text" value={instituteName} onChange={(e) => setInstituteName(e.target.value)} placeholder="e.g. Nitin Institute of Technology" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Business Type <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ v: "INDIVIDUAL", l: "Individual / Proprietor" }, { v: "ENTITY", l: "Registered Entity (Pvt/LLP/Trust)" }].map(({ v, l }) => (
                      <button key={v} type="button" onClick={() => setBusinessType(v)}
                        className={`p-4 rounded-2xl border-2 text-sm font-semibold text-left transition-all ${businessType === v ? "border-[#2D5DA8] bg-[#2D5DA8]/05 text-[#2D5DA8]" : "border-[#E5E7EB] text-[#374151] hover:border-[#2D5DA8]/40"}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Address <span className="text-red-500">*</span></label>
                  <div className="relative"><FiMapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9CA3AF]" />
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Street, Area" className={`${inputCls} pl-10 resize-none`} /></div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div><label className={labelCls}>City <span className="text-red-500">*</span></label><input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" className={inputCls} /></div>
                  <div><label className={labelCls}>State <span className="text-red-500">*</span></label><input type="text" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="Maharashtra" className={inputCls} /></div>
                  <div><label className={labelCls}>Pincode <span className="text-red-500">*</span></label><input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="400001" className={inputCls} /></div>
                </div>
                <div>
                  <label className={labelCls}>Message (Optional)</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="Any additional information..." className={`${inputCls} resize-none`} />
                </div>
              </div>
            )}

            {/* ── STEP 2: Documents ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-extrabold text-[#1A1A1A]">KYC Documents</h2>
                  <p className="text-sm text-[#6B7280] mt-1">Upload required documents. Accepted: JPG, PNG, PDF (max 5MB each).</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {docList.map((doc) => {
                    const uploaded = docs.find((d) => d.key === doc.key);
                    const isUploading = uploading === doc.key;
                    return (
                      <div key={doc.key} className={`relative rounded-2xl border-2 p-4 transition-all ${uploaded ? "border-[#A8C63A] bg-[#A8C63A]/05" : "border-[#E5E7EB] bg-white hover:border-[#2D5DA8]/30"}`}>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <p className="text-sm font-semibold text-[#1A1A1A]">{doc.label}</p>
                            {doc.required && <span className="text-[10px] text-red-500 font-bold uppercase">Required</span>}
                          </div>
                          {uploaded && (
                            <button onClick={() => removeDoc(doc.key)} className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200 transition-colors flex-shrink-0">
                              <FiX className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {uploaded ? (
                          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                            <FiFile className="w-4 h-4 text-[#A8C63A]" />
                            <span className="truncate">{uploaded.name}</span>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="file"
                              accept={doc.accept}
                              className="hidden"
                              ref={(el) => { fileRefs.current[doc.key] = el; }}
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDoc(doc.key, doc.label, f); }}
                            />
                            <span className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isUploading ? "bg-[#EEF2F7] text-[#6B7280]" : "bg-[#2D5DA8]/10 text-[#2D5DA8] hover:bg-[#2D5DA8]/20"}`}>
                              {isUploading ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiUpload className="w-3.5 h-3.5" />}
                              {isUploading ? "Uploading..." : "Choose File"}
                            </span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STEP 3: Review ── */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-extrabold text-[#1A1A1A]">Review & Submit</h2>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  {[
                    ["Full Name", fullName], ["Email", email], ["Phone", phone],
                    ["Institute", instituteName], ["Business Type", businessType],
                    ["City", city], ["State", stateName], ["Pincode", pincode],
                  ].map(([k, v]) => (
                    <div key={k} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                      <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-0.5">{k}</p>
                      <p className="font-semibold text-[#1A1A1A]">{v || "—"}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#374151] mb-3">Documents ({docs.length} uploaded)</p>
                  <div className="flex flex-wrap gap-2">
                    {docs.map((d) => (
                      <span key={d.key} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#A8C63A]/10 border border-[#A8C63A]/20 text-xs font-semibold text-[#8FA92F]">
                        <FiCheckCircle className="w-3.5 h-3.5" />{d.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-[#EEF2F7] border border-[#2D5DA8]/15 text-sm text-[#374151]">
                  By submitting, you confirm that all information provided is accurate. Our team will verify your documents and contact you within 2–3 business days.
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <button onClick={() => { setStep((s) => s - 1); setError(""); }} className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#E5E7EB] text-[#374151] font-semibold text-sm hover:bg-[#F8FAFC] transition-all">
                  <FiArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={next} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2D5DA8] text-white font-bold text-sm hover:bg-[#1E4A85] transition-all shadow-md">
                  Continue <FiArrowRight className="w-4 h-4" />
                </motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F39C12] text-white font-bold text-sm hover:bg-[#D68910] transition-all shadow-md disabled:opacity-50">
                  {submitting ? <><FiLoader className="w-4 h-4 animate-spin" /> Submitting...</> : <><FiCheckCircle className="w-4 h-4" /> Submit Application</>}
                </motion.button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
