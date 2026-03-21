"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FiMapPin, FiUser, FiPhone, FiMail, FiArrowLeft, FiBriefcase, FiExternalLink } from "react-icons/fi";
import { useUserPanelConfig } from "@/contexts/UserPanelConfigContext";
import FranchiseInquiryModal from "@/components/userpanel/FranchiseInquiryModal";

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop",
];

interface FranchiseItem {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  head: string;
  contact: string;
  email: string;
  plan: string;
}

export default function UserPanelFranchisesPage() {
  const config = useUserPanelConfig();
  const [franchises, setFranchises] = useState<FranchiseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryFranchise, setInquiryFranchise] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetch("/api/franchises/public")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setFranchises(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const locationStr = (f: FranchiseItem) =>
    [f.address, f.city, f.state, f.pincode].filter(Boolean).join(", ") || "Address not specified";

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link
            href="/userpanel#franchise"
            className="inline-flex items-center gap-2 text-[var(--up-text-muted)] hover:text-[var(--up-accent)] font-medium transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--up-accent)]/10 border border-[var(--up-accent)]/20 text-[var(--up-accent)] text-sm font-semibold uppercase tracking-wider mb-3">
            Our Network
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--up-text)] tracking-tight">
            {config.franchise?.sectionTitle || "Our Franchise Branches"}
          </h1>
          <p className="mt-4 text-[var(--up-text-muted)] max-w-2xl mx-auto">
            Explore our franchise locations. Find a branch near you and connect with our team.
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center py-20"
          >
            <div className="w-12 h-12 rounded-full border-4 border-[var(--up-accent)]/30 border-t-[var(--up-accent)] animate-spin" />
          </motion.div>
        )}

        {/* Franchise grid */}
        <AnimatePresence mode="wait">
          {!loading && franchises.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 rounded-2xl bg-[var(--up-bg-muted)] border border-[var(--up-border)]"
            >
              <FiBriefcase className="w-16 h-16 text-[var(--up-text-muted)]/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[var(--up-text)] mb-2">No branches yet</h3>
              <p className="text-[var(--up-text-muted)]">
                Our franchise network is growing. Check back soon or contact us for franchise opportunities.
              </p>
            </motion.div>
          )}

          {!loading && franchises.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.08 } },
                hidden: {},
              }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {franchises.map((f, i) => (
                <motion.article
                  key={f.id}
                  variants={{
                    hidden: { opacity: 0, y: 40 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 18 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative"
                >
                  <div className="h-full rounded-2xl overflow-hidden bg-[var(--up-bg-card)] border border-[var(--up-border)] shadow-sm group-hover:shadow-xl group-hover:border-[var(--up-accent)]/30 transition-all duration-500">
                    <div className="relative h-48 overflow-hidden">
                      <motion.img
                        src={DEFAULT_IMAGES[i % DEFAULT_IMAGES.length]}
                        alt={f.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-[var(--up-accent)]/90 text-white text-xs font-semibold">
                        {f.plan}
                      </span>
                      <h2 className="absolute bottom-4 left-4 right-4 text-xl font-bold text-white drop-shadow-lg">
                        {f.name}
                      </h2>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex items-start gap-3 text-[var(--up-text-muted)]">
                        <FiMapPin className="w-5 h-5 text-[var(--up-accent)] flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{locationStr(f)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[var(--up-text-muted)]">
                        <FiUser className="w-5 h-5 text-[var(--up-accent)] flex-shrink-0" />
                        <span className="text-sm">{f.head}</span>
                      </div>
                      {f.contact && (
                        <div className="flex items-center gap-3 text-[var(--up-text-muted)]">
                          <FiPhone className="w-5 h-5 text-[var(--up-accent)] flex-shrink-0" />
                          <a href={`tel:${f.contact}`} className="text-sm hover:text-[var(--up-accent)] transition-colors">
                            {f.contact}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-[var(--up-text-muted)]">
                        <FiMail className="w-5 h-5 text-[var(--up-accent)] flex-shrink-0" />
                        <a href={`mailto:${f.email}`} className="text-sm hover:text-[var(--up-accent)] transition-colors truncate">
                          {f.email}
                        </a>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/userpanel/franchise/${f.id}/courses`}
                          className="flex-1"
                        >
                          <motion.span
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="block w-full py-3 rounded-xl bg-[var(--up-accent)] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[var(--up-accent-hover)] transition-colors"
                          >
                            View Courses
                            <FiExternalLink className="w-4 h-4" />
                          </motion.span>
                        </Link>
                        <motion.button
                          type="button"
                          onClick={() => { setInquiryFranchise({ id: f.id, name: f.name }); setInquiryOpen(true); }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="py-3 px-4 rounded-xl border-2 border-[var(--up-accent)] text-[var(--up-accent)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--up-accent)]/10 transition-colors"
                        >
                          Enquire
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FranchiseInquiryModal
        open={inquiryOpen}
        onClose={() => { setInquiryOpen(false); setInquiryFranchise(null); }}
        franchise={inquiryFranchise}
      />
    </div>
  );
}
