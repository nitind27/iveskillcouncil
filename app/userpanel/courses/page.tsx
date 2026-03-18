"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiClock, FiBook } from "react-icons/fi";
import { useUserPanelConfig } from "@/contexts/UserPanelConfigContext";
import type { CourseItem } from "@/config/userpanel.config";

function getSlug(c: CourseItem): string {
  return c.slug || c.id;
}

export default function UserPanelCoursesPage() {
  const config = useUserPanelConfig();
  const courses = config.courses?.items || [];

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
            Choose a course to view details, add to cart, or enquire now.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course: CourseItem, i: number) => (
            <motion.article
              key={course.id}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.06 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative"
            >
              <Link href={`/userpanel/courses/${getSlug(course)}`} className="block">
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
                      View details & book
                      <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {courses.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-[var(--up-text-muted)] py-16"
          >
            No courses available at the moment.
          </motion.p>
        )}
      </div>
    </div>
  );
}
