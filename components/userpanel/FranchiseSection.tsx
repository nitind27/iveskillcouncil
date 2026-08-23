"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiMapPin, FiUser, FiPhone, FiMail, FiArrowRight,
  FiBriefcase, FiExternalLink, FiCheckCircle,
} from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";
import FranchiseInquiryModal from "./FranchiseInquiryModal";
import FranchisePlansModal from "./FranchisePlansModal";

interface FranchiseSectionProps {
  config: UserPanelConfig;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80";

const perks = [
  "Full training & onboarding support",
  "Marketing & branding materials",
  "Dedicated franchise manager",
  "Revenue sharing model",
];

export default function FranchiseSection({ config }: FranchiseSectionProps) {
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryFranchise, setInquiryFranchise] = useState<{ id?: string; name: string } | null>(null);
  const [plansOpen, setPlansOpen] = useState(false);
  const { franchise } = config;
  const highlight = franchise?.highlight;
  const [highlightSrc, setHighlightSrc] = useState(highlight?.image || FALLBACK_IMAGE);

  const openInquiry = (f?: { id?: string; name: string } | null) => {
    setInquiryFranchise(f ?? null);
    setInquiryOpen(true);
  };

  return (
    <>
      <section id="franchise" className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[#1E4A85]/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-8 h-64 w-64 rounded-full bg-[#C4A35A]/[0.08] blur-3xl" />

        <div className="relative mx-auto max-w-7xl space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1E4A85]/15 bg-[#1E4A85]/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E4A85]">
              <FiBriefcase className="h-3.5 w-3.5" />
              Franchise
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A] md:text-4xl">
              {franchise?.sectionTitle || "Featured Branch"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-[#64748B]">
              Join our franchise network and build a successful education business.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border border-[#1E4A85]/20 shadow-[0_24px_60px_rgba(15,39,68,0.18)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0F2744] via-[#163A6B] to-[#1E4A85]" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#C4A35A]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#C4A35A] via-white/70 to-[#C4A35A]" />

            <div className="relative grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12 lg:p-12">
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#C4A35A]">
                  Partner with IVESDC
                </p>
                <h3 className="mb-3 text-2xl font-extrabold leading-tight text-white drop-shadow-[0_0_18px_rgba(196,163,90,0.25)] md:text-3xl">
                  Ready to open your own branch?
                </h3>
                <p className="mb-6 max-w-lg text-sm leading-relaxed text-white/80 md:text-base">
                  Partner with us and get full support — from setup to operations. Our team is with you every step.
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {perks.map((p, i) => (
                    <motion.div
                      key={p}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/90"
                    >
                      <FiCheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#C4A35A]" />
                      {p}
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setPlansOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C4A35A] px-6 py-3.5 text-sm font-bold text-[#0F172A] shadow-lg transition-colors hover:bg-[#A88B48] hover:text-white"
                >
                  View Plans &amp; Buy
                  <FiArrowRight className="h-4 w-4" />
                </button>
                <Link
                  href="/userpanel/apply-franchise"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                >
                  Apply with Documents
                </Link>
                <button
                  type="button"
                  onClick={() => openInquiry(null)}
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10"
                >
                  Just Enquire
                </button>
              </div>
            </div>
          </motion.div>

          {highlight && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
            >
              <div className="grid md:grid-cols-2">
                <div className="relative min-h-[240px] overflow-hidden bg-[#EEF2F7] md:min-h-[340px]">
                  <img
                    src={highlightSrc}
                    alt={highlight.name}
                    className="h-full w-full object-cover"
                    onError={() => setHighlightSrc(FALLBACK_IMAGE)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F2744]/55 via-transparent to-transparent" />
                  <span className="absolute bottom-4 left-4 rounded-md bg-[#C4A35A] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0F172A]">
                    Featured Branch
                  </span>
                </div>

                <div className="flex flex-col justify-center gap-6 p-7 md:p-10">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-[0.16em] text-[#1E4A85]">
                      Spotlight
                    </p>
                    <h3 className="text-2xl font-extrabold text-[#0F172A] md:text-3xl">
                      {highlight.name}
                    </h3>
                  </div>

                  <ul className="space-y-3">
                    {[
                      { icon: FiMapPin, value: highlight.location },
                      { icon: FiUser, value: `Head: ${highlight.head}` },
                      { icon: FiPhone, value: highlight.contact },
                      { icon: FiMail, value: highlight.email },
                    ].map(({ icon: Icon, value }) => (
                      <li key={value} className="flex items-center gap-3 text-sm text-[#475569]">
                        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1E4A85]/10">
                          <Icon className="h-4 w-4 text-[#1E4A85]" />
                        </span>
                        {value}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => openInquiry({ name: highlight.name })}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#163A6B]"
                    >
                      Visit & Enquire <FiExternalLink className="h-4 w-4" />
                    </button>
                    <Link
                      href={highlight.detailsUrl || "/userpanel/franchises"}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] px-5 py-2.5 text-sm font-semibold text-[#334155] transition-colors hover:border-[#1E4A85]/40 hover:text-[#1E4A85]"
                    >
                      All Franchises <FiArrowRight className="h-4 w-4" />
                    </Link>
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

      <FranchisePlansModal
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
      />
    </>
  );
}
