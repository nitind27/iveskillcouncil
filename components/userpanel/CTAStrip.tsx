"use client";

import { motion } from "framer-motion";
import { FiSend, FiArrowRight } from "react-icons/fi";
import { useState } from "react";
import Link from "next/link";

export default function CTAStrip() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* IVESDC brand gradient — Blue primary */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2D5DA8] via-[#1E4A85] to-[#1a3d70]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(168,198,58,0.12),transparent)]" />
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-[#A8C63A]/10 blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs font-bold uppercase tracking-widest mb-5">
            Get Started Today
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Start Your Learning Journey
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
            Get course updates, exclusive offers and learning tips. No spam, ever.
          </p>

          {submitted ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/15 border border-white/25 text-white font-semibold text-lg"
            >
              <span className="w-6 h-6 rounded-full bg-[#A8C63A] flex items-center justify-center text-white text-sm font-bold">✓</span>
              You&apos;re subscribed!
            </motion.div>
          ) : (
            <motion.form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="flex-1 px-5 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white/50 transition-all"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-4 rounded-xl bg-[#F39C12] text-white font-bold flex items-center justify-center gap-2 shadow-xl hover:bg-[#D68910] transition-all"
              >
                Subscribe <FiSend className="w-4 h-4" />
              </motion.button>
            </motion.form>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/userpanel/courses">
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#A8C63A] text-[#1A1A1A] font-bold hover:bg-[#8FA92F] transition-all cursor-pointer text-sm shadow-lg"
              >
                Browse Courses <FiArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
            <Link href="/userpanel/franchise-plans">
              <motion.span
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-white/30 text-white font-semibold hover:bg-white/10 transition-all cursor-pointer text-sm"
              >
                Franchise Plans <FiArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
