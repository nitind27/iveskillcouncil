"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiMessageSquare,
  FiSend,
  FiTrash2,
  FiMapPin,
  FiMap,
  FiBook,
  FiArrowRight,
} from "react-icons/fi";
import { useCourseCart } from "@/contexts/CourseCartContext";
import { useUserPanelConfig } from "@/contexts/UserPanelConfigContext";
import type { CourseItem } from "@/config/userpanel.config";

function getSlug(c: CourseItem): string {
  return c.slug || c.id;
}

function BookingContent() {
  const searchParams = useSearchParams();
  const openEnquire = searchParams?.get("enquire") === "1";
  const config = useUserPanelConfig();
  const { items, remove, clear } = useCourseCart();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  useEffect(() => {
    if (openEnquire) return;
  }, [openEnquire]);

  const fetchPincode = useCallback(async () => {
    const pin = String(pincode).trim().replace(/\D/g, "").slice(0, 6);
    if (pin.length !== 6) {
      setPincodeError("Enter a valid 6-digit pincode");
      return;
    }
    setPincodeError("");
    setPincodeLoading(true);
    try {
      const res = await fetch(`/api/pincode/${pin}`);
      const json = await res.json();
      const data = json?.data;
      if (data?.found) {
        setArea(data.area || "");
        setCity(data.city || "");
        setState(data.state || "");
      } else {
        setPincodeError("No details found for this pincode");
      }
    } catch {
      setPincodeError("Could not fetch location. Try again.");
    } finally {
      setPincodeLoading(false);
    }
  }, [pincode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setStatus("submitting");
    const courseNames = items.map((i) => i.course.title).join(", ");
    try {
      const res = await fetch("/api/enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          courseName: courseNames || "General enquiry",
          message: message.trim() || undefined,
          address: address.trim() || undefined,
          pincode: pincode.trim() || undefined,
          area: area.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data?.error || "Something went wrong.");
        return;
      }
      setStatus("success");
      clear();
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  };

  const allCourses = config.courses?.items || [];
  const cartIds = new Set(items.map((i) => i.course.id));
  const suggestedCourses = allCourses.filter((c) => !cartIds.has(c.id)).slice(0, 4);

  if (items.length === 0 && status !== "success") {
    return (
      <div className="min-h-screen py-24 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <h1 className="text-2xl font-bold text-[var(--up-text)] mb-4">Your cart is empty</h1>
          <p className="text-[var(--up-text-muted)] mb-6">
            Add courses from the courses page to book or enquire.
          </p>
          <Link
            href="/userpanel/courses"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--up-accent)] text-white font-semibold"
          >
            Browse courses <FiArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </motion.div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen py-24 px-4 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center rounded-3xl bg-[var(--up-bg-card)] border border-[var(--up-border)] p-8 shadow-lg"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-emerald-600">✓</span>
          </div>
          <h2 className="text-xl font-bold text-[var(--up-text)] mb-2">Request submitted</h2>
          <p className="text-[var(--up-text-muted)] mb-8">
            We have received your enquiry. Our team will contact you shortly.
          </p>
          <Link
            href="/userpanel/courses"
            className="inline-flex items-center gap-2 text-[var(--up-accent)] font-semibold"
          >
            Back to courses <FiArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <Link
            href="/userpanel/courses"
            className="inline-flex items-center gap-2 text-[var(--up-text-muted)] hover:text-[var(--up-accent)] transition-colors text-sm font-medium"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to courses
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 order-2 lg:order-1"
          >
            <h2 className="text-lg font-bold text-[var(--up-text)] mb-4">Selected courses</h2>
            <div className="space-y-3">
              {items.map(({ course }) => (
                <div
                  key={course.id}
                  className="flex gap-3 p-4 rounded-xl bg-[var(--up-bg-card)] border border-[var(--up-border)]"
                >
                  <img
                    src={course.image}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--up-text)] text-sm line-clamp-2">
                      {course.title}
                    </p>
                    <p className="text-xs text-[var(--up-text-muted)]">{course.duration}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(course.id)}
                    className="p-2 rounded-lg text-[var(--up-text-muted)] hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                    aria-label="Remove"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => clear()}
              className="mt-3 text-sm text-[var(--up-text-muted)] hover:text-[var(--up-accent)]"
            >
              Clear all
            </button>
          </motion.div>

          {/* Enquire form - full details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 order-1 lg:order-2"
          >
            <div className="rounded-3xl bg-[var(--up-bg-card)] border border-[var(--up-border)] p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[var(--up-text)] mb-2">Enquire Now</h2>
              <p className="text-[var(--up-text-muted)] text-sm mb-6">
                Share your details and address. We’ll get back to you for the selected course(s).
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--up-text)] mb-1.5">
                    Full name *
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--up-text-subtle)]" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--up-bg)] border border-[var(--up-border)] text-[var(--up-text)] placeholder-[var(--up-text-subtle)] focus:outline-none focus:border-[var(--up-accent)] focus:ring-2 focus:ring-[var(--up-accent)]/20"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[var(--up-text)] mb-1.5">
                      Email *
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--up-text-subtle)]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--up-bg)] border border-[var(--up-border)] text-[var(--up-text)] placeholder-[var(--up-text-subtle)] focus:outline-none focus:border-[var(--up-accent)] focus:ring-2 focus:ring-[var(--up-accent)]/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--up-text)] mb-1.5">
                      Phone *
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--up-text-subtle)]" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--up-bg)] border border-[var(--up-border)] text-[var(--up-text)] placeholder-[var(--up-text-subtle)] focus:outline-none focus:border-[var(--up-accent)] focus:ring-2 focus:ring-[var(--up-accent)]/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--up-text)] mb-1.5">
                    Address
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-3.5 w-4 h-4 text-[var(--up-text-subtle)]" />
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, building, landmark"
                      rows={2}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--up-bg)] border border-[var(--up-border)] text-[var(--up-text)] placeholder-[var(--up-text-subtle)] focus:outline-none focus:border-[var(--up-accent)] focus:ring-2 focus:ring-[var(--up-accent)]/20 resize-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--up-text)] mb-1.5">
                    Pincode (6 digits)
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative flex-1 min-w-[140px]">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setPincode(v);
                          setPincodeError("");
                        }}
                        onBlur={fetchPincode}
                        placeholder="e.g. 110001"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--up-bg)] border border-[var(--up-border)] text-[var(--up-text)] placeholder-[var(--up-text-subtle)] focus:outline-none focus:border-[var(--up-accent)] focus:ring-2 focus:ring-[var(--up-accent)]/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={fetchPincode}
                      disabled={pincodeLoading || pincode.length !== 6}
                      className="px-4 py-3 rounded-xl bg-[var(--up-accent)]/10 text-[var(--up-accent)] font-medium text-sm hover:bg-[var(--up-accent)]/20 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {pincodeLoading ? "..." : "Get area"}
                    </button>
                  </div>
                  {pincodeError && (
                    <p className="mt-1 text-xs text-amber-600">{pincodeError}</p>
                  )}
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--up-text)] mb-1.5">
                      Area / Locality
                    </label>
                    <div className="relative">
                      <FiMap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--up-text-subtle)]" />
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="Auto from pincode"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--up-bg)] border border-[var(--up-border)] text-[var(--up-text)] placeholder-[var(--up-text-subtle)] focus:outline-none focus:border-[var(--up-accent)] focus:ring-2 focus:ring-[var(--up-accent)]/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--up-text)] mb-1.5">
                      City / District
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Auto from pincode"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--up-bg)] border border-[var(--up-border)] text-[var(--up-text)] placeholder-[var(--up-text-subtle)] focus:outline-none focus:border-[var(--up-accent)] focus:ring-2 focus:ring-[var(--up-accent)]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--up-text)] mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Auto from pincode"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--up-bg)] border border-[var(--up-border)] text-[var(--up-text)] placeholder-[var(--up-text-subtle)] focus:outline-none focus:border-[var(--up-accent)] focus:ring-2 focus:ring-[var(--up-accent)]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--up-text)] mb-1.5">
                    Message (optional)
                  </label>
                  <div className="relative">
                    <FiMessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-[var(--up-text-subtle)]" />
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Preferred batch, questions..."
                      rows={3}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--up-bg)] border border-[var(--up-border)] text-[var(--up-text)] placeholder-[var(--up-text-subtle)] focus:outline-none focus:border-[var(--up-accent)] focus:ring-2 focus:ring-[var(--up-accent)]/20 resize-none"
                    />
                  </div>
                </div>
                {errorMsg && (
                  <p className="text-sm text-rose-600">{errorMsg}</p>
                )}
                <motion.button
                  type="submit"
                  disabled={status === "submitting"}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-xl bg-[var(--up-accent)] text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <FiSend className="w-5 h-5" />
                  {status === "submitting" ? "Submitting..." : "Submit enquiry"}
                </motion.button>
              </form>
            </div>

            {/* More courses you might like */}
            {suggestedCourses.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-10 pt-10 border-t border-[var(--up-border)]"
              >
                <h3 className="text-lg font-bold text-[var(--up-text)] mb-2 flex items-center gap-2">
                  <FiBook className="w-5 h-5 text-[var(--up-accent)]" />
                  More courses you might like
                </h3>
                <p className="text-sm text-[var(--up-text-muted)] mb-6">
                  Explore these programs and add to your enquiry.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {suggestedCourses.map((course, i) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 + i * 0.05 }}
                    >
                      <Link
                        href={`/userpanel/courses/${getSlug(course)}`}
                        className="flex gap-4 p-4 rounded-2xl bg-[var(--up-bg-card)] border border-[var(--up-border)] hover:border-[var(--up-accent)]/40 hover:shadow-lg transition-all duration-300 group"
                      >
                        <img
                          src={course.image}
                          alt=""
                          className="w-24 h-24 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[var(--up-text)] line-clamp-2 group-hover:text-[var(--up-accent)] transition-colors">
                            {course.title}
                          </p>
                          <p className="text-xs text-[var(--up-text-muted)] mt-0.5">{course.duration}</p>
                          <span className="inline-flex items-center gap-1 text-[var(--up-accent)] font-semibold text-sm mt-2">
                            View & Enquire <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 rounded-xl bg-[var(--up-accent)]/20 animate-pulse" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
