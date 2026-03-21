"use client";

import { useState } from "react";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiMapPin, FiTag, FiMessageSquare, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import { GlassModal } from "@/components/common/GlassModal";
import { usePincodeLookup } from "@/hooks/usePincodeLookup";

const INVESTMENT_OPTIONS = [
  { value: "", label: "Select investment range" },
  { value: "10-25L", label: "₹10L - ₹25L" },
  { value: "25-50L", label: "₹25L - ₹50L" },
  { value: "50L-1Cr", label: "₹50L - ₹1 Cr" },
  { value: "1Cr+", label: "₹1 Cr+" },
];

const STEPS = [
  { id: 1, title: "Contact Info" },
  { id: 2, title: "Location & Investment" },
  { id: 3, title: "Message" },
];

const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

export interface FranchiseForInquiry {
  id?: string;
  name: string;
}

interface FranchiseInquiryModalProps {
  open: boolean;
  onClose: () => void;
  /** Franchise user is inquiring about (from Visit button) */
  franchise?: FranchiseForInquiry | null;
}

export default function FranchiseInquiryModal({ open, onClose, franchise }: FranchiseInquiryModalProps) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [investmentRange, setInvestmentRange] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [direction, setDirection] = useState(0);

  const { fetchByPincode, loading: pincodeLoading, error: pincodeError, clearError: clearPincodeError } = usePincodeLookup(
    (data) => {
      setCity(data.city);
      setState(data.state);
    }
  );

  const totalSteps = 3;

  const goNext = () => {
    if (step === 1) {
      const nameR = validateName(fullName);
      const emailR = validateEmail(email);
      const phoneR = validatePhone(phone);
      if (!nameR.valid) { setErrorMsg(nameR.error!); return; }
      if (!emailR.valid) { setErrorMsg(emailR.error!); return; }
      if (!phoneR.valid) { setErrorMsg(phoneR.error!); return; }
    }
    setErrorMsg("");
    setDirection(1);
    setStep((s) => Math.min(s + 1, totalSteps));
  };
  const goPrev = () => {
    setErrorMsg("");
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const canProceedStep1 = fullName.trim() && email.trim() && phone.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setStatus("submitting");
    try {
      const res = await fetch("/api/franchise-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          investmentRange: investmentRange || undefined,
          message: message.trim() || undefined,
          franchiseId: franchise?.id || undefined,
          franchiseName: franchise?.name || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data?.error || "Something went wrong.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  return (
    <GlassModal open={open} onClose={onClose} title={franchise ? `Inquiry: ${franchise.name}` : "Apply for Franchise"} size="md" contentClassName="!bg-white border-gray-200">
      {status === "success" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-emerald-600">✓</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Inquiry Submitted</h3>
          <p className="text-gray-600 text-sm mb-6">
            Thank you for your interest. Our franchise team will get in touch with you with details and next steps.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 font-medium hover:bg-cyan-500/30 transition-colors"
          >
            Close
          </button>
        </motion.div>
      ) : (
        <>
          {franchise && (
            <div className="mb-6 p-4 rounded-xl bg-cyan-50 border border-cyan-200">
              <p className="text-sm text-cyan-800 font-medium">Inquiring about: {franchise.name}</p>
            </div>
          )}
          {/* Step progress */}
          <div className="mb-8 p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
            <div className="flex items-center justify-between gap-2">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <motion.div
                      animate={{
                        scale: step === s.id ? 1.05 : 1,
                        backgroundColor: step >= s.id ? "#06b6d4" : "#e5e7eb",
                        color: step >= s.id ? "#fff" : "#9ca3af",
                        borderColor: step === s.id ? "#06b6d4" : "transparent",
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors"
                    >
                      {step > s.id ? <span className="text-white">✓</span> : s.id}
                    </motion.div>
                    <span className={`text-xs font-medium mt-2 text-center max-w-[70px] truncate sm:max-w-none ${step >= s.id ? "text-cyan-600" : "text-gray-400"}`}>
                      {s.title}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 min-w-[12px] mx-2 h-1 bg-gray-200 rounded-full overflow-hidden self-start mt-4">
                      <motion.div
                        className="h-full bg-cyan-500 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: step > s.id ? "100%" : "0%" }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-center">
              <span className="text-xs text-gray-500">Step {step} of {totalSteps}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  initial={{ opacity: 0, x: direction >= 0 ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction >= 0 ? -40 : 40 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="space-y-4"
                >
                  <p className="text-gray-600 text-sm mb-4">Share your contact details to get started.</p>
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Email *</label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. name@example.com"
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Phone *</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  initial={{ opacity: 0, x: direction >= 0 ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction >= 0 ? -40 : 40 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="space-y-4"
                >
                  <p className="text-gray-600 text-sm mb-4">Where are you located and what&apos;s your investment capacity?</p>
                  <div>
                    <label className={labelClass}>Pincode</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => {
                            setPincode(e.target.value);
                            clearPincodeError();
                          }}
                          placeholder="6-digit pincode"
                          maxLength={6}
                          className={inputClass}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => fetchByPincode(pincode)}
                        disabled={pincodeLoading || pincode.trim().replace(/\D/g, "").length !== 6}
                        className="px-4 py-3 rounded-xl bg-cyan-500/10 text-cyan-600 font-medium hover:bg-cyan-500/20 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap flex items-center gap-2"
                      >
                        {pincodeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get area"}
                      </button>
                    </div>
                    {pincodeError && <p className="mt-1 text-xs text-amber-600">{pincodeError}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>City</label>
                      <div className="relative">
                        <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Auto from pincode"
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Auto from pincode"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Expected Investment Range</label>
                    <div className="relative">
                      <FiTag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        value={investmentRange}
                        onChange={(e) => setInvestmentRange(e.target.value)}
                        className={inputClass + " appearance-none cursor-pointer"}
                      >
                        {INVESTMENT_OPTIONS.map((opt) => (
                          <option key={opt.value || "none"} value={opt.value} className="bg-white text-gray-900">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  initial={{ opacity: 0, x: direction >= 0 ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction >= 0 ? -40 : 40 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="space-y-4"
                >
                  <p className="text-gray-600 text-sm mb-4">Any additional details or questions?</p>
                  <div>
                    <label className={labelClass}>Message (optional)</label>
                    <div className="relative">
                      <FiMessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell us about your experience or questions..."
                        rows={4}
                        className={inputClass + " resize-none"}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {errorMsg && <p className="text-sm text-rose-600 mt-4">{errorMsg}</p>}

            <div className="flex gap-3 mt-6">
              {step === 1 ? (
                <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              ) : (
                <button type="button" onClick={goPrev} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2">
                  <FiArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={step === 1 && !canProceedStep1}
                  className="flex-1 py-3 rounded-xl bg-cyan-500 text-white font-semibold hover:bg-cyan-600 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                >
                  Next <FiArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-400 hover:to-blue-500 disabled:opacity-60 transition-all"
                >
                  {status === "submitting" ? "Submitting..." : "Submit Inquiry"}
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </GlassModal>
  );
}
