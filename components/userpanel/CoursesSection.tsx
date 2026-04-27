"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiClock, FiBookOpen } from "react-icons/fi";
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
    <section id="courses" className="relative py-28 px-4 sm:px-6 lg:px-8 bg-[var(--up-bg)] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_110%,rgba(45,93,168,0.06),transparent)] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2D5DA8]/10 border border-[#2D5DA8]/20 text-[#2D5DA8] text-sm font-semibold uppercase tracking-wider mb-4">
            <FiBookOpen className="w-4 h-4" /> Programs
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] tracking-tight">
            {courses.sectionTitle}
          </h2>
          <p className="text-[#6B7280] mt-3 text-lg max-w-xl mx-auto">
            Pick a course and start building real skills today.
          </p>
        </motion.div>

        {/* grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((course: CourseItem, i: number) => (
            <motion.article
              key={course.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ type: "spring", stiffness: 90, damping: 18, delay: i * 0.07 }}
              className="group relative flex flex-col rounded-2xl overflow-hidden bg-white border border-[var(--up-border)] hover:border-[#2D5DA8]/40 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/60 via-black/10 to-transparent" />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
                  <FiClock className="w-3 h-3" />
                  {course.duration}
                </span>
                {/* top accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2D5DA8] to-[#A8C63A]" />
              </div>

              {/* body */}
              <div className="flex flex-col flex-1 p-5 gap-4">
                <h3 className="font-bold text-base text-[#1A1A1A] group-hover:text-[#2D5DA8] transition-colors line-clamp-2 leading-snug flex-1">
                  {course.title}
                </h3>
                <Link href={`/userpanel/courses/${getSlug(course)}`} className="block">
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#F39C12] text-white text-sm font-bold hover:bg-[#D68910] transition-colors shadow-md cursor-pointer"
                  >
                    View Details
                    <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.span>
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        {/* view all */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href="/userpanel/franchises">
            <motion.span
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border-2 border-[#2D5DA8] text-[#2D5DA8] font-semibold hover:bg-[#2D5DA8] hover:text-white transition-all cursor-pointer"
            >
              Browse all branches & courses
              <FiArrowRight className="w-4 h-4" />
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
