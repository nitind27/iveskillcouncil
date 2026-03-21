"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FiMapPin, FiUser, FiPhone, FiMail, FiArrowRight, FiBriefcase, FiExternalLink } from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";
import FranchiseInquiryModal from "./FranchiseInquiryModal";

interface FranchiseSectionProps {
  config: UserPanelConfig;
}

export default function FranchiseSection({ config }: FranchiseSectionProps) {
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryFranchise, setInquiryFranchise] = useState<{ id?: string; name: string } | null>(null);
  const { franchise } = config;
  const highlight = franchise?.highlight;

  const openInquiry = (f?: { id?: string; name: string } | null) => {
    setInquiryFranchise(f ?? null);
    setInquiryOpen(true);
  };

  return (
    <>
      <section id="franchise" className="relative py-24 px-4 sm:px-6 lg:px-8 panel-perspective overflow-hidden bg-[var(--up-bg-muted)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--up-accent)]/[0.05] blur-[100px] rounded-full -z-10" />
        <div className="max-w-5xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-1 bg-[var(--up-accent)]/10 rounded-3xl blur-xl opacity-0 hover:opacity-60 transition duration-500" />
            <div className="relative rounded-3xl bg-[var(--up-bg-card)] border border-[var(--up-border)] p-8 md:p-10 text-center md:text-left shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[var(--up-accent)]/15 flex items-center justify-center border border-[var(--up-accent)]/20 flex-shrink-0">
                    <FiBriefcase className="w-7 h-7 text-[var(--up-accent)]" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-[var(--up-text)] mb-1">
                      Want to take a franchise?
                    </h3>
                    <p className="text-[var(--up-text-muted)] text-sm md:text-base">
                      Partner with us. Share your details and our team will contact you with options and support.
                    </p>
                  </div>
                </div>
                <motion.button
                  type="button"
                  onClick={() => openInquiry(null)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-shrink-0 px-8 py-4 rounded-xl bg-[var(--up-accent)] font-bold text-white shadow-lg border border-[var(--up-border)] hover:bg-[var(--up-accent-hover)] transition-all"
                >
                  Apply for Franchise
                </motion.button>
              </div>
            </div>
          </motion.div>

          {highlight && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
              whileHover={{ y: -4 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-[var(--up-accent)]/10 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-50 transition duration-700" />
              <div className="relative rounded-3xl overflow-hidden bg-[var(--up-bg-card)] border border-[var(--up-border)] group-hover:border-[var(--up-accent)]/30 shadow-xl transition-all duration-500">
                <div className="grid md:grid-cols-2">
                  <div className="relative min-h-[280px] md:min-h-[360px] overflow-hidden">
                    <motion.img
                      src={highlight.image}
                      alt={highlight.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.7 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent md:from-transparent md:via-transparent md:to-black/50" />
                  </div>
                  <div className="p-8 md:p-10 flex flex-col justify-center">
                    <span className="text-[var(--up-accent)] text-xs font-bold uppercase tracking-wider mb-2">
                      {franchise.sectionTitle || "Featured Branch"}
                    </span>
                    <h2 className="text-2xl md:text-4xl font-bold text-[var(--up-text)] mb-6 tracking-tight">
                      {highlight.name}
                    </h2>
                    <ul className="space-y-4 text-[var(--up-text-muted)]">
                      <li className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--up-accent)]/15 flex items-center justify-center border border-[var(--up-accent)]/20">
                          <FiMapPin className="w-5 h-5 text-[var(--up-accent)]" />
                        </span>
                        {highlight.location}
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--up-accent)]/15 flex items-center justify-center border border-[var(--up-accent)]/20">
                          <FiUser className="w-5 h-5 text-[var(--up-accent)]" />
                        </span>
                        Head: {highlight.head}
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--up-accent)]/15 flex items-center justify-center border border-[var(--up-accent)]/20">
                          <FiPhone className="w-5 h-5 text-[var(--up-accent)]" />
                        </span>
                        {highlight.contact}
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--up-accent)]/15 flex items-center justify-center border border-[var(--up-accent)]/20">
                          <FiMail className="w-5 h-5 text-[var(--up-accent)]" />
                        </span>
                        {highlight.email}
                      </li>
                    </ul>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <motion.button
                        type="button"
                        onClick={() => openInquiry({ name: highlight.name })}
                        whileHover={{ scale: 1.03, boxShadow: "0 8px 25px -5px rgb(0 0 0 / 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--up-accent)] text-white font-semibold shadow-lg hover:bg-[var(--up-accent-hover)] transition-all"
                      >
                        Visit & Enquire
                        <FiExternalLink className="w-4 h-4" />
                      </motion.button>
                      <Link href={highlight.detailsUrl || "/userpanel/franchises"}>
                        <motion.span
                          whileHover={{ x: 6 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--up-bg-muted)] border border-[var(--up-border)] hover:bg-[var(--up-accent)]/15 hover:border-[var(--up-accent)]/30 font-semibold w-fit transition-all text-[var(--up-text)] cursor-pointer"
                        >
                          View All Franchises
                          <FiArrowRight className="w-4 h-4" />
                        </motion.span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      <FranchiseInquiryModal
        open={inquiryOpen}
        onClose={() => { setInquiryOpen(false); setInquiryFranchise(null); }}
        franchise={inquiryFranchise}
      />
    </>
  );
}
