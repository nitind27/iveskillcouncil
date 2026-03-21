"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowRight, FiClock, FiBook, FiArrowLeft, FiMapPin } from "react-icons/fi";
import { useUserPanelConfig } from "@/contexts/UserPanelConfigContext";

interface FranchiseCourse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration: string;
  image: string;
  fee: number;
  type: string;
}

interface FranchiseData {
  id: string;
  name: string;
}

export default function FranchiseCoursesPage() {
  const params = useParams();
  const router = useRouter();
  const config = useUserPanelConfig();
  const franchiseId = typeof params?.id === "string" ? params.id : "";
  const [data, setData] = useState<{ franchise: FranchiseData; courses: FranchiseCourse[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!franchiseId) {
      setLoading(false);
      setError("Invalid franchise");
      return;
    }
    fetch(`/api/userpanel/franchise/${franchiseId}/courses`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && res?.data) {
          setData(res.data);
        } else {
          setError(res?.error || "Failed to load courses");
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [franchiseId]);

  if (loading) {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-[var(--up-accent)]/20 border-2 border-[var(--up-accent)]/40 animate-pulse" />
          <p className="text-[var(--up-text-muted)] font-medium">Loading courses...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen py-24 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <h1 className="text-2xl font-bold text-[var(--up-text)] mb-4">
            {error || "Franchise not found"}
          </h1>
          <Link
            href="/userpanel/franchises"
            className="inline-flex items-center gap-2 text-[var(--up-accent)] font-semibold hover:underline"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to franchises
          </Link>
        </motion.div>
      </div>
    );
  }

  const { franchise, courses } = data;

  return (
    <div className="min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <Link
            href="/userpanel/franchises"
            className="inline-flex items-center gap-2 text-[var(--up-text-muted)] hover:text-[var(--up-accent)] font-medium transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            All franchises
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--up-accent)]/10 border border-[var(--up-accent)]/20 text-[var(--up-accent)] text-sm font-semibold uppercase tracking-wider mb-3">
            <FiMapPin className="w-4 h-4" />
            {franchise.name}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--up-text)] tracking-tight">
            {config.courses?.sectionTitle || "Our Courses"}
          </h1>
          <p className="mt-4 text-[var(--up-text-muted)] max-w-2xl mx-auto">
            Courses available at this branch. Choose one to view details or enquire.
          </p>
        </motion.div>

        {/* Course grid */}
        <AnimatePresence mode="wait">
          {courses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 rounded-2xl bg-[var(--up-bg-muted)] border border-[var(--up-border)]"
            >
              <FiBook className="w-16 h-16 text-[var(--up-text-muted)]/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[var(--up-text)] mb-2">No courses yet</h3>
              <p className="text-[var(--up-text-muted)]">
                This branch has not added any courses yet. Check back later or explore other branches.
              </p>
              <Link
                href="/userpanel/franchises"
                className="inline-flex items-center gap-2 mt-6 text-[var(--up-accent)] font-semibold hover:underline"
              >
                <FiArrowLeft className="w-4 h-4" /> View other franchises
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.06 } },
                hidden: {},
              }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {courses.map((course, i) => (
                <motion.article
                  key={course.id}
                  variants={{
                    hidden: { opacity: 0, y: 32 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ type: "spring", stiffness: 100, damping: 18 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative"
                >
                  <Link
                    href={`/userpanel/franchise/${franchiseId}/courses/${course.slug}`}
                    className="block"
                  >
                    <div className="rounded-2xl overflow-hidden bg-[var(--up-bg-card)] border border-[var(--up-border)] shadow-sm group-hover:shadow-lg group-hover:border-[var(--up-accent)]/30 transition-all duration-300">
                      <div className="relative h-52 overflow-hidden">
                        <motion.img
                          src={course.image}
                          alt={course.title}
                          className="w-full h-full object-cover"
                          whileHover={{ scale: 1.08 }}
                          transition={{ duration: 0.5 }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-[var(--up-bg-card)]/95 text-sm font-medium text-[var(--up-text)]">
                          {course.duration}
                        </span>
                        <span className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-[var(--up-accent)]/90 text-white text-sm font-bold">
                          ₹{course.fee.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="p-6">
                        <h2 className="text-xl font-bold text-[var(--up-text)] mb-2 group-hover:text-[var(--up-accent)] transition-colors line-clamp-2">
                          {course.title}
                        </h2>
                        {course.description && (
                          <p className="text-[var(--up-text-muted)] text-sm line-clamp-2 mb-4">
                            {course.description}
                          </p>
                        )}
                        <span className="inline-flex items-center gap-2 text-[var(--up-accent)] font-semibold text-sm">
                          View details & enquire
                          <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
