"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiArrowRight,
  FiAward,
  FiUsers,
  FiZap,
  FiShield,
} from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";
import { cn } from "@/lib/utils";

function aboutButtonHref(href: string): string {
  if (href.startsWith("#")) return `/userpanel${href}`;
  return href;
}

/** Founder / main owner gallery — `public/owner` */
const OWNER_SLIDES = [
  {
    src: "/owner/1.png",
    caption: "Maharashtra Excellence Awards & Conclave 2026",
    role: "Founder · Leadership",
  },
  {
    src: "/owner/2.png",
    caption: "Digital Excellence Awards 2026",
    role: "Founder · Vision",
  },
  {
    src: "/owner/3.png",
    caption: "Excellence · Recognition · Growth",
    role: "Founder · Achievement",
  },
  {
    src: "/owner/4.png",
    caption: "Leadership · Vision · Impact",
    role: "Founder · Dedication",
  },
] as const;

const AUTO_MS = 4500;

interface AboutSectionProps {
  config: UserPanelConfig;
}

const features = [
  {
    icon: FiZap,
    label: "Fast-Track Learning",
    desc: "Structured curriculum for quick skill gains",
    color: "text-[#C4A35A] bg-[#C4A35A]/10",
  },
  {
    icon: FiShield,
    label: "Certified Programs",
    desc: "Industry-recognized certifications",
    color: "text-[#1E4A85] bg-[#1E4A85]/10",
  },
  {
    icon: FiUsers,
    label: "Expert Mentors",
    desc: "Learn from experienced professionals",
    color: "text-[#1E4A85] bg-[#EEF2F7]",
  },
  {
    icon: FiAward,
    label: "Award Winning",
    desc: "National & global recognitions",
    color: "text-[#C4A35A] bg-[#C4A35A]/10",
  },
];

function OwnerShowcase() {
  const [index, setIndex] = useState(0);
  const len = OWNER_SLIDES.length;
  const slide = OWNER_SLIDES[index];

  useEffect(() => {
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % len);
    }, AUTO_MS);
    return () => window.clearInterval(t);
  }, [len]);

  return (
    <div className="relative mx-auto w-full max-w-[440px] lg:max-w-none">
      <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-[#1E4A85]/20 via-transparent to-[#C4A35A]/25 opacity-80 blur-[1px]" />
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full border border-[#C4A35A]/30" />
      <div className="pointer-events-none absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-[#1E4A85]/10" />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-[#0B1F3A] shadow-[0_28px_70px_rgba(15,23,42,0.22)] ring-1 ring-[#1E4A85]/15">
        <div className="relative aspect-[3/4] w-full">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slide.src}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <motion.img
                src={slide.src}
                alt={slide.caption}
                className="h-full w-full object-cover object-[center_20%]"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A] via-[#0B1F3A]/20 to-transparent" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute left-0 right-0 top-0 z-20 h-1 bg-white/10">
            <motion.div
              key={`progress-${index}`}
              className="h-full origin-left bg-gradient-to-r from-[#C4A35A] to-[#E8D5A3]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
            />
          </div>

          <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C4A35A] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C4A35A]" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/95">
              Leadership
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-20 p-5 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.caption}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E8D5A3]">
                  {slide.role}
                </p>
                <p className="mt-1 max-w-[95%] text-sm font-semibold leading-snug text-white sm:text-base">
                  {slide.caption}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-4 flex items-center gap-1.5">
              {OWNER_SLIDES.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === index ? "w-7 bg-[#C4A35A]" : "w-1.5 bg-white/40"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.45 }}
        className="absolute -left-2 top-8 z-30 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur-sm sm:flex lg:-left-4"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E4A85] to-[#163A6B]">
          <FiUsers className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-lg font-black leading-none text-[#1A1A1A]">10k+</div>
          <div className="mt-0.5 text-[11px] font-medium text-[#6B7280]">
            Happy Students
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.35, duration: 0.45 }}
        className="absolute -right-2 bottom-28 z-30 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/95 px-3.5 py-2.5 shadow-xl backdrop-blur-sm sm:flex lg:-right-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#C4A35A] to-[#A88B48]">
          <FiAward className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-lg font-black leading-none text-[#1A1A1A]">Excellence</div>
          <div className="mt-0.5 text-[11px] font-medium text-[#6B7280]">
            Awards 2026
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AboutSection({ config }: AboutSectionProps) {
  const { about, site } = config;
  const heading = site?.name
    ? `About ${site.name}`
    : about.title || "About Our Institute";

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-gradient-to-b from-[#F7F9FC] via-white to-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
    >
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1E4A85]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#C4A35A]/[0.08] blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <OwnerShowcase />
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
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${f.color}`}
                  >
                    <f.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#1A1A1A]">
                      {f.label}
                    </div>
                    <div className="mt-0.5 text-xs leading-relaxed text-[#6B7280]">
                      {f.desc}
                    </div>
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
