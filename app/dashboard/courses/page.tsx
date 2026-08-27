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
  RefreshCw,
  Search,
  Clock,
  IndianRupee,
  Layers,
  AlertTriangle,
  Crown,
  Medal,
  Gem,
  Film,
} from "lucide-react";
import { showSuccess, showError, showDeleteConfirm } from "@/lib/toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  CourseFormModal,
  emptyCourseForm,
  courseToForm,
  type CourseFormState,
} from "@/components/courses/CourseFormModal";
import { isRichTextEmpty, stripHtml } from "@/components/common/RichTextEditor";

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
  awardCategory?: string | null;
  certificateType?: string | null;
  coursePreposition?: string | null;
  mrp?: number | null;
  displayOrder?: number;
  durationValue?: number | null;
  durationUnit?: string | null;
  previewVideoUrl?: string | null;
  practicalMarks?: number | null;
  objectiveMarks?: number | null;
  examFeesByPlan?: Array<{ plan: string; examFee: number }>;
  syllabus?: string | null;
  eligibility?: string | null;
  certificateSubject?: string | null;
  tags?: string[];
  isPopular?: boolean;
  isRecommended?: boolean;
  isMrpVisible?: boolean;
  hideExamResult?: boolean;
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

export default function SuperAdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [courseOpen, setCourseOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState<CourseFormState>(emptyCourseForm);

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
    setCourseForm(courseToForm(c as unknown as Record<string, unknown>));
    setCourseOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = courseForm.tags.map((t) => t.trim()).filter(Boolean);
    if (!courseForm.name.trim() || !courseForm.baseFee || !courseForm.durationValue) {
      showError("Validation", "Title, Price and Duration are required");
      return;
    }
    if (isRichTextEmpty(courseForm.description) || isRichTextEmpty(courseForm.syllabus)) {
      showError("Validation", "Description and Syllabus are required");
      return;
    }
    if (!courseForm.lectures || Number(courseForm.lectures) < 1) {
      showError("Validation", "Total lectures is required");
      return;
    }
    if (tags.length === 0) {
      showError("Validation", "At least one tag is required");
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
          description: courseForm.description.trim(),
          syllabus: courseForm.syllabus.trim(),
          eligibility: courseForm.eligibility.trim() || null,
          certificateSubject: courseForm.certificateSubject.trim() || null,
          imageUrl: courseForm.imageUrl.trim() || null,
          previewVideoUrl: courseForm.previewVideoUrl.trim() || null,
          type: courseForm.type,
          category: courseForm.category || null,
          awardCategory: courseForm.awardCategory || null,
          certificateType: courseForm.certificateType,
          coursePreposition: courseForm.coursePreposition || "In",
          level: courseForm.level,
          mode: courseForm.mode,
          baseFee: Number(courseForm.baseFee),
          mrp: courseForm.mrp === "" ? null : Number(courseForm.mrp),
          displayOrder: Number(courseForm.displayOrder) || 0,
          durationValue: Number(courseForm.durationValue),
          durationUnit: courseForm.durationUnit,
          lectures: Number(courseForm.lectures) || 0,
          practicalMarks:
            courseForm.practicalMarks === ""
              ? null
              : Number(courseForm.practicalMarks),
          objectiveMarks:
            courseForm.objectiveMarks === ""
              ? null
              : Number(courseForm.objectiveMarks),
          examFeesByPlan: courseForm.examFeesByPlan,
          tags,
          highlights: courseForm.highlights.trim() || null,
          isPopular: courseForm.isPopular,
          isRecommended: courseForm.isRecommended,
          isMrpVisible: courseForm.isMrpVisible,
          hideExamResult: courseForm.hideExamResult,
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
            <Link
              href="/dashboard/course-categories"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <Layers className="h-3.5 w-3.5" />
              Categories ({categories.length})
            </Link>
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
              onClick={openCreateCourse}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 text-xs font-bold text-[#0B132B] transition hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Course
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

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-sm font-semibold text-[#1E4A85]">
          Courses ({globalCourses.length})
        </p>

        {!loading && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses..."
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
          <p className="mt-3 text-sm text-muted-foreground">Loading courses...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
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
                    const blurb = c.shortDescription || stripHtml(c.description || "");
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
        </AnimatePresence>
      )}

      <CourseFormModal
        open={courseOpen}
        editId={editCourse?.id ?? null}
        form={courseForm}
        setForm={setCourseForm}
        categories={categories.filter((c) => c.status === "ACTIVE")}
        saving={saving}
        imageUploading={imageUploading}
        onClose={() => setCourseOpen(false)}
        onSubmit={handleSaveCourse}
        onUploadImage={uploadCoverImage}
        onClearImage={clearCoverImage}
      />
    </div>
  );
}
