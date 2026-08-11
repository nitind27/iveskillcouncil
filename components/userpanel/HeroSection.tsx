"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FiArrowRight, FiPlay } from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";

function heroCtaHref(href: string): string {
  if (href === "#courses") return "/userpanel/courses";
  if (href.startsWith("#")) return `/userpanel${href}`;
  return href;
}

const HERO_ROTATE_INTERVAL_MS = 6500;

interface HeroSectionProps {
  config: UserPanelConfig;
  userName?: string | null;
}

export default function HeroSection({ config, userName }: HeroSectionProps) {
  const { hero } = config;
  const displayName = userName?.trim() || "Guest";

  const images = hero.backgroundImages?.length
    ? hero.backgroundImages
    : [hero.backgroundImage];
  const [currentIndex, setCurrentIndex] = useState(0);

  const heroSlides = [
    {
      badge: "Career-Ready Learning",
      subtitle:
        "Explore job-focused programs designed to help you learn faster, practice more, and move ahead with confidence.",
      stats: [
        { dot: "bg-emerald-500", text: "120+ Projects" },
        { dot: "bg-indigo-500", text: "Hands-on Training" },
        { dot: "bg-[var(--up-accent)]", text: "Mentor Support" },
      ],
    },
    {
      badge: "Industry-Led Programs",
      subtitle:
        "Learn with modern modules, real workflows, and structured coaching. Get stronger concepts and better outcomes.",
      stats: [
        { dot: "bg-amber-500", text: "Certification Ready" },
        { dot: "bg-cyan-500", text: "Live Guidance" },
        { dot: "bg-[var(--up-accent)]", text: "Skilled Curriculum" },
      ],
    },
    {
      badge: "Upgrade Your Skills",
      subtitle:
        "From beginner to advanced, choose the right path. Enrol now and start your learning journey today.",
      stats: [
        { dot: "bg-rose-500", text: "Flexible Batches" },
        { dot: "bg-violet-500", text: "Daily Practice" },
        { dot: "bg-[var(--up-accent)]", text: "Fast Progress" },
      ],
    },
  ] as const;

  const slide = heroSlides[currentIndex % heroSlides.length];

  const goToNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(goToNext, HERO_ROTATE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [goToNext]);

  return (
    <section
      id="home"
      className="relative min-h-[95vh] flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0">
        <img
          src={images[currentIndex]}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {images.length > 1 && (
          <img
            src={images[(currentIndex + 1) % images.length]}
            alt=""
            fetchPriority="low"
            decoding="async"
            className="hidden"
            aria-hidden
          />
        )}
      </div>
      <div className="absolute inset-0 hero-overlay" />

      <div className="pointer-events-none absolute top-1/4 left-1/4 h-[320px] w-[320px] rounded-full bg-[#2D5DA8]/20 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-[280px] w-[280px] rounded-full bg-[#A8C63A]/15 blur-[80px]" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-sm backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--up-accent)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--up-accent)]" />
          </span>
          {slide.badge || hero.greetingPrefix}
        </p>

        <h1 className="mb-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
          <span className="text-white drop-shadow-lg">{displayName}</span>
          <span className="text-white/60">.</span>
        </h1>

        <p className="mx-auto mb-12 max-w-2xl text-lg font-medium leading-relaxed text-white/80 drop-shadow sm:text-xl md:text-2xl">
          {slide.subtitle || hero.subtitle}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href={heroCtaHref(hero.ctaPrimary.href)}>
            <span className="group inline-flex items-center gap-3 rounded-2xl bg-[#F39C12] px-8 py-4 font-bold text-white shadow-2xl transition-colors duration-200 hover:bg-[#D68910]">
              {hero.ctaPrimary.label}
              <FiArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
          <Link href={heroCtaHref(hero.ctaSecondary.href)}>
            <span className="inline-flex items-center gap-3 rounded-2xl border-2 border-white/30 bg-white/10 px-8 py-4 font-bold text-white backdrop-blur-sm transition-colors duration-200 hover:border-white/50 hover:bg-white/20">
              <FiPlay className="h-5 w-5 text-white" />
              {hero.ctaSecondary.label}
            </span>
          </Link>
        </div>

        <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm font-medium text-white/70">
          {slide.stats.map((s) => (
            <span key={s.text} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              {s.text}
            </span>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-36 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? "w-8 bg-[#F39C12]" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
              onClick={() => setCurrentIndex(i)}
            />
          ))}
        </div>
      )}

      <div className="absolute bottom-28 left-1/2 z-10 -translate-x-1/2">
        <div className="flex h-16 w-10 items-start justify-center rounded-full border-2 border-white/30 bg-white/10 pt-3 backdrop-blur-sm">
          <span className="h-3 w-1.5 rounded-full bg-[#F39C12]" />
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 overflow-hidden">
        <svg
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          className="block w-full"
          style={{ height: "90px" }}
        >
          <path
            d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,90 L0,90 Z"
            fill="#F8FAFC"
            fillOpacity="0.35"
          />
          <path
            d="M0,55 C240,15 480,75 720,45 C960,15 1200,65 1440,35 L1440,90 L0,90 Z"
            fill="#F8FAFC"
          />
        </svg>
      </div>
    </section>
  );
}
