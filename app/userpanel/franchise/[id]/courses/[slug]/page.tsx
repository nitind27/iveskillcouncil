"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiClock,
  FiMapPin,
  FiShoppingCart,
  FiSend,
} from "react-icons/fi";

interface CourseData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  duration: string;
  image: string;
  fee: number;
  type: string;
  franchise: { id: string; name: string };
}

export default function FranchiseCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const franchiseId = typeof params?.id === "string" ? params.id : "";
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!franchiseId || !slug) {
      setLoading(false);
      setError("Invalid route");
      return;
    }
    fetch(`/api/userpanel/franchise/${franchiseId}/courses/${slug}`)
      .then((r) => r.json())
      .then((res) => {
        if (res?.success && res?.data) {
          setCourse(res.data);
        } else {
          setError(res?.error || "Course not found");
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [franchiseId, slug]);

  if (loading) {
    return (
      <div className="min-h-screen py-24 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-[var(--up-accent)]/20 border-2 border-[var(--up-accent)]/40 animate-pulse" />
          <p className="text-[var(--up-text-muted)] font-medium">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen py-24 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <h1 className="text-2xl font-bold text-[var(--up-text)] mb-4">
            {error || "Course not found"}
          </h1>
          <Link
            href={`/userpanel/franchise/${franchiseId}/courses`}
            className="inline-flex items-center gap-2 text-[var(--up-accent)] font-semibold hover:underline"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to courses
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleEnquire = () => {
    router.push(
      `/userpanel/booking?franchiseId=${course.franchise.id}&courseId=${course.id}&courseName=${encodeURIComponent(course.title)}&fee=${course.fee}&enquire=1`
    );
  };

  const handleBook = () => {
    router.push(
      `/userpanel/booking?franchiseId=${course.franchise.id}&courseId=${course.id}&courseName=${encodeURIComponent(course.title)}&fee=${course.fee}`
    );
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href={`/userpanel/franchise/${franchiseId}/courses`}
            className="inline-flex items-center gap-2 text-[var(--up-text-muted)] hover:text-[var(--up-accent)] transition-colors text-sm font-medium"
          >
            <FiArrowLeft className="w-4 h-4" /> {course.franchise.name} courses
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl overflow-hidden bg-[var(--up-bg-card)] border border-[var(--up-border)] shadow-lg"
        >
          <div className="grid md:grid-cols-5 gap-0">
            <div className="md:col-span-2 relative h-64 md:h-auto min-h-[280px]">
              <motion.img
                src={course.image}
                alt={course.title}
                className="absolute inset-0 w-full h-full object-cover"
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/30" />
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-[var(--up-accent)]/90 text-white text-sm font-bold">
                ₹{course.fee.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="md:col-span-3 p-6 md:p-10 flex flex-col justify-center">
              <span className="inline-flex items-center gap-2 text-[var(--up-accent)] text-sm font-medium mb-2">
                <FiMapPin className="w-4 h-4" />
                {course.franchise.name}
              </span>
              <h1 className="text-2xl md:text-4xl font-bold text-[var(--up-text)] mb-4">
                {course.title}
              </h1>
              <p className="text-[var(--up-text-muted)] mb-6">
                {course.description || "Comprehensive program with hands-on projects and support."}
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--up-bg-muted)] text-[var(--up-text)] text-sm font-medium">
                  <FiClock className="w-4 h-4 text-[var(--up-accent)]" />
                  {course.duration}
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--up-accent)]/10 text-[var(--up-accent)] text-sm font-bold">
                  ₹{course.fee.toLocaleString("en-IN")} total fee
                </span>
              </div>

              <div className="flex flex-wrap gap-4">
                <motion.button
                  type="button"
                  onClick={handleBook}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-[var(--up-accent)] text-white font-bold shadow-lg hover:bg-[var(--up-accent-hover)] transition-colors"
                >
                  <FiShoppingCart className="w-5 h-5" />
                  Book Now
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleEnquire}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border-2 border-[var(--up-border)] bg-[var(--up-bg-card)] text-[var(--up-text)] font-bold hover:border-[var(--up-accent)]/50 transition-colors"
                >
                  <FiSend className="w-5 h-5" />
                  Enquire Now
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
