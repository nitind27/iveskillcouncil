"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { FiArrowRight, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";

function heroCtaHref(href: string): string {
  if (href === "#courses") return "/userpanel/courses";
  if (href.startsWith("#")) return `/userpanel${href}`;
  return href;
}

const HERO_ROTATE_INTERVAL_MS = 5500;
const SLIDE_EASE = [0.22, 1, 0.36, 1] as const;

const DEFAULT_HERO_IMAGES = [
  "/uploads/userpanel/hero/1.png",
  "/uploads/userpanel/hero/2.png",
  "/uploads/userpanel/hero/3.png",
  "/uploads/userpanel/hero/4.png",
];

const HERO_SLIDES = [
  {
    badge: "Skill India Mission",
    title: "Building a Skilled and Self-Reliant Nation",
    subtitle: "Quality vocational education and industry-ready training for every learner.",
  },
  {
    badge: "Vocational Education",
    title: "From Classroom to Career",
    subtitle: "Hands-on programmes designed to build confidence, competence, and employability.",
  },
  {
    badge: "IVESDC",
    title: "Train. Certify. Grow.",
    subtitle: "Explore courses, offers, and franchise opportunities across our national network.",
  },
  {
    badge: "Join the Movement",
    title: "Skills That Build the Future",
    subtitle: "Enrol today and take the next step in your learning journey.",
  },
] as const;

const imageVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%" }),
  center: { x: "0%" },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%" }),
};

interface HeroSectionProps {
  config: UserPanelConfig;
  userName?: string | null;
}

export default function HeroSection({ config }: HeroSectionProps) {
  const { hero } = config;
  const configured = hero.backgroundImages?.length
    ? hero.backgroundImages
    : hero.backgroundImage
      ? [hero.backgroundImage]
      : [];
  const allowed = new Set(DEFAULT_HERO_IMAGES);
  const filtered = configured
    .map((src) => src.split("?")[0])
    .filter((src) => allowed.has(src));
  const images = filtered.length > 0 ? filtered : DEFAULT_HERO_IMAGES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const count = Math.max(images.length, 1);
  const slide = HERO_SLIDES[currentIndex % HERO_SLIDES.length];

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
      className="up-hero relative z-0 flex w-full overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={imageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.75, ease: SLIDE_EASE }}
            className="absolute inset-0"
          >
            <img
              src={images[currentIndex % images.length]}
              alt=""
              fetchPriority={currentIndex === 0 ? "high" : "low"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="hero-govt-shade pointer-events-none absolute inset-0" />

      <div className="absolute left-0 right-0 top-0 z-30 flex h-[4px]">
        <span className="flex-1 bg-[#FF9933]" />
        <span className="flex-1 bg-white" />
        <span className="flex-1 bg-[#138808]" />
      </div>

      {images.length > 1 && (
        <img
          src={images[(currentIndex + 1) % images.length]}
          alt=""
          className="hidden"
          aria-hidden
        />
      )}

      <div className="relative z-10 mt-auto flex h-full w-full items-end">
        <div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={`copy-${currentIndex}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4, ease: SLIDE_EASE }}
              className="max-w-2xl"
            >
              <p className="hero-badge-glow mb-3 inline-block border-l-[3px] border-[#C4A35A] bg-black/55 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                {slide.badge}
              </p>
              <h1 className="hero-title-glow mb-3 text-3xl font-extrabold leading-[1.15] tracking-tight sm:text-4xl md:text-[2.75rem] lg:text-5xl">
                {slide.title}
              </h1>
              <p className="hero-sub-glow mb-6 max-w-xl text-sm font-medium leading-relaxed sm:text-base md:text-lg">
                {slide.subtitle}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href={heroCtaHref(hero.ctaPrimary.href)}>
                  <span className="group inline-flex items-center gap-2 bg-[#C4A35A] px-5 py-2.5 text-sm font-bold text-[#0F172A] shadow-md transition-colors hover:bg-[#A88B48] hover:text-white">
                    {hero.ctaPrimary.label}
                    <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
                <Link href={heroCtaHref(hero.ctaSecondary.href)}>
                  <span className="inline-flex items-center gap-2 border border-white/60 bg-black/30 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-[2px] transition-colors hover:bg-black/45">
                    {hero.ctaSecondary.label}
                  </span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 sm:flex md:left-5"
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={goNext}
            className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 sm:flex md:right-5"
          >
            <FiChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
                className="relative h-1 overflow-hidden bg-white/40"
                style={{ width: i === currentIndex ? 36 : 12 }}
              >
                {i === currentIndex && (
                  <span
                    key={currentIndex}
                    className={`hero-progress-bar absolute inset-0 bg-[#C4A35A] ${paused ? "is-paused" : ""}`}
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
