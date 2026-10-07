"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FiArrowRight, FiClock, FiBookOpen, FiUsers, FiPlayCircle } from "react-icons/fi";
import type { CourseItem, UserPanelConfig } from "@/config/userpanel.config";
import { useUserPanelHref } from "@/hooks/useUserPanelBasePath";
import Reveal from "./ui/Reveal";
import FlagWave from "./ui/FlagWave";
import { upButton } from "./ui/button";
import { EASE_OUT, VIEWPORT } from "./ui/motion";

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

const BADGES = ["bg-ive-saffron", "bg-ive-royal", "bg-ive-emerald", "bg-ive-navy"];

function CourseCard({ course, index, href }: { course: CourseItem; index: number; href: string }) {
  const reduce = useReducedMotion();
  const [src, setSrc] = useState(course.image || FALLBACK_IMAGE);
  const title = formatTitle(course.title);
  const category = (course as CourseItem & { category?: string | null }).category?.trim() || "Skill Program";

  return (
    <motion.article
      initial={{ opacity: 0, y: reduce ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.6, delay: reduce ? 0 : index * 0.08, ease: EASE_OUT }}
      whileHover={reduce ? undefined : { y: -8, scale: 1.015 }}
      className="group flex w-[86%] flex-shrink-0 snap-start flex-col overflow-hidden rounded-[1.25rem] border border-ive-line bg-white p-2.5 shadow-[var(--up-card-shadow)] transition-[box-shadow,border-color] duration-500 hover:border-ive-royal/30 hover:shadow-[0_28px_60px_-28px_rgba(18,78,150,0.45)] sm:w-[47%] md:w-auto md:rounded-[1.4rem]"
    >
      <Link href={href} tabIndex={-1} aria-hidden className="relative block aspect-[16/11] overflow-hidden rounded-2xl bg-ive-mist">
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          onError={() => setSrc(FALLBACK_IMAGE)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ive-navy/50 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />
        <span className={`absolute bottom-3 left-3 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white shadow-md ${BADGES[index % BADGES.length]}`}>
          {category}
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-2.5 pb-2 pt-4">
        <h3 className="text-[17px] font-bold leading-snug text-ive-navy">
          <Link href={href} className="transition-colors hover:text-ive-royal focus-visible:underline focus-visible:outline-none">
            {title}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ive-slate">
          {course.description || "Industry-aligned vocational programme."}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-dashed border-ive-line pt-3.5 text-xs font-medium text-ive-slate">
          {course.duration && (
            <span className="inline-flex items-center gap-1.5">
              <FiClock className="h-3.5 w-3.5 text-ive-saffron" />
              {course.duration}
            </span>
          )}
          {Number(course.lectures) > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <FiPlayCircle className="h-3.5 w-3.5 text-ive-emerald" />
              {course.lectures} lectures
            </span>
          )}
          {Number(course.enrolled) > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <FiUsers className="h-3.5 w-3.5 text-ive-royal" />
              {course.enrolled} enrolled
            </span>
          )}
        </div>

        <div className="mt-auto pt-4">
          <Link
            href={href}
            className="flex items-center justify-center gap-2 rounded-xl border border-ive-royal/25 py-2.5 text-sm font-semibold text-ive-royal transition-all duration-300 hover:border-ive-navy hover:bg-ive-navy hover:text-white"
          >
            View Details
            <FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

interface CoursesSectionProps {
  config: UserPanelConfig;
}

export default function CoursesSection({ config }: CoursesSectionProps) {
  const { courses } = config;
  const up = useUserPanelHref();
  const items = (courses?.items || []).filter((c) => c.enabled !== false).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <section id="courses" className="relative isolate overflow-hidden bg-gradient-to-b from-[#EEF5FD] to-[#F6F9FE] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <FlagWave rotate={-14} opacity={0.1} className="-left-52 -top-10 w-[600px] sm:w-[760px] lg:-left-72 lg:w-[900px]" />
      <div className="up-dot-pattern pointer-events-none absolute right-0 top-0 h-72 w-72 opacity-70 [mask-image:radial-gradient(circle_at_top_right,#000,transparent_70%)]" aria-hidden />
      <div className="relative mx-auto max-w-7xl">
        <Reveal className="mb-10 grid items-end gap-6 sm:mb-12 lg:grid-cols-[1fr_auto_1fr]">
          <span className="hidden lg:block" />
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ive-royal shadow-sm">
              <FiBookOpen className="h-3.5 w-3.5 text-ive-saffron" />
              Our Courses
            </span>
            <h2 className="mt-4 text-[1.65rem] font-extrabold tracking-tight text-ive-navy sm:text-4xl lg:text-[2.6rem]">
              {courses.sectionTitle || "Featured Courses"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-ive-slate">
              Structured, job-ready programmes designed for real skills and better outcomes.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <Link href={up("/userpanel/courses")} className={upButton("outline", "md")}>
              View All Courses
              <FiArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-4 xl:gap-6 [&::-webkit-scrollbar]:hidden">
          {items.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} href={up(`/userpanel/courses/${getSlug(course)}`)} />
          ))}
        </div>
      </div>
    </section>
  );
}
