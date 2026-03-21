"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiImage, FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { createPortal } from "react-dom";
import type { UserPanelConfig } from "@/config/userpanel.config";

interface GallerySectionProps {
  config: UserPanelConfig;
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

  const lightboxContent = (
    <AnimatePresence>
      {lightboxIndex !== null && (
        <motion.div
          key="gallery-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Gallery image"
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <FiX className="w-6 h-6" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i! - 1 + images.length) % images.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Previous"
              >
                <FiChevronLeft className="w-8 h-8" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => (i! + 1) % images.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                aria-label="Next"
              >
                <FiChevronRight className="w-8 h-8" />
              </button>
            </>
          )}
          <motion.img
            key={lightboxIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            src={images[lightboxIndex]?.src}
            alt={images[lightboxIndex]?.alt || `Gallery ${lightboxIndex + 1}`}
            className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
              {lightboxIndex + 1} / {images.length}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <section id="gallery" className="relative py-24 px-4 sm:px-6 lg:px-8 panel-perspective overflow-hidden bg-[var(--up-bg-muted)]">
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-violet-500/5 blur-[100px] rounded-full -z-10" />
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-700 text-sm font-semibold uppercase tracking-wider mb-3">
            <FiImage className="w-4 h-4" /> Moments
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-[var(--up-text)] mt-2 tracking-tight">
            {gallery.sectionTitle}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {images.map((item, i) => (
            <motion.div
              key={item.src + i}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ type: "spring", stiffness: 100, delay: (i % 6) * 0.05 }}
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => setLightboxIndex(i)}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden group panel-3d border border-[var(--up-border)] shadow-sm cursor-pointer"
            >
              <div className="absolute -inset-0.5 bg-[var(--up-accent)]/10 rounded-2xl blur opacity-0 group-hover:opacity-60 transition duration-500 z-10 pointer-events-none" />
              <motion.img
                src={item.src}
                alt={item.alt || `Gallery ${i + 1}`}
                className="relative w-full h-full object-cover"
                whileHover={{ scale: 1.12 }}
                transition={{ duration: 0.6 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-black/50">
                <span className="text-white font-medium text-sm">{item.alt || `Image ${i + 1}`}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      {typeof window !== "undefined" && createPortal(lightboxContent, document.body)}
    </section>
  );
}
