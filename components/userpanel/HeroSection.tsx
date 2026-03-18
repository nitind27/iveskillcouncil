"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { FiArrowRight, FiPlay } from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";

function heroCtaHref(href: string): string {
  if (href === "#courses") return "/userpanel/courses";
  if (href.startsWith("#")) return `/userpanel${href}`;
  return href;
}

const HERO_ROTATE_INTERVAL_MS = 5500;
const HERO_FLIP_DURATION = 1.1;

interface HeroSectionProps {
  config: UserPanelConfig;
  userName?: string | null;
}

export default function HeroSection({ config, userName }: HeroSectionProps) {
  const { hero } = config;
  const displayName = userName?.trim() || "Guest";
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 120]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.96]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.4]);

  const images = hero.backgroundImages?.length
    ? hero.backgroundImages
    : [hero.backgroundImage];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [nextIndex, setNextIndex] = useState(0);

  // Content changes together with the rotating background images.
  // (We cycle through these slides if admin provides more images.)
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

  const activeIndex = isFlipping ? nextIndex : currentIndex;
  const slide = heroSlides[activeIndex % heroSlides.length];

  const goToNext = useCallback(() => {
    if (images.length <= 1 || isFlipping) return;
    const next = (currentIndex + 1) % images.length;
    setNextIndex(next);
    setIsFlipping(true);
  }, [currentIndex, images.length, isFlipping]);

  useEffect(() => {
    const id = setInterval(goToNext, HERO_ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [goToNext]);

  const onFlipComplete = useCallback(() => {
    setCurrentIndex(nextIndex);
    setIsFlipping(false);
  }, [nextIndex]);

  return (
    <section
      id="home"
      className="relative min-h-[95vh] flex items-center justify-center overflow-hidden panel-perspective"
    >
      {/* 3D book-style page flip background */}
      <motion.div style={{ y: heroY }} className="absolute inset-0 scale-105">
        <div
          className="absolute inset-0"
          style={{
            perspective: "1400px",
            transformStyle: "preserve-3d",
          }}
        >
          {isFlipping ? (
            <>
              {/* Incoming page (from right, behind) */}
              <motion.div
                initial={{ rotateY: 92, scale: 1.06, opacity: 0.78 }}
                animate={{
                  rotateY: 0,
                  // Zoom-in then slightly zoom-out while the flip completes
                  scale: [1.08, 1.02, 0.99],
                  opacity: [0.78, 0.98, 0.93],
                }}
                transition={{
                  duration: HERO_FLIP_DURATION,
                  ease: [0.22, 1, 0.36, 1],
                }}
                onAnimationComplete={onFlipComplete}
                className="absolute inset-0 bg-cover bg-center bg-no-repeat origin-right"
                style={{
                  transformOrigin: "right center",
                  backfaceVisibility: "hidden",
                  backgroundImage: `url(${images[nextIndex]})`,
                  zIndex: 1,
                  filter: "brightness(1.03) saturate(1.05)",
                }}
              />
              {/* Outgoing page (flips left, on top) */}
              <motion.div
                initial={{ rotateY: 0, scale: 1.02, opacity: 0.98 }}
                animate={{
                  rotateY: -92,
                  scale: [1.02, 0.985, 0.97],
                  opacity: [0.98, 0.9, 0.82],
                }}
                transition={{
                  duration: HERO_FLIP_DURATION,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="absolute inset-0 bg-cover bg-center bg-no-repeat origin-right"
                style={{
                  transformOrigin: "right center",
                  backfaceVisibility: "hidden",
                  backgroundImage: `url(${images[currentIndex]})`,
                  zIndex: 2,
                  boxShadow: "-20px 0 60px rgba(0,0,0,0.25)",
                  filter: "brightness(1.03) saturate(1.05)",
                }}
              />
            </>
          ) : (
            <motion.div
              initial={false}
              key={currentIndex}
              animate={{ scale: [1.06, 1.02] }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${images[currentIndex]})`,
                backfaceVisibility: "hidden",
                filter: "brightness(1.03) saturate(1.05)",
              }}
            />
          )}
        </div>
      </motion.div>
      <div className="absolute inset-0 hero-overlay" />

      {/* Subtle orbs */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[var(--up-accent)]/[0.08] blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 15, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-[var(--up-accent)]/[0.06] blur-[90px] pointer-events-none"
      />

      <motion.div
        style={{ scale: heroScale, opacity: heroOpacity }}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center panel-3d"
      >
        <motion.p
          key={`badge-${activeIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--up-bg-card)]/90 border border-[var(--up-border)] text-[var(--up-accent)] text-sm font-semibold uppercase tracking-[0.2em] mb-6 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--up-accent)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--up-accent)]" />
          </span>
          {slide.badge || hero.greetingPrefix}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold mb-6 tracking-tight leading-[1.05]"
        >
          <span className="text-[var(--up-text)] drop-shadow-sm">{displayName}</span>
          <span className="text-[var(--up-text-subtle)]">.</span>
        </motion.h1>

        <motion.p
          key={`subtitle-${activeIndex}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-lg sm:text-xl md:text-2xl text-[var(--up-text-muted)] max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
        >
          {slide.subtitle || hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap gap-4 justify-center items-center"
        >
          <Link href={heroCtaHref(hero.ctaPrimary.href)}>
            <motion.span
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -12px rgba(29, 78, 216, 0.35)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[var(--up-accent)] text-white font-bold shadow-xl border border-[var(--up-border-strong)] hover:bg-[var(--up-accent-hover)] transition-all duration-300"
            >
              {hero.ctaPrimary.label}
              <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.span>
          </Link>
          <Link href={heroCtaHref(hero.ctaSecondary.href)}>
            <motion.span
              whileHover={{ scale: 1.05, backgroundColor: "var(--up-bg-muted)" }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl border-2 border-[var(--up-border-strong)] bg-[var(--up-bg-card)] text-[var(--up-text)] font-bold hover:border-[var(--up-accent)]/40 transition-all duration-300"
            >
              <FiPlay className="w-5 h-5 text-[var(--up-accent)]" />
              {hero.ctaSecondary.label}
            </motion.span>
          </Link>
        </motion.div>

        <motion.div
          key={`stats-${activeIndex}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-16 flex flex-wrap justify-center gap-8 text-[var(--up-text-muted)] text-sm font-medium"
        >
          {slide.stats.map((s) => (
            <span key={s.text} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              {s.text}
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* Slide indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "w-8 bg-[var(--up-accent)]" : "w-1.5 bg-[var(--up-text-subtle)]/50 hover:bg-[var(--up-text-muted)]"
                }`}
                onClick={() => {
                  setCurrentIndex(i);
                  setIsFlipping(false);
                }}
              />
            ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-10 h-16 rounded-full border-2 border-[var(--up-border-strong)] flex items-start justify-center pt-3 bg-[var(--up-bg-card)]/90"
        >
          <motion.span className="w-1.5 h-3 rounded-full bg-[var(--up-accent)]" />
        </motion.div>
      </motion.div>
    </section>
  );
}
