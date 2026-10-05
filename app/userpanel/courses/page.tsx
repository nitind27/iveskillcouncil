"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
  FiMapPin,
} from "react-icons/fi";
import { SectionLoader } from "@/components/common/PageLoader";
import { useFranchiseSiteSlug, useUserPanelHref } from "@/hooks/useUserPanelBasePath";
import { useUserPanelConfig } from "@/contexts/UserPanelConfigContext";
import FlagWave from "@/components/userpanel/ui/FlagWave";
import { upButton } from "@/components/userpanel/ui/button";
import { EASE_OUT } from "@/components/userpanel/ui/motion";

const FALLBACK_IMAGE = "/assets/home/about-classroom.jpg";

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
  SILVER: "bg-white/95 text-ive-navy",
  GOLD: "bg-ive-saffron text-white",
  DIAMOND: "bg-ive-navy text-white",
};

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const MODE_LABEL: Record<string, string> = {
  OFFLINE: "Classroom",
  ONLINE: "Online",
  HYBRID: "Hybrid",
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
  slug: string | null;
  description: string | null;
  shortDescription: string | null;
  imageUrl: string | null;
  type: string;
  category: string;
  categoryData: Category | null;
  level: string;
  mode: string;
  durationMonths: number;
  lectures: number;
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

function formatDuration(months: number): string {
  if (months <= 0) return "Flexible";
  if (months === 1) return "1 month";
  if (months < 12) return `${months} months`;
  const yrs = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return yrs === 1 ? "1 year" : `${yrs} years`;
  return `${yrs}y ${rem}mo`;
}

function plainText(value: string | null | undefined): string {
  return (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function CourseCard({
  course,
  index,
  imageName,
}: {
  course: Course;
  index: number;
  imageName: string;
}) {
  const reduce = useReducedMotion();
  const [imgSrc, setImgSrc] = useState(course.imageUrl || FALLBACK_IMAGE);
  const catName = course.categoryData?.name || imageName;
  const up = useUserPanelHref();
  const blurb =
    plainText(course.shortDescription) ||
    plainText(course.description) ||
    "Industry-aligned vocational programme with practical training.";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: reduce ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, delay: reduce ? 0 : Math.min(index * 0.04, 0.28), ease: EASE_OUT }}
      className="group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-ive-line bg-white p-2.5 shadow-[0_10px_30px_-18px_rgba(6,27,54,0.35)] transition-[box-shadow,border-color,transform] duration-500 hover:-translate-y-1.5 hover:border-ive-royal/30 hover:shadow-[0_28px_50px_-24px_rgba(18,78,150,0.4)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-ive-mist">
        <img
          src={imgSrc}
          alt={formatTitle(course.name)}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ive-navy/55 via-transparent to-transparent" />
        <span className={`absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-sm ${TYPE_STYLE[course.type] || TYPE_STYLE.SILVER}`}>
          {TYPE_LABEL[course.type] || course.type}
        </span>
        <span className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ive-navy shadow-sm">
          {catName}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-1.5 pt-4">
        <h3 className="line-clamp-2 text-[16px] font-bold leading-snug text-ive-navy sm:text-[17px]">
          {formatTitle(course.name)}
        </h3>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-ive-slate">{blurb}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-dashed border-ive-line pt-3.5 text-xs font-medium text-ive-slate">
          <span className="inline-flex items-center gap-1.5">
            <FiClock className="h-3.5 w-3.5 text-ive-saffron" />
            {formatDuration(course.durationMonths)}
          </span>
          {LEVEL_LABEL[course.level] && (
            <span className="inline-flex items-center gap-1.5">
              <FiBookOpen className="h-3.5 w-3.5 text-ive-royal" />
              {LEVEL_LABEL[course.level]}
            </span>
          )}
          {MODE_LABEL[course.mode] && (
            <span className="inline-flex items-center gap-1.5">
              <FiMapPin className="h-3.5 w-3.5 text-ive-emerald" />
              {MODE_LABEL[course.mode]}
            </span>
          )}
        </div>

        <Link href={up("/userpanel/franchises")} className={`${upButton("primary", "md", "mt-4 w-full")} group-hover:gap-3`}>
          Enroll Course
          <FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </motion.article>
  );
}

export default function UserPanelCoursesPage() {
  const reduce = useReducedMotion();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeSlug, setActive] = useState("ALL");
  const franchiseSlug = useFranchiseSiteSlug();
  const up = useUserPanelHref();
  const seo = useUserPanelConfig().seo;

  useEffect(() => {
    const url = franchiseSlug
      ? `/api/courses/public?franchiseSlug=${encodeURIComponent(franchiseSlug)}`
      : "/api/courses/public";
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setCourses(res.data || []);
          setCategories(res.categories || []);
        }
      })
      .finally(() => setLoading(false));
  }, [franchiseSlug]);

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
        (c.shortDescription || "").toLowerCase().includes(q) ||
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
    const known = new Set(order);
    const groups = order
      .filter((slug) => map[slug]?.length)
      .map((slug) => ({
        slug,
        cat: categories.find((c) => c.slug === slug)!,
        courses: map[slug],
      }));
    const uncategorized = filtered.filter((c) => !known.has(c.category));
    if (uncategorized.length) {
      groups.push({
        slug: "other",
        cat: {
          id: 0,
          name: groups.length ? "Other programmes" : "All programmes",
          slug: "other",
          description: null,
          icon: "FiBookOpen",
          colorClass: null,
          sortOrder: 999,
        },
        courses: uncategorized,
      });
    }
    return groups;
  }, [filtered, categories]);

  const chip =
    "inline-flex flex-shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-300";

  return (
    <div className="relative min-h-screen bg-[#F4F7FB]">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-ive-navy via-[#0A2748] to-[#124E96]">
        <FlagWave tone="dark" rotate={-8} opacity={0.16} className="-right-40 -top-16 w-[520px] sm:w-[680px]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,133,0,0.18),transparent_32%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8 lg:pb-24">
          <motion.div initial={{ opacity: 0, y: reduce ? 0 : 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE_OUT }} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#FFB15C]">
              <FiBookOpen className="h-3.5 w-3.5" />
              All Programs
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {seo.coursesHeadline}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/75">{seo.coursesDescription}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45, ease: EASE_OUT }}
            className="mt-7 flex flex-wrap gap-2.5"
          >
            {[
              { value: presentCategories.length, label: "categories" },
              { value: courses.length, label: "programmes" },
              { value: filtered.length, label: "showing now" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm backdrop-blur-sm">
                <span className="font-extrabold text-white">{item.value}</span>
                <span className="ml-1.5 text-white/70">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-9 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[1.4rem] border border-ive-line bg-white p-3 shadow-[0_18px_50px_-28px_rgba(6,27,54,0.45)] sm:p-4">
          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ive-slate" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by course name or description..."
              className="h-12 w-full rounded-xl border border-ive-line bg-ive-mist/70 pl-12 pr-11 text-sm text-ive-navy outline-none transition-all placeholder:text-ive-slate/80 focus:border-ive-royal/40 focus:bg-white focus:ring-4 focus:ring-ive-royal/10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ive-slate hover:bg-white hover:text-ive-navy"
                aria-label="Clear search"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActive("ALL")}
              className={`${chip} ${
                activeSlug === "ALL"
                  ? "border-ive-navy bg-ive-navy text-white shadow-sm"
                  : "border-ive-line bg-white text-ive-slate hover:border-ive-royal/30 hover:text-ive-navy"
              }`}
            >
              <FiGrid className="h-4 w-4" />
              All
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeSlug === "ALL" ? "bg-ive-saffron text-white" : "bg-ive-mist"}`}>
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
                  className={`${chip} ${
                    isActive
                      ? "border-ive-navy bg-ive-navy text-white shadow-sm"
                      : "border-ive-line bg-white text-ive-slate hover:border-ive-royal/30 hover:text-ive-navy"
                  }`}
                >
                  {icon}
                  <span className="max-w-[10rem] truncate">{cat.name}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${isActive ? "bg-ive-saffron text-white" : "bg-ive-mist"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {loading ? (
          <SectionLoader text="Loading courses..." />
        ) : (
        <>
        {courses.length === 0 && (
          <div className="rounded-[1.4rem] border border-ive-line bg-white px-6 py-20 text-center shadow-sm">
            <FiBookOpen className="mx-auto mb-4 h-12 w-12 text-ive-line" />
            <h2 className="mb-2 text-xl font-bold text-ive-navy">No courses yet</h2>
            <p className="mb-6 text-ive-slate">Courses appear here when added in the admin panel.</p>
            <Link href={up("/userpanel/franchises")} className={upButton("navy", "md")}>
              Browse Branches <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {courses.length > 0 && filtered.length === 0 && (
          <div className="rounded-[1.4rem] border border-ive-line bg-white px-6 py-16 text-center shadow-sm">
            <FiSearch className="mx-auto mb-4 h-12 w-12 text-ive-line" />
            <h3 className="mb-1 text-lg font-bold text-ive-navy">No results found</h3>
            <p className="text-sm text-ive-slate">Try another keyword or category.</p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {activeSlug === "ALL" ? (
            <motion.div key="grouped" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-14">
              {orderedGroups.map(({ slug, cat, courses: items }) => {
                const icon = ICON_MAP[cat.icon || ""] || <FiTag className="h-5 w-5" />;
                const solo = orderedGroups.length === 1 && slug === "other";
                return (
                  <section key={slug} className="scroll-mt-28">
                    {!solo && (
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ive-royal/10 text-ive-royal">{icon}</span>
                        <div>
                          <h2 className="text-xl font-extrabold tracking-tight text-ive-navy sm:text-2xl">{cat.name}</h2>
                          {cat.description && <p className="mt-0.5 text-sm text-ive-slate">{cat.description}</p>}
                        </div>
                      </div>
                      {slug !== "other" && (
                      <button type="button" onClick={() => setActive(slug)} className="text-sm font-bold text-ive-royal hover:text-ive-navy">
                        View all {items.length}
                        <FiArrowRight className="ml-1 inline h-4 w-4" />
                      </button>
                      )}
                    </div>
                    )}
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {(slug === "other" ? items : items.slice(0, 6)).map((course, i) => (
                        <CourseCard key={course.id} course={course} index={i} imageName={cat.name} />
                      ))}
                    </div>
                    {items.length > 6 && slug !== "other" && (
                      <button type="button" onClick={() => setActive(slug)} className="mt-4 text-sm font-bold text-ive-royal hover:underline">
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
              initial={{ opacity: 0, y: reduce ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
            >
              {filtered.map((course, i) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  index={i}
                  imageName={course.categoryData?.name || course.category}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {courses.length > 0 && (
          <div className="relative mt-14 isolate overflow-hidden rounded-[1.5rem] bg-gradient-to-r from-ive-navy to-[#124E96] px-6 py-8 sm:flex sm:items-center sm:justify-between sm:px-8">
            <FlagWave tone="dark" rotate={8} opacity={0.18} className="-right-24 -top-10 w-[420px]" />
            <div className="relative mb-4 sm:mb-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-ive-saffron">Ready to start?</p>
              <p className="mt-1 text-lg font-bold text-white sm:text-xl">Find a franchise branch and enrol today.</p>
            </div>
            <Link href={up("/userpanel/franchises")} className={`${upButton("primary", "lg")} relative`}>
              Browse Branches
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
        </>
        )}
      </div>
    </div>
  );
}
