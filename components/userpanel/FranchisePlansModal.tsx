"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX, FiCheck, FiArrowRight, FiArrowLeft, FiLoader,
  FiShield, FiStar, FiZap, FiAward,
  FiUser, FiMail, FiPhone, FiMapPin, FiMessageSquare,
} from "react-icons/fi";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";

interface Plan {
  id: number;
  name: "SILVER" | "GOLD" | "DIAMOND";
  price: number;
  durationInDays: number;
  status: string;
}

const PLAN_META: Record<string, {
  icon: React.ReactNode;
  tagline: string;
  color: string;
  border: string;
  badge: string;
  badgeBg: string;
  features: string[];
  popular?: boolean;
}> = {
  SILVER: {
    icon: <FiShield className="w-6 h-6" />,
    tagline: "Perfect to get started",
    color: "text-[#6B7280]",
    border: "border-[#E5E7EB]",
    badge: "Starter",
    badgeBg: "bg-[#F3F4F6] text-[#374151]",
    features: ["Up to 50 students", "Basic course management", "Attendance tracking", "Fee reports", "Email support"],
  },
  GOLD: {
    icon: <FiStar className="w-6 h-6" />,
    tagline: "Most popular choice",
    color: "text-[#F39C12]",
    border: "border-[#F39C12]",
    badge: "Most Popular",
    badgeBg: "bg-[#F39C12] text-white",
    features: ["Up to 200 students", "Advanced courses", "Staff management", "Certificates", "Analytics", "Priority support"],
    popular: true,
  },
  DIAMOND: {
    icon: <FiZap className="w-6 h-6" />,
    tagline: "For large-scale operations",
    color: "text-[#2D5DA8]",
    border: "border-[#2D5DA8]",
    badge: "Enterprise",
    badgeBg: "bg-[#2D5DA8] text-white",
    features: ["Unlimited students", "Full system access", "Multi-branch", "Custom branding", "Dedicated manager", "24/7 support"],
  },
};

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = "plans" | "form" | "processing";

export default function FranchisePlansModal({ open, onClose }: Props) {
  const [plans,       setPlans]       = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [step,        setStep]        = useState<Step>("plans");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // Form fields
  const [fullName,   setFullName]   = useState("");
  const [email,      setEmail]      = useState("");
  const [phone,      setPhone]      = useState("");
  const [city,       setCity]       = useState("");
  const [stateName,  setStateName]  = useState("");
  const [address,    setAddress]    = useState("");
  const [message,    setMessage]    = useState("");
  const [formError,  setFormError]  = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load plans when modal opens
  useEffect(() => {
    if (!open || plans.length > 0) return;
    setLoadingPlans(true);
    fetch("/api/franchise-plans/public")
      .then((r) => r.json())
      .then((res) => { if (res.success && Array.isArray(res.data)) setPlans(res.data); })
      .finally(() => setLoadingPlans(false));
  }, [open, plans.length]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep("plans");
        setSelectedPlan(null);
        setFormError("");
        setFullName(""); setEmail(""); setPhone("");
        setCity(""); setStateName(""); setAddress(""); setMessage("");
        setSubmitting(false);
      }, 300);
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const selectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setFormError("");
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const nameR  = validateName(fullName);
    const emailR = validateEmail(email);
    const phoneR = validatePhone(phone);
    if (!nameR.valid)  { setFormError(nameR.error!);  return; }
    if (!emailR.valid) { setFormError(emailR.error!); return; }
    if (!phoneR.valid) { setFormError(phoneR.error!); return; }

    setFormError("");
    setSubmitting(true);
    setStep("processing");

    try {
      const res = await fetch("/api/franchise-payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          planId: selectedPlan.id,
          city: city.trim() || undefined,
          state: stateName.trim() || undefined,
          address: address.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || "Failed to create order. Please try again.");
        setStep("form");
        setSubmitting(false);
        return;
      }

      // Redirect to Cashfree checkout
      const { paymentSessionId } = data.data;
      const cfEnv = process.env.NEXT_PUBLIC_CASHFREE_ENV || "TEST";
      const checkoutUrl =
        cfEnv === "PROD"
          ? `https://payments.cashfree.com/pay/${paymentSessionId}`
          : `https://sandbox.cashfree.com/pay/${paymentSessionId}`;

      window.location.href = checkoutUrl;
    } catch {
      setFormError("Network error. Please try again.");
      setStep("form");
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-[#E5E7EB] bg-white focus:border-[#2D5DA8] focus:ring-2 focus:ring-[#2D5DA8]/15 outline-none transition-all text-sm text-[#1A1A1A] placeholder-[#9CA3AF]";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !submitting && onClose()}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300]"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed inset-0 z-[301] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">

              {/* ── Header ── */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] flex-shrink-0">
                <div className="flex items-center gap-3">
                  {step === "form" && (
                    <button
                      onClick={() => { setStep("plans"); setFormError(""); }}
                      disabled={submitting}
                      className="w-8 h-8 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] transition-colors disabled:opacity-40"
                    >
                      <FiArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div>
                    <h2 className="text-lg font-extrabold text-[#1A1A1A]">
                      {step === "plans" ? "Choose Your Franchise Plan" :
                       step === "form"  ? `Complete Purchase — ${selectedPlan?.name}` :
                       "Processing Payment..."}
                    </h2>
                    {step === "plans" && (
                      <p className="text-xs text-[#6B7280] mt-0.5">Select a plan to get started with your franchise</p>
                    )}
                    {step === "form" && selectedPlan && (
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        ₹{selectedPlan.price.toLocaleString("en-IN")} · {selectedPlan.durationInDays >= 365 ? `${Math.round(selectedPlan.durationInDays / 365)} Year` : `${selectedPlan.durationInDays} Days`}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={submitting}
                  className="w-9 h-9 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] transition-colors disabled:opacity-40"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* ── Body ── */}
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">

                  {/* STEP: Plans */}
                  {step === "plans" && (
                    <motion.div
                      key="plans"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="p-6"
                    >
                      {loadingPlans ? (
                        <div className="flex items-center justify-center py-16 gap-3">
                          <FiLoader className="w-6 h-6 text-[#2D5DA8] animate-spin" />
                          <span className="text-[#6B7280] font-medium">Loading plans...</span>
                        </div>
                      ) : plans.length === 0 ? (
                        <div className="text-center py-16 text-[#6B7280]">No plans available. Please try again later.</div>
                      ) : (
                        <div className="grid sm:grid-cols-3 gap-5">
                          {plans.map((plan, i) => {
                            const meta = PLAN_META[plan.name] || PLAN_META.SILVER;
                            return (
                              <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className={`relative bg-white rounded-2xl border-2 ${meta.border} ${meta.popular ? "shadow-xl" : "shadow-sm"} hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col`}
                              >
                                {meta.popular && (
                                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F39C12] to-[#D68910]" />
                                )}
                                <div className="p-6 flex flex-col flex-1">
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 ${meta.badgeBg}`}>
                                    {meta.badge}
                                  </span>
                                  <div className={`${meta.color} mb-1`}>{meta.icon}</div>
                                  <h3 className="text-xl font-extrabold text-[#1A1A1A] mb-0.5">{plan.name}</h3>
                                  <p className="text-[#6B7280] text-xs mb-4">{meta.tagline}</p>
                                  <div className="mb-4">
                                    <span className="text-3xl font-black text-[#1A1A1A]">₹{plan.price.toLocaleString("en-IN")}</span>
                                    <span className="text-[#6B7280] text-xs ml-1">
                                      / {plan.durationInDays >= 365 ? `${Math.round(plan.durationInDays / 365)}yr` : `${plan.durationInDays}d`}
                                    </span>
                                  </div>
                                  <div className="h-px bg-[#E5E7EB] mb-4" />
                                  <ul className="space-y-2 mb-6 flex-1">
                                    {meta.features.map((f) => (
                                      <li key={f} className="flex items-start gap-2 text-[#374151] text-xs">
                                        <FiCheck className="w-3.5 h-3.5 text-[#A8C63A] flex-shrink-0 mt-0.5" />
                                        {f}
                                      </li>
                                    ))}
                                  </ul>
                                  <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => selectPlan(plan)}
                                    className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                                      meta.popular
                                        ? "bg-[#F39C12] text-white hover:bg-[#D68910]"
                                        : "bg-[#2D5DA8] text-white hover:bg-[#1E4A85]"
                                    }`}
                                  >
                                    Select Plan <FiArrowRight className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* trust strip */}
                      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-[#9CA3AF] text-xs">
                        {["Secure Cashfree Payment", "24hr Account Setup", "Dedicated Support"].map((t) => (
                          <span key={t} className="flex items-center gap-1.5">
                            <FiCheck className="w-3.5 h-3.5 text-[#A8C63A]" />{t}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP: Form */}
                  {step === "form" && selectedPlan && (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="p-6"
                    >
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          {/* Full Name */}
                          <div>
                            <label className="block text-sm font-semibold text-[#374151] mb-1.5">Full Name <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required className={`${inputCls} pl-10`} />
                            </div>
                          </div>
                          {/* Email */}
                          <div>
                            <label className="block text-sm font-semibold text-[#374151] mb-1.5">Email <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className={`${inputCls} pl-10`} />
                            </div>
                          </div>
                          {/* Phone */}
                          <div>
                            <label className="block text-sm font-semibold text-[#374151] mb-1.5">Phone <span className="text-red-500">*</span></label>
                            <div className="relative">
                              <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required className={`${inputCls} pl-10`} />
                            </div>
                          </div>
                          {/* City */}
                          <div>
                            <label className="block text-sm font-semibold text-[#374151] mb-1.5">City</label>
                            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" className={inputCls} />
                          </div>
                          {/* State */}
                          <div>
                            <label className="block text-sm font-semibold text-[#374151] mb-1.5">State</label>
                            <input type="text" value={stateName} onChange={(e) => setStateName(e.target.value)} placeholder="Maharashtra" className={inputCls} />
                          </div>
                          {/* Address */}
                          <div>
                            <label className="block text-sm font-semibold text-[#374151] mb-1.5">Address</label>
                            <div className="relative">
                              <FiMapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9CA3AF]" />
                              <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, Area, Pincode" rows={1} className={`${inputCls} pl-10 resize-none`} />
                            </div>
                          </div>
                        </div>

                        {/* Message */}
                        <div>
                          <label className="block text-sm font-semibold text-[#374151] mb-1.5">Message (Optional)</label>
                          <div className="relative">
                            <FiMessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9CA3AF]" />
                            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Any specific requirements..." rows={2} className={`${inputCls} pl-10 resize-none`} />
                          </div>
                        </div>

                        {/* Error */}
                        {formError && (
                          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                            <FiX className="w-4 h-4 flex-shrink-0 mt-0.5" />{formError}
                          </div>
                        )}

                        {/* Order summary */}
                        <div className="p-4 rounded-2xl bg-[#EEF2F7] border border-[#2D5DA8]/15 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-[#6B7280]">Selected Plan</p>
                            <p className="font-bold text-[#1A1A1A]">{selectedPlan.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-[#6B7280]">Total Amount</p>
                            <p className="text-xl font-black text-[#2D5DA8]">₹{selectedPlan.price.toLocaleString("en-IN")}</p>
                          </div>
                        </div>

                        {/* Submit */}
                        <motion.button
                          type="submit"
                          disabled={submitting}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="w-full py-4 rounded-2xl bg-[#F39C12] text-white font-bold text-base hover:bg-[#D68910] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                        >
                          {submitting ? (
                            <><FiLoader className="w-5 h-5 animate-spin" /> Processing...</>
                          ) : (
                            <>Pay ₹{selectedPlan.price.toLocaleString("en-IN")} via Cashfree <FiArrowRight className="w-5 h-5" /></>
                          )}
                        </motion.button>
                        <p className="text-center text-xs text-[#9CA3AF]">Secured by Cashfree Payments · 256-bit SSL encryption</p>
                      </form>
                    </motion.div>
                  )}

                  {/* STEP: Processing */}
                  {step === "processing" && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-20 gap-5"
                    >
                      <div className="relative">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-4 border-[#2D5DA8]/20 border-t-[#2D5DA8]" />
                        <FiAward className="w-6 h-6 text-[#2D5DA8] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-[#1A1A1A] text-lg">Redirecting to payment...</p>
                        <p className="text-[#6B7280] text-sm mt-1">Please wait, do not close this window.</p>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
