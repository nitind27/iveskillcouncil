"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiStar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
    <section
      id="testimonials"
      className="relative py-24 px-4 sm:px-6 lg:px-8 panel-perspective overflow-hidden bg-[var(--up-bg)]"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--up-accent)]/[0.05] blur-[100px] rounded-full -z-10" />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-[var(--up-accent)]/10 border border-[var(--up-accent)]/20 text-[var(--up-accent)] text-sm font-semibold uppercase tracking-wider mb-3"
          >
            Testimonials
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-[var(--up-text)] tracking-tight"
          >
            {testimonials?.sectionTitle || "What Our Students Say"}
          </motion.h2>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="relative"
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute -inset-1 bg-[var(--up-accent)]/10 rounded-3xl blur-xl opacity-0 hover:opacity-100 transition duration-500"
            />
            <div className="relative rounded-3xl bg-[var(--up-bg-card)] border border-[var(--up-border)] p-8 md:p-10 shadow-sm overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col md:flex-row items-center gap-6 md:gap-8"
              >
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 border-[var(--up-border)] shadow-xl ring-2 ring-[var(--up-accent)]/20"
                >
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face";
                    }}
                  />
                </motion.div>
                <div className="flex-1 text-center md:text-left">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex justify-center md:justify-start gap-1 mb-3"
                  >
                    {Array.from({ length: Math.min(5, Math.max(1, t.rating)) }).map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.25 + i * 0.05, type: "spring", stiffness: 400 }}
                      >
                        <FiStar className="w-5 h-5 text-amber-500 fill-amber-500" />
                      </motion.span>
                    ))}
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="text-[var(--up-text-muted)] text-lg leading-relaxed mb-4"
                  >
                    &ldquo;{t.text}&rdquo;
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="font-bold text-[var(--up-text)]"
                  >
                    {t.name}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="text-sm text-[var(--up-accent)]"
                  >
                    {t.role}
                  </motion.p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {hasMultiple && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-4 mt-8"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={goPrev}
              aria-label="Previous testimonial"
              className="w-12 h-12 rounded-xl bg-[var(--up-bg-card)] border border-[var(--up-border)] flex items-center justify-center text-[var(--up-text)] hover:border-[var(--up-accent)]/40 hover:text-[var(--up-accent)] transition-colors"
            >
              <FiChevronLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex gap-2">
              {items.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setActive(i)}
                  whileHover={{ scale: 1.2 }}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === active ? "w-8 bg-[var(--up-accent)]" : "w-2.5 bg-[var(--up-border)] hover:bg-[var(--up-text-subtle)]"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={goNext}
              aria-label="Next testimonial"
              className="w-12 h-12 rounded-xl bg-[var(--up-bg-card)] border border-[var(--up-border)] flex items-center justify-center text-[var(--up-text)] hover:border-[var(--up-accent)]/40 hover:text-[var(--up-accent)] transition-colors"
            >
              <FiChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
