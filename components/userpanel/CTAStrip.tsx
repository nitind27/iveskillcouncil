"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiSend, FiArrowRight, FiCheckCircle, FiMail } from "react-icons/fi";

const perks = [
  "Course updates",
  "Exclusive offers",
  "Learning tips",
  "No spam, ever",
];

export default function CTAStrip() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="relative overflow-hidden bg-[#070F1C] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(196,163,90,0.14),transparent_58%)]" />
      <div className="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-[#1E4A85]/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 top-8 h-56 w-56 rounded-full bg-[#C4A35A]/12 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-[#C4A35A]/25 shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#163A6B] via-[#102A4C] to-[#0B1F38]" />
          <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#C4A35A] via-white/60 to-[#C4A35A]" />

          <div className="relative grid items-center gap-10 p-8 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:p-12">
            <div>
              <span className="mb-4 inline-flex rounded-full border border-[#C4A35A]/35 bg-[#C4A35A]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C4A35A]">
                Get started today
              </span>
              <h2 className="text-3xl font-extrabold leading-tight text-white md:text-4xl">
                Start Your Learning Journey
              </h2>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-white/70">
                Get course updates, exclusive offers and learning tips. Stay connected with IVESDC — no spam, ever.
              </p>

              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {perks.map((perk, i) => (
                  <motion.div
                    key={perk}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.12 + i * 0.06 }}
                    className="flex items-center gap-2.5 text-sm text-white/85"
                  >
                    <FiCheckCircle className="h-4 w-4 flex-shrink-0 text-[#C4A35A]" />
                    {perk}
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/userpanel/courses"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#1E4A85] shadow-lg transition-colors hover:bg-[#EEF2F7]"
                >
                  Browse Courses
                  <FiArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/userpanel/franchise-plans"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/12"
                >
                  Franchise Plans
                  <FiArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/12 bg-black/25 p-6 backdrop-blur-sm sm:p-7">
              {submitted ? (
                <motion.div
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex min-h-[180px] flex-col items-center justify-center text-center"
                >
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#C4A35A] text-lg font-bold text-[#0F172A]">
                    ✓
                  </span>
                  <p className="text-lg font-bold text-white">You&apos;re subscribed</p>
                  <p className="mt-1 text-sm text-white/65">We&apos;ll send useful updates to your inbox.</p>
                </motion.div>
              ) : (
                <>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C4A35A]/15 text-[#C4A35A]">
                      <FiMail className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-bold text-white">Subscribe for updates</p>
                      <p className="text-xs text-white/55">One email. Relevant news only.</p>
                    </div>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3.5 text-sm text-white placeholder-white/45 outline-none transition-colors focus:border-[#C4A35A]/60 focus:bg-white/12"
                    />
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#C4A35A] py-3.5 text-sm font-bold text-[#0F172A] shadow-[0_8px_24px_rgba(196,163,90,0.28)] transition-colors hover:bg-[#A88B48] hover:text-white"
                    >
                      Subscribe
                      <FiSend className="h-4 w-4" />
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
