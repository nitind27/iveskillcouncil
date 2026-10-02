"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiPause, FiPlay, FiRadio } from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";
import { COUNCIL } from "./ui/council";
import { EASE_OUT } from "./ui/motion";
import SectionHeading from "./ui/SectionHeading";
import Reveal from "./ui/Reveal";

const ROTATE_MS = 6000;
const SWIPE_THRESHOLD_PX = 50;

const DEFAULT_HERO_IMAGES = [
  "/uploads/userpanel/hero/banner-1.jpg",
  "/uploads/userpanel/hero/banner-2.jpg",
  "/uploads/userpanel/hero/banner-3.jpg",
  "/uploads/userpanel/hero/banner-4.jpg",
];

/** Admin-managed hero banners. They carry baked-in text, so they are always shown whole (never cropped or overlaid). */
export default function HighlightsSection({ config }: { config: UserPanelConfig }) {
  const { hero } = config;
  const reduce = useReducedMotion();

  const configured = hero?.backgroundImages?.length
    ? hero.backgroundImages
    : hero?.backgroundImage
      ? [hero.backgroundImage]
      : [];

  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const markFailed = useCallback((src: string) => {
    setFailed((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));
  }, []);
  const validConfigured = configured.filter(
    (src): src is string => typeof src === "string" && src.trim().length > 0 && !failed.has(src)
  );
  const images = validConfigured.length > 0 ? validConfigured : DEFAULT_HERO_IMAGES;

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef<number | null>(null);

  const count = Math.max(images.length, 1);
  const index = current % count;
  const autoplay = count > 1 && !reduce;
  const paused = hovered || focused || userPaused || !inView;

  const goTo = useCallback(
    (next: number, dir: number) => {
      setDirection(dir);
      setCurrent(((next % count) + count) % count);
    },
    [count]
  );
  const goNext = useCallback(() => goTo(index + 1, 1), [index, goTo]);
  const goPrev = useCallback(() => goTo(index - 1, -1), [index, goTo]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const src = images[index];
  const nextSrc = images[(index + 1) % images.length];

  const arrows = count > 1 && (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={goPrev}
        aria-label="Previous highlight"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-ive-line bg-white text-ive-navy shadow-sm transition-all hover:-translate-x-0.5 hover:border-ive-navy"
      >
        <FiChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Next highlight"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-ive-navy text-white shadow-sm transition-all hover:translate-x-0.5 hover:bg-ive-navy-2"
      >
        <FiChevronRight className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <section id="highlights" className="relative bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          align="left"
          eyebrow="Official Updates"
          icon={<FiRadio className="h-3.5 w-3.5" />}
          title={<>Highlights &amp; <span className="text-ive-saffron">Announcements</span></>}
          description={`Key moments, campaigns and announcements from ${COUNCIL.shortName}.`}
          action={arrows || undefined}
        />

        <Reveal>
          <div
            ref={stageRef}
            role="region"
            aria-roledescription="carousel"
            aria-label="Highlights"
            tabIndex={0}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={() => setFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") goNext();
              if (e.key === "ArrowLeft") goPrev();
            }}
            onPointerDown={(e) => {
              if (e.pointerType !== "mouse") pointerStartX.current = e.clientX;
            }}
            onPointerUp={(e) => {
              if (pointerStartX.current === null) return;
              const dx = e.clientX - pointerStartX.current;
              pointerStartX.current = null;
              if (Math.abs(dx) > SWIPE_THRESHOLD_PX && count > 1) (dx < 0 ? goNext : goPrev)();
            }}
            className="relative rounded-[1.75rem] border border-ive-line bg-ive-mist p-2 shadow-[0_30px_80px_-35px_rgba(6,27,54,0.45)] outline-none focus-visible:ring-2 focus-visible:ring-ive-saffron sm:p-3"
          >
            <div className="relative aspect-[8/3] w-full overflow-hidden rounded-[1.25rem] bg-ive-line">
              <AnimatePresence initial={false} custom={direction}>
                <motion.img
                  key={`${index}-${src}`}
                  src={src}
                  alt={`${COUNCIL.shortName} highlight ${index + 1} of ${count}`}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? "5%" : "-5%" }}
                  animate={{ opacity: 1, x: "0%" }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: direction > 0 ? "-4%" : "4%" }}
                  transition={{ duration: reduce ? 0.3 : 0.8, ease: EASE_OUT }}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onError={() => markFailed(src)}
                  className="absolute inset-0 h-full w-full select-none object-cover object-center"
                />
              </AnimatePresence>
              {images.length > 1 && <img src={nextSrc} alt="" className="hidden" aria-hidden loading="lazy" onError={() => markFailed(nextSrc)} />}
            </div>
          </div>

          {count > 1 && (
            <div className="mt-5 flex items-center gap-4">
              <span className="font-mono text-xs font-bold tabular-nums text-ive-navy">
                {String(index + 1).padStart(2, "0")}
                <span className="text-ive-slate/60"> / {String(count).padStart(2, "0")}</span>
              </span>
              <div className="flex flex-1 items-center gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to highlight ${i + 1}`}
                    aria-current={i === index ? "true" : undefined}
                    onClick={() => goTo(i, i > index ? 1 : -1)}
                    className="group/dot relative h-6 flex-1"
                  >
                    <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-ive-line transition-colors group-hover/dot:bg-ive-slate/30">
                      {i < index && <span className="absolute inset-0 bg-ive-navy/40" />}
                      {i === index && (
                        <span
                          key={`${index}-${autoplay}`}
                          className="absolute inset-0 origin-left bg-gradient-to-r from-ive-saffron to-[#FFB15C]"
                          style={
                            autoplay
                              ? { animation: `up-progress ${ROTATE_MS}ms linear forwards`, animationPlayState: paused ? "paused" : "running" }
                              : undefined
                          }
                          onAnimationEnd={autoplay ? goNext : undefined}
                        />
                      )}
                    </span>
                  </button>
                ))}
              </div>
              {autoplay && (
                <button
                  type="button"
                  onClick={() => setUserPaused((p) => !p)}
                  aria-label={userPaused ? "Play highlights" : "Pause highlights"}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ive-line bg-white text-ive-navy transition-colors hover:border-ive-navy"
                >
                  {userPaused ? <FiPlay className="h-3.5 w-3.5" /> : <FiPause className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
