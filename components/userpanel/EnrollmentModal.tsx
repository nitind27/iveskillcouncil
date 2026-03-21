"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { FiUser, FiMail, FiPhone, FiMessageSquare, FiArrowRight, FiArrowLeft } from "react-icons/fi";
import { GlassModal } from "@/components/common/GlassModal";
import type { CourseItem } from "@/config/userpanel.config";

const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20";
const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

interface EnrollmentModalProps {
  course: CourseItem | null;
  onClose: () => void;
}

export default function EnrollmentModal({ course, onClose }: EnrollmentModalProps) {
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
    if (!course) return;
    setErrorMsg("");
    setStatus("submitting");
    try {
      const res = await fetch("/api/enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          courseName: course.title,
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

  return (
    <GlassModal open={!!course} onClose={onClose} title="Enroll in Course" size="md" contentClassName="!bg-white border-gray-200">
      {course && (
        <>
          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl text-emerald-600">✓</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Request Submitted</h3>
              <p className="text-gray-600 text-sm mb-6">
                We have received your enrollment request for <strong className="text-gray-900">{course.title}</strong>. Our team will contact you shortly.
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
              <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Selected Course</p>
                <p className="font-semibold text-gray-900">{course.title}</p>
                <p className="text-sm text-gray-600">{course.duration}</p>
              </div>

              {/* Step progress */}
              <div className="mb-8 p-4 rounded-2xl bg-cyan-50/50 border border-cyan-100">
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
                            backgroundColor: step >= s.id ? "#06b6d4" : "#e5e7eb",
                            color: step >= s.id ? "#fff" : "#9ca3af",
                            borderColor: step === s.id ? "#06b6d4" : "transparent",
                          }}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors"
                        >
                          {step > s.id ? <span className="text-white">✓</span> : s.id}
                        </motion.div>
                        <span className={`text-xs font-medium mt-2 ${step >= s.id ? "text-cyan-600" : "text-gray-400"}`}>
                          {s.title}
                        </span>
                      </div>
                      {i < 1 && (
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
                            placeholder="Enter your full name"
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
                      <p className="text-gray-600 text-sm mb-4">Any question or preferred batch?</p>
                      <div>
                        <label className={labelClass}>Message (optional)</label>
                        <div className="relative">
                          <FiMessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                          <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Any question or preferred batch..."
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
                      {status === "submitting" ? "Submitting..." : "Submit Request"}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </>
      )}
    </GlassModal>
  );
}
