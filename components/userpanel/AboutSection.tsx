"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiAward, FiUsers, FiZap, FiShield } from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";

function aboutButtonHref(href: string): string {
  if (href.startsWith("#")) return `/userpanel${href}`;
  return href;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80";

interface AboutSectionProps {
  config: UserPanelConfig;
}

const features = [
  { icon: FiZap, label: "Fast-Track Learning", desc: "Structured curriculum for quick skill gains", color: "text-[#C4A35A] bg-[#C4A35A]/10" },
  { icon: FiShield, label: "Certified Programs", desc: "Industry-recognized certifications", color: "text-[#1E4A85] bg-[#1E4A85]/10" },
  { icon: FiUsers, label: "Expert Mentors", desc: "Learn from experienced professionals", color: "text-[#1E4A85] bg-[#EEF2F7]" },
  { icon: FiAward, label: "Award Winning", desc: "15+ national & global recognitions", color: "text-[#C4A35A] bg-[#C4A35A]/10" },
];

export default function AboutSection({ config }: AboutSectionProps) {
  const { about, site } = config;
  const [imgSrc, setImgSrc] = useState(about.image || FALLBACK_IMAGE);
  const heading = site?.name ? `About ${site.name}` : about.title || "About Our Institute";

  return (
    <section id="about" className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1E4A85]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#C4A35A]/[0.08] blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-3xl border border-[#E5E7EB] bg-[#EEF2F7] shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
              <img
                src={imgSrc}
                alt={heading}
                className="h-full w-full aspect-[4/3] object-cover"
                onError={() => setImgSrc(FALLBACK_IMAGE)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.45 }}
              className="absolute left-4 top-4 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E4A85] to-[#163A6B]">
                <FiUsers className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-black leading-none text-[#1A1A1A]">10k+</div>
                <div className="mt-0.5 text-[11px] font-medium text-[#6B7280]">Happy Students</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.45 }}
              className="absolute bottom-4 right-4 flex items-center gap-3 rounded-2xl border border-white/70 bg-white/95 px-3.5 py-2.5 shadow-lg backdrop-blur-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C4A35A] to-[#A88B48]">
                <FiAward className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-black leading-none text-[#1A1A1A]">15+</div>
                <div className="mt-0.5 text-[11px] font-medium text-[#6B7280]">Awards Won</div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-7"
          >
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1E4A85]/20 bg-[#1E4A85]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E4A85]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C4A35A]" />
                Our Story
              </span>
              <h2 className="mb-4 text-3xl font-extrabold leading-tight tracking-tight text-[#1A1A1A] md:text-4xl lg:text-[2.6rem]">
                {heading}
              </h2>
              <p className="text-base leading-relaxed text-[#4B5563] md:text-lg">
                {about.description}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {features.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 + i * 0.07, duration: 0.4 }}
                  whileHover={{ y: -3 }}
                  className="flex items-start gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4 transition-shadow duration-300 hover:border-[#2D5DA8]/25 hover:bg-white hover:shadow-md"
                >
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${f.color}`}>
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1A1A1A]">{f.label}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-[#6B7280]">{f.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Link href={aboutButtonHref(about.buttonHref)}>
                <span className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#163A6B]">
                  {about.buttonLabel}
                  <FiArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <Link href="/userpanel/courses">
                <span className="inline-flex items-center gap-2 rounded-xl border border-[#1E4A85] bg-white px-6 py-3 text-sm font-bold text-[#1E4A85] transition-colors hover:bg-[#EEF2F7]">
                  View Courses
                  <FiArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
