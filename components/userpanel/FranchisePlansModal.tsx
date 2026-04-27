"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX, FiCheck, FiArrowRight, FiArrowLeft, FiLoader,
  FiShield, FiStar, FiZap, FiAward,
  FiUser, FiMail, FiPhone, FiMapPin, FiMessageSquare,
  FiUpload, FiFile, FiAlertCircle, FiCheckCircle, FiBriefcase,
  FiEye,
} from "react-icons/fi";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import CashfreeCheckout from "./CashfreeCheckout";

// ── Types ────────────────────────────────────────────────────────────────────
interface Plan { id: number; name: "SILVER"|"GOLD"|"DIAMOND"; price: number; durationInDays: number; status: string; }
interface UploadedDoc { key: string; url: string; name: string; type: string; label: string; }
interface Props { open: boolean; onClose: () => void; }
type Step = "plans" | "personal" | "business" | "documents" | "review" | "processing";

// ── Plan metadata ────────────────────────────────────────────────────────────
const PLAN_META: Record<string, { icon: React.ReactNode; tagline: string; color: string; border: string; badge: string; badgeBg: string; features: string[]; popular?: boolean }> = {
  SILVER:  { icon: <FiShield className="w-6 h-6"/>, tagline: "Perfect to get started",       color: "text-[#6B7280]",  border: "border-[#E5E7EB]",  badge: "Starter",      badgeBg: "bg-[#F3F4F6] text-[#374151]",  features: ["Up to 50 students","Basic course management","Attendance tracking","Fee reports","Email support"] },
  GOLD:    { icon: <FiStar   className="w-6 h-6"/>, tagline: "Most popular choice",          color: "text-[#F39C12]",  border: "border-[#F39C12]",  badge: "Most Popular", badgeBg: "bg-[#F39C12] text-white",       features: ["Up to 200 students","Advanced courses","Staff management","Certificates","Analytics","Priority support"], popular: true },
  DIAMOND: { icon: <FiZap    className="w-6 h-6"/>, tagline: "For large-scale operations",   color: "text-[#2D5DA8]",  border: "border-[#2D5DA8]",  badge: "Enterprise",   badgeBg: "bg-[#2D5DA8] text-white",       features: ["Unlimited students","Full system access","Multi-branch","Custom branding","Dedicated manager","24/7 support"] },
};

// ── Document lists ───────────────────────────────────────────────────────────
const INDIVIDUAL_DOCS = [
  { key: "pan",          label: "PAN Card",                  required: true,  accept: "image/*,.pdf" },
  { key: "aadhar",       label: "Aadhar Card",               required: true,  accept: "image/*,.pdf" },
  { key: "photo",        label: "Applicant Photo",           required: true,  accept: "image/*" },
  { key: "signature",    label: "Signature",                 required: true,  accept: "image/*" },
  { key: "logo",         label: "Institute Logo",            required: false, accept: "image/*" },
  { key: "centre_photo", label: "Centre Photo",              required: false, accept: "image/*" },
];
const ENTITY_DOCS = [
  ...INDIVIDUAL_DOCS,
  { key: "udyam",      label: "Udyam Registration",          required: false, accept: "image/*,.pdf" },
  { key: "entity_reg", label: "Entity Registration + GST",   required: false, accept: "image/*,.pdf" },
  { key: "bank",       label: "Bank Passbook / Cheque",      required: false, accept: "image/*,.pdf" },
  { key: "stamp",      label: "Institute Stamp",             required: false, accept: "image/*" },
];

const STEPS: Step[] = ["plans","personal","business","documents","review"];
const STEP_LABELS = ["Plan","Personal","Business","Documents","Review"];

const inputCls = "w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white focus:border-[#2D5DA8] focus:ring-2 focus:ring-[#2D5DA8]/15 outline-none transition-all text-sm text-[#1A1A1A] placeholder-[#9CA3AF]";
const labelCls = "block text-sm font-semibold text-[#374151] mb-1.5";

// ── Component ────────────────────────────────────────────────────────────────
export default function FranchisePlansModal({ open, onClose }: Props) {
  const [plans,        setPlans]        = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [step,         setStep]         = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [error,        setError]        = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [previewDoc,   setPreviewDoc]   = useState<UploadedDoc | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);

  // Personal
  const [fullName,       setFullName]       = useState("");
  const [email,          setEmail]          = useState("");
  const [phone,          setPhone]          = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");

  // Business
  const [instituteName, setInstituteName] = useState("");
  const [businessType,  setBusinessType]  = useState("INDIVIDUAL");
  const [address,       setAddress]       = useState("");
  const [city,          setCity]          = useState("");
  const [stateName,     setStateName]     = useState("");
  const [pincode,       setPincode]       = useState("");
  const [message,       setMessage]       = useState("");

  // Documents
  const [docs,      setDocs]      = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const docList = businessType === "INDIVIDUAL" ? INDIVIDUAL_DOCS : ENTITY_DOCS;

  // Load plans
  useEffect(() => {
    if (!open || plans.length > 0) return;
    setLoadingPlans(true);
    fetch("/api/franchise-plans/public").then(r => r.json()).then(res => {
      if (res.success && Array.isArray(res.data)) setPlans(res.data);
    }).finally(() => setLoadingPlans(false));
  }, [open, plans.length]);

  // Body scroll lock
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep("plans"); setSelectedPlan(null); setError(""); setSubmitting(false);
        setFullName(""); setEmail(""); setPhone(""); setAlternatePhone("");
        setInstituteName(""); setBusinessType("INDIVIDUAL"); setAddress("");
        setCity(""); setStateName(""); setPincode(""); setMessage("");
        setDocs([]); setPreviewDoc(null); setPaymentSessionId(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Upload doc
  const uploadDoc = async (key: string, label: string, file: File) => {
    setUploading(key);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("docType", key);
      const res  = await fetch("/api/franchise-application/upload-doc", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || "Upload failed"); return; }
      setDocs(prev => [...prev.filter(d => d.key !== key), { key, url: data.data.url, name: file.name, type: file.type, label }]);
      setError("");
    } catch { setError("Upload failed. Please try again."); }
    finally { setUploading(null); }
  };

  const removeDoc = (key: string) => {
    setDocs(prev => prev.filter(d => d.key !== key));
    if (fileRefs.current[key]) fileRefs.current[key]!.value = "";
  };

  // Validate current step
  const validate = (): string | null => {
    if (step === "personal") {
      const nr = validateName(fullName);   if (!nr.valid)  return nr.error!;
      const er = validateEmail(email);     if (!er.valid)  return er.error!;
      const pr = validatePhone(phone);     if (!pr.valid)  return pr.error!;
    }
    if (step === "business") {
      if (!instituteName.trim()) return "Institute name is required";
      if (!address.trim() || !city.trim() || !stateName.trim() || !pincode.trim()) return "Complete address is required";
    }
    if (step === "documents") {
      const missing = docList.filter(d => d.required && !docs.find(u => u.key === d.key));
      if (missing.length) return `Required: ${missing.map(d => d.label).join(", ")}`;
    }
    return null;
  };

  const goNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const goBack = () => {
    setError("");
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  // Final submit → save application + payment
  const handleSubmit = async () => {
    setError(""); setSubmitting(true); setStep("processing");
    try {
      // 1. Save application
      const appRes = await fetch("/api/franchise-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(), email: email.trim(), phone: phone.trim(),
          alternatePhone: alternatePhone.trim() || undefined,
          instituteName: instituteName.trim(), businessType,
          address: address.trim(), city: city.trim(), state: stateName.trim(), pincode: pincode.trim(),
          planId: selectedPlan!.id, message: message.trim() || undefined, documents: docs,
        }),
      });
      const appData = await appRes.json();
      if (!appRes.ok || !appData.success) {
        setError(appData.error || "Failed to save application");
        setStep("review"); setSubmitting(false); return;
      }

      // 2. Create payment order
      const payRes = await fetch("/api/franchise-payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(), email: email.trim(), phone: phone.trim(),
          planId: selectedPlan!.id, city: city.trim() || undefined,
          state: stateName.trim() || undefined, address: address.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok || !payData.success) {
        setError(payData.error || "Payment order failed");
        setStep("review"); setSubmitting(false); return;
      }

      // 3. Trigger Cashfree SDK checkout
      const { paymentSessionId } = payData.data;
      setPaymentSessionId(paymentSessionId);
      // CashfreeCheckout component will handle the SDK redirect
    } catch {
      setError("Network error. Please try again.");
      setStep("review"); setSubmitting(false);
    }
  };

  const stepIdx = STEPS.indexOf(step);
  const isFormStep = stepIdx > 0 && step !== "processing";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={() => !submitting && onClose()} className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[300]" />

          <motion.div key="modal" initial={{ opacity: 0, scale: 0.96, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[301] flex items-center justify-center p-3 sm:p-4" onClick={e => e.stopPropagation()}>

            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden">

              {/* ── Header ── */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB] flex-shrink-0">
                <div className="flex items-center gap-3">
                  {isFormStep && step !== "plans" && (
                    <button onClick={goBack} disabled={submitting}
                      className="w-8 h-8 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] transition-colors disabled:opacity-40">
                      <FiArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div>
                    <h2 className="text-base font-extrabold text-[#1A1A1A]">
                      {step === "plans"      ? "Choose Your Franchise Plan" :
                       step === "personal"   ? "Personal Information" :
                       step === "business"   ? "Business Information" :
                       step === "documents"  ? "KYC Documents" :
                       step === "review"     ? "Review & Pay" :
                       "Processing..."}
                    </h2>
                    {selectedPlan && step !== "plans" && step !== "processing" && (
                      <p className="text-xs text-[#6B7280]">{selectedPlan.name} Plan · ₹{selectedPlan.price.toLocaleString("en-IN")}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Step progress dots */}
                  {isFormStep && (
                    <div className="hidden sm:flex items-center gap-1.5">
                      {STEPS.slice(1).map((s, i) => (
                        <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${
                          STEPS.indexOf(step) > i + 1 ? "w-4 bg-[#A8C63A]" :
                          STEPS.indexOf(step) === i + 1 ? "w-6 bg-[#2D5DA8]" : "w-1.5 bg-[#E5E7EB]"
                        }`} />
                      ))}
                    </div>
                  )}
                  <button onClick={onClose} disabled={submitting}
                    className="w-9 h-9 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] transition-colors disabled:opacity-40">
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ── Body ── */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">

                  {/* PLANS */}
                  {step === "plans" && (
                    <motion.div key="plans" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="p-5">
                      {loadingPlans ? (
                        <div className="flex items-center justify-center py-16 gap-3">
                          <FiLoader className="w-6 h-6 text-[#2D5DA8] animate-spin" />
                          <span className="text-[#6B7280] font-medium">Loading plans...</span>
                        </div>
                      ) : (
                        <div className="grid sm:grid-cols-3 gap-4">
                          {plans.map((plan, i) => {
                            const meta = PLAN_META[plan.name] || PLAN_META.SILVER;
                            return (
                              <motion.div key={plan.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                className={`relative bg-white rounded-2xl border-2 ${meta.border} ${meta.popular ? "shadow-xl" : "shadow-sm"} hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col`}>
                                {meta.popular && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F39C12] to-[#D68910]" />}
                                <div className="p-5 flex flex-col flex-1">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${meta.badgeBg}`}>{meta.badge}</span>
                                  <div className={`${meta.color} mb-1`}>{meta.icon}</div>
                                  <h3 className="text-xl font-extrabold text-[#1A1A1A] mb-0.5">{plan.name}</h3>
                                  <p className="text-[#6B7280] text-xs mb-3">{meta.tagline}</p>
                                  <div className="mb-3">
                                    <span className="text-3xl font-black text-[#1A1A1A]">₹{plan.price.toLocaleString("en-IN")}</span>
                                    <span className="text-[#6B7280] text-xs ml-1">/ {plan.durationInDays >= 365 ? `${Math.round(plan.durationInDays/365)}yr` : `${plan.durationInDays}d`}</span>
                                  </div>
                                  <div className="h-px bg-[#E5E7EB] mb-3" />
                                  <ul className="space-y-1.5 mb-5 flex-1">
                                    {meta.features.map(f => (
                                      <li key={f} className="flex items-start gap-2 text-[#374151] text-xs">
                                        <FiCheck className="w-3.5 h-3.5 text-[#A8C63A] flex-shrink-0 mt-0.5" />{f}
                                      </li>
                                    ))}
                                  </ul>
                                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                    onClick={() => { setSelectedPlan(plan); setError(""); setStep("personal"); }}
                                    className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${meta.popular ? "bg-[#F39C12] text-white hover:bg-[#D68910]" : "bg-[#2D5DA8] text-white hover:bg-[#1E4A85]"}`}>
                                    Select Plan <FiArrowRight className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                      <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-[#9CA3AF] text-xs">
                        {["Secure Cashfree Payment","24hr Account Setup","Dedicated Support"].map(t => (
                          <span key={t} className="flex items-center gap-1.5"><FiCheck className="w-3.5 h-3.5 text-[#A8C63A]" />{t}</span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* PERSONAL */}
                  {step === "personal" && (
                    <motion.div key="personal" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="p-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div><label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                          <div className="relative"><FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className={`${inputCls} pl-10`} /></div></div>
                        <div><label className={labelCls}>Email <span className="text-red-500">*</span></label>
                          <div className="relative"><FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={`${inputCls} pl-10`} /></div></div>
                        <div><label className={labelCls}>Phone <span className="text-red-500">*</span></label>
                          <div className="relative"><FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className={`${inputCls} pl-10`} /></div></div>
                        <div><label className={labelCls}>Alternate Phone</label>
                          <div className="relative"><FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                            <input type="tel" value={alternatePhone} onChange={e => setAlternatePhone(e.target.value)} placeholder="Optional" className={`${inputCls} pl-10`} /></div></div>
                      </div>
                    </motion.div>
                  )}

                  {/* BUSINESS */}
                  {step === "business" && (
                    <motion.div key="business" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="p-5 space-y-4">
                      <div><label className={labelCls}>Institute / Centre Name <span className="text-red-500">*</span></label>
                        <input type="text" value={instituteName} onChange={e => setInstituteName(e.target.value)} placeholder="e.g. Nitin Institute of Technology" className={inputCls} /></div>
                      <div><label className={labelCls}>Business Type <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 gap-3">
                          {[{v:"INDIVIDUAL",l:"Individual / Proprietor"},{v:"ENTITY",l:"Registered Entity"}].map(({v,l}) => (
                            <button key={v} type="button" onClick={() => setBusinessType(v)}
                              className={`p-3.5 rounded-2xl border-2 text-sm font-semibold text-left transition-all ${businessType===v ? "border-[#2D5DA8] bg-[#2D5DA8]/05 text-[#2D5DA8]" : "border-[#E5E7EB] text-[#374151] hover:border-[#2D5DA8]/40"}`}>
                              <FiBriefcase className="w-4 h-4 mb-1" />{l}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div><label className={labelCls}>Address <span className="text-red-500">*</span></label>
                        <div className="relative"><FiMapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9CA3AF]" />
                          <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} placeholder="Street, Area" className={`${inputCls} pl-10 resize-none`} /></div></div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><label className={labelCls}>City <span className="text-red-500">*</span></label><input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Mumbai" className={inputCls} /></div>
                        <div><label className={labelCls}>State <span className="text-red-500">*</span></label><input type="text" value={stateName} onChange={e => setStateName(e.target.value)} placeholder="Maharashtra" className={inputCls} /></div>
                        <div><label className={labelCls}>Pincode <span className="text-red-500">*</span></label><input type="text" value={pincode} onChange={e => setPincode(e.target.value)} placeholder="400001" className={inputCls} /></div>
                      </div>
                      <div><label className={labelCls}>Message (Optional)</label>
                        <div className="relative"><FiMessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9CA3AF]" />
                          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={2} placeholder="Any additional info..." className={`${inputCls} pl-10 resize-none`} /></div></div>
                    </motion.div>
                  )}

                  {/* DOCUMENTS */}
                  {step === "documents" && (
                    <motion.div key="documents" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="p-5">
                      <p className="text-xs text-[#6B7280] mb-4">Upload required documents. Accepted: JPG, PNG, PDF (max 5MB each).</p>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {docList.map(doc => {
                          const uploaded = docs.find(d => d.key === doc.key);
                          const isImg    = uploaded?.type?.startsWith("image/");
                          const isUp     = uploading === doc.key;
                          return (
                            <div key={doc.key} className={`rounded-2xl border-2 overflow-hidden transition-all ${uploaded ? "border-[#A8C63A]" : "border-[#E5E7EB] hover:border-[#2D5DA8]/30"}`}>
                              {/* Preview area */}
                              {uploaded && isImg && (
                                <div className="relative group">
                                  <img src={uploaded.url} alt={uploaded.label} className="w-full h-28 object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button onClick={() => setPreviewDoc(uploaded)} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors">
                                      <FiEye className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => removeDoc(doc.key)} className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-colors">
                                      <FiX className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                              <div className="p-3">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div>
                                    <p className="text-sm font-semibold text-[#1A1A1A]">{doc.label}</p>
                                    {doc.required && <span className="text-[10px] text-red-500 font-bold uppercase">Required</span>}
                                  </div>
                                  {uploaded && !isImg && (
                                    <button onClick={() => removeDoc(doc.key)} className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200 flex-shrink-0">
                                      <FiX className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                {uploaded && !isImg ? (
                                  <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                                    <FiFile className="w-4 h-4 text-[#2D5DA8]" />
                                    <span className="truncate">{uploaded.name}</span>
                                    <a href={uploaded.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-[#2D5DA8] hover:underline flex-shrink-0">View</a>
                                  </div>
                                ) : !uploaded ? (
                                  <label className="cursor-pointer">
                                    <input type="file" accept={doc.accept} className="hidden"
                                      ref={el => { fileRefs.current[doc.key] = el; }}
                                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(doc.key, doc.label, f); }} />
                                    <span className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all w-fit ${isUp ? "bg-[#EEF2F7] text-[#6B7280]" : "bg-[#2D5DA8]/10 text-[#2D5DA8] hover:bg-[#2D5DA8]/20"}`}>
                                      {isUp ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiUpload className="w-3.5 h-3.5" />}
                                      {isUp ? "Uploading..." : "Choose File"}
                                    </span>
                                  </label>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* REVIEW */}
                  {step === "review" && selectedPlan && (
                    <motion.div key="review" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="p-5 space-y-5">
                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        {[["Full Name",fullName],["Email",email],["Phone",phone],["Institute",instituteName],["Business Type",businessType],["City",city],["State",stateName],["Pincode",pincode]].map(([k,v]) => (
                          <div key={k} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
                            <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-0.5">{k}</p>
                            <p className="font-semibold text-[#1A1A1A]">{v||"—"}</p>
                          </div>
                        ))}
                      </div>
                      {docs.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-[#374151] mb-2">Documents ({docs.length})</p>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {docs.map(d => (
                              <div key={d.key} className="rounded-xl overflow-hidden border border-[#E5E7EB] cursor-pointer" onClick={() => setPreviewDoc(d)}>
                                {d.type?.startsWith("image/") ? (
                                  <img src={d.url} alt={d.label} className="w-full h-16 object-cover" />
                                ) : (
                                  <div className="w-full h-16 bg-[#EEF2F7] flex items-center justify-center"><FiFile className="w-6 h-6 text-[#2D5DA8]" /></div>
                                )}
                                <p className="text-[10px] font-semibold text-[#6B7280] px-2 py-1 truncate">{d.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="p-4 rounded-2xl bg-[#EEF2F7] border border-[#2D5DA8]/15 flex items-center justify-between">
                        <div><p className="text-xs text-[#6B7280]">Selected Plan</p><p className="font-bold text-[#1A1A1A]">{selectedPlan.name}</p></div>
                        <div className="text-right"><p className="text-xs text-[#6B7280]">Total</p><p className="text-2xl font-black text-[#2D5DA8]">₹{selectedPlan.price.toLocaleString("en-IN")}</p></div>
                      </div>
                      {error && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                          <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{error}
                        </div>
                      )}
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={submitting}
                        className="w-full py-4 rounded-2xl bg-[#F39C12] text-white font-bold text-base hover:bg-[#D68910] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
                        <FiAward className="w-5 h-5" /> Submit Application &amp; Pay ₹{selectedPlan.price.toLocaleString("en-IN")}
                      </motion.button>
                      <p className="text-center text-xs text-[#9CA3AF]">Secured by Cashfree Payments · 256-bit SSL</p>
                    </motion.div>
                  )}

                  {/* PROCESSING */}
                  {step === "processing" && (
                    <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 gap-5">
                      <div className="relative">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-4 border-[#2D5DA8]/20 border-t-[#2D5DA8]" />
                        <FiAward className="w-6 h-6 text-[#2D5DA8] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-[#1A1A1A] text-lg">Redirecting to payment...</p>
                        <p className="text-[#6B7280] text-sm mt-1">Please wait, do not close this window.</p>
                      </div>
                      {/* SDK checkout trigger */}
                      {paymentSessionId && (
                        <CashfreeCheckout
                          paymentSessionId={paymentSessionId}
                          onError={(msg) => {
                            setError(msg);
                            setStep("review");
                            setSubmitting(false);
                            setPaymentSessionId(null);
                          }}
                        />
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* ── Footer nav (all steps except plans, review, processing) ── */}
              {isFormStep && step !== "review" && (
                <div className="flex gap-3 px-5 py-4 border-t border-[#E5E7EB] flex-shrink-0">
                  <button onClick={goBack} className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#E5E7EB] text-[#374151] font-semibold text-sm hover:bg-[#F8FAFC] transition-all">
                    <FiArrowLeft className="w-4 h-4" /> Back
                  </button>
                  {error && (
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                      <FiAlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                    </div>
                  )}
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={goNext}
                    className="ml-auto flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D5DA8] text-white font-bold text-sm hover:bg-[#1E4A85] transition-all shadow-md">
                    Continue <FiArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Document Preview Lightbox ── */}
          <AnimatePresence>
            {previewDoc && (
              <motion.div key="lb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setPreviewDoc(null)} className="fixed inset-0 bg-black/90 z-[400] flex items-center justify-center p-4">
                <button onClick={() => setPreviewDoc(null)} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20">
                  <FiX className="w-6 h-6" />
                </button>
                {previewDoc.type?.startsWith("image/") ? (
                  <img src={previewDoc.url} alt={previewDoc.label} className="max-w-full max-h-[85vh] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
                ) : (
                  <div className="bg-white rounded-2xl p-8 text-center" onClick={e => e.stopPropagation()}>
                    <FiFile className="w-16 h-16 text-[#2D5DA8] mx-auto mb-4" />
                    <p className="font-bold text-[#1A1A1A] mb-2">{previewDoc.label}</p>
                    <p className="text-[#6B7280] text-sm mb-4">{previewDoc.name}</p>
                    <a href={previewDoc.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D5DA8] text-white font-semibold hover:bg-[#1E4A85] transition-all">
                      Open PDF <FiArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                )}
                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">{previewDoc.label}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
