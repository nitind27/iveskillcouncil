"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiImage, FiX, FiChevronLeft, FiChevronRight, FiMaximize2 } from "react-icons/fi";
import { createPortal } from "react-dom";
import type { UserPanelConfig } from "@/config/userpanel.config";

interface GallerySectionProps {
  config: UserPanelConfig;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80";

function tileClass(index: number, total: number): string {
  if (total < 3) return "md:col-span-6 aspect-[4/3]";
  if (index === 0) return "md:col-span-8 md:row-span-2 aspect-[4/3] md:aspect-auto md:min-h-[420px]";
  if (index === 1 || index === 2) return "md:col-span-4 aspect-[4/3] md:min-h-[200px]";
  return "md:col-span-4 aspect-[4/3]";
}

function GalleryTile({
  src,
  alt,
  index,
  total,
  onOpen,
}: {
  src: string;
  alt: string;
  index: number;
  total: number;
  onOpen: () => void;
}) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMAGE);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, delay: (index % 6) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
      className={`group relative col-span-12 overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#EEF2F7] text-left shadow-[0_10px_28px_rgba(15,23,42,0.06)] transition-all duration-500 hover:-translate-y-1 hover:border-[#1E4A85]/25 hover:shadow-[0_20px_44px_rgba(30,74,133,0.14)] ${tileClass(index, total)}`}
    >
      <img
        src={imgSrc}
        alt={alt}
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        onError={() => setImgSrc(FALLBACK_IMAGE)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F2744]/80 via-[#0F2744]/15 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-90" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
        <span className="text-sm font-semibold text-white drop-shadow-sm">{alt}</span>
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
          <FiMaximize2 className="h-4 w-4" />
        </span>
      </div>
    </motion.button>
  );
}

export default function GallerySection({ config }: GallerySectionProps) {
  const { gallery } = config;
  const images = gallery?.images || [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i === null ? null : (i + 1) % images.length));
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, images.length]);

  useEffect(() => {
    if (lightboxIndex !== null) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxIndex]);

  if (images.length === 0) return null;

  const current = lightboxIndex !== null ? images[lightboxIndex] : null;

  const lightboxContent = (
    <AnimatePresence>
      {lightboxIndex !== null && current && (
        <motion.div
          key="gallery-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#070F1C]/92 p-4 backdrop-blur-md"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image"
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-[#C4A35A] hover:text-[#1A1408]"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i! - 1 + images.length) % images.length); }}
                className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-[#C4A35A] hover:text-[#1A1408]"
                aria-label="Previous"
              >
                <FiChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i! + 1) % images.length); }}
                className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-[#C4A35A] hover:text-[#1A1408]"
                aria-label="Next"
              >
                <FiChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <motion.div
            key={lightboxIndex}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.28 }}
            className="relative max-h-[86vh] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.src}
              alt={current.alt || `Gallery ${lightboxIndex + 1}`}
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
            />
            <div className="mt-4 flex items-center justify-between gap-4 text-sm text-white/80">
              <span className="font-medium text-white">{current.alt || `Image ${lightboxIndex + 1}`}</span>
              {images.length > 1 && (
                <span className="rounded-full border border-[#C4A35A]/35 bg-[#C4A35A]/15 px-3 py-1 text-xs font-semibold text-[#C4A35A]">
                  {lightboxIndex + 1} / {images.length}
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <section id="gallery" className="relative overflow-hidden bg-[#F7F8FA] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-[#1E4A85]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-6 h-56 w-56 rounded-full bg-[#C4A35A]/[0.08] blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1E4A85]/15 bg-[#1E4A85]/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E4A85]">
            <FiImage className="h-3.5 w-3.5" />
            Moments
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A] md:text-4xl">
            {gallery.sectionTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-[#64748B]">
            Campus life, classrooms, and events — a glimpse of the institute in action.
          </p>
        </motion.div>

        <div className="grid grid-cols-12 gap-4 md:gap-5">
          {images.map((item, i) => (
            <GalleryTile
              key={item.src + i}
              src={item.src}
              alt={item.alt || `Gallery ${i + 1}`}
              index={i}
              total={images.length}
              onOpen={() => setLightboxIndex(i)}
            />
          ))}
        </div>
      </div>

      {typeof window !== "undefined" && createPortal(lightboxContent, document.body)}
    </section>
  );
}
