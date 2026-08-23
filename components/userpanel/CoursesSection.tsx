"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiClock, FiBookOpen } from "react-icons/fi";
import type { CourseItem, UserPanelConfig } from "@/config/userpanel.config";

function getSlug(c: CourseItem): string {
  return c.slug || c.id;
}

function formatTitle(title: string): string {
  const t = title.trim();
  if (!t) return "Course";
  if (t === t.toLowerCase() || t === t.toUpperCase()) {
    return t
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }
  return t;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80";

function CourseCard({ course, index }: { course: CourseItem; index: number }) {
  const [src, setSrc] = useState(course.image || FALLBACK_IMAGE);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#1E4A85]/25 hover:shadow-[0_18px_40px_rgba(30,74,133,0.12)]"
    >
      <div className="relative h-44 overflow-hidden bg-[#EEF2F7]">
        <img
          src={src}
          alt={formatTitle(course.title)}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setSrc(FALLBACK_IMAGE)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F2744]/70 via-[#0F2744]/10 to-transparent" />
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-[#0F2744]/80 px-2.5 py-1 text-[11px] font-semibold text-white">
          <FiClock className="h-3 w-3 text-[#C4A35A]" />
          {course.duration}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 text-[15px] font-bold leading-snug text-[#0F172A] transition-colors group-hover:text-[#1E4A85]">
          {formatTitle(course.title)}
        </h3>
        {course.description ? (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[#64748B]">
            {course.description}
          </p>
        ) : (
          <p className="mb-4 text-sm text-[#94A3B8]">Industry-aligned vocational programme.</p>
        )}
        <Link
          href={`/userpanel/courses/${getSlug(course)}`}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg border border-[#1E4A85] bg-white py-2.5 text-sm font-semibold text-[#1E4A85] transition-colors hover:bg-[#1E4A85] hover:text-white"
        >
          View Details
          <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </motion.article>
  );
}

interface CoursesSectionProps {
  config: UserPanelConfig;
}

export default function CoursesSection({ config }: CoursesSectionProps) {
  const { courses } = config;
  const items = (courses?.items || []).filter((c) => c.enabled !== false).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section id="courses" className="relative overflow-hidden bg-[#F7F8FA] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1E4A85]/15 bg-[#1E4A85]/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E4A85]">
            <FiBookOpen className="h-3.5 w-3.5" />
            Programs
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A] md:text-4xl">
            {courses.sectionTitle || "Featured Courses"}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base text-[#64748B]">
            Structured, job-ready programmes designed for real skills and better outcomes.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link
            href="/userpanel/courses"
            className="inline-flex items-center gap-2 rounded-lg bg-[#1E4A85] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#163A6B]"
          >
            Browse all courses
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
