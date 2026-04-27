"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCheck, FiArrowRight, FiLoader, FiX,
  FiUser, FiMail, FiPhone, FiMapPin, FiMessageSquare,
  FiShield, FiStar, FiZap, FiAward,
} from "react-icons/fi";
import Link from "next/link";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";

import PageLoader from "@/components/common/PageLoader";

interface Plan {
  id: number;
  name: "SILVER" | "GOLD" | "DIAMOND";
  price: number;
  durationInDays: number;
  status: string;
}

// Per-plan features shown on the card
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
    icon: <FiShield className="w-7 h-7" />,
    tagline: "Perfect to get started",
    color: "text-[#6B7280]",
    border: "border-[#E5E7EB]",
    badge: "Starter",
    badgeBg: "bg-[#F3F4F6] text-[#374151]",
    features: [
      "Up to 50 students",
      "Basic course management",
      "Student attendance tracking",
      "Fee collection & reports",
      "Email support",
    ],
  },
  GOLD: {
    icon: <FiStar className="w-7 h-7" />,
    tagline: "Most popular choice",
    color: "text-[#F39C12]",
    border: "border-[#F39C12]",
    badge: "Most Popular",
    badgeBg: "bg-[#F39C12] text-white",
    features: [
      "Up to 200 students",
      "Advanced course management",
      "Staff management",
      "Certificate generation",
      "Analytics & reports",
      "Priority support",
    ],
    popular: true,
  },
  DIAMOND: {
    icon: <FiZap className="w-7 h-7" />,
    tagline: "For large-scale operations",
    color: "text-[#2D5DA8]",
    border: "border-[#2D5DA8]",
    badge: "Enterprise",
    badgeBg: "bg-[#2D5DA8] text-white",
    features: [
      "Unlimited students",
      "Full system access",
      "Multi-branch support",
      "Custom branding",
      "Advanced analytics",
      "Dedicated account manager",
      "24/7 priority support",
    ],
  },
};

export default function FranchisePlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // Form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetch("/api/franchise-plans/public")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setPlans(res.data);
        } else {
          setFetchError("No plans available at the moment. Please try again later.");
        }
      })
      .catch(() => setFetchError("Failed to load plans. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

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
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return <PageLoader text="Loading plans..." />;
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <FiX className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Could not load plans</h2>
          <p className="text-[#6B7280] mb-6">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-[#2D5DA8] text-white font-semibold hover:bg-[#1E4A85] transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2D5DA8] via-[#1E4A85] to-[#1a3d70] py-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(168,198,58,0.12),transparent)]" />
        <div className="absolute -bottom-1 left-0 right-0 h-16 bg-[#F8FAFC]" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center relative"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-sm font-semibold uppercase tracking-wider mb-5">
            <FiAward className="w-4 h-4 text-[#A8C63A]" />
            Franchise Plans
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Choose the Right Plan<br />for Your Franchise
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Start your education franchise journey. Pick a plan, complete payment, and our team will set up your account within 24 hours.
          </p>
        </motion.div>
      </div>

      {/* ── Plans Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan, i) => {
            const meta = PLAN_META[plan.name] || PLAN_META.SILVER;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 100, damping: 18 }}
                className={`relative bg-white rounded-3xl border-2 ${meta.border} shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${meta.popular ? "scale-105 md:scale-105" : ""}`}
              >
                {/* popular ribbon */}
                {meta.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F39C12] to-[#D68910]" />
                )}

                <div className="p-8">
                  {/* badge */}
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 ${meta.badgeBg}`}>
                    {meta.badge}
                  </span>

                  {/* icon + name */}
                  <div className={`${meta.color} mb-2`}>{meta.icon}</div>
                  <h3 className="text-2xl font-extrabold text-[#1A1A1A] mb-1">{plan.name}</h3>
                  <p className="text-[#6B7280] text-sm mb-6">{meta.tagline}</p>

                  {/* price */}
                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      <span className="text-5xl font-black text-[#1A1A1A]">
                        ₹{plan.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="text-[#6B7280] text-sm mt-1">
                      Valid for {plan.durationInDays >= 365
                        ? `${Math.round(plan.durationInDays / 365)} year${Math.round(plan.durationInDays / 365) > 1 ? "s" : ""}`
                        : `${plan.durationInDays} days`}
                    </p>
                  </div>

                  {/* divider */}
                  <div className="h-px bg-[#E5E7EB] mb-6" />

                  {/* features */}
                  <ul className="space-y-3 mb-8">
                    {meta.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-[#374151] text-sm">
                        <FiCheck className="w-4 h-4 text-[#A8C63A] flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedPlan(plan); setFormError(""); }}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                      meta.popular
                        ? "bg-[#F39C12] text-white hover:bg-[#D68910]"
                        : "bg-[#2D5DA8] text-white hover:bg-[#1E4A85]"
                    }`}
                  >
                    Get Started
                    <FiArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* trust strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-[#6B7280] text-sm"
        >
          {["Secure Cashfree Payment", "24hr Account Setup", "Dedicated Support", "100% Genuine"].map((t) => (
            <span key={t} className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-[#A8C63A]" />
              {t}
            </span>
          ))}
        </motion.div>

        <div className="text-center mt-10">
          <Link href="/userpanel" className="text-[#2D5DA8] font-semibold hover:underline text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* ── Purchase Modal ── */}
      <AnimatePresence>
        {selectedPlan && (
          <>
            {/* backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setSelectedPlan(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
            />

            {/* modal */}
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* modal header */}
                <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-[#E5E7EB] flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-[#1A1A1A]">Complete Purchase</h2>
                    <p className="text-sm text-[#6B7280] mt-0.5">
                      {selectedPlan.name} Plan —{" "}
                      <span className="font-bold text-[#2D5DA8]">
                        ₹{selectedPlan.price.toLocaleString("en-IN")}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => !submitting && setSelectedPlan(null)}
                    disabled={submitting}
                    className="w-9 h-9 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#1A1A1A] transition-colors disabled:opacity-40"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] focus:border-[#2D5DA8] focus:ring-2 focus:ring-[#2D5DA8]/15 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] focus:border-[#2D5DA8] focus:ring-2 focus:ring-[#2D5DA8]/15 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-1.5">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] focus:border-[#2D5DA8] focus:ring-2 focus:ring-[#2D5DA8]/15 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* City + State */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-[#374151] mb-1.5">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Mumbai"
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] focus:border-[#2D5DA8] focus:ring-2 focus:ring-[#2D5DA8]/15 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#374151] mb-1.5">State</label>
                      <input
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        placeholder="Maharashtra"
                        className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] focus:border-[#2D5DA8] focus:ring-2 focus:ring-[#2D5DA8]/15 outline-none transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-1.5">Address</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9CA3AF]" />
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street, Area, Pincode"
                        rows={2}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] focus:border-[#2D5DA8] focus:ring-2 focus:ring-[#2D5DA8]/15 outline-none transition-all resize-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-[#374151] mb-1.5">Message (Optional)</label>
                    <div className="relative">
                      <FiMessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-[#9CA3AF]" />
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Any specific requirements..."
                        rows={2}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E7EB] focus:border-[#2D5DA8] focus:ring-2 focus:ring-[#2D5DA8]/15 outline-none transition-all resize-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {formError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                      <FiX className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {formError}
                    </div>
                  )}

                  {/* order summary */}
                  <div className="p-4 rounded-2xl bg-[#EEF2F7] border border-[#2D5DA8]/15">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#6B7280]">Plan</span>
                      <span className="font-semibold text-[#1A1A1A]">{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#6B7280]">Duration</span>
                      <span className="font-semibold text-[#1A1A1A]">
                        {selectedPlan.durationInDays >= 365
                          ? `${Math.round(selectedPlan.durationInDays / 365)} Year`
                          : `${selectedPlan.durationInDays} Days`}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-[#2D5DA8]/15">
                      <span className="text-[#1A1A1A]">Total Amount</span>
                      <span className="text-[#2D5DA8]">₹{selectedPlan.price.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan(null)}
                      disabled={submitting}
                      className="flex-1 py-3 rounded-2xl border-2 border-[#E5E7EB] text-[#374151] font-semibold text-sm hover:bg-[#F8FAFC] transition-all disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 py-3 rounded-2xl bg-[#F39C12] text-white font-bold text-sm hover:bg-[#D68910] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                    >
                      {submitting ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Pay ₹{selectedPlan.price.toLocaleString("en-IN")}
                          <FiArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-center text-xs text-[#9CA3AF]">
                    Secured by Cashfree Payments · 256-bit SSL
                  </p>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
