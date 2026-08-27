"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowRight,
  FiSearch,
  FiClock,
  FiBookOpen,
  FiMonitor,
  FiDollarSign,
  FiScissors,
  FiTool,
  FiFileText,
  FiBriefcase,
  FiUsers,
  FiCpu,
  FiGrid,
  FiTag,
  FiX,
} from "react-icons/fi";
import { SectionLoader } from "@/components/common/PageLoader";

const ICON_MAP: Record<string, React.ReactNode> = {
  FiMonitor: <FiMonitor className="h-4 w-4" />,
  FiDollarSign: <FiDollarSign className="h-4 w-4" />,
  FiScissors: <FiScissors className="h-4 w-4" />,
  FiTool: <FiTool className="h-4 w-4" />,
  FiFileText: <FiFileText className="h-4 w-4" />,
  FiBriefcase: <FiBriefcase className="h-4 w-4" />,
  FiUsers: <FiUsers className="h-4 w-4" />,
  FiCpu: <FiCpu className="h-4 w-4" />,
  FiGrid: <FiGrid className="h-4 w-4" />,
  FiTag: <FiTag className="h-4 w-4" />,
  FiBookOpen: <FiBookOpen className="h-4 w-4" />,
};

const TYPE_LABEL: Record<string, string> = {
  SILVER: "Silver",
  GOLD: "Gold",
  DIAMOND: "Diamond",
};

const TYPE_STYLE: Record<string, string> = {
  SILVER: "bg-white/95 text-[#475569]",
  GOLD: "bg-[#C4A35A] text-[#1A1408]",
  DIAMOND: "bg-[#1E4A85] text-white",
};

const CATEGORY_IMAGES: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=640&q=80",
  computer: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&q=80",
  it: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&q=80",
  accounting: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=640&q=80",
  beauty: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=640&q=80",
  fashion: "https://images.unsplash.com/photo-1558171813-1c0887537c53?w=640&q=80",
  tailoring: "https://images.unsplash.com/photo-1558171813-1c0887537c53?w=640&q=80",
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
  categoryData: Category | null;
  durationMonths: number;
}

function categoryImage(slug: string, name: string): string {
  const hay = `${slug} ${name}`.toLowerCase();
  const key = Object.keys(CATEGORY_IMAGES).find((k) => k !== "default" && hay.includes(k));
  return CATEGORY_IMAGES[key || "default"];
}

function formatTitle(title: string): string {
  const t = title.trim();
  if (!t) return "Course";
  if (t === t.toLowerCase() || t === t.toUpperCase()) {
    return t.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }
  return t;
}

function formatDuration(months: number): string {
  if (months <= 0) return "Flexible";
  if (months === 1) return "1 month";
  if (months < 12) return `${months} months`;
  const yrs = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return yrs === 1 ? "1 year" : `${yrs} years`;
  return `${yrs}y ${rem}mo`;
}

function CourseCard({
  course,
  index,
  imageSlug,
  imageName,
}: {
  course: Course;
  index: number;
  imageSlug: string;
  imageName: string;
}) {
  const [imgSrc, setImgSrc] = useState(categoryImage(imageSlug, imageName));
  const catName = course.categoryData?.name || imageName;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.32), ease: [0.22, 1, 0.36, 1] }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E8ECF1] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:border-[#1E4A85]/20 hover:shadow-[0_16px_40px_rgba(30,74,133,0.1)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[#EEF2F7]">
        <img
          src={imgSrc}
          alt={formatTitle(course.name)}
          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          onError={() => setImgSrc(CATEGORY_IMAGES.default)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F2744]/50 to-transparent" />
        <span className={`absolute left-3 top-3 rounded-md px-2.5 py-1 text-[11px] font-bold shadow-sm ${TYPE_STYLE[course.type] || TYPE_STYLE.SILVER}`}>
          {TYPE_LABEL[course.type] || course.type}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#1E4A85]">{catName}</p>
        <h3 className="mb-2 line-clamp-2 text-[15px] font-bold leading-snug text-[#0F172A] group-hover:text-[#1E4A85]">
          {formatTitle(course.name)}
        </h3>
        <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-[#64748B]">
          {(course.description || "")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim() ||
            "Industry-aligned vocational programme with practical training."}
        </p>

        <div className="mb-4 flex items-center border-t border-[#F1F5F9] pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
            <FiClock className="h-3.5 w-3.5 text-[#C4A35A]" />
            {formatDuration(course.durationMonths)}
          </span>
        </div>

        <Link
          href="/userpanel/franchises"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E4A85] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#163A6B]"
        >
          Enroll Course
          <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </motion.article>
  );
}

export default function UserPanelCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeSlug, setActive] = useState("ALL");

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

  const presentCategories = useMemo(() => {
    const slugs = new Set(courses.map((c) => c.category));
    return categories.filter((c) => slugs.has(c.slug));
  }, [courses, categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      const matchCat = activeSlug === "ALL" || c.category === activeSlug;
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        (c.categoryData?.name || "").toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [courses, activeSlug, search]);

  const orderedGroups = useMemo(() => {
    const map: Record<string, Course[]> = {};
    for (const c of filtered) {
      if (!map[c.category]) map[c.category] = [];
      map[c.category].push(c);
    }
    const order = categories.map((c) => c.slug);
    return order
      .filter((slug) => map[slug]?.length)
      .map((slug) => ({
        slug,
        cat: categories.find((c) => c.slug === slug)!,
        courses: map[slug],
      }));
  }, [filtered, categories]);

  if (loading) return <SectionLoader text="Loading courses..." />;

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Hero */}
      <section className="border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#1E4A85]/15 bg-[#1E4A85]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
              <FiBookOpen className="h-3.5 w-3.5" />
              All Programs
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A] md:text-4xl">
              Explore Our Courses
            </h1>
            <p className="mt-2 text-base text-[#64748B]">
              Browse vocational programmes by category — all listings update live from our course catalogue.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-6 flex flex-wrap gap-3"
          >
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2.5 text-sm">
              <span className="font-bold text-[#1E4A85]">{presentCategories.length}</span>
              <span className="ml-1.5 text-[#64748B]">categories</span>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2.5 text-sm">
              <span className="font-bold text-[#1E4A85]">{courses.length}</span>
              <span className="ml-1.5 text-[#64748B]">programmes</span>
            </div>
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2.5 text-sm">
              <span className="font-bold text-[#1E4A85]">{filtered.length}</span>
              <span className="ml-1.5 text-[#64748B]">showing now</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* Sidebar — categories from API */}
          <aside className="lg:w-56 lg:flex-shrink-0">
            <div className="lg:sticky lg:top-[calc(var(--up-nav-height,4.5rem)+1rem)]">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Categories</p>
              <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
                <button
                  type="button"
                  onClick={() => setActive("ALL")}
                  className={`flex flex-shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition-all lg:w-full ${
                    activeSlug === "ALL"
                      ? "border-[#1E4A85] bg-[#1E4A85] text-white shadow-sm"
                      : "border-[#E5E7EB] bg-white text-[#475569] hover:border-[#1E4A85]/25 hover:text-[#1E4A85]"
                  }`}
                >
                  <FiGrid className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">All Courses</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeSlug === "ALL" ? "bg-white/20" : "bg-[#F1F5F9]"}`}>
                    {courses.length}
                  </span>
                </button>
                {presentCategories.map((cat) => {
                  const icon = ICON_MAP[cat.icon || ""] || <FiTag className="h-4 w-4" />;
                  const count = courses.filter((c) => c.category === cat.slug).length;
                  const isActive = activeSlug === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActive(cat.slug)}
                      className={`flex flex-shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm font-semibold transition-all lg:w-full ${
                        isActive
                          ? "border-[#C4A35A]/50 bg-[#C4A35A]/12 text-[#7A6230]"
                          : "border-[#E5E7EB] bg-white text-[#475569] hover:border-[#1E4A85]/25 hover:text-[#1E4A85]"
                      }`}
                    >
                      <span className="flex-shrink-0">{icon}</span>
                      <span className="flex-1 truncate">{cat.name}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-white/60" : "bg-[#F1F5F9]"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 flex-1">
            <div className="relative mb-6">
              <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by course name or description..."
                className="w-full rounded-xl border border-[#E5E7EB] bg-white py-3 pl-12 pr-10 text-sm shadow-sm outline-none transition-all focus:border-[#1E4A85]/35 focus:ring-2 focus:ring-[#1E4A85]/10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#475569]"
                  aria-label="Clear search"
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>

            {courses.length === 0 && (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white py-20 text-center">
                <FiBookOpen className="mx-auto mb-4 h-12 w-12 text-[#CBD5E1]" />
                <h2 className="mb-2 text-xl font-bold text-[#0F172A]">No courses yet</h2>
                <p className="mb-6 text-[#64748B]">Courses appear here when added in the admin panel.</p>
                <Link href="/userpanel/franchises" className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-6 py-3 font-semibold text-white hover:bg-[#163A6B]">
                  Browse Branches <FiArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}

            {courses.length > 0 && filtered.length === 0 && (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white py-16 text-center">
                <FiSearch className="mx-auto mb-4 h-12 w-12 text-[#CBD5E1]" />
                <h3 className="mb-1 text-lg font-bold text-[#0F172A]">No results found</h3>
                <p className="text-sm text-[#64748B]">Try another keyword or category.</p>
              </div>
            )}

            <AnimatePresence mode="popLayout">
              {activeSlug === "ALL" ? (
                <motion.div
                  key="grouped"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-12"
                >
                  {orderedGroups.map(({ slug, cat, courses: items }) => {
                    const icon = ICON_MAP[cat.icon || ""] || <FiTag className="h-5 w-5" />;
                    return (
                      <section key={slug} className="scroll-mt-28">
                        <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E4A85]/10 text-[#1E4A85]">
                              {icon}
                            </span>
                            <div>
                              <h2 className="text-xl font-extrabold text-[#0F172A]">{cat.name}</h2>
                              {cat.description && (
                                <p className="text-sm text-[#64748B]">{cat.description}</p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActive(slug)}
                            className="text-sm font-semibold text-[#1E4A85] hover:text-[#163A6B]"
                          >
                            View all {items.length} →
                          </button>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                          {items.slice(0, 6).map((course, i) => (
                            <CourseCard
                              key={course.id}
                              course={course}
                              index={i}
                              imageSlug={slug}
                              imageName={cat.name}
                            />
                          ))}
                        </div>
                        {items.length > 6 && (
                          <button
                            type="button"
                            onClick={() => setActive(slug)}
                            className="mt-4 text-sm font-semibold text-[#1E4A85] hover:underline"
                          >
                            + {items.length - 6} more in {cat.name}
                          </button>
                        )}
                      </section>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key={activeSlug + search}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {filtered.map((course, i) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      index={i}
                      imageSlug={course.category}
                      imageName={course.categoryData?.name || course.category}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>

        {courses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative mt-12 overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#163A6B] to-[#1E4A85] px-6 py-8 sm:flex sm:items-center sm:justify-between"
          >
            <div className="mb-4 sm:mb-0">
              <p className="text-xs font-bold uppercase tracking-wider text-[#C4A35A]">Ready to start?</p>
              <p className="mt-1 text-lg font-bold text-white">Find a franchise branch and enrol today.</p>
            </div>
            <Link
              href="/userpanel/franchises"
              className="inline-flex items-center gap-2 rounded-xl bg-[#C4A35A] px-6 py-3 text-sm font-bold text-[#0F172A] transition-colors hover:bg-[#A88B48] hover:text-white"
            >
              Browse Branches
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
