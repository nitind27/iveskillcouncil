"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiTag, FiChevronRight, FiChevronLeft, FiArrowRight } from "react-icons/fi";
import OfferModal from "./OfferModal";
import OfferApplyFormModal from "./OfferApplyFormModal";
import type { OfferItem, UserPanelConfig } from "@/config/userpanel.config";

interface OffersSectionProps {
  config: UserPanelConfig;
}

export default function OffersSection({ config }: OffersSectionProps) {
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [applyFormOffer, setApplyFormOffer] = useState<OfferItem | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const { offers } = config;
  const items = offers?.items || [];

  if (items.length === 0) return null;

  const currentOffer = items[slideIndex];
  const hasMultiple = items.length > 1;

  const goPrev = () => setSlideIndex((i) => (i === 0 ? items.length - 1 : i - 1));
  const goNext = () => setSlideIndex((i) => (i === items.length - 1 ? 0 : i + 1));

  return (
    <>
      <section id="offers" className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[var(--up-bg-muted)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(243,156,18,0.07),transparent)] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#F39C12]/[0.06] blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto relative">
          {/* heading */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F39C12]/15 border border-[#F39C12]/30 text-[#D68910] text-sm font-semibold uppercase tracking-wider mb-4">
              <FiTag className="w-4 h-4" /> Hot Deals
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] tracking-tight">
              {offers.sectionTitle}
            </h2>
            <p className="text-[#6B7280] mt-3 text-lg max-w-lg mx-auto">
              Limited-time offers — grab them before they&apos;re gone.
            </p>
          </motion.div>

          {/* slider */}
          <div className="flex items-center gap-4">
            {hasMultiple && (
              <motion.button
                type="button"
                onClick={goPrev}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Previous offer"
                className="w-12 h-12 rounded-2xl bg-white border border-[var(--up-border)] flex items-center justify-center text-[#374151] hover:border-[#F39C12]/50 hover:text-[#F39C12] transition-all shrink-0 shadow-sm"
              >
                <FiChevronLeft className="w-5 h-5" />
              </motion.button>
            )}

            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slideIndex}
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ type: "spring", stiffness: 280, damping: 28 }}
                  className="relative rounded-3xl overflow-hidden cursor-pointer group"
                  onClick={() => setSelectedOffer(currentOffer)}
                >
                  {/* outer gradient border */}
                  <div className="relative bg-gradient-to-br from-[#F39C12] via-[#D68910] to-[#2D5DA8] p-px rounded-3xl shadow-2xl">
                    <div className="relative bg-white rounded-[calc(1.5rem-1px)] p-8 md:p-12 overflow-hidden">
                      {/* decorative circles */}
                      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#F39C12]/10 group-hover:bg-[#F39C12]/20 transition-colors duration-500" />
                      <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-[#2D5DA8]/08 group-hover:bg-[#2D5DA8]/15 transition-colors duration-500" />

                      <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
                        {/* discount badge */}
                        <div className="flex-shrink-0">
                          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[#F39C12] to-[#D68910] flex flex-col items-center justify-center shadow-xl">
                            <span className="text-4xl font-black text-white leading-none">{currentOffer.discount}%</span>
                            <span className="text-white/80 text-xs font-bold uppercase tracking-wider mt-1">OFF</span>
                          </div>
                        </div>

                        {/* text */}
                        <div className="flex-1 text-center md:text-left">
                          <span className="inline-block px-3 py-1 rounded-full bg-[#F39C12]/15 border border-[#F39C12]/30 text-[#D68910] text-xs font-bold uppercase tracking-wider mb-3">
                            Limited Time
                          </span>
                          <h3 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] mb-3 leading-tight">
                            {currentOffer.title}
                          </h3>
                          <p className="text-[#6B7280] mb-6 line-clamp-2 text-base">
                            {currentOffer.description}
                          </p>
                          <motion.span
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F39C12] text-white font-bold shadow-lg text-sm hover:bg-[#D68910] transition-colors"
                          >
                            Claim Offer <FiArrowRight className="w-4 h-4" />
                          </motion.span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {hasMultiple && (
              <motion.button
                type="button"
                onClick={goNext}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Next offer"
                className="w-12 h-12 rounded-2xl bg-white border border-[var(--up-border)] flex items-center justify-center text-[#374151] hover:border-[#F39C12]/50 hover:text-[#F39C12] transition-all shrink-0 shadow-sm"
              >
                <FiChevronRight className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          {/* dots */}
          {hasMultiple && (
            <div className="flex justify-center gap-2 mt-8">
              {items.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlideIndex(i)}
                  aria-label={`Offer ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === slideIndex ? "w-8 bg-[#F39C12]" : "w-2 bg-[var(--up-border)] hover:bg-[#F39C12]/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <OfferModal
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onApplyNow={(offer) => { setSelectedOffer(null); setApplyFormOffer(offer); }}
      />
      <OfferApplyFormModal
        open={!!applyFormOffer}
        onClose={() => setApplyFormOffer(null)}
        offer={applyFormOffer}
      />
    </>
  );
}
