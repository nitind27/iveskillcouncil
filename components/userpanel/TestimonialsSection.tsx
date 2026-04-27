"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiStar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaQuoteLeft } from "react-icons/fa";
import { useUserPanelConfig } from "@/contexts/UserPanelConfigContext";
import type { TestimonialItem } from "@/config/userpanel.config";

export default function TestimonialsSection() {
  const config = useUserPanelConfig();
  const { testimonials } = config;
  const items: TestimonialItem[] = testimonials?.items || [];
  const [active, setActive] = useState(0);

  if (items.length === 0) return null;

  const t = items[active];
  const hasMultiple = items.length > 1;

  const goPrev = () => setActive((a) => (a === 0 ? items.length - 1 : a - 1));
  const goNext = () => setActive((a) => (a === items.length - 1 ? 0 : a + 1));

  return (
    <section id="testimonials" className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[var(--up-bg)]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#2D5DA8]/[0.05] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#2D5DA8]/10 border border-[#2D5DA8]/20 text-[#2D5DA8] text-sm font-semibold uppercase tracking-wider mb-4">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] tracking-tight">
            {testimonials?.sectionTitle || "What Our Students Say"}
          </h2>
        </motion.div>

        {/* card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="relative rounded-3xl bg-white border border-[var(--up-border)] shadow-xl overflow-hidden p-8 md:p-12"
          >
            {/* top accent bar — brand blue + green */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#2D5DA8] via-[#A8C63A] to-[#F39C12]" />

            {/* quote icon */}
            <FaQuoteLeft className="w-10 h-10 text-[#2D5DA8]/15 mb-6" />

            {/* stars */}
            <div className="flex gap-1 mb-5">
              {Array.from({ length: Math.min(5, Math.max(1, t.rating)) }).map((_, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 400 }}
                >
                  <FiStar className="w-5 h-5 text-[#F39C12] fill-[#F39C12]" />
                </motion.span>
              ))}
            </div>

            {/* text */}
            <p className="text-[#374151] text-xl md:text-2xl font-medium leading-relaxed mb-8">
              &ldquo;{t.text}&rdquo;
            </p>

            {/* author */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-[#2D5DA8]/20 shadow-md flex-shrink-0">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face";
                  }}
                />
              </div>
              <div>
                <p className="font-bold text-[#1A1A1A] text-base">{t.name}</p>
                <p className="text-sm text-[#2D5DA8] font-medium">{t.role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* nav */}
        {hasMultiple && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={goPrev}
              aria-label="Previous"
              className="w-12 h-12 rounded-2xl bg-white border border-[var(--up-border)] flex items-center justify-center text-[#374151] hover:border-[#2D5DA8]/40 hover:text-[#2D5DA8] transition-all shadow-sm"
            >
              <FiChevronLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Testimonial ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === active ? "w-8 bg-[#2D5DA8]" : "w-2 bg-[var(--up-border)] hover:bg-[#2D5DA8]/40"
                  }`}
                />
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={goNext}
              aria-label="Next"
              className="w-12 h-12 rounded-2xl bg-white border border-[var(--up-border)] flex items-center justify-center text-[#374151] hover:border-[#2D5DA8]/40 hover:text-[#2D5DA8] transition-all shadow-sm"
            >
              <FiChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        )}
      </div>
    </section>
  );
}
