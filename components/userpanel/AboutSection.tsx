"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiArrowRight, FiAward, FiUsers, FiZap, FiShield, FiTarget, FiCompass, FiChevronDown } from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";
import type { UserPanelConfig } from "@/config/userpanel.config";
import { cn } from "@/lib/utils";
import { useUserPanelHref } from "@/hooks/useUserPanelBasePath";
import { COUNCIL } from "./ui/council";
import { upButton } from "./ui/button";
import Reveal from "./ui/Reveal";
import FlagWave from "./ui/FlagWave";
import AnimatedCounter from "./AnimatedCounter";

function aboutButtonHref(href: string): string {
  if (href.startsWith("#")) return `/userpanel${href}`;
  return href;
}

/** Founder / main owner gallery — originals in `public/owner`, web copies in `public/assets/home`. */
const OWNER_SLIDES = [
  { src: "/assets/home/owner-1.jpg", caption: "Maharashtra Excellence Awards & Conclave 2026", role: "Founder · Leadership" },
  { src: "/assets/home/owner-2.jpg", caption: "Digital Excellence Awards 2026", role: "Founder · Vision" },
  { src: "/assets/home/owner-3.jpg", caption: "Excellence · Recognition · Growth", role: "Founder · Achievement" },
  { src: "/assets/home/owner-4.jpg", caption: "Leadership · Vision · Impact", role: "Founder · Dedication" },
] as const;

const AUTO_MS = 4500;

const features = [
  { icon: FiZap, label: "Fast-Track Learning", desc: "Structured curriculum for quick skill gains", color: "bg-ive-saffron/10 text-ive-saffron" },
  { icon: FiShield, label: "Certified Programs", desc: "Industry-recognized certifications", color: "bg-ive-emerald/10 text-ive-emerald" },
  { icon: FiUsers, label: "Expert Mentors", desc: "Learn from experienced professionals", color: "bg-ive-royal/10 text-ive-royal" },
  { icon: FiAward, label: "Award Winning", desc: "National & global recognitions", color: "bg-ive-saffron/10 text-ive-saffron" },
];

function OwnerSlideshow() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = OWNER_SLIDES[index];

  useEffect(() => {
    if (reduce || paused) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % OWNER_SLIDES.length), AUTO_MS);
    return () => window.clearInterval(t);
  }, [reduce, paused]);

  return (
    <div className="relative h-full w-full" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <AnimatePresence initial={false}>
        <motion.img
          key={slide.src}
          src={slide.src}
          alt={slide.caption}
          loading="lazy"
          decoding="async"
          initial={{ opacity: 0, scale: reduce ? 1 : 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.2 : 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 h-full w-full object-cover object-[center_22%]"
        />
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-t from-ive-navy/90 via-ive-navy/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#FFD4A8]">{slide.role}</p>
        <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-white sm:text-[13px]">{slide.caption}</p>
        <div className="mt-2 flex gap-1">
          {OWNER_SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
              className="flex h-4 items-center"
            >
              <span className={cn("h-1 rounded-full transition-all duration-300", i === index ? "w-5 bg-ive-saffron" : "w-1.5 bg-white/50")} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Collage({ enrollments }: { enrollments: number }) {
  const reduce = useReducedMotion();
  const frame = "overflow-hidden rounded-[1.75rem] border-[6px] border-white bg-ive-mist shadow-[0_30px_60px_-30px_rgba(6,27,54,0.45)]";

  return (
    <div className="relative mx-auto w-full max-w-[600px]">
      <div className="up-dot-pattern pointer-events-none absolute -left-6 -top-6 h-40 w-40 rounded-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-48 w-48 rounded-full bg-ive-saffron/10 blur-2xl" aria-hidden />

      <div className="relative grid h-[440px] grid-cols-12 grid-rows-12 sm:h-[540px]">
        <motion.div
          whileHover={reduce ? undefined : { scale: 1.015 }}
          className={cn(frame, "relative z-10 col-span-7 col-start-1 row-span-11 row-start-2")}
        >
          <img src="/assets/home/about-student.jpg" alt="Student at a skill development campus" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </motion.div>

        <div className={cn(frame, "relative z-20 col-span-5 col-start-8 row-span-6 row-start-1 ml-3")}>
          <OwnerSlideshow />
        </div>

        <motion.div
          whileHover={reduce ? undefined : { scale: 1.02 }}
          className={cn(frame, "relative z-30 col-span-6 col-start-7 row-span-5 row-start-8 -ml-6")}
        >
          <img src="/assets/home/about-classroom.jpg" alt="Students learning in a computer training lab" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.25, duration: 0.6 }}
        className="up-float absolute -left-3 top-[18%] z-40 flex max-w-[190px] items-start gap-2.5 rounded-2xl border border-ive-line bg-white p-3 shadow-xl sm:-left-6"
      >
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-ive-saffron text-white">
          <FaGraduationCap className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-ive-slate">Our Mission</span>
          <span className="block text-xs font-bold leading-snug text-ive-navy">{COUNCIL.mission}</span>
        </span>
      </motion.div>

      {enrollments > 0 && (
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="absolute -bottom-4 left-6 z-40 flex items-center gap-3 rounded-2xl bg-ive-navy px-4 py-3 text-white shadow-xl"
        >
          <FiUsers className="h-5 w-5 text-ive-saffron" />
          <span>
            <span className="block text-lg font-extrabold leading-none">
              <AnimatedCounter value={enrollments} />
            </span>
            <span className="block text-[11px] text-white/65">Active Enrollments</span>
          </span>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="absolute right-0 top-[52%] z-40 hidden items-center gap-2.5 rounded-2xl border border-ive-line bg-white px-3.5 py-2.5 shadow-xl sm:flex"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ive-saffron to-ive-saffron-dark text-white">
          <FiAward className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-sm font-extrabold leading-none text-ive-navy">Excellence</span>
          <span className="mt-0.5 block text-[11px] text-ive-slate">Awards 2026</span>
        </span>
      </motion.div>
    </div>
  );
}

interface AboutSectionProps {
  config: UserPanelConfig;
}

export default function AboutSection({ config }: AboutSectionProps) {
  const { about } = config;
  const up = useUserPanelHref();
  const reduce = useReducedMotion();
  const [missionOpen, setMissionOpen] = useState(false);
  const enrollments = config.stats?.find((s) => s.id === "enrollments")?.value ?? 0;

  return (
    <section id="about" className="relative isolate overflow-hidden bg-white px-4 pb-24 pt-20 sm:px-6 sm:pt-28 lg:px-8">
      <FlagWave rotate={9} opacity={0.09} className="-right-48 bottom-6 w-[560px] sm:w-[720px] lg:-right-64 lg:w-[880px]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2 lg:gap-14 xl:gap-20">
        <Reveal x={-30}>
          <Collage enrollments={enrollments} />
        </Reveal>

        <div>
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full bg-ive-saffron/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ive-saffron-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-ive-saffron" />
              About {COUNCIL.shortName}
            </span>
            <h2 className="mt-4 text-[1.9rem] font-extrabold leading-[1.15] tracking-tight text-ive-navy sm:text-4xl lg:text-[2.6rem]">
              Institute of Vocational Education &amp; <span className="text-ive-royal">Skill Development Council</span>
            </h2>
            <div className="mt-5 flex items-center gap-1.5" aria-hidden>
              <span className="h-1 w-10 rounded-full bg-ive-saffron" />
              <span className="h-1 w-3 rounded-full bg-ive-line" />
              <span className="h-1 w-6 rounded-full bg-ive-emerald" />
            </div>
            <p className="mt-5 text-base leading-relaxed text-ive-slate md:text-[17px]">{about.description}</p>
          </Reveal>

          <ul className="mt-8 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {features.map((f, i) => (
              <Reveal
                as="li"
                key={f.label}
                delay={0.06 + i * 0.06}
                className="group rounded-2xl border border-ive-line bg-white p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:border-ive-royal/25 hover:shadow-[var(--up-card-shadow-hover)]"
              >
                <span className={cn("mx-auto flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110", f.color)}>
                  <f.icon className="h-5 w-5" />
                </span>
                <span className="mt-3 block text-[13px] font-bold leading-tight text-ive-navy">{f.label}</span>
                <span className="mt-1 block text-[11.5px] leading-snug text-ive-slate">{f.desc}</span>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-3">
            <Link href={up(aboutButtonHref(about.buttonHref))} className={upButton("primary", "lg")}>
              {about.buttonLabel}
              <FiArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
            <button
              type="button"
              onClick={() => setMissionOpen((o) => !o)}
              aria-expanded={missionOpen}
              aria-controls="about-mission"
              className={upButton("outline", "lg")}
            >
              Our Mission
              <FiChevronDown className={cn("h-4 w-4 transition-transform duration-300", missionOpen && "rotate-180")} />
            </button>
          </Reveal>

          <AnimatePresence initial={false}>
            {missionOpen && (
              <motion.div
                id="about-mission"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="relative overflow-hidden rounded-2xl bg-ive-navy p-5 text-white">
                    <div className="up-grid-pattern absolute inset-0 opacity-60" aria-hidden />
                    <FiTarget className="relative h-6 w-6 text-ive-saffron" />
                    <p className="relative mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#FFB15C]">Our Mission</p>
                    <p className="relative mt-1 text-lg font-bold leading-snug">{COUNCIL.mission}</p>
                  </div>
                  <div className="rounded-2xl border border-ive-line bg-ive-mist p-5">
                    <FiCompass className="h-6 w-6 text-ive-emerald" />
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ive-emerald">Our Motto</p>
                    <p className="mt-1 text-lg font-bold leading-snug text-ive-navy">{COUNCIL.motto}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
