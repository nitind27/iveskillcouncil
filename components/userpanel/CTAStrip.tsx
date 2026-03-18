"use client";

import { motion } from "framer-motion";
import { FiSend } from "react-icons/fi";
import { useState } from "react";

export default function CTAStrip() {
  const [email, setEmail] = useState("");

  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[var(--up-bg-muted)] border-y border-[var(--up-border)]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto relative text-center"
      >
        <h2 className="text-2xl md:text-4xl font-bold text-[var(--up-text)] mb-2">
          Start Your Learning Journey Today
        </h2>
        <p className="text-[var(--up-text-muted)] mb-8 max-w-xl mx-auto">
          Get course updates, offers and tips. No spam.
        </p>
        <motion.form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="flex-1 px-5 py-4 rounded-xl bg-[var(--up-bg-card)] border border-[var(--up-border)] text-[var(--up-text)] placeholder-[var(--up-text-subtle)] focus:outline-none focus:border-[var(--up-accent)] focus:ring-2 focus:ring-[var(--up-accent)]/20 transition-all"
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-4 rounded-xl bg-[var(--up-accent)] font-semibold text-white flex items-center justify-center gap-2 shadow-lg border border-[var(--up-border)] hover:bg-[var(--up-accent-hover)] transition-all"
          >
            Subscribe <FiSend className="w-4 h-4" />
          </motion.button>
        </motion.form>
      </motion.div>
    </section>
  );
}
