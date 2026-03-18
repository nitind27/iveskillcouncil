"use client";

import { motion } from "framer-motion";
import { FiStar, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useState } from "react";

const TESTIMONIALS = [
  {
    id: "1",
    name: "Priya Sharma",
    role: "Full Stack Developer",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    text: "The course structure and hands-on projects helped me switch to tech. Instructors are industry experts and the placement support is excellent.",
    rating: 5,
  },
  {
    id: "2",
    name: "Rahul Verma",
    role: "Data Analyst",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    text: "Best investment in my career. From basics to advanced analytics, everything was well organized. Got placed within 2 months of completion.",
    rating: 5,
  },
  {
    id: "3",
    name: "Anita Desai",
    role: "Digital Marketing Lead",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    text: "Practical, up-to-date content and real campaigns. The certification is recognized by employers. Highly recommend for marketing professionals.",
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const t = TESTIMONIALS[active];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 panel-perspective overflow-hidden bg-[var(--up-bg)]">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--up-accent)]/[0.05] blur-[100px] rounded-full -z-10" />
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--up-accent)]/10 border border-[var(--up-accent)]/20 text-[var(--up-accent)] text-sm font-semibold uppercase tracking-wider mb-3">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-[var(--up-text)] tracking-tight">
            What Our Students Say
          </h2>
        </motion.div>

        <motion.div
          key={active}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-[var(--up-accent)]/10 rounded-3xl blur-xl opacity-0 hover:opacity-100 transition duration-500" />
          <div className="relative rounded-3xl bg-[var(--up-bg-card)] border border-[var(--up-border)] p-8 md:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 border-[var(--up-border)] shadow-xl"
              >
                <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
              </motion.div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex justify-center md:justify-start gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
                  ))}
                </div>
                <p className="text-[var(--up-text-muted)] text-lg leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <p className="font-bold text-[var(--up-text)]">{t.name}</p>
                <p className="text-sm text-[var(--up-accent)]">{t.role}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActive((a) => (a === 0 ? TESTIMONIALS.length - 1 : a - 1))}
            className="w-12 h-12 rounded-xl bg-[var(--up-bg-card)] border border-[var(--up-border)] flex items-center justify-center text-[var(--up-text)] hover:border-[var(--up-accent)]/40 hover:text-[var(--up-accent)] transition-colors"
          >
            <FiChevronLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === active ? "w-8 bg-[var(--up-accent)]" : "bg-[var(--up-border)] hover:bg-[var(--up-text-subtle)]"
                }`}
              />
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActive((a) => (a === TESTIMONIALS.length - 1 ? 0 : a + 1))}
            className="w-12 h-12 rounded-xl bg-[var(--up-bg-card)] border border-[var(--up-border)] flex items-center justify-center text-[var(--up-text)] hover:border-[var(--up-accent)]/40 hover:text-[var(--up-accent)] transition-colors"
          >
            <FiChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </section>
  );
}
