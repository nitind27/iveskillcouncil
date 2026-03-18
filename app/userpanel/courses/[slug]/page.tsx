"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiClock,
  FiUsers,
  FiFilm,
  FiBook,
  FiFileText,
  FiShoppingCart,
  FiSend,
} from "react-icons/fi";
import { useUserPanelConfig } from "@/contexts/UserPanelConfigContext";
import { useCourseCart } from "@/contexts/CourseCartContext";
import type { CourseItem } from "@/config/userpanel.config";

function getSlug(c: CourseItem): string {
  return c.slug || c.id;
}

function findCourseBySlug(items: CourseItem[], slug: string): CourseItem | null {
  return items.find((c) => getSlug(c) === slug) || items.find((c) => c.id === slug) || null;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const config = useUserPanelConfig();
  const { add: addToCart, has: inCart } = useCourseCart();
  const courses = config.courses?.items || [];
  const course = slug ? findCourseBySlug(courses, slug) : null;

  if (!course) {
    return (
      <div className="min-h-screen py-24 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <h1 className="text-2xl font-bold text-[var(--up-text)] mb-4">Course not found</h1>
          <Link
            href="/userpanel/courses"
            className="inline-flex items-center gap-2 text-[var(--up-accent)] font-semibold"
          >
            <FiArrowLeft className="w-4 h-4" /> Back to courses
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!inCart(course.id)) addToCart(course);
    router.push("/userpanel/booking");
  };

  const handleEnquireNow = () => {
    if (!inCart(course.id)) addToCart(course);
    router.push("/userpanel/booking?enquire=1");
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
            href="/userpanel/courses"
            className="inline-flex items-center gap-2 text-[var(--up-text-muted)] hover:text-[var(--up-accent)] transition-colors text-sm font-medium"
          >
            <FiArrowLeft className="w-4 h-4" /> All courses
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
            </div>
            <div className="md:col-span-3 p-6 md:p-10 flex flex-col justify-center">
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
                {typeof course.enrolled === "number" && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--up-bg-muted)] text-[var(--up-text)] text-sm font-medium">
                    <FiUsers className="w-4 h-4 text-[var(--up-accent)]" />
                    {course.enrolled.toLocaleString()} enrolled
                  </span>
                )}
                {typeof course.lectures === "number" && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--up-bg-muted)] text-[var(--up-text)] text-sm font-medium">
                    <FiBook className="w-4 h-4 text-[var(--up-accent)]" />
                    {course.lectures} lectures
                  </span>
                )}
                {typeof course.videos === "number" && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--up-bg-muted)] text-[var(--up-text)] text-sm font-medium">
                    <FiFilm className="w-4 h-4 text-[var(--up-accent)]" />
                    {course.videos} videos
                  </span>
                )}
                {course.notes && (
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--up-bg-muted)] text-[var(--up-text)] text-sm font-medium">
                    <FiFileText className="w-4 h-4 text-[var(--up-accent)]" />
                    {course.notes}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <motion.button
                  type="button"
                  onClick={handleAddToCart}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-[var(--up-accent)] text-white font-bold shadow-lg hover:bg-[var(--up-accent-hover)] transition-colors"
                >
                  <FiShoppingCart className="w-5 h-5" />
                  {inCart(course.id) ? "View booking" : "Add to cart & book"}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleEnquireNow}
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
