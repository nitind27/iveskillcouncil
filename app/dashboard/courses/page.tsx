"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  Tag,
  X,
  Check,
  RefreshCw,
  Search,
  Clock,
  IndianRupee,
  Layers,
  AlertTriangle,
  Crown,
  Medal,
  Gem,
  ImageIcon,
  Film,
  FileText,
  Upload,
} from "lucide-react";
import { showSuccess, showError, showDeleteConfirm } from "@/lib/toast";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  imageUrl?: string | null;
  baseFee: number;
  durationMonths: number;
  type: string;
  category: string | null;
  level?: string;
  mode?: string;
  lectures?: number;
  videos?: number;
  notes?: string | null;
  highlights?: string | null;
  status?: string;
  franchiseId: string | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  colorClass: string | null;
  sortOrder: number;
  status: string;
}

const COURSE_TYPES = ["SILVER", "GOLD", "DIAMOND"] as const;
const COURSE_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
const COURSE_MODES = ["OFFLINE", "ONLINE", "HYBRID"] as const;

const emptyCourseForm = () => ({
  name: "",
  slug: "",
  shortDescription: "",
  description: "",
  imageUrl: "",
  type: "SILVER" as (typeof COURSE_TYPES)[number],
  category: "",
  level: "BEGINNER" as (typeof COURSE_LEVELS)[number],
  mode: "OFFLINE" as (typeof COURSE_MODES)[number],
  baseFee: "",
  durationMonths: "",
  lectures: "",
  videos: "",
  notes: "",
  highlights: "",
  status: "ACTIVE",
});

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150);
}

const COLOR_OPTIONS = [
  { value: "blue", label: "Blue", cls: "bg-[#1E4A85]" },
  { value: "green", label: "Green", cls: "bg-emerald-500" },
  { value: "pink", label: "Pink", cls: "bg-rose-500" },
  { value: "orange", label: "Orange", cls: "bg-orange-500" },
  { value: "violet", label: "Violet", cls: "bg-indigo-500" },
  { value: "amber", label: "Amber", cls: "bg-[#C4A35A]" },
  { value: "emerald", label: "Emerald", cls: "bg-teal-500" },
  { value: "cyan", label: "Cyan", cls: "bg-cyan-600" },
  { value: "gray", label: "Gray", cls: "bg-slate-500" },
];

const TYPE_STYLE: Record<
  string,
  { badge: string; Icon: typeof Crown; bar: string }
> = {
  SILVER: {
    badge: "bg-slate-600 text-white",
    Icon: Medal,
    bar: "from-slate-400/30 to-transparent",
  },
  GOLD: {
    badge: "bg-[#C4A35A] text-[#0B132B]",
    Icon: Crown,
    bar: "from-[#C4A35A]/40 to-transparent",
  },
  DIAMOND: {
    badge: "bg-[#1E4A85] text-white",
    Icon: Gem,
    bar: "from-[#1E4A85]/35 to-transparent",
  },
};

const inputCls =
  "h-10 w-full rounded-lg border border-border/70 bg-card px-3 text-sm font-medium outline-none transition focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15";
const labelCls =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground";

export default function SuperAdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"courses" | "categories">("courses");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [courseOpen, setCourseOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);

  const [catOpen, setCatOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [catForm, setCatForm] = useState({
    name: "",
    description: "",
    icon: "",
    colorClass: "blue",
    sortOrder: "99",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [cRes, catRes] = await Promise.all([
        fetch("/api/courses?all=1", { credentials: "include" }),
        fetch("/api/admin/course-categories", { credentials: "include" }),
      ]);
      const cData = await cRes.json().catch(() => ({}));
      const catData = await catRes.json().catch(() => ({}));

      if (cRes.status === 401 || catRes.status === 401) {
        setLoadError("Session expired or database unreachable. Re-login and keep db:proxy running.");
        setCourses([]);
        setCategories([]);
        return;
      }
      if (!cRes.ok && !catRes.ok) {
        setLoadError(cData?.error || catData?.error || "Failed to load data");
        return;
      }
      if (cData?.data) setCourses(cData.data);
      else if (!cRes.ok) setLoadError(cData?.error || "Failed to load courses");
      if (catData?.data) setCategories(catData.data);
      else if (!catRes.ok) setLoadError(catData?.error || "Failed to load categories");
    } catch {
      setLoadError("Network error — check server and db:proxy");
      showError("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const uploadCoverImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showError("Invalid file", "Please choose an image (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError("Too large", "Image must be under 5MB.");
      return;
    }
    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (courseForm.imageUrl) fd.append("oldUrl", courseForm.imageUrl);
      const res = await fetch("/api/admin/course-image", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.data?.url) {
        showError("Upload failed", data?.error || "Could not upload image");
        return;
      }
      setCourseForm((f) => ({ ...f, imageUrl: data.data.url }));
      showSuccess("Uploaded", "Cover image ready.");
    } catch {
      showError("Upload failed", "Network error");
    } finally {
      setImageUploading(false);
    }
  };

  const clearCoverImage = () => {
    setCourseForm((f) => ({ ...f, imageUrl: "" }));
  };

  const openCreateCourse = () => {
    setEditCourse(null);
    setCourseForm(emptyCourseForm());
    setCourseOpen(true);
  };

  const openEditCourse = (c: Course) => {
    setEditCourse(c);
    setCourseForm({
      name: c.name,
      slug: c.slug || "",
      shortDescription: c.shortDescription || "",
      description: c.description || "",
      imageUrl: c.imageUrl || "",
      type: (COURSE_TYPES.includes(c.type as (typeof COURSE_TYPES)[number])
        ? c.type
        : "SILVER") as (typeof COURSE_TYPES)[number],
      category: c.category || "",
      level: (COURSE_LEVELS.includes(c.level as (typeof COURSE_LEVELS)[number])
        ? c.level
        : "BEGINNER") as (typeof COURSE_LEVELS)[number],
      mode: (COURSE_MODES.includes(c.mode as (typeof COURSE_MODES)[number])
        ? c.mode
        : "OFFLINE") as (typeof COURSE_MODES)[number],
      baseFee: String(c.baseFee),
      durationMonths: String(c.durationMonths),
      lectures: String(c.lectures ?? ""),
      videos: String(c.videos ?? ""),
      notes: c.notes || "",
      highlights: c.highlights || "",
      status: c.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    });
    setCourseOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.name.trim() || !courseForm.baseFee || !courseForm.durationMonths) {
      showError("Validation", "Name, Fee and Duration are required");
      return;
    }
    setSaving(true);
    try {
      const url = editCourse ? `/api/courses/${editCourse.id}` : "/api/courses";
      const method = editCourse ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: courseForm.name.trim(),
          slug: courseForm.slug.trim() || slugify(courseForm.name),
          shortDescription: courseForm.shortDescription.trim() || null,
          description: courseForm.description.trim() || null,
          imageUrl: courseForm.imageUrl.trim() || null,
          type: courseForm.type,
          category: courseForm.category || null,
          level: courseForm.level,
          mode: courseForm.mode,
          baseFee: Number(courseForm.baseFee),
          durationMonths: Number(courseForm.durationMonths),
          lectures: Number(courseForm.lectures) || 0,
          videos: Number(courseForm.videos) || 0,
          notes: courseForm.notes.trim() || null,
          highlights: courseForm.highlights.trim() || null,
          status: courseForm.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data?.error || "Failed");
        return;
      }
      showSuccess(
        editCourse ? "Updated" : "Created",
        editCourse ? "Course updated." : "Course created."
      );
      setCourseOpen(false);
      loadData();
    } catch {
      showError("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    const ok = await showDeleteConfirm(`Delete "${name}"?`, "This cannot be undone.");
    if (!ok) return;
    try {
      const res = await fetch(`/api/courses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError("Error", data?.error || "Failed to delete");
        return;
      }
      showSuccess("Deleted", data?.message || "Course deleted.");
      loadData();
    } catch {
      showError("Error", "Network error");
    }
  };

  const openCreateCat = () => {
    setEditCat(null);
    setCatForm({
      name: "",
      description: "",
      icon: "",
      colorClass: "blue",
      sortOrder: "99",
    });
    setCatOpen(true);
  };

  const openEditCat = (cat: Category) => {
    setEditCat(cat);
    setCatForm({
      name: cat.name,
      description: cat.description || "",
      icon: cat.icon || "",
      colorClass: cat.colorClass || "blue",
      sortOrder: String(cat.sortOrder),
    });
    setCatOpen(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      showError("Validation", "Name is required");
      return;
    }
    setSaving(true);
    try {
      const url = editCat
        ? `/api/admin/course-categories/${editCat.id}`
        : "/api/admin/course-categories";
      const method = editCat ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: catForm.name.trim(),
          description: catForm.description.trim() || null,
          icon: catForm.icon.trim() || null,
          colorClass: catForm.colorClass,
          sortOrder: Number(catForm.sortOrder) || 99,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data?.error || "Failed");
        return;
      }
      showSuccess(
        editCat ? "Updated" : "Created",
        editCat ? "Category updated." : "Category created."
      );
      setCatOpen(false);
      loadData();
    } catch {
      showError("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCat = async (cat: Category) => {
    const ok = await showDeleteConfirm(
      `Delete "${cat.name}"?`,
      "All courses in this category must be reassigned first."
    );
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/course-categories/${cat.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data?.error || "Failed");
        return;
      }
      showSuccess("Deleted", "Category deleted.");
      loadData();
    } catch {
      showError("Error", "Network error");
    }
  };

  const globalCourses = useMemo(
    () => courses.filter((c) => !c.franchiseId),
    [courses]
  );

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return globalCourses.filter((c) => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q)
      );
    });
  }, [globalCourses, search, typeFilter]);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.slug, c])),
    [categories]
  );

  const typeCounts = useMemo(() => {
    const counts = { SILVER: 0, GOLD: 0, DIAMOND: 0 };
    for (const c of globalCourses) {
      if (c.type in counts) counts[c.type as keyof typeof counts]++;
    }
    return counts;
  }, [globalCourses]);

  return (
    <div className="space-y-5 pb-8">
      {/* Single compact header */}
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] text-white shadow-md shadow-[#1E4A85]/15">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/55">
              <Link href="/dashboard" className="hover:text-white/90">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-white/80">Manage Courses</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Manage Courses
              </h1>
              <span className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#E8D5A3] sm:inline-flex">
                <BookOpen className="h-3 w-3" />
                Catalog
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs text-white/60 sm:text-sm">
              Global courses & categories for franchise assignment
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                  Courses
                </p>
                <p className="font-bold tabular-nums leading-tight">{globalCourses.length}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#E8D5A3]/70">
                  Categories
                </p>
                <p className="font-bold tabular-nums leading-tight text-[#F5E6C8]">
                  {categories.length}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <button
              type="button"
              onClick={activeTab === "courses" ? openCreateCourse : openCreateCat}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 text-xs font-bold text-[#0B132B] transition hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" />
              {activeTab === "courses" ? "Add Course" : "Add Category"}
            </button>
          </div>
        </div>
      </header>

      {loadError && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-sm text-amber-900 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Could not load fully</p>
              <p className="mt-0.5 text-amber-800/90 dark:text-amber-200/90">{loadError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A6B]"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {/* Tabs + filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="inline-flex w-fit gap-1 rounded-xl border border-[#1E4A85]/12 bg-[#1E4A85]/[0.04] p-1">
          {(["courses", "categories"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold capitalize transition",
                activeTab === tab
                  ? "bg-[#1E4A85] text-white shadow-sm"
                  : "text-muted-foreground hover:text-[#1E4A85]"
              )}
            >
              {tab === "courses"
                ? `Courses (${globalCourses.length})`
                : `Categories (${categories.length})`}
            </button>
          ))}
        </div>

        {activeTab === "courses" && !loading && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses…"
                className="h-10 w-full rounded-lg border border-border/70 bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 rounded-lg border border-border/70 bg-card px-3 text-sm font-medium outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
            >
              <option value="all">All types</option>
              <option value="SILVER">Silver ({typeCounts.SILVER})</option>
              <option value="GOLD">Gold ({typeCounts.GOLD})</option>
              <option value="DIAMOND">Diamond ({typeCounts.DIAMOND})</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1E4A85]/12 bg-card py-20">
          <Loader2 className="h-9 w-9 animate-spin text-[#1E4A85]" />
          <p className="mt-3 text-sm text-muted-foreground">Loading courses…</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === "courses" && (
            <motion.div
              key="courses"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {filteredCourses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#1E4A85]/25 bg-[#1E4A85]/[0.03] px-6 py-14 text-center">
                  <BookOpen className="mx-auto h-11 w-11 text-[#1E4A85]/50" />
                  <p className="mt-3 font-semibold text-foreground">
                    {globalCourses.length === 0 ? "No global courses yet" : "No matching courses"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {globalCourses.length === 0
                      ? "Create courses that franchise owners can assign to their branches."
                      : "Try a different search or type filter."}
                  </p>
                  {globalCourses.length === 0 && (
                    <button
                      type="button"
                      onClick={openCreateCourse}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#163A6B]"
                    >
                      <Plus className="h-4 w-4" />
                      Add Course
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredCourses.map((c, i) => {
                    const cat = c.category ? catMap[c.category] : null;
                    const style = TYPE_STYLE[c.type] || TYPE_STYLE.SILVER;
                    const TypeIcon = style.Icon;
                    const blurb = c.shortDescription || c.description;
                    return (
                      <motion.article
                        key={c.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition hover:border-[#1E4A85]/35 hover:shadow-md"
                      >
                        <div className="relative h-36 overflow-hidden bg-[#EEF2F7]">
                          {c.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.imageUrl}
                              alt={c.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div
                              className={cn(
                                "flex h-full w-full items-center justify-center bg-gradient-to-br",
                                style.bar
                              )}
                            >
                              <TypeIcon className="h-10 w-10 text-[#1E4A85]/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0F2744]/70 via-transparent to-transparent" />
                          <span
                            className={cn(
                              "absolute left-3 top-3 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                              style.badge
                            )}
                          >
                            {c.type}
                          </span>
                          {c.status === "INACTIVE" && (
                            <span className="absolute right-3 top-3 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                              Inactive
                            </span>
                          )}
                          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-md bg-[#0F2744]/85 px-2 py-1 text-[11px] font-semibold text-white">
                            <Clock className="h-3 w-3 text-[#C4A35A]" />
                            {c.durationMonths} mo
                          </span>
                        </div>

                        <div className="flex flex-1 flex-col gap-3 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-bold leading-snug text-foreground">
                                {c.name}
                              </h3>
                              {c.slug && (
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                  /{c.slug}
                                </p>
                              )}
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                onClick={() => openEditCourse(c)}
                                className="rounded-lg border border-border/70 p-1.5 text-muted-foreground transition hover:border-[#1E4A85]/40 hover:bg-[#1E4A85]/5 hover:text-[#1E4A85]"
                                aria-label={`Edit ${c.name}`}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCourse(c.id, c.name)}
                                className="rounded-lg border border-border/70 p-1.5 text-muted-foreground transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                                aria-label={`Delete ${c.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {blurb && (
                            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {blurb}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold text-muted-foreground">
                            {c.level && (
                              <span className="rounded-full bg-muted px-2 py-0.5">{c.level}</span>
                            )}
                            {c.mode && (
                              <span className="rounded-full bg-muted px-2 py-0.5">{c.mode}</span>
                            )}
                            {cat && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#1E4A85]/10 px-2 py-0.5 text-[#1E4A85]">
                                <Tag className="h-2.5 w-2.5" />
                                {cat.name}
                              </span>
                            )}
                          </div>

                          <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-xs">
                            <span className="inline-flex items-center gap-1 font-bold text-[#1E4A85] dark:text-[#8EB6E8]">
                              <IndianRupee className="h-3.5 w-3.5" />
                              {Number(c.baseFee).toLocaleString("en-IN")}
                            </span>
                            {(c.lectures ?? 0) > 0 && (
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <BookOpen className="h-3.5 w-3.5" />
                                {c.lectures}
                              </span>
                            )}
                            {(c.videos ?? 0) > 0 && (
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <Film className="h-3.5 w-3.5" />
                                {c.videos}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "categories" && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {categories.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#C4A35A]/40 bg-[#C4A35A]/[0.05] px-6 py-14 text-center">
                  <Layers className="mx-auto h-11 w-11 text-[#C4A35A]" />
                  <p className="mt-3 font-semibold text-foreground">No categories yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add categories to organise courses on the public page.
                  </p>
                  <button
                    type="button"
                    onClick={openCreateCat}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#163A6B]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Category
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {categories.map((cat, i) => {
                    const courseCount = globalCourses.filter(
                      (c) => c.category === cat.slug
                    ).length;
                    const colorDot = COLOR_OPTIONS.find((c) => c.value === cat.colorClass);
                    return (
                      <motion.article
                        key={cat.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition hover:border-[#1E4A85]/35 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm",
                                colorDot?.cls || "bg-[#1E4A85]"
                              )}
                            >
                              <Tag className="h-4 w-4" />
                            </span>
                            <div>
                              <h3 className="text-sm font-bold text-foreground">{cat.name}</h3>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                /{cat.slug}
                              </p>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              type="button"
                              onClick={() => openEditCat(cat)}
                              className="rounded-lg border border-border/70 p-1.5 text-muted-foreground transition hover:border-[#1E4A85]/40 hover:bg-[#1E4A85]/5 hover:text-[#1E4A85]"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCat(cat)}
                              className="rounded-lg border border-border/70 p-1.5 text-muted-foreground transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground">{cat.description}</p>
                        )}
                        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                          <span className="rounded-full bg-[#1E4A85]/10 px-2 py-0.5 text-[10px] font-semibold text-[#1E4A85]">
                            {courseCount} course{courseCount !== 1 ? "s" : ""}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Order {cat.sortOrder}
                          </span>
                          <span
                            className={cn(
                              "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold",
                              cat.status === "ACTIVE"
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {cat.status}
                          </span>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Course modal */}
      <AnimatePresence>
        {courseOpen && (
          <motion.div
            key="course-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B132B]/50 p-4 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setCourseOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-card shadow-2xl"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.08] via-transparent to-[#C4A35A]/[0.08] px-6 py-4">
                <div>
                  <h3 className="font-bold text-[#1E4A85] dark:text-[#8EB6E8]">
                    {editCourse ? "Edit Course" : "Create Course"}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Fill all details for public listing & franchise assignment
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCourseOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form
                onSubmit={handleSaveCourse}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  {/* Basic */}
                  <section className="space-y-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
                      Basic info
                    </h4>
                    <div>
                      <label className={labelCls}>Course name *</label>
                      <input
                        type="text"
                        value={courseForm.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setCourseForm((f) => ({
                            ...f,
                            name,
                            slug:
                              !editCourse && (!f.slug || f.slug === slugify(f.name))
                                ? slugify(name)
                                : f.slug,
                          }));
                        }}
                        placeholder="e.g. Full Stack Development"
                        className={inputCls}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>URL slug</label>
                        <input
                          type="text"
                          value={courseForm.slug}
                          onChange={(e) =>
                            setCourseForm((f) => ({
                              ...f,
                              slug: slugify(e.target.value),
                            }))
                          }
                          placeholder="full-stack-development"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Status</label>
                        <select
                          value={courseForm.status}
                          onChange={(e) =>
                            setCourseForm((f) => ({ ...f, status: e.target.value }))
                          }
                          className={inputCls}
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Short description</label>
                      <input
                        type="text"
                        value={courseForm.shortDescription}
                        onChange={(e) =>
                          setCourseForm((f) => ({
                            ...f,
                            shortDescription: e.target.value,
                          }))
                        }
                        placeholder="One-line blurb for course cards"
                        maxLength={300}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Full description</label>
                      <textarea
                        value={courseForm.description}
                        onChange={(e) =>
                          setCourseForm((f) => ({ ...f, description: e.target.value }))
                        }
                        rows={3}
                        placeholder="Detailed overview shown on course page"
                        className={cn(inputCls, "h-auto resize-none py-2")}
                      />
                    </div>
                  </section>

                  {/* Media */}
                  <section className="space-y-3 border-t border-border/60 pt-4">
                    <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
                      <ImageIcon className="h-3.5 w-3.5" />
                      Cover image
                    </h4>

                    {courseForm.imageUrl ? (
                      <div className="overflow-hidden rounded-xl border border-border/70">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={courseForm.imageUrl}
                          alt="Cover preview"
                          className="h-40 w-full object-cover"
                        />
                        <div className="flex items-center gap-2 border-t border-border/60 bg-muted/30 p-3">
                          <label className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#1E4A85]/30 bg-card text-sm font-semibold text-[#1E4A85] transition hover:bg-[#1E4A85]/5">
                            {imageUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            Change file
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="hidden"
                              disabled={imageUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadCoverImage(file);
                                e.target.value = "";
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={clearCoverImage}
                            disabled={imageUploading}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        className={cn(
                          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1E4A85]/25 bg-[#1E4A85]/[0.03] px-4 py-10 text-center transition hover:border-[#1E4A85]/45 hover:bg-[#1E4A85]/[0.06]",
                          imageUploading && "pointer-events-none opacity-70"
                        )}
                      >
                        {imageUploading ? (
                          <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
                        ) : (
                          <Upload className="h-8 w-8 text-[#1E4A85]/70" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {imageUploading ? "Uploading…" : "Choose cover image"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            JPG, PNG or WebP · max 5MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          disabled={imageUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadCoverImage(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </section>

                  {/* Classification */}
                  <section className="space-y-3 border-t border-border/60 pt-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
                      Classification
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Plan type *</label>
                        <select
                          value={courseForm.type}
                          onChange={(e) =>
                            setCourseForm((f) => ({
                              ...f,
                              type: e.target.value as (typeof COURSE_TYPES)[number],
                            }))
                          }
                          className={inputCls}
                        >
                          {COURSE_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Category</label>
                        <select
                          value={courseForm.category}
                          onChange={(e) =>
                            setCourseForm((f) => ({ ...f, category: e.target.value }))
                          }
                          className={inputCls}
                        >
                          <option value="">— None —</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.slug}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Level</label>
                        <select
                          value={courseForm.level}
                          onChange={(e) =>
                            setCourseForm((f) => ({
                              ...f,
                              level: e.target.value as (typeof COURSE_LEVELS)[number],
                            }))
                          }
                          className={inputCls}
                        >
                          {COURSE_LEVELS.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Mode</label>
                        <select
                          value={courseForm.mode}
                          onChange={(e) =>
                            setCourseForm((f) => ({
                              ...f,
                              mode: e.target.value as (typeof COURSE_MODES)[number],
                            }))
                          }
                          className={inputCls}
                        >
                          {COURSE_MODES.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>

                  {/* Pricing */}
                  <section className="space-y-3 border-t border-border/60 pt-4">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
                      Pricing & duration
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Base fee (₹) *</label>
                        <input
                          type="number"
                          min={0}
                          value={courseForm.baseFee}
                          onChange={(e) =>
                            setCourseForm((f) => ({ ...f, baseFee: e.target.value }))
                          }
                          className={inputCls}
                          required
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Duration (months) *</label>
                        <input
                          type="number"
                          min={1}
                          value={courseForm.durationMonths}
                          onChange={(e) =>
                            setCourseForm((f) => ({
                              ...f,
                              durationMonths: e.target.value,
                            }))
                          }
                          className={inputCls}
                          required
                        />
                      </div>
                    </div>
                  </section>

                  {/* Content stats */}
                  <section className="space-y-3 border-t border-border/60 pt-4">
                    <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
                      <Film className="h-3.5 w-3.5" />
                      Content stats
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div>
                        <label className={labelCls}>Lectures</label>
                        <input
                          type="number"
                          min={0}
                          value={courseForm.lectures}
                          onChange={(e) =>
                            setCourseForm((f) => ({ ...f, lectures: e.target.value }))
                          }
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Videos</label>
                        <input
                          type="number"
                          min={0}
                          value={courseForm.videos}
                          onChange={(e) =>
                            setCourseForm((f) => ({ ...f, videos: e.target.value }))
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className={labelCls}>Notes label</label>
                        <input
                          type="text"
                          value={courseForm.notes}
                          onChange={(e) =>
                            setCourseForm((f) => ({ ...f, notes: e.target.value }))
                          }
                          placeholder="PDF notes per module"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Highlights */}
                  <section className="space-y-3 border-t border-border/60 pt-4">
                    <h4 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1E4A85]">
                      <FileText className="h-3.5 w-3.5" />
                      Learning highlights
                    </h4>
                    <div>
                      <label className={labelCls}>One highlight per line</label>
                      <textarea
                        value={courseForm.highlights}
                        onChange={(e) =>
                          setCourseForm((f) => ({ ...f, highlights: e.target.value }))
                        }
                        rows={4}
                        placeholder={"Hands-on projects\nIndustry mentorship\nPlacement support"}
                        className={cn(inputCls, "h-auto resize-none py-2 font-normal")}
                      />
                    </div>
                  </section>
                </div>

                <div className="flex shrink-0 gap-3 border-t border-border/60 bg-muted/20 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setCourseOpen(false)}
                    className="h-10 flex-1 rounded-lg border border-border text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1E4A85] text-sm font-semibold text-white hover:bg-[#163A6B] disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {editCourse ? "Update Course" : "Create Course"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category modal */}
      <AnimatePresence>
        {catOpen && (
          <motion.div
            key="cat-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B132B]/50 p-4 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setCatOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
              className="w-full max-w-md rounded-2xl border border-[#1E4A85]/15 bg-card shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.06] to-transparent px-6 py-4">
                <h3 className="font-bold text-[#1E4A85] dark:text-[#8EB6E8]">
                  {editCat ? "Edit Category" : "Create Category"}
                </h3>
                <button
                  type="button"
                  onClick={() => setCatOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSaveCat} className="space-y-4 p-6">
                <div>
                  <label className={labelCls}>Category name *</label>
                  <input
                    type="text"
                    value={catForm.name}
                    onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Computer"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  <input
                    type="text"
                    value={catForm.description}
                    onChange={(e) =>
                      setCatForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Short description"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Icon name</label>
                    <input
                      type="text"
                      value={catForm.icon}
                      onChange={(e) => setCatForm((f) => ({ ...f, icon: e.target.value }))}
                      placeholder="FiMonitor"
                      className={inputCls}
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      react-icons name (optional)
                    </p>
                  </div>
                  <div>
                    <label className={labelCls}>Sort order</label>
                    <input
                      type="number"
                      min={0}
                      value={catForm.sortOrder}
                      onChange={(e) =>
                        setCatForm((f) => ({ ...f, sortOrder: e.target.value }))
                      }
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Color</label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() =>
                          setCatForm((f) => ({ ...f, colorClass: c.value }))
                        }
                        className={cn(
                          "h-7 w-7 rounded-full ring-2 ring-offset-2 transition-all",
                          c.cls,
                          catForm.colorClass === c.value
                            ? "scale-110 ring-[#1E4A85]"
                            : "ring-transparent"
                        )}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCatOpen(false)}
                    className="h-10 flex-1 rounded-lg border border-border text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#1E4A85] text-sm font-semibold text-white hover:bg-[#163A6B] disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {editCat ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
