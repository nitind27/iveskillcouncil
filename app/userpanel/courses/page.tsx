"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiMapPin, FiBook } from "react-icons/fi";
import { useUserPanelConfig } from "@/contexts/UserPanelConfigContext";

export default function UserPanelCoursesPage() {
  const config = useUserPanelConfig();

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--up-accent)]/10 border border-[var(--up-accent)]/20 text-[var(--up-accent)] text-sm font-semibold uppercase tracking-wider mb-3">
            Programs
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--up-text)] tracking-tight">
            {config.courses?.sectionTitle || "Our Courses"}
          </h1>
          <p className="mt-4 text-[var(--up-text-muted)] max-w-2xl mx-auto">
            Courses are available at each franchise branch. Select a branch to view its courses and enrol.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 100, damping: 18 }}
          className="max-w-2xl mx-auto"
        >
          <Link
            href="/userpanel/franchises"
            className="block rounded-2xl overflow-hidden bg-[var(--up-bg-card)] border border-[var(--up-border)] shadow-lg hover:shadow-xl hover:border-[var(--up-accent)]/30 transition-all duration-300 group"
          >
            <div className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 rounded-2xl bg-[var(--up-accent)]/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <FiMapPin className="w-10 h-10 text-[var(--up-accent)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--up-text)] mb-2 group-hover:text-[var(--up-accent)] transition-colors">
                Browse by Branch
              </h2>
              <p className="text-[var(--up-text-muted)] mb-6">
                Each franchise branch offers its own set of courses. Find a branch near you and explore the courses available there.
              </p>
              <span className="inline-flex items-center gap-2 text-[var(--up-accent)] font-semibold">
                View all branches & courses
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
