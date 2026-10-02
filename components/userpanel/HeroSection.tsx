"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { FiArrowRight, FiPlay, FiAward, FiCheckCircle } from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";
import { useUserPanelHref } from "@/hooks/useUserPanelBasePath";
import { COUNCIL } from "./ui/council";
import { upButton } from "./ui/button";
import { EASE_OUT } from "./ui/motion";
import Magnetic from "./ui/Magnetic";
import FlagWave from "./ui/FlagWave";

function heroCtaHref(href: string): string {
  if (!href) return "/userpanel/courses";
  if (href === "#courses") return "/userpanel/courses";
  if (href.startsWith("#")) return `/userpanel${href}`;
  return href;
}

const HERO_IMAGE = "/assets/home/hero-skills-india.jpg";

interface HeroSectionProps {
  config: UserPanelConfig;
  userName?: string | null;
}

export default function HeroSection({ config }: HeroSectionProps) {
  const { hero } = config;
  const up = useUserPanelHref();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 1.06]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -50]);

  const enrollments = config.stats?.find((s) => s.id === "enrollments")?.value ?? 0;
  const avatars = (config.testimonials?.items || []).map((t) => t.avatar).filter(Boolean).slice(0, 4);
  const highlightCount = hero?.backgroundImages?.filter(Boolean).length || (hero?.backgroundImage ? 1 : 0);

  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.1, delayChildren: 0.1 } } };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } },
  };

  const scrollToHighlights = () => {
    document.getElementById("highlights")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  const journeyCard = (
    <button
      type="button"
      onClick={scrollToHighlights}
      className="group flex items-center gap-3.5 rounded-2xl border border-white/70 bg-white/85 py-2.5 pl-2.5 pr-5 text-left shadow-[0_20px_50px_-20px_rgba(6,27,54,0.45)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
    >
      <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-ive-saffron text-white shadow-[0_10px_24px_-8px_rgba(255,133,0,0.8)]">
        <span className="absolute inset-0 animate-ping rounded-full bg-ive-saffron/40 motion-reduce:animate-none" aria-hidden />
        <FiPlay className="relative ml-0.5 h-5 w-5 fill-white" />
      </span>
      <span>
        <span className="block text-sm font-bold text-ive-navy">Explore Our Journey</span>
        <span className="block text-xs text-ive-slate">
          {highlightCount > 0 ? `${highlightCount} official highlights` : "Official highlights"}
        </span>
      </span>
    </button>
  );

  return (
    <section
      id="home"
      ref={ref}
      className="relative isolate overflow-hidden bg-gradient-to-b from-white via-[#F4F8FD] to-[#E9F1FB]"
    >
      {/* Desktop image layer */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[66%] lg:block"
        style={{ y: imageY, scale: imageScale }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.1, ease: EASE_OUT }}
        aria-hidden
      >
        <img
          src={HERO_IMAGE}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-[65%_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F6F9FE] via-[#F6F9FE]/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#E9F1FB] to-transparent" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent" />
      </motion.div>

      {/* Atmosphere */}
      <FlagWave
        rotate={-10}
        opacity={0.14}
        className="-left-40 top-16 w-[560px] sm:w-[720px] lg:-left-56 lg:top-10 lg:w-[920px]"
      />
      <div className="up-dot-pattern pointer-events-none absolute left-0 top-0 h-72 w-72 opacity-70 [mask-image:radial-gradient(circle_at_top_left,#000,transparent_70%)]" aria-hidden />
      <div className="pointer-events-none absolute -left-40 top-24 h-[420px] w-[420px] rounded-full bg-ive-saffron/[0.10] blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute bottom-10 left-1/3 h-72 w-72 rounded-full bg-ive-royal/[0.10] blur-[110px]" aria-hidden />
      <span className="up-float pointer-events-none absolute left-[46%] top-28 hidden h-16 w-16 rounded-full border-2 border-dashed border-ive-saffron/40 lg:block" aria-hidden />
      <span className="up-float pointer-events-none absolute bottom-48 left-[8%] hidden h-3 w-3 rounded-full bg-ive-emerald/60 lg:block [animation-delay:-3s]" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-36 pt-10 sm:px-6 sm:pt-14 lg:min-h-[640px] lg:grid-cols-12 lg:px-8 lg:pb-44 lg:pt-16">
        <motion.div style={{ y: contentY }} className="lg:col-span-6 xl:col-span-6">
          <motion.div variants={container} initial="hidden" animate="show">
            <motion.span
              variants={item}
              className="inline-flex items-center gap-2 rounded-full border border-ive-royal/15 bg-white/80 py-1 pl-1 pr-3.5 text-xs font-semibold text-ive-royal shadow-sm backdrop-blur"
            >
              <span className="rounded-full bg-ive-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {COUNCIL.shortName}
              </span>
              {COUNCIL.mission}
            </motion.span>

            <motion.h1
              variants={item}
              className="mt-6 text-[2.35rem] font-extrabold leading-[1.08] tracking-tight text-ive-navy sm:text-5xl lg:text-[3.6rem]"
            >
              Empowering Skills,
              <br />
              Building a{" "}
              <span className="relative inline-block text-ive-saffron">
                Better India
                <svg className="absolute -bottom-2 left-0 h-3 w-full text-ive-saffron/40" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden>
                  <path d="M2 9C50 3 150 3 198 9" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
            </motion.h1>

            {hero?.subtitle && (
              <motion.p variants={item} className="mt-6 max-w-xl text-base leading-relaxed text-ive-slate sm:text-lg">
                {hero.subtitle}
              </motion.p>
            )}

            <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <Link href={up(heroCtaHref(hero?.ctaPrimary?.href || "/userpanel/courses"))} className={upButton("primary", "lg", "px-7")}>
                  {hero?.ctaPrimary?.label || "View Courses"}
                  <FiArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                </Link>
              </Magnetic>
              <Link href={up(heroCtaHref(hero?.ctaSecondary?.href || "/userpanel#offers"))} className={upButton("outline", "lg", "px-7")}>
                {hero?.ctaSecondary?.label || "Explore Offers"}
              </Link>
            </motion.div>

            <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              {enrollments > 0 && (
                <div className="flex items-center gap-3">
                  {avatars.length > 0 && (
                    <span className="flex -space-x-2.5">
                      {avatars.map((src, i) => (
                        <img key={src + i} src={src} alt="" loading="lazy" className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm" />
                      ))}
                    </span>
                  )}
                  <span>
                    <span className="block text-sm font-extrabold text-ive-navy">
                      {new Intl.NumberFormat("en-IN").format(enrollments)} Active Enrollments
                    </span>
                    <span className="block text-xs text-ive-slate">Learners growing with {COUNCIL.shortName}</span>
                  </span>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ive-emerald/25 bg-ive-emerald/[0.08] px-2.5 py-1 text-[11px] font-bold text-ive-emerald">
                  <FiCheckCircle className="h-3 w-3" />
                  Skill India Mission
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-ive-line bg-white px-2.5 py-1 text-[11px] font-semibold text-ive-slate">
                  <FiAward className="h-3 w-3 text-ive-saffron" />
                  ISO 9001:2015
                </span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Desktop: floating overlays positioned over the image layer */}
        <div className="relative hidden h-full lg:col-span-6 lg:block">
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: EASE_OUT }}
            className="absolute bottom-6 left-0"
          >
            {journeyCard}
          </motion.div>
          <motion.span
            initial={{ opacity: 0, y: reduce ? 0 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: EASE_OUT }}
            className="absolute right-0 top-4 rounded-2xl border border-white/70 bg-white/75 px-4 py-2.5 text-right shadow-lg backdrop-blur-md"
          >
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ive-slate">Our Motto</span>
            <span className="block text-sm font-extrabold italic text-ive-saffron-dark">{COUNCIL.motto}</span>
          </motion.span>
        </div>

        {/* Mobile / tablet image */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT }}
          className="relative lg:hidden"
        >
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] border-4 border-white shadow-[0_30px_70px_-30px_rgba(6,27,54,0.5)]">
            <img src={HERO_IMAGE} alt="" loading="eager" decoding="async" className="h-full w-full object-cover object-[70%_center]" />
          </div>
          <div className="absolute -bottom-6 left-4 right-4 flex justify-center sm:justify-start">{journeyCard}</div>
        </motion.div>
      </div>
    </section>
  );
}
