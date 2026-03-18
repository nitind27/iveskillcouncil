"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiTag, FiChevronRight } from "react-icons/fi";
import OfferModal from "./OfferModal";
import type { OfferItem, UserPanelConfig } from "@/config/userpanel.config";

interface OffersSectionProps {
  config: UserPanelConfig;
}

export default function OffersSection({ config }: OffersSectionProps) {
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const { offers } = config;
  const items = offers?.items || [];

  if (items.length === 0) return null;

  return (
    <>
      <section id="offers" className="relative py-24 px-4 sm:px-6 lg:px-8 panel-perspective overflow-hidden bg-[var(--up-bg)]">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full -z-10 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-700 text-sm font-semibold uppercase tracking-wider mb-3">
              <FiTag className="w-4 h-4" /> Deals
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-[var(--up-text)] mt-2 tracking-tight">
              {offers.sectionTitle}
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((offer: OfferItem, i: number) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ type: "spring", stiffness: 100, delay: i * 0.08 }}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => setSelectedOffer(offer)}
                className="group relative panel-3d cursor-pointer"
              >
                <div className="absolute -inset-0.5 bg-amber-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-70 transition duration-500" />
                <div className="relative h-full rounded-2xl bg-[var(--up-bg-card)] border border-[var(--up-border)] group-hover:border-amber-500/40 p-6 text-center transition-all duration-500 overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform duration-700" />
                  <motion.span
                    initial={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    className="inline-block px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-bold text-white shadow-lg mb-4 relative z-10"
                  >
                    {offer.discount}% OFF
                  </motion.span>
                  <h3 className="text-xl font-bold text-[var(--up-text)] mb-2 pr-4 relative z-10 group-hover:text-amber-800 transition-colors">
                    {offer.title}
                  </h3>
                  <p className="text-[var(--up-text-muted)] text-sm mb-5 relative z-10 line-clamp-2">
                    {offer.description}
                  </p>
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/25 font-medium text-sm text-amber-700 group-hover:bg-amber-500/25 transition-colors relative z-10">
                    View Offer <FiChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <OfferModal
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
      />
    </>
  );
}
