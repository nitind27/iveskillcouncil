"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiAward, FiUsers, FiZap, FiShield } from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";

function aboutButtonHref(href: string): string {
  if (href.startsWith("#")) return `/userpanel${href}`;
  return href;
}

interface AboutSectionProps {
  config: UserPanelConfig;
}

const features = [
  { icon: FiZap, label: "Fast-Track Learning", desc: "Structured curriculum for quick skill gains", color: "text-[#F39C12] bg-[#F39C12]/10" },
  { icon: FiShield, label: "Certified Programs", desc: "Industry-recognized certifications", color: "text-[#2D5DA8] bg-[#2D5DA8]/10" },
  { icon: FiUsers, label: "Expert Mentors", desc: "Learn from experienced professionals", color: "text-[#A8C63A] bg-[#A8C63A]/15" },
  { icon: FiAward, label: "Award Winning", desc: "15+ national & global recognitions", color: "text-[#F39C12] bg-[#F39C12]/10" },
];

export default function AboutSection({ config }: AboutSectionProps) {
  const { about } = config;

  return (
    <section id="about" className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[var(--up-bg-muted)]">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#2D5DA8]/[0.05] blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#A8C63A]/[0.06] blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT — image + floating badges */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[var(--up-border)]">
              <img src={about.image} alt={about.title} className="w-full aspect-[4/3] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/40 via-transparent to-transparent" />
            </div>

            {/* badge top-left */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="absolute -top-5 -left-5 bg-white border border-[var(--up-border)] rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D5DA8] to-[#1E4A85] flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-black text-[#1A1A1A]">10k+</div>
                <div className="text-xs text-[#6B7280] font-medium">Happy Students</div>
              </div>
            </motion.div>

            {/* badge bottom-right */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45 }}
              className="absolute -bottom-5 -right-5 bg-white border border-[var(--up-border)] rounded-2xl px-5 py-3 shadow-xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F39C12] to-[#D68910] flex items-center justify-center">
                <FiAward className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-black text-[#1A1A1A]">15+</div>
                <div className="text-xs text-[#6B7280] font-medium">Awards Won</div>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT — content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-8"
          >
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2D5DA8]/10 border border-[#2D5DA8]/20 text-[#2D5DA8] text-xs font-bold uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A8C63A] animate-pulse" />
                Our Story
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] leading-tight mb-4">
                {about.title}
              </h2>
              <p className="text-[#6B7280] text-lg leading-relaxed">
                {about.description}
              </p>
            </div>

            {/* feature grid */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="group flex items-start gap-3 p-4 rounded-2xl bg-white border border-[var(--up-border)] hover:border-[#2D5DA8]/30 hover:shadow-md transition-all duration-300"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color}`}>
                    <f.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#1A1A1A]">{f.label}</div>
                    <div className="text-xs text-[#6B7280] mt-0.5">{f.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={aboutButtonHref(about.buttonHref)}>
                <motion.span
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#2D5DA8] font-bold text-white shadow-lg hover:bg-[#1E4A85] transition-all cursor-pointer"
                >
                  {about.buttonLabel}
                  <FiArrowRight className="w-4 h-4" />
                </motion.span>
              </Link>
              <motion.span
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#A8C63A] font-bold text-[#1A1A1A] shadow-md hover:bg-[#8FA92F] transition-all cursor-pointer"
              >
                View Courses
                <FiArrowRight className="w-4 h-4" />
              </motion.span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
