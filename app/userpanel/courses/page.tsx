"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowRight, FiSearch, FiClock, FiBookOpen,
  FiMonitor, FiDollarSign, FiScissors, FiTool,
  FiFileText, FiBriefcase, FiUsers, FiCpu, FiGrid,
  FiTag,
} from "react-icons/fi";
import { SectionLoader } from "@/components/common/PageLoader";

// Icon map — matches icon names stored in DB
const ICON_MAP: Record<string, React.ReactNode> = {
  FiMonitor:    <FiMonitor    className="w-5 h-5" />,
  FiDollarSign: <FiDollarSign className="w-5 h-5" />,
  FiScissors:   <FiScissors   className="w-5 h-5" />,
  FiTool:       <FiTool       className="w-5 h-5" />,
  FiFileText:   <FiFileText   className="w-5 h-5" />,
  FiBriefcase:  <FiBriefcase  className="w-5 h-5" />,
  FiUsers:      <FiUsers      className="w-5 h-5" />,
  FiCpu:        <FiCpu        className="w-5 h-5" />,
  FiGrid:       <FiGrid       className="w-5 h-5" />,
  FiTag:        <FiTag        className="w-5 h-5" />,
  FiBookOpen:   <FiBookOpen   className="w-5 h-5" />,
};

// Color → Tailwind classes (colorClass stored in DB)
const COLOR_MAP: Record<string, { text: string; bg: string; border: string; bar: string }> = {
  blue:    { text: "text-[#2D5DA8]",  bg: "bg-[#2D5DA8]/10",  border: "border-[#2D5DA8]/20",  bar: "from-[#2D5DA8] to-[#A8C63A]" },
  green:   { text: "text-[#A8C63A]",  bg: "bg-[#A8C63A]/10",  border: "border-[#A8C63A]/20",  bar: "from-[#A8C63A] to-[#2D5DA8]" },
  pink:    { text: "text-pink-500",    bg: "bg-pink-50",        border: "border-pink-200",       bar: "from-pink-400 to-rose-500" },
  orange:  { text: "text-orange-500",  bg: "bg-orange-50",      border: "border-orange-200",     bar: "from-orange-400 to-amber-500" },
  violet:  { text: "text-violet-600",  bg: "bg-violet-50",      border: "border-violet-200",     bar: "from-violet-500 to-purple-600" },
  amber:   { text: "text-[#F39C12]",   bg: "bg-[#F39C12]/10",  border: "border-[#F39C12]/20",  bar: "from-[#F39C12] to-[#D68910]" },
  emerald: { text: "text-emerald-600", bg: "bg-emerald-50",     border: "border-emerald-200",    bar: "from-emerald-400 to-teal-500" },
  cyan:    { text: "text-cyan-600",    bg: "bg-cyan-50",        border: "border-cyan-200",       bar: "from-cyan-400 to-blue-500" },
  gray:    { text: "text-[#6B7280]",   bg: "bg-[#F3F4F6]",     border: "border-[#E5E7EB]",      bar: "from-[#9CA3AF] to-[#6B7280]" },
};

const TYPE_BADGE: Record<string, string> = {
  SILVER:  "bg-gray-100 text-gray-600",
  GOLD:    "bg-amber-100 text-amber-700",
  DIAMOND: "bg-blue-100 text-blue-700",
};

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  colorClass: string | null;
  sortOrder: number;
}

interface Course {
  id: string;
  name: string;
  description: string | null;
  type: string;
  category: string;
  baseFee: number;
  durationMonths: number;
}

export default function UserPanelCoursesPage() {
  const [courses,    setCourses]    = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [activeSlug, setActive]     = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/courses/public")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setCourses(res.data || []);
          setCategories(res.categories || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Only show categories that have at least one course
  const presentCategories = useMemo(() => {
    const slugsWithCourses = new Set(courses.map((c) => c.category));
    return categories.filter((cat) => slugsWithCourses.has(cat.slug));
  }, [courses, categories]);

  // Filtered courses
  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchCat = activeSlug === "ALL" || c.category === activeSlug;
      const q = search.toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [courses, activeSlug, search]);

  // Group by category slug, in DB sort order
  const orderedGroups = useMemo(() => {
    const map: Record<string, Course[]> = {};
    for (const c of filtered) {
      if (!map[c.category]) map[c.category] = [];
      map[c.category].push(c);
    }
    // Sort groups by category sortOrder
    const catOrder = categories.map((c) => c.slug);
    return catOrder.filter((slug) => map[slug]?.length).map((slug) => ({
      slug,
      cat: categories.find((c) => c.slug === slug)!,
      courses: map[slug],
    }));
  }, [filtered, categories]);

  if (loading) return <SectionLoader text="Loading courses..." />;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-[#2D5DA8] via-[#1E4A85] to-[#1a3d70] py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(168,198,58,0.12),transparent)]" />
        <div className="absolute -bottom-1 left-0 right-0 h-12 bg-[#F8FAFC]" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto text-center relative">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-sm font-semibold uppercase tracking-wider mb-4">
            <FiBookOpen className="w-4 h-4 text-[#A8C63A]" /> All Programs
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight">Explore Our Courses</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto">Browse by category and find the right program for your career goals.</p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* ── Search ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative max-w-xl mx-auto mb-10">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-[#E5E7EB] bg-white shadow-sm focus:border-[#2D5DA8] focus:ring-2 focus:ring-[#2D5DA8]/15 outline-none transition-all text-sm"
          />
        </motion.div>

        {/* ── Category filter tabs ── */}
        {presentCategories.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-2 justify-center mb-12">
            {/* ALL */}
            <button
              onClick={() => setActive("ALL")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                activeSlug === "ALL"
                  ? "bg-[#2D5DA8] text-white border-[#2D5DA8] shadow-md"
                  : "bg-white text-[#374151] border-[#E5E7EB] hover:border-[#2D5DA8]/40 hover:text-[#2D5DA8]"
              }`}
            >
              <FiGrid className="w-4 h-4" />
              All
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeSlug === "ALL" ? "bg-white/20 text-white" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
                {courses.length}
              </span>
            </button>

            {presentCategories.map((cat) => {
              const colors = COLOR_MAP[cat.colorClass || "gray"] || COLOR_MAP.gray;
              const icon   = ICON_MAP[cat.icon || ""] || <FiTag className="w-4 h-4" />;
              const count  = courses.filter((c) => c.category === cat.slug).length;
              const isActive = activeSlug === cat.slug;
              return (
                <motion.button
                  key={cat.slug}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActive(cat.slug)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                    isActive ? `${colors.bg} ${colors.text} ${colors.border} shadow-md` : "bg-white text-[#374151] border-[#E5E7EB] hover:border-[#2D5DA8]/30"
                  }`}
                >
                  <span className={isActive ? colors.text : "text-[#9CA3AF]"}>{icon}</span>
                  {cat.name}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-white/40" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* ── Empty states ── */}
        {courses.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-[#EEF2F7] flex items-center justify-center mx-auto mb-5">
              <FiBookOpen className="w-10 h-10 text-[#9CA3AF]" />
            </div>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">No courses yet</h2>
            <p className="text-[#6B7280] mb-6 max-w-sm mx-auto">Courses will appear here once added by the admin.</p>
            <Link href="/userpanel/franchises" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D5DA8] text-white font-semibold hover:bg-[#1E4A85] transition-all">
              Browse Branches <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {courses.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <FiSearch className="w-12 h-12 text-[#D1D5DB] mx-auto mb-4" />
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">No results found</h3>
            <p className="text-[#6B7280] text-sm">Try a different search term or category.</p>
          </div>
        )}

        {/* ── Category groups ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlug + search}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-14"
          >
            {orderedGroups.map(({ slug, cat, courses: items }) => {
              const colors = COLOR_MAP[cat.colorClass || "gray"] || COLOR_MAP.gray;
              const icon   = ICON_MAP[cat.icon || ""] || <FiTag className="w-5 h-5" />;
              return (
                <section key={slug}>
                  {/* category heading */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-2xl ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}>
                      <span className={colors.text}>{icon}</span>
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-[#1A1A1A]">{cat.name}</h2>
                      {cat.description && <p className="text-xs text-[#6B7280]">{cat.description}</p>}
                    </div>
                    <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                      {items.length} course{items.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* course cards */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {items.map((course, i) => (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05, type: "spring", stiffness: 120, damping: 18 }}
                        className="group bg-white rounded-2xl border border-[#E5E7EB] hover:border-[#2D5DA8]/30 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
                      >
                        <div className={`h-1.5 bg-gradient-to-r ${colors.bar}`} />
                        <div className="p-5 flex flex-col flex-1 gap-3">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${TYPE_BADGE[course.type] || TYPE_BADGE.SILVER}`}>
                              {course.type}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                              {cat.name}
                            </span>
                          </div>
                          <h3 className="font-bold text-[#1A1A1A] text-sm leading-snug group-hover:text-[#2D5DA8] transition-colors line-clamp-2 flex-1">
                            {course.name}
                          </h3>
                          {course.description && (
                            <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed">{course.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-[#6B7280] pt-1 border-t border-[#F3F4F6]">
                            <span className="flex items-center gap-1">
                              <FiClock className="w-3.5 h-3.5" />
                              {course.durationMonths} month{course.durationMonths !== 1 ? "s" : ""}
                            </span>
                            {course.baseFee > 0 && (
                              <span className="flex items-center gap-1 ml-auto font-semibold text-[#374151]">
                                ₹{course.baseFee.toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>
                          <Link href="/userpanel/franchises">
                            <motion.span
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-[#2D5DA8] text-white text-xs font-bold hover:bg-[#1E4A85] transition-colors cursor-pointer"
                            >
                              Find a Branch <FiArrowRight className="w-3.5 h-3.5" />
                            </motion.span>
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* ── Bottom CTA ── */}
        {courses.length > 0 && (
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-16 text-center">
            <p className="text-[#6B7280] mb-4">Want to enrol? Find a franchise branch near you.</p>
            <Link href="/userpanel/franchises">
              <motion.span
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#F39C12] text-white font-bold hover:bg-[#D68910] transition-all shadow-lg cursor-pointer"
              >
                Browse Franchise Branches <FiArrowRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
