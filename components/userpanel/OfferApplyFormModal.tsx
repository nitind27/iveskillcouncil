"use client";

import { useState } from "react";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiMessageSquare, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { GlassModal } from "@/components/common/GlassModal";
import type { OfferItem } from "@/config/userpanel.config";

const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

interface OfferApplyFormModalProps {
  open: boolean;
  onClose: () => void;
  offer: OfferItem | null;
}

export default function OfferApplyFormModal({
  open,
  onClose,
  offer,
}: OfferApplyFormModalProps) {
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [direction, setDirection] = useState(0);

  const totalSteps = 2;

  const goNext = () => {
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
    if (!offer) return;
    const nameR = validateName(fullName);
    const emailR = validateEmail(email);
    const phoneR = validatePhone(phone);
    if (!nameR.valid) { setErrorMsg(nameR.error!); return; }
    if (!emailR.valid) { setErrorMsg(emailR.error!); return; }
    if (!phoneR.valid) { setErrorMsg(phoneR.error!); return; }
    setErrorMsg("");
    setStatus("submitting");
    try {
      const res = await fetch("/api/offer-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          offerId: offer.id,
          offerTitle: offer.title,
          message: message.trim() || undefined,
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

  const handleClose = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setStep(1);
    setStatus("idle");
    setErrorMsg("");
    onClose();
  };

  return (
    <GlassModal
      open={open}
      onClose={handleClose}
      title="Apply for Offer"
      size="md"
      showCloseButton
      backdropClassName="bg-black/40 backdrop-blur-xl"
      contentClassName="!bg-white border-gray-200"
    >
      {status === "success" ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-emerald-600">✓</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Application Submitted</h3>
          <p className="text-gray-600 text-sm mb-6">
            Thank you for applying. We will contact you shortly with next steps.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-medium hover:bg-cyan-500/30 transition-colors"
          >
            Close
          </button>
        </motion.div>
      ) : (
        <>
          {offer && (
            <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-amber-700 font-bold">{offer.title}</p>
              <p className="text-amber-600 text-sm mt-1">{offer.discount}% OFF</p>
            </div>
          )}

          {/* Step progress */}
          <div className="mb-8 p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
            <div className="flex items-center justify-between gap-2">
              {[
                { id: 1, title: "Contact" },
                { id: 2, title: "Message" },
              ].map((s, i) => (
                <div key={s.id} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <motion.div
                      animate={{
                        scale: step === s.id ? 1.05 : 1,
                        backgroundColor: step >= s.id ? "#f59e0b" : "#e5e7eb",
                        color: step >= s.id ? "#fff" : "#9ca3af",
                        borderColor: step === s.id ? "#f59e0b" : "transparent",
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors"
                    >
                      {step > s.id ? <span className="text-white">✓</span> : s.id}
                    </motion.div>
                    <span className={`text-xs font-medium mt-2 ${step >= s.id ? "text-amber-600" : "text-gray-400"}`}>
                      {s.title}
                    </span>
                  </div>
                  {i < 1 && (
                    <div className="flex-1 min-w-[12px] mx-2 h-1 bg-gray-200 rounded-full overflow-hidden self-start mt-4">
                      <motion.div
                        className="h-full bg-amber-500 rounded-full"
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
                  <p className="text-gray-600 text-sm mb-4">Enter your contact details.</p>
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
                        placeholder="your@email.com"
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
                  <p className="text-gray-600 text-sm mb-4">Any questions or notes?</p>
                  <div>
                    <label className={labelClass}>Message (optional)</label>
                    <div className="relative">
                      <FiMessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Any questions or notes..."
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
                <button type="button" onClick={handleClose} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
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
                  className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                >
                  Next <FiArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-400 hover:to-orange-400 disabled:opacity-60 transition-all"
                >
                  {status === "submitting" ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </GlassModal>
  );
}
