"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiImage, FiX, FiChevronLeft, FiChevronRight, FiMaximize2 } from "react-icons/fi";
import { createPortal } from "react-dom";
import type { UserPanelConfig, GalleryImage } from "@/config/userpanel.config";

interface GallerySectionProps {
  config: UserPanelConfig;
}

const ALL = "All";
const INITIAL_VISIBLE = 12;

function GalleryTile({
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
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, delay: (index % 6) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
      className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#EEF2F7] text-left shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-all duration-500 hover:-translate-y-1 hover:border-[#003366]/25 hover:shadow-[0_20px_44px_rgba(0,51,102,0.16)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7F0E] md:mb-5"
      aria-label={`Open ${item.alt || "image"}`}
    >
      {!loaded && <div className="aspect-[4/3] w-full animate-pulse bg-gradient-to-br from-[#E2E8F0] to-[#F1F5F9]" />}
      <img
        src={useThumb ? item.thumb : item.src}
        alt={item.alt || "Gallery image"}
        loading={index < 3 ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => (useThumb ? setUseThumb(false) : onError())}
        className={`block h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.06] ${loaded ? "" : "absolute inset-0 opacity-0"}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#001a33]/85 via-[#001a33]/10 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
      {item.category && (
        <span className="absolute left-3 top-3 rounded-full border border-white/25 bg-[#001a33]/45 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
          {item.category}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <span className="line-clamp-2 text-sm font-semibold leading-snug text-white drop-shadow-sm">
          {item.alt}
        </span>
        <span className="flex h-9 w-9 flex-shrink-0 translate-y-1 items-center justify-center rounded-full bg-[#FF7F0E] text-[#1A1408] opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <FiMaximize2 className="h-4 w-4" />
        </span>
      </div>
    </motion.button>
  );
}

export default function GallerySection({ config }: GallerySectionProps) {
  const { gallery } = config;
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState(ALL);
  const [showAll, setShowAll] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const touchX = useRef<number | null>(null);

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
  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);

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
          className="fixed inset-0 z-[9999] flex flex-col bg-[#070F1C]/95 backdrop-blur-md"
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
            <span className="rounded-full border border-[#FF7F0E]/35 bg-[#FF7F0E]/15 px-3 py-1 text-xs font-semibold text-[#FF7F0E]">
              {lightboxIndex + 1} / {total}
            </span>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-[#FF7F0E] hover:text-[#1A1408]"
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
                  className="absolute left-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-[#FF7F0E] hover:text-[#1A1408] sm:left-5 sm:flex"
                  aria-label="Previous"
                >
                  <FiChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); go(1); }}
                  className="absolute right-2 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-[#FF7F0E] hover:text-[#1A1408] sm:right-5 sm:flex"
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
                    className={`h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      i === lightboxIndex ? "border-[#FF7F0E] opacity-100" : "border-transparent opacity-50 hover:opacity-90"
                    }`}
                    aria-label={`Show ${img.alt || `image ${i + 1}`}`}
                  >
                    <img src={img.thumb || img.src} alt="" loading="lazy" className="h-full w-full object-cover" />
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
    <section id="gallery" className="relative overflow-hidden bg-[#F7F8FA] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-[#003366]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-6 h-56 w-56 rounded-full bg-[#FF7F0E]/[0.08] blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#003366]/15 bg-[#003366]/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#003366]">
            <FiImage className="h-3.5 w-3.5" />
            Moments &amp; Achievements
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A] md:text-4xl">
            {gallery.sectionTitle}
          </h2>
          <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-[#003366] to-[#FF7F0E]" />
          <p className="mx-auto mt-4 max-w-xl text-base text-[#64748B]">
            Awards, events and proud moments — a glimpse of our institute&apos;s journey.
          </p>
        </motion.div>

        {categories.length > 1 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Gallery categories">
            {[{ name: ALL, count: images.length }, ...categories].map(({ name, count }) => {
              const active = filter === name;
              return (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setFilter(name);
                    setShowAll(false);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                    active
                      ? "border-[#003366] bg-[#003366] text-white shadow-[0_8px_20px_rgba(0,51,102,0.25)]"
                      : "border-[#E2E8F0] bg-white text-[#334155] hover:border-[#003366]/30 hover:text-[#003366]"
                  }`}
                >
                  {name}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                      active ? "bg-[#FF7F0E] text-[#1A1408]" : "bg-[#F1F5F9] text-[#64748B]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div key={filter} className="columns-1 gap-4 sm:columns-2 md:gap-5 lg:columns-3">
          {visible.map((item, i) => (
            <GalleryTile
              key={item.src + i}
              item={item}
              index={i}
              onOpen={() => setLightboxIndex(i)}
              onError={() => markFailed(item.src)}
            />
          ))}
        </div>

        {filtered.length > INITIAL_VISIBLE && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="rounded-full border border-[#003366]/20 bg-white px-6 py-2.5 text-sm font-semibold text-[#003366] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#003366] hover:shadow-md"
            >
              {showAll ? "Show less" : `View all ${filtered.length} photos`}
            </button>
          </div>
        )}
      </div>

      {mounted && createPortal(lightboxContent, document.body)}
    </section>
  );
}
