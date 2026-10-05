"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePincodeLookup } from "@/hooks/usePincodeLookup";
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
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import type { CourseItem } from "@/config/userpanel.config";
import { upButton } from "@/components/userpanel/ui/button";

function getSlug(c: CourseItem): string {
  return c.slug || c.id;
}

const fieldClass =
  "w-full rounded-xl border border-ive-line bg-[#F7FAFE] py-3 text-sm text-ive-navy outline-none transition placeholder:text-ive-slate/70 focus:border-ive-royal/35 focus:bg-white focus:ring-4 focus:ring-ive-royal/10";
const labelClass = "mb-1.5 block text-sm font-semibold text-ive-navy";

function BookingContent() {
  const searchParams = useSearchParams();
  const openEnquire = searchParams?.get("enquire") === "1";
  const config = useUserPanelConfig();
  const { items, remove, clear } = useCourseCart();

  // Direct enrolment from franchise course page (URL params)
  const directFranchiseId = searchParams?.get("franchiseId") || "";
  const directCourseId = searchParams?.get("courseId") || "";
  const directCourseName = searchParams?.get("courseName") || "";
  const directEnrolment = !!(directFranchiseId && directCourseId && directCourseName);
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

  const { fetchByPincode, loading: pincodeLoading, error: pincodeError, clearError: clearPincodeError } = usePincodeLookup((data) => {
    setArea(data.area);
    setCity(data.city);
    setState(data.state);
  });

  useEffect(() => {
    if (openEnquire) return;
  }, [openEnquire]);

  const fetchPincode = () => fetchByPincode(pincode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameR = validateName(fullName);
    const emailR = validateEmail(email);
    const phoneR = validatePhone(phone);
    if (!nameR.valid) { setErrorMsg(nameR.error!); setStatus("idle"); return; }
    if (!emailR.valid) { setErrorMsg(emailR.error!); setStatus("idle"); return; }
    if (!phoneR.valid) { setErrorMsg(phoneR.error!); setStatus("idle"); return; }
    setErrorMsg("");
    setStatus("submitting");
    const courseNames = directEnrolment
      ? decodeURIComponent(directCourseName)
      : items.map((i) => i.course.title).join(", ");
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
      if (!directEnrolment) clear();
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  };

  const allCourses = config.courses?.items || [];
  const cartIds = new Set(items.map((i) => i.course.id));
  const suggestedCourses = allCourses.filter((c) => !cartIds.has(c.id)).slice(0, 4);

  const hasCourses = directEnrolment || items.length > 0;

  if (!hasCourses && status !== "success") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F4F7FB] px-4 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md rounded-[1.5rem] border border-ive-line bg-white px-8 py-10 shadow-[0_22px_50px_-32px_rgba(6,27,54,0.4)]"
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ive-saffron/10 text-ive-saffron">
            <FiBook className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-2xl font-extrabold text-ive-navy">Your cart is empty</h1>
          <p className="mb-6 mt-2 text-ive-slate">
            Add courses from the courses page to book or enquire.
          </p>
          <Link
            href={directEnrolment ? "/userpanel/franchises" : "/userpanel/courses"}
            className={upButton("primary", "md")}
          >
            {directEnrolment ? "Browse franchises" : "Browse courses"} <FiArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F4F7FB] px-4 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-[1.5rem] border border-ive-line bg-white p-8 text-center shadow-[0_22px_50px_-32px_rgba(6,27,54,0.4)]"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-ive-emerald/15">
            <span className="text-3xl text-ive-emerald">✓</span>
          </div>
          <h2 className="mb-2 text-xl font-extrabold text-ive-navy">Request submitted</h2>
          <p className="mb-8 text-ive-slate">
            We have received your enquiry. Our team will contact you shortly.
          </p>
          <Link
            href={directEnrolment ? "/userpanel/franchises" : "/userpanel/courses"}
            className="inline-flex items-center gap-2 font-bold text-ive-royal hover:text-ive-navy"
          >
            Back to {directEnrolment ? "franchises" : "courses"} <FiArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F4F7FB]">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-ive-navy via-[#0A2748] to-[#124E96]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_0%,rgba(255,133,0,0.22),transparent_34%),radial-gradient(circle_at_10%_100%,rgba(21,154,112,0.16),transparent_32%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-8">
          <Link
            href={directEnrolment ? `/userpanel/franchise/${directFranchiseId}/courses` : "/userpanel/courses"}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/75 transition hover:text-white"
          >
            <FiArrowLeft className="h-4 w-4" /> Back to courses
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Course <span className="text-ive-saffron">enquiry</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
            Share your details for the selected course. The institute team will contact you.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-8 max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Cart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="order-2 rounded-[1.4rem] border border-ive-line bg-white p-5 shadow-[0_18px_40px_-28px_rgba(6,27,54,0.4)] lg:order-1 lg:col-span-1"
          >
            <h2 className="mb-4 text-lg font-extrabold text-ive-navy">Selected courses</h2>
            <div className="space-y-3">
              {directEnrolment ? (
                <div className="flex gap-3 rounded-xl border border-ive-line bg-[#F7FAFE] p-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-ive-saffron/10">
                    <FiBook className="h-8 w-8 text-ive-saffron" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-ive-navy">
                      {decodeURIComponent(directCourseName)}
                    </p>
                  </div>
                </div>
              ) : (
                items.map(({ course }) => (
                  <div
                    key={course.id}
                    className="flex gap-3 rounded-xl border border-ive-line bg-[#F7FAFE] p-3"
                  >
                    <img
                      src={course.image}
                      alt=""
                      className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-ive-navy">
                        {course.title}
                      </p>
                      <p className="text-xs text-ive-slate">{course.duration}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(course.id)}
                      className="rounded-lg p-2 text-ive-slate transition-colors hover:bg-rose-500/10 hover:text-rose-600"
                      aria-label="Remove"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
            {!directEnrolment && (
              <button
                type="button"
                onClick={() => clear()}
                className="mt-3 text-sm font-semibold text-ive-slate hover:text-ive-saffron"
              >
                Clear all
              </button>
            )}
          </motion.div>

          {/* Enquire form - full details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="order-1 lg:order-2 lg:col-span-2"
          >
            <div className="overflow-hidden rounded-[1.4rem] border border-ive-line bg-white shadow-[0_18px_40px_-28px_rgba(6,27,54,0.4)]">
              <div className="h-1 bg-gradient-to-r from-ive-saffron via-ive-royal to-ive-emerald" aria-hidden />
              <div className="p-6 md:p-8">
              <h2 className="mb-2 text-xl font-extrabold text-ive-navy">Enquire now</h2>
              <p className="mb-6 text-sm text-ive-slate">
                Share your details and address. We’ll get back to you for the selected course(s).
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={labelClass}>
                    Full name *
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ive-slate" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className={`${fieldClass} pl-10 pr-4`}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>
                      Email *
                    </label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ive-slate" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className={`${fieldClass} pl-10 pr-4`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>
                      Phone *
                    </label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ive-slate" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className={`${fieldClass} pl-10 pr-4`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Address
                  </label>
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-3.5 w-4 h-4 text-ive-slate" />
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, building, landmark"
                      rows={2}
                      className={`${fieldClass} resize-none pl-10 pr-4`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
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
                          clearPincodeError();
                        }}
                        onBlur={fetchPincode}
                        placeholder="e.g. 110001"
                        className={`${fieldClass} px-4`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={fetchPincode}
                      disabled={pincodeLoading || pincode.length !== 6}
                      className="rounded-xl bg-ive-navy px-4 py-3 text-sm font-bold text-white transition hover:bg-ive-royal disabled:pointer-events-none disabled:opacity-50"
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
                    <label className={labelClass}>
                      Area / Locality
                    </label>
                    <div className="relative">
                      <FiMap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ive-slate" />
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="Auto from pincode"
                        className={`${fieldClass} pl-10 pr-4`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>
                      City / District
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Auto from pincode"
                      className={`${fieldClass} px-4`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      State
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="Auto from pincode"
                      className={`${fieldClass} px-4`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Message (optional)
                  </label>
                  <div className="relative">
                    <FiMessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-ive-slate" />
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Preferred batch, questions..."
                      rows={3}
                      className={`${fieldClass} resize-none pl-10 pr-4`}
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
                  className={upButton("primary", "lg", "w-full")}
                >
                  <FiSend className="w-5 h-5" />
                  {status === "submitting" ? "Submitting..." : "Submit enquiry"}
                </motion.button>
              </form>
              </div>
            </div>

            {/* More courses you might like - only when using cart, not direct enrolment */}
            {!directEnrolment && suggestedCourses.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8"
              >
                <h3 className="mb-2 flex items-center gap-2 text-lg font-extrabold text-ive-navy">
                  <FiBook className="h-5 w-5 text-ive-saffron" />
                  More courses you might like
                </h3>
                <p className="mb-6 text-sm text-ive-slate">
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
                        className="group flex gap-4 rounded-2xl border border-ive-line bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-ive-royal/30 hover:shadow-[0_18px_40px_-28px_rgba(6,27,54,0.45)]"
                      >
                        <img
                          src={course.image}
                          alt=""
                          className="w-24 h-24 rounded-xl object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="line-clamp-2 font-bold text-ive-navy transition-colors group-hover:text-ive-royal">
                            {course.title}
                          </p>
                          <p className="mt-0.5 text-xs text-ive-slate">{course.duration}</p>
                          <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-ive-saffron">
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
          <div className="h-10 w-10 animate-pulse rounded-xl bg-ive-saffron/20" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
