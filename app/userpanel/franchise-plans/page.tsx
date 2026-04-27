"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FiCheck, FiArrowRight, FiArrowLeft, FiLoader, FiX,
  FiShield, FiStar, FiZap, FiAward, FiBriefcase,
  FiUser, FiMail, FiPhone, FiMapPin, FiMessageSquare,
  FiUpload, FiFile, FiCheckCircle, FiAlertCircle, FiEye,
} from "react-icons/fi";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import PageLoader from "@/components/common/PageLoader";

// ── Types ────────────────────────────────────────────────────────────────────
interface Plan { id: number; name: "SILVER"|"GOLD"|"DIAMOND"; price: number; durationInDays: number; status: string; }
interface UploadedDoc { key: string; url: string; name: string; type: string; label: string; }
type Step = "plans"|"personal"|"business"|"documents"|"review"|"processing"|"done";

// ── Plan metadata ─────────────────────────────────────────────────────────────
const PLAN_META: Record<string, { icon: React.ReactNode; tagline: string; color: string; border: string; badge: string; badgeBg: string; highlight: string; features: string[]; popular?: boolean }> = {
  SILVER: {
    icon: <FiShield className="w-8 h-8"/>, tagline: "Perfect to get started", color: "text-[#6B7280]",
    border: "border-[#E5E7EB]", badge: "Starter", badgeBg: "bg-[#F3F4F6] text-[#374151]", highlight: "#6B7280",
    features: ["Up to 50 students","Basic course management","Attendance tracking","Fee collection & reports","Email support"],
  },
  GOLD: {
    icon: <FiStar className="w-8 h-8"/>, tagline: "Most popular choice", color: "text-[#F39C12]",
    border: "border-[#F39C12]", badge: "Most Popular", badgeBg: "bg-[#F39C12] text-white", highlight: "#F39C12",
    features: ["Up to 200 students","Advanced course management","Staff management","Certificate generation","Analytics & reports","Priority support"],
    popular: true,
  },
  DIAMOND: {
    icon: <FiZap className="w-8 h-8"/>, tagline: "For large-scale operations", color: "text-[#2D5DA8]",
    border: "border-[#2D5DA8]", badge: "Enterprise", badgeBg: "bg-[#2D5DA8] text-white", highlight: "#2D5DA8",
    features: ["Unlimited students","Full system access","Multi-branch support","Custom branding","Advanced analytics","Dedicated account manager","24/7 priority support"],
  },
};

// ── Document lists ────────────────────────────────────────────────────────────
const INDIVIDUAL_DOCS = [
  { key:"pan",          label:"PAN Card",                 required:true,  accept:"image/*,.pdf" },
  { key:"aadhar",       label:"Aadhar Card",              required:true,  accept:"image/*,.pdf" },
  { key:"photo",        label:"Applicant Photo",          required:true,  accept:"image/*" },
  { key:"signature",    label:"Signature",                required:true,  accept:"image/*" },
  { key:"logo",         label:"Institute Logo",           required:false, accept:"image/*" },
  { key:"centre_photo", label:"Centre Photo",             required:false, accept:"image/*" },
];
const ENTITY_DOCS = [
  ...INDIVIDUAL_DOCS,
  { key:"udyam",      label:"Udyam Registration",         required:false, accept:"image/*,.pdf" },
  { key:"entity_reg", label:"Entity Registration + GST",  required:false, accept:"image/*,.pdf" },
  { key:"bank",       label:"Bank Passbook / Cheque",     required:false, accept:"image/*,.pdf" },
  { key:"stamp",      label:"Institute Stamp",            required:false, accept:"image/*" },
];

const FORM_STEPS: Step[] = ["personal","business","documents","review"];
const FORM_LABELS = ["Personal Info","Business Info","KYC Documents","Review & Pay"];

const inputCls = "w-full px-4 py-3.5 rounded-2xl border border-[#E5E7EB] bg-white focus:border-[#2D5DA8] focus:ring-2 focus:ring-[#2D5DA8]/15 outline-none transition-all text-sm text-[#1A1A1A] placeholder-[#9CA3AF]";
const labelCls = "block text-sm font-semibold text-[#374151] mb-1.5";

// ── Main Component ────────────────────────────────────────────────────────────
export default function FranchisePlansPage() {
  const [plans,        setPlans]        = useState<Plan[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [fetchError,   setFetchError]   = useState("");
  const [step,         setStep]         = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [error,        setError]        = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [previewDoc,   setPreviewDoc]   = useState<UploadedDoc | null>(null);

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

  useEffect(() => {
    fetch("/api/franchise-plans/public").then(r => r.json()).then(res => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) setPlans(res.data);
      else setFetchError("No plans available. Please try again later.");
    }).catch(() => setFetchError("Failed to load plans. Please refresh."))
    .finally(() => setLoading(false));
  }, []);

  const uploadDoc = async (key: string, label: string, file: File) => {
    setUploading(key);
    try {
      const form = new FormData();
      form.append("file", file); form.append("docType", key);
      const res  = await fetch("/api/franchise-application/upload-doc", { method:"POST", body:form });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || "Upload failed"); return; }
      setDocs(prev => [...prev.filter(d => d.key !== key), { key, url:data.data.url, name:file.name, type:file.type, label }]);
      setError("");
    } catch { setError("Upload failed. Please try again."); }
    finally { setUploading(null); }
  };

  const removeDoc = (key: string) => {
    setDocs(prev => prev.filter(d => d.key !== key));
    if (fileRefs.current[key]) fileRefs.current[key]!.value = "";
  };

  const validate = (): string | null => {
    if (step === "personal") {
      const nr = validateName(fullName);   if (!nr.valid) return nr.error!;
      const er = validateEmail(email);     if (!er.valid) return er.error!;
      const pr = validatePhone(phone);     if (!pr.valid) return pr.error!;
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
    const err = validate(); if (err) { setError(err); return; }
    setError("");
    const idx = FORM_STEPS.indexOf(step);
    if (idx < FORM_STEPS.length - 1) setStep(FORM_STEPS[idx + 1]);
  };

  const goBack = () => {
    setError("");
    const idx = FORM_STEPS.indexOf(step);
    if (idx > 0) setStep(FORM_STEPS[idx - 1]);
    else setStep("plans");
  };

  const handleSubmit = async () => {
    setError(""); setSubmitting(true); setStep("processing");
    try {
      // Save application
      const appRes = await fetch("/api/franchise-application", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          fullName:fullName.trim(), email:email.trim(), phone:phone.trim(),
          alternatePhone:alternatePhone.trim()||undefined,
          instituteName:instituteName.trim(), businessType,
          address:address.trim(), city:city.trim(), state:stateName.trim(), pincode:pincode.trim(),
          planId:selectedPlan!.id, message:message.trim()||undefined, documents:docs,
        }),
      });
      const appData = await appRes.json();
      if (!appRes.ok || !appData.success) { setError(appData.error||"Failed to save application"); setStep("review"); setSubmitting(false); return; }

      // Create payment order
      const payRes = await fetch("/api/franchise-payment/create-order", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          fullName:fullName.trim(), email:email.trim(), phone:phone.trim(),
          planId:selectedPlan!.id, city:city.trim()||undefined,
          state:stateName.trim()||undefined, address:address.trim()||undefined,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok || !payData.success) { setError(payData.error||"Payment order failed"); setStep("review"); setSubmitting(false); return; }

      // Cashfree JS SDK checkout
      const { paymentSessionId } = payData.data;
      const cfEnv = process.env.NEXT_PUBLIC_CASHFREE_ENV === "PROD" ? "production" : "sandbox";
      if (!(window as any).Cashfree) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
          s.onload = () => resolve(); s.onerror = () => reject(new Error("SDK load failed"));
          document.head.appendChild(s);
        });
      }
      const cashfree = (window as any).Cashfree({ mode: cfEnv });
      const result   = await cashfree.checkout({ paymentSessionId, redirectTarget: "_self" });
      if (result?.error) { setError(result.error.message||"Payment failed"); setStep("review"); setSubmitting(false); }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
      setStep("review"); setSubmitting(false);
    }
  };

  const formStepIdx = FORM_STEPS.indexOf(step);
  const isFormStep  = formStepIdx >= 0;

  if (loading) return <PageLoader text="Loading plans..." />;

  if (fetchError) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><FiX className="w-8 h-8 text-red-500"/></div>
        <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Could not load plans</h2>
        <p className="text-[#6B7280] mb-6">{fetchError}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl bg-[#2D5DA8] text-white font-semibold hover:bg-[#1E4A85] transition-all">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2D5DA8] via-[#1E4A85] to-[#1a3d70] py-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(168,198,58,0.12),transparent)]"/>
        <div className="absolute -bottom-1 left-0 right-0 h-16 bg-[#F8FAFC]" style={{clipPath:"ellipse(55% 100% at 50% 100%)"}}/>
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="max-w-4xl mx-auto text-center relative">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-sm font-semibold uppercase tracking-wider mb-5">
            <FiAward className="w-4 h-4 text-[#A8C63A]"/> Franchise Plans
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            {step === "plans" ? <>Choose the Right Plan<br/>for Your Franchise</> : "Complete Your Application"}
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            {step === "plans" ? "Pick a plan, fill your details, upload KYC documents and pay — all in one place." : selectedPlan ? `${selectedPlan.name} Plan · ₹${selectedPlan.price.toLocaleString("en-IN")}` : ""}
          </p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Step progress bar (form steps only) */}
        {isFormStep && step !== "processing" && (
          <div className="mb-10">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-[#E5E7EB] -z-10"/>
              <div className="absolute top-4 left-0 h-0.5 bg-[#2D5DA8] -z-10 transition-all duration-500"
                style={{width:`${(formStepIdx/(FORM_STEPS.length-1))*100}%`}}/>
              {FORM_STEPS.map((s,i) => (
                <div key={s} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                    i < formStepIdx ? "bg-[#A8C63A] border-[#A8C63A] text-white" :
                    i === formStepIdx ? "bg-[#2D5DA8] border-[#2D5DA8] text-white" :
                    "bg-white border-[#E5E7EB] text-[#9CA3AF]"}`}>
                    {i < formStepIdx ? <FiCheckCircle className="w-4 h-4"/> : i+1}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${i===formStepIdx?"text-[#2D5DA8]":"text-[#9CA3AF]"}`}>{FORM_LABELS[i]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── PLANS ── */}
          {step === "plans" && (
            <motion.div key="plans" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} transition={{duration:0.25}}>
              <div className="grid md:grid-cols-3 gap-8 items-start">
                {plans.map((plan,i) => {
                  const meta = PLAN_META[plan.name]||PLAN_META.SILVER;
                  return (
                    <motion.div key={plan.id} initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:i*0.1,type:"spring",stiffness:100,damping:18}}
                      className={`relative bg-white rounded-3xl border-2 ${meta.border} shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${meta.popular?"scale-105":""}`}>
                      {meta.popular && <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F39C12] to-[#D68910]"/>}
                      <div className="p-8">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${meta.badgeBg}`}>{meta.badge}</span>
                        <div className={`${meta.color} mb-2`}>{meta.icon}</div>
                        <h3 className="text-2xl font-extrabold text-[#1A1A1A] mb-1">{plan.name}</h3>
                        <p className="text-[#6B7280] text-sm mb-6">{meta.tagline}</p>
                        <div className="mb-6">
                          <span className="text-5xl font-black text-[#1A1A1A]">₹{plan.price.toLocaleString("en-IN")}</span>
                          <p className="text-[#6B7280] text-sm mt-1">Valid for {plan.durationInDays>=365?`${Math.round(plan.durationInDays/365)} year${Math.round(plan.durationInDays/365)>1?"s":""}`:plan.durationInDays+" days"}</p>
                        </div>
                        <div className="h-px bg-[#E5E7EB] mb-6"/>
                        <ul className="space-y-3 mb-8">
                          {meta.features.map(f => (
                            <li key={f} className="flex items-start gap-3 text-[#374151] text-sm">
                              <FiCheck className="w-4 h-4 text-[#A8C63A] flex-shrink-0 mt-0.5"/>{f}
                            </li>
                          ))}
                        </ul>
                        <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                          onClick={() => { setSelectedPlan(plan); setError(""); setStep("personal"); }}
                          className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${meta.popular?"bg-[#F39C12] text-white hover:bg-[#D68910]":"bg-[#2D5DA8] text-white hover:bg-[#1E4A85]"}`}>
                          Get Started <FiArrowRight className="w-4 h-4"/>
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-[#6B7280] text-sm">
                {["Secure Cashfree Payment","24hr Account Setup","Dedicated Support","100% Genuine"].map(t => (
                  <span key={t} className="flex items-center gap-2"><FiCheck className="w-4 h-4 text-[#A8C63A]"/>{t}</span>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/userpanel" className="text-[#2D5DA8] font-semibold hover:underline text-sm">← Back to Home</Link>
              </div>
            </motion.div>
          )}

          {/* ── PERSONAL ── */}
          {step === "personal" && (
            <motion.div key="personal" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}}
              className="bg-white rounded-3xl border border-[#E5E7EB] shadow-lg p-8">
              <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-2">Personal Information</h2>
              <p className="text-[#6B7280] text-sm mb-8">Tell us about yourself — the franchise owner.</p>
              <div className="grid sm:grid-cols-2 gap-5">
                <div><label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
                  <div className="relative"><FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]"/>
                    <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Your full name" className={`${inputCls} pl-11`}/></div></div>
                <div><label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
                  <div className="relative"><FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]"/>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className={`${inputCls} pl-11`}/></div></div>
                <div><label className={labelCls}>Phone Number <span className="text-red-500">*</span></label>
                  <div className="relative"><FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]"/>
                    <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210" className={`${inputCls} pl-11`}/></div></div>
                <div><label className={labelCls}>Alternate Phone</label>
                  <div className="relative"><FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]"/>
                    <input type="tel" value={alternatePhone} onChange={e=>setAlternatePhone(e.target.value)} placeholder="Optional" className={`${inputCls} pl-11`}/></div></div>
              </div>
            </motion.div>
          )}

          {/* ── BUSINESS ── */}
          {step === "business" && (
            <motion.div key="business" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}}
              className="bg-white rounded-3xl border border-[#E5E7EB] shadow-lg p-8 space-y-6">
              <div><h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-1">Business Information</h2>
                <p className="text-[#6B7280] text-sm">Details about your institute or centre.</p></div>
              <div><label className={labelCls}>Institute / Centre Name <span className="text-red-500">*</span></label>
                <input type="text" value={instituteName} onChange={e=>setInstituteName(e.target.value)} placeholder="e.g. Nitin Institute of Technology" className={inputCls}/></div>
              <div><label className={labelCls}>Business Type <span className="text-red-500">*</span></label>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[{v:"INDIVIDUAL",l:"Individual / Proprietor",d:"For sole proprietors and individuals"},{v:"ENTITY",l:"Registered Entity",d:"Pvt Ltd, LLP, Trust, Society"}].map(({v,l,d}) => (
                    <button key={v} type="button" onClick={()=>setBusinessType(v)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${businessType===v?"border-[#2D5DA8] bg-[#2D5DA8]/05":"border-[#E5E7EB] hover:border-[#2D5DA8]/40"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <FiBriefcase className={`w-4 h-4 ${businessType===v?"text-[#2D5DA8]":"text-[#9CA3AF]"}`}/>
                        <span className={`font-bold text-sm ${businessType===v?"text-[#2D5DA8]":"text-[#374151]"}`}>{l}</span>
                      </div>
                      <p className="text-xs text-[#6B7280]">{d}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div><label className={labelCls}>Full Address <span className="text-red-500">*</span></label>
                <div className="relative"><FiMapPin className="absolute left-4 top-4 w-4 h-4 text-[#9CA3AF]"/>
                  <textarea value={address} onChange={e=>setAddress(e.target.value)} rows={2} placeholder="Street, Area, Landmark" className={`${inputCls} pl-11 resize-none`}/></div></div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className={labelCls}>City <span className="text-red-500">*</span></label>
                  <input type="text" value={city} onChange={e=>setCity(e.target.value)} placeholder="Mumbai" className={inputCls}/></div>
                <div><label className={labelCls}>State <span className="text-red-500">*</span></label>
                  <input type="text" value={stateName} onChange={e=>setStateName(e.target.value)} placeholder="Maharashtra" className={inputCls}/></div>
                <div><label className={labelCls}>Pincode <span className="text-red-500">*</span></label>
                  <input type="text" value={pincode} onChange={e=>setPincode(e.target.value)} placeholder="400001" className={inputCls}/></div>
              </div>
              <div><label className={labelCls}>Message (Optional)</label>
                <div className="relative"><FiMessageSquare className="absolute left-4 top-4 w-4 h-4 text-[#9CA3AF]"/>
                  <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={2} placeholder="Any additional information..." className={`${inputCls} pl-11 resize-none`}/></div></div>
            </motion.div>
          )}

          {/* ── DOCUMENTS ── */}
          {step === "documents" && (
            <motion.div key="documents" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}}
              className="bg-white rounded-3xl border border-[#E5E7EB] shadow-lg p-8">
              <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-1">KYC Documents</h2>
              <p className="text-[#6B7280] text-sm mb-8">Upload required documents. Accepted: JPG, PNG, PDF (max 5MB each).</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {docList.map(doc => {
                  const uploaded = docs.find(d=>d.key===doc.key);
                  const isImg    = uploaded?.type?.startsWith("image/");
                  const isUp     = uploading===doc.key;
                  return (
                    <div key={doc.key} className={`rounded-2xl border-2 overflow-hidden transition-all ${uploaded?"border-[#A8C63A] shadow-md":"border-[#E5E7EB] hover:border-[#2D5DA8]/30"}`}>
                      {/* Image preview */}
                      {uploaded && isImg && (
                        <div className="relative group h-32">
                          <img src={uploaded.url} alt={uploaded.label} className="w-full h-full object-cover"/>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                            <button onClick={()=>setPreviewDoc(uploaded)} className="p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"><FiEye className="w-4 h-4"/></button>
                            <button onClick={()=>removeDoc(doc.key)} className="p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-colors"><FiX className="w-4 h-4"/></button>
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <p className="text-sm font-bold text-[#1A1A1A]">{doc.label}</p>
                            <span className={`text-[10px] font-bold uppercase ${doc.required?"text-red-500":"text-[#9CA3AF]"}`}>{doc.required?"Required":"Optional"}</span>
                          </div>
                          {uploaded && !isImg && (
                            <button onClick={()=>removeDoc(doc.key)} className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-500 hover:bg-red-200 flex-shrink-0"><FiX className="w-3 h-3"/></button>
                          )}
                        </div>
                        {uploaded && !isImg ? (
                          <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                            <FiFile className="w-4 h-4 text-[#2D5DA8] flex-shrink-0"/>
                            <span className="truncate flex-1">{uploaded.name}</span>
                            <a href={uploaded.url} target="_blank" rel="noopener noreferrer" className="text-[#2D5DA8] hover:underline flex-shrink-0">View</a>
                          </div>
                        ) : !uploaded ? (
                          <label className="cursor-pointer block">
                            <input type="file" accept={doc.accept} className="hidden"
                              ref={el=>{fileRefs.current[doc.key]=el;}}
                              onChange={e=>{const f=e.target.files?.[0];if(f)uploadDoc(doc.key,doc.label,f);}}/>
                            <span className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all w-fit ${isUp?"bg-[#EEF2F7] text-[#6B7280]":"bg-[#2D5DA8]/10 text-[#2D5DA8] hover:bg-[#2D5DA8]/20"}`}>
                              {isUp?<FiLoader className="w-3.5 h-3.5 animate-spin"/>:<FiUpload className="w-3.5 h-3.5"/>}
                              {isUp?"Uploading...":"Choose File"}
                            </span>
                          </label>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-[#A8C63A] font-semibold">
                            <FiCheckCircle className="w-4 h-4"/> Uploaded
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── REVIEW ── */}
          {step === "review" && selectedPlan && (
            <motion.div key="review" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}} className="space-y-6">
              <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-lg p-8">
                <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-6">Review Your Application</h2>
                <div className="grid sm:grid-cols-2 gap-4 text-sm mb-6">
                  {[["Full Name",fullName],["Email",email],["Phone",phone],["Institute",instituteName],["Business Type",businessType],["City",city],["State",stateName],["Pincode",pincode]].map(([k,v])=>(
                    <div key={k} className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                      <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">{k}</p>
                      <p className="font-semibold text-[#1A1A1A]">{v||"—"}</p>
                    </div>
                  ))}
                </div>
                {docs.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-bold text-[#374151] mb-3">Documents ({docs.length} uploaded)</p>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                      {docs.map(d=>(
                        <div key={d.key} className="rounded-xl overflow-hidden border border-[#E5E7EB] cursor-pointer hover:shadow-md transition-all" onClick={()=>setPreviewDoc(d)}>
                          {d.type?.startsWith("image/")
                            ? <img src={d.url} alt={d.label} className="w-full h-16 object-cover"/>
                            : <div className="w-full h-16 bg-[#EEF2F7] flex items-center justify-center"><FiFile className="w-6 h-6 text-[#2D5DA8]"/></div>}
                          <p className="text-[10px] font-semibold text-[#6B7280] px-2 py-1 truncate">{d.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Plan summary */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-[#EEF2F7] to-[#F8FAFC] border border-[#2D5DA8]/15 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#6B7280] mb-1">Selected Plan</p>
                    <p className="text-xl font-extrabold text-[#1A1A1A]">{selectedPlan.name}</p>
                    <p className="text-xs text-[#6B7280]">{selectedPlan.durationInDays>=365?`${Math.round(selectedPlan.durationInDays/365)} Year`:selectedPlan.durationInDays+" Days"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#6B7280] mb-1">Total Amount</p>
                    <p className="text-3xl font-black text-[#2D5DA8]">₹{selectedPlan.price.toLocaleString("en-IN")}</p>
                  </div>
                </div>
                {error && (
                  <div className="mt-4 flex items-start gap-2 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>{error}
                  </div>
                )}
                <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={handleSubmit} disabled={submitting}
                  className="w-full mt-6 py-4 rounded-2xl bg-[#F39C12] text-white font-bold text-lg hover:bg-[#D68910] transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl">
                  <FiAward className="w-5 h-5"/> Submit Application &amp; Pay ₹{selectedPlan.price.toLocaleString("en-IN")}
                </motion.button>
                <p className="text-center text-xs text-[#9CA3AF] mt-3">Secured by Cashfree Payments · 256-bit SSL encryption</p>
              </div>
            </motion.div>
          )}

          {/* ── PROCESSING ── */}
          {step === "processing" && (
            <motion.div key="processing" initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center justify-center py-24 gap-6">
              <div className="relative">
                <motion.div animate={{rotate:360}} transition={{duration:1,repeat:Infinity,ease:"linear"}} className="w-20 h-20 rounded-full border-4 border-[#2D5DA8]/20 border-t-[#2D5DA8]"/>
                <FiAward className="w-8 h-8 text-[#2D5DA8] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
              </div>
              <div className="text-center">
                <p className="font-extrabold text-[#1A1A1A] text-2xl mb-2">Opening Payment Gateway...</p>
                <p className="text-[#6B7280]">Please wait. Do not close or refresh this page.</p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── Navigation footer (form steps) ── */}
        {isFormStep && step !== "review" && step !== "processing" && (
          <div className="flex gap-4 mt-8">
            <button onClick={goBack} className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-[#E5E7EB] text-[#374151] font-semibold hover:bg-[#F8FAFC] transition-all">
              <FiArrowLeft className="w-4 h-4"/> Back
            </button>
            {error && (
              <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0"/>{error}
              </div>
            )}
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={goNext}
              className="ml-auto flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-[#2D5DA8] text-white font-bold hover:bg-[#1E4A85] transition-all shadow-lg">
              Continue <FiArrowRight className="w-4 h-4"/>
            </motion.button>
          </div>
        )}
        {step === "review" && (
          <div className="mt-6 flex justify-start">
            <button onClick={goBack} className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-[#E5E7EB] text-[#374151] font-semibold hover:bg-[#F8FAFC] transition-all">
              <FiArrowLeft className="w-4 h-4"/> Back to Documents
            </button>
          </div>
        )}
      </div>

      {/* ── Document Preview Lightbox ── */}
      <AnimatePresence>
        {previewDoc && (
          <motion.div key="lb" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            onClick={()=>setPreviewDoc(null)} className="fixed inset-0 bg-black/90 z-[500] flex items-center justify-center p-4">
            <button onClick={()=>setPreviewDoc(null)} className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"><FiX className="w-6 h-6"/></button>
            {previewDoc.type?.startsWith("image/") ? (
              <img src={previewDoc.url} alt={previewDoc.label} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" onClick={e=>e.stopPropagation()}/>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center shadow-2xl" onClick={e=>e.stopPropagation()}>
                <FiFile className="w-16 h-16 text-[#2D5DA8] mx-auto mb-4"/>
                <p className="font-bold text-[#1A1A1A] text-lg mb-1">{previewDoc.label}</p>
                <p className="text-[#6B7280] text-sm mb-6">{previewDoc.name}</p>
                <a href={previewDoc.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-[#2D5DA8] text-white font-bold hover:bg-[#1E4A85] transition-all">
                  Open PDF <FiArrowRight className="w-4 h-4"/>
                </a>
              </div>
            )}
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">{previewDoc.label}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
