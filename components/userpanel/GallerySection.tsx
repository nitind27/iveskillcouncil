"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FiImage, FiX, FiChevronLeft, FiChevronRight, FiMaximize2 } from "react-icons/fi";
import { createPortal } from "react-dom";
import type { UserPanelConfig, GalleryImage } from "@/config/userpanel.config";
import { cn } from "@/lib/utils";
import Reveal from "./ui/Reveal";
import { EASE_OUT } from "./ui/motion";

interface GallerySectionProps {
  config: UserPanelConfig;
}

const ALL = "All";

function useCardsPerView() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const apply = () => {
      const width = window.innerWidth;
      setCount(width < 640 ? 1 : width < 1024 ? 2 : 3);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  return count;
}

function GalleryCard({
  item,
  index,
  onOpen,
  onError,
}: {
  item: GalleryImage;
  index: number;
  onOpen: () => void;
  onError: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [useThumb, setUseThumb] = useState(Boolean(item.thumb && item.thumb !== item.src));

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full w-full flex-col overflow-hidden rounded-[1.35rem] border border-ive-line bg-white text-left shadow-[0_18px_40px_-28px_rgba(6,27,54,0.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_-24px_rgba(6,27,54,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ive-saffron focus-visible:ring-offset-2"
      aria-label={`Open ${item.alt || "image"}`}
    >
      <span className="relative flex h-64 items-center justify-center bg-[#F4F7FB] sm:h-72">
        {!loaded && <span className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#E2E8F0] to-[#F1F5F9]" aria-hidden />}
        <img
          src={useThumb ? item.thumb : item.src}
          alt={item.alt || "Gallery image"}
          loading={index < 3 ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => (useThumb ? setUseThumb(false) : onError())}
          className={cn("max-h-full max-w-full object-contain transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0")}
        />
        {item.category && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ive-navy shadow-sm">
            {item.category}
          </span>
        )}
        <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ive-navy/90 text-white opacity-0 shadow-lg transition duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <FiMaximize2 className="h-4 w-4" />
        </span>
      </span>
      <span className="flex items-start justify-between gap-3 px-4 py-3.5">
        <span className="line-clamp-2 text-sm font-bold leading-snug text-ive-navy">{item.alt || "Gallery image"}</span>
      </span>
    </button>
  );
}

export default function GallerySection({ config }: GallerySectionProps) {
  const { gallery } = config;
  const reduce = useReducedMotion();
  const perView = useCardsPerView();
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState(ALL);
  const [page, setPage] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const touchX = useRef<number | null>(null);
  const slideX = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  const images = useMemo(
    () => (gallery?.images || []).filter((img) => img?.src && !failed.has(img.src)),
    [gallery?.images, failed]
  );

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    images.forEach((img) => {
      if (img.category) counts.set(img.category, (counts.get(img.category) ?? 0) + 1);
    });
    return Array.from(counts, ([name, count]) => ({ name, count }));
  }, [images]);

  const filtered = useMemo(
    () => (filter === ALL ? images : images.filter((img) => img.category === filter)),
    [images, filter]
  );
  const maxPage = Math.max(0, filtered.length - perView);

  useEffect(() => {
    setPage(0);
  }, [filter]);

  useEffect(() => {
    setPage((current) => Math.min(current, maxPage));
  }, [maxPage]);

  const markFailed = useCallback((src: string) => {
    setFailed((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));
  }, []);

  const total = filtered.length;
  const go = useCallback(
    (step: number) => setLightboxIndex((i) => (i === null || total === 0 ? null : (i + step + total) % total)),
    [total]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, go]);

  useEffect(() => {
    if (lightboxIndex === null || total < 2) return;
    [1, -1].forEach((step) => {
      const next = filtered[(lightboxIndex + step + total) % total];
      if (next) new Image().src = next.src;
    });
  }, [lightboxIndex, filtered, total]);

  if (images.length === 0) return null;

  const current = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  const lightboxContent = (
    <AnimatePresence>
      {lightboxIndex !== null && current && (
        <motion.div
          key="gallery-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col bg-[#040F20]/95 backdrop-blur-md"
          onClick={() => setLightboxIndex(null)}
          onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
          onTouchEnd={(e) => {
            const start = touchX.current;
            const end = e.changedTouches[0]?.clientX;
            touchX.current = null;
            if (start === null || end === undefined || Math.abs(end - start) < 50) return;
            go(end < start ? 1 : -1);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image"
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6" onClick={(e) => e.stopPropagation()}>
            <span className="rounded-full border border-ive-saffron/35 bg-ive-saffron/15 px-3 py-1 text-xs font-semibold text-ive-saffron">
              {lightboxIndex + 1} / {total}
            </span>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-ive-saffron"
              aria-label="Close"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20">
            {total > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); go(-1); }}
                  className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-ive-saffron sm:left-5 sm:flex"
                  aria-label="Previous"
                >
                  <FiChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); go(1); }}
                  className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-ive-saffron sm:right-5 sm:flex"
                  aria-label="Next"
                >
                  <FiChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            <motion.figure
              key={current.src}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="flex max-h-full max-w-5xl flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={current.src}
                alt={current.alt || `Gallery ${lightboxIndex + 1}`}
                className="max-h-[calc(100vh-15rem)] w-auto max-w-full rounded-2xl object-contain shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
              />
              <figcaption className="mt-4 flex flex-wrap items-center justify-center gap-2 text-center">
                {current.category && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">
                    {current.category}
                  </span>
                )}
                <span className="text-sm font-medium text-white">{current.alt || `Image ${lightboxIndex + 1}`}</span>
              </figcaption>
            </motion.figure>
          </div>

          {total > 1 && (
            <div className="flex justify-center px-4 pb-4 pt-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                {filtered.map((img, i) => (
                  <button
                    key={img.src + i}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className={cn(
                      "h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                      i === lightboxIndex ? "border-ive-saffron opacity-100" : "border-transparent opacity-50 hover:opacity-90"
                    )}
                    aria-label={`Show ${img.alt || `image ${i + 1}`}`}
                  >
                    <img src={img.thumb || img.src} alt="" loading="lazy" className="h-full w-full object-cover object-center" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <section id="gallery" className="relative overflow-hidden bg-ive-mist px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="relative mx-auto max-w-7xl">
        <Reveal className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ive-royal shadow-sm">
            <FiImage className="h-3.5 w-3.5 text-ive-saffron" />
            Moments &amp; Achievements
          </span>
          <h2 className="mt-4 text-[1.9rem] font-extrabold tracking-tight text-ive-navy sm:text-4xl lg:text-[2.6rem]">{gallery.sectionTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-ive-slate">
            Awards, events and proud moments — a glimpse of our institute&apos;s journey.
          </p>
        </Reveal>

        {categories.length > 1 && (
          <div className="-mx-4 mb-8 flex justify-start gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Gallery categories">
            {[{ name: ALL, count: images.length }, ...categories].map(({ name, count }) => {
              const active = filter === name;
              return (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(name)}
                  className={cn(
                    "relative inline-flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300",
                    active ? "text-white" : "bg-white text-ive-ink hover:text-ive-navy"
                  )}
                >
                  {active && (
                    <motion.span layoutId="gallery-filter" className="absolute inset-0 rounded-full bg-ive-navy shadow-[0_8px_20px_-6px_rgba(6,27,54,0.45)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                  )}
                  <span className="relative">{name}</span>
                  <span className={cn("relative rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none", active ? "bg-ive-saffron text-white" : "bg-ive-mist text-ive-slate")}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="relative">
          {filtered.length > perView && (
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ive-slate">
                {page + 1}–{Math.min(page + perView, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ive-line bg-white text-ive-navy shadow-sm transition hover:border-ive-saffron hover:text-ive-saffron disabled:opacity-40"
                  aria-label="Previous photos"
                >
                  <FiChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(maxPage, current + 1))}
                  disabled={page >= maxPage}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ive-line bg-white text-ive-navy shadow-sm transition hover:border-ive-saffron hover:text-ive-saffron disabled:opacity-40"
                  aria-label="Next photos"
                >
                  <FiChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <div
            className="overflow-hidden"
            onTouchStart={(e) => {
              slideX.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              const start = slideX.current;
              const end = e.changedTouches[0]?.clientX;
              slideX.current = null;
              if (start === null || end === undefined || Math.abs(end - start) < 48) return;
              setPage((current) => (end < start ? Math.min(maxPage, current + 1) : Math.max(0, current - 1)));
            }}
          >
            {filtered.length === 0 ? (
              <p className="rounded-2xl bg-white px-6 py-10 text-center text-sm text-ive-slate">No photos in this category.</p>
            ) : (
              <motion.ul
                className="flex"
                style={{ width: `${(filtered.length / perView) * 100}%` }}
                animate={{ x: `${(-page * 100) / filtered.length}%` }}
                transition={{ duration: reduce ? 0 : 0.45, ease: EASE_OUT }}
              >
                {filtered.map((item, i) => (
                  <li key={filter + item.src + i} className="px-2" style={{ width: `${100 / filtered.length}%` }}>
                    <GalleryCard item={item} index={i} onOpen={() => setLightboxIndex(i)} onError={() => markFailed(item.src)} />
                  </li>
                ))}
              </motion.ul>
            )}
          </div>
        </div>
      </div>

      {mounted && createPortal(lightboxContent, document.body)}
    </section>
  );
}
