"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiBookOpen,
  FiTag,
  FiCheckCircle,
  FiAward,
} from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";
import type { UserPanelConfig } from "@/config/userpanel.config";
import { useUserPanelHref } from "@/hooks/useUserPanelBasePath";

function heroCtaHref(href: string): string {
  if (!href) return "/userpanel/courses";
  if (href === "#courses") return "/userpanel/courses";
  if (href.startsWith("#")) return `/userpanel${href}`;
  return href;
}

const HERO_ROTATE_INTERVAL_MS = 6000;
const SLIDE_EASE = [0.22, 1, 0.36, 1] as const;

const DEFAULT_HERO_IMAGES = [
  "/uploads/userpanel/hero/1.png",
  "/uploads/userpanel/hero/2.png",
  "/uploads/userpanel/hero/3.png",
  "/uploads/userpanel/hero/4.png",
];

const imageVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0.95,
  }),
  center: {
    x: "0%",
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0.95,
  }),
};

interface HeroSectionProps {
  config: UserPanelConfig;
  userName?: string | null;
}

export default function HeroSection({ config }: HeroSectionProps) {
  const { hero } = config;
  const up = useUserPanelHref();

  const configured = hero?.backgroundImages?.length
    ? hero.backgroundImages
    : hero?.backgroundImage
      ? [hero.backgroundImage]
      : [];

  const validConfigured = configured.filter(
    (src): src is string => typeof src === "string" && src.trim().length > 0
  );
  const images = validConfigured.length > 0 ? validConfigured : DEFAULT_HERO_IMAGES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const count = Math.max(images.length, 1);

  const goTo = useCallback(
    (next: number, dir: number) => {
      setDirection(dir);
      setCurrentIndex(((next % count) + count) % count);
    },
    [count]
  );

  const goNext = useCallback(() => goTo(currentIndex + 1, 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1, -1), [currentIndex, goTo]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (count <= 1) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = window.setInterval(() => {
      if (!pausedRef.current) goNext();
    }, HERO_ROTATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [count, goNext]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  return (
    <section
      id="home"
      className="group relative z-0 w-full bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Indian Tricolor Top Line */}
      <div className="flex h-[3px] w-full">
        <span className="flex-1 bg-[#FF9933]" />
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-[#138808]" />
      </div>

      {/* Hero Banner Carousel (100% Unobstructed Full View) */}
      <div className="up-hero relative w-full overflow-hidden bg-[#EEF2F7]">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={imageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.65, ease: SLIDE_EASE }}
            className="absolute inset-0"
          >
            <img
              src={images[currentIndex % images.length]}
              alt="IVESDC Vocational Education & Training Council Banner"
              fetchPriority={currentIndex === 0 ? "high" : "low"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>

        {/* Preload Next Banner */}
        {images.length > 1 && (
          <img
            src={images[(currentIndex + 1) % images.length]}
            alt=""
            className="hidden"
            aria-hidden
          />
        )}

        {/* Subtle Side Navigation Arrows (Hover activated) */}
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              onClick={goPrev}
              className="absolute left-3 sm:left-5 top-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#1E4A85] shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110 active:scale-95"
            >
              <FiChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              onClick={goNext}
              className="absolute right-3 sm:right-5 top-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[#1E4A85] shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white hover:scale-110 active:scale-95"
            >
              <FiChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Minimal Slide Dots on Banner */}
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-3 py-1 backdrop-blur-md">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === currentIndex ? 24 : 6,
                    backgroundColor:
                      i === currentIndex ? "#C4A35A" : "rgba(255,255,255,0.6)",
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Seamless Action & Brand Ribbon (Directly below banner on clean white / light slate) */}
      <div className="border-b border-[#E5E7EB] bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          {/* Council & Mission Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1E4A85] to-[#163A6B] text-[#C4A35A] shadow-sm">
              <FaGraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#138808]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#138808] animate-pulse" />
                  Skill India Mission
                </span>
                <span className="text-[#D1D5DB]">•</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#64748B]">
                  <FiAward className="h-3 w-3 text-[#C4A35A]" />
                  ISO 9001:2015
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#0F172A] tracking-tight">
                National Council for Vocational Education & Training
              </p>
            </div>
          </div>

          {/* Quick Action CTAs: View Courses & Explore Offers */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Primary Action: View Courses */}
            <Link href={up(heroCtaHref(hero?.ctaPrimary?.href || "/userpanel/courses"))}>
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] hover:bg-[#163A6B] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:shadow-md"
              >
                <FiBookOpen className="h-4 w-4 text-[#C4A35A]" />
                {hero?.ctaPrimary?.label || "View Courses"}
                <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </motion.span>
            </Link>

            {/* Secondary Action: Explore Offers */}
            <Link href={up(heroCtaHref(hero?.ctaSecondary?.href || "/userpanel#offers"))}>
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D1D5DB] hover:border-[#1E4A85]/40 hover:bg-[#F8FAFC] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#334155] transition-colors"
              >
                <FiTag className="h-4 w-4 text-[#C4A35A]" />
                {hero?.ctaSecondary?.label || "Explore Offers"}
              </motion.span>
            </Link>

            {/* Quick Action: Verify Certificate */}
            <Link href="/certificate" className="hidden md:inline-flex">
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#D1D5DB] hover:border-[#1E4A85]/40 hover:bg-[#F8FAFC] px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-[#334155] transition-colors"
              >
                <FiCheckCircle className="h-4 w-4 text-[#1E4A85]" />
                Verify Certificate
              </motion.span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
