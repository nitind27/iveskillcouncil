"use client";

import { motion } from "framer-motion";
import { FiImage } from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";

interface GallerySectionProps {
  config: UserPanelConfig;
}

export default function GallerySection({ config }: GallerySectionProps) {
  const { gallery } = config;
  const images = gallery?.images || [];

  if (images.length === 0) return null;

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
              className="relative aspect-[4/3] rounded-2xl overflow-hidden group panel-3d border border-[var(--up-border)] shadow-sm"
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
    </section>
  );
}
