"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight } from "react-icons/fi";
import type { CourseItem, UserPanelConfig } from "@/config/userpanel.config";

function getSlug(c: CourseItem): string {
  return c.slug || c.id;
}

interface CoursesSectionProps {
  config: UserPanelConfig;
}

export default function CoursesSection({ config }: CoursesSectionProps) {
  const { courses } = config;
  const items = courses?.items || [];

  if (items.length === 0) return null;

  return (
    <section id="courses" className="relative py-24 px-4 sm:px-6 lg:px-8 panel-perspective bg-[var(--up-bg)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,var(--up-accent)/0.06,transparent)] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--up-accent)]/10 border border-[var(--up-accent)]/20 text-[var(--up-accent)] text-sm font-semibold uppercase tracking-wider mb-3">
            Programs
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-[var(--up-text)] mt-2 tracking-tight">
            {courses.sectionTitle}
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((course: CourseItem, i: number) => (
            <motion.article
              key={course.id}
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.07 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative panel-3d"
            >
              <div className="absolute -inset-0.5 bg-[var(--up-accent)]/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-60 transition duration-500" />
              <div className="relative h-full rounded-2xl overflow-hidden bg-[var(--up-bg-card)] border border-[var(--up-border)] group-hover:border-[var(--up-accent)]/30 transition-all duration-500 shadow-sm">
                <Link href={`/userpanel/courses/${getSlug(course)}`} className="block">
                  <div className="relative h-48 overflow-hidden">
                    <motion.img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.12 }}
                      transition={{ duration: 0.6 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-[var(--up-bg-card)]/90 backdrop-blur text-xs font-medium text-[var(--up-text)]">
                      {course.duration}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg text-[var(--up-text)] mb-3 group-hover:text-[var(--up-accent)] transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                  </div>
                </Link>
                <div className="px-5 pb-5">
                  <Link href={`/userpanel/courses/${getSlug(course)}`}>
                    <motion.span
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex w-full py-3 rounded-xl bg-[var(--up-accent)] font-semibold text-sm text-white items-center justify-center gap-2 shadow-lg border border-[var(--up-border)] hover:bg-[var(--up-accent-hover)] transition-all"
                    >
                      View details & book
                      <FiArrowRight className="w-4 h-4" />
                    </motion.span>
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link
            href="/userpanel/franchises"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-[var(--up-border)] text-[var(--up-text)] font-semibold hover:border-[var(--up-accent)]/50 transition-colors"
          >
            Browse branches & courses <FiArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
