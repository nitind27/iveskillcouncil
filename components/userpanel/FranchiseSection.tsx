"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiMapPin, FiUser, FiPhone, FiMail, FiArrowRight, FiBriefcase, FiExternalLink, FiCheckCircle } from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";
import FranchiseInquiryModal from "./FranchiseInquiryModal";
import FranchisePlansModal from "./FranchisePlansModal";

interface FranchiseSectionProps {
  config: UserPanelConfig;
}

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

  const openInquiry = (f?: { id?: string; name: string } | null) => {
    setInquiryFranchise(f ?? null);
    setInquiryOpen(true);
  };

  return (
    <>
      <section id="franchise" className="relative py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[var(--up-bg)]">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#2D5DA8]/[0.04] blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#A8C63A]/[0.05] blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative space-y-16">

          {/* heading */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#A8C63A]/15 border border-[#A8C63A]/30 text-[#8FA92F] text-sm font-semibold uppercase tracking-wider mb-4">
              <FiBriefcase className="w-4 h-4" /> Franchise
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] tracking-tight">
              {franchise?.sectionTitle || "Grow With Us"}
            </h2>
            <p className="text-[#6B7280] mt-3 text-lg max-w-xl mx-auto">
              Join our franchise network and build a successful education business.
            </p>
          </motion.div>

          {/* CTA banner — Blue brand gradient */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#2D5DA8] via-[#1E4A85] to-[#1a3d70]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(168,198,58,0.15),transparent)]" />
            <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                  Ready to open your own branch?
                </h3>
                <p className="text-white/75 text-base max-w-lg">
                  Partner with us and get full support — from setup to operations. Our team is with you every step.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2 max-w-sm">
                  {perks.map((p) => (
                    <div key={p} className="flex items-center gap-2 text-white/80 text-sm">
                      <FiCheckCircle className="w-4 h-4 text-[#A8C63A] flex-shrink-0" />
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 flex-shrink-0">
                <motion.button
                  type="button"
                  onClick={() => setPlansOpen(true)}
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)" }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#F39C12] text-white font-extrabold text-base shadow-xl hover:bg-[#D68910] transition-all"
                >
                  View Plans &amp; Buy
                  <FiArrowRight className="w-5 h-5" />
                </motion.button>
                <Link href="/userpanel/apply-franchise">
                  <motion.span
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-white/10 border border-white/25 text-white font-semibold text-sm hover:bg-white/20 transition-all cursor-pointer"
                  >
                    Apply with Documents
                  </motion.span>
                </Link>
                <motion.button
                  type="button"
                  onClick={() => openInquiry(null)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-3 rounded-2xl bg-white/10 border border-white/25 text-white font-semibold text-sm hover:bg-white/20 transition-all"
                >
                  Just Enquire
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* featured branch */}
          {highlight && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}
              className="rounded-3xl overflow-hidden border border-[var(--up-border)] shadow-xl bg-white"
            >
              <div className="grid md:grid-cols-2">
                {/* image */}
                <div className="relative min-h-[280px] md:min-h-[380px] overflow-hidden">
                  <img src={highlight.image} alt={highlight.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/50 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className="px-3 py-1.5 rounded-xl bg-[#A8C63A] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider shadow-lg">
                      Featured Branch
                    </span>
                  </div>
                </div>

                {/* info */}
                <div className="p-8 md:p-10 flex flex-col justify-center gap-6">
                  <div>
                    <p className="text-[#2D5DA8] text-xs font-bold uppercase tracking-wider mb-1">
                      {franchise.sectionTitle || "Spotlight"}
                    </p>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A]">
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
                      <li key={value} className="flex items-center gap-3 text-[#6B7280] text-sm">
                        <span className="w-8 h-8 rounded-lg bg-[#2D5DA8]/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-[#2D5DA8]" />
                        </span>
                        {value}
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <motion.button
                      type="button"
                      onClick={() => openInquiry({ name: highlight.name })}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D5DA8] text-white font-semibold shadow-lg hover:bg-[#1E4A85] transition-all text-sm"
                    >
                      Visit & Enquire <FiExternalLink className="w-4 h-4" />
                    </motion.button>
                    <Link href={highlight.detailsUrl || "/userpanel/franchises"}>
                      <motion.span
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[var(--up-border)] text-[#374151] font-semibold hover:border-[#2D5DA8]/40 hover:text-[#2D5DA8] transition-all text-sm cursor-pointer"
                      >
                        All Franchises <FiArrowRight className="w-4 h-4" />
                      </motion.span>
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
