"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Layers,
  Plus,
  Loader2,
  Trash2,
  Edit2,
  RefreshCw,
  Search,
  Check,
  AlertTriangle,
  ArrowUpDown,
  BookOpen,
  Tag,
} from "lucide-react";
import { showSuccess, showError, showDeleteConfirm } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/common/Modal";

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

const COLOR_OPTIONS = [
  { value: "blue", label: "Navy", cls: "bg-[#1E4A85]" },
  { value: "gold", label: "Gold", cls: "bg-[#C4A35A]" },
  { value: "emerald", label: "Emerald", cls: "bg-emerald-600" },
  { value: "violet", label: "Violet", cls: "bg-violet-600" },
  { value: "rose", label: "Rose", cls: "bg-rose-600" },
  { value: "cyan", label: "Cyan", cls: "bg-cyan-600" },
  { value: "orange", label: "Orange", cls: "bg-orange-500" },
  { value: "slate", label: "Slate", cls: "bg-slate-600" },
];

function colorDot(value: string | null) {
  return COLOR_OPTIONS.find((c) => c.value === value)?.cls || "bg-[#1E4A85]";
}

const emptyForm = () => ({
  name: "",
  description: "",
  icon: "",
  colorClass: "blue",
  sortOrder: "0",
  status: "ACTIVE",
});

const labelCls = "mb-1.5 block text-xs font-semibold text-muted-foreground";
const inputCls =
  "h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none transition focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15";

export default function CourseCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [courseCounts, setCourseCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm());

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [catRes, courseRes] = await Promise.all([
        fetch("/api/admin/course-categories", { credentials: "include" }),
        fetch("/api/courses?all=1", { credentials: "include" }),
      ]);
      const catData = await catRes.json().catch(() => ({}));
      const courseData = await courseRes.json().catch(() => ({}));

      if (!catRes.ok) {
        setLoadError(catData?.error || "Failed to load categories");
        setCategories([]);
      } else {
        setCategories(Array.isArray(catData.data) ? catData.data : []);
      }

      const courses = Array.isArray(courseData.data) ? courseData.data : [];
      const counts: Record<string, number> = {};
      for (const c of courses) {
        if (c.category) counts[c.category] = (counts[c.category] || 0) + 1;
      }
      setCourseCounts(counts);
    } catch {
      setLoadError("Network error while loading categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
    );
  }, [categories, search]);

  const openCreate = () => {
    setEditCat(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditCat(cat);
    setForm({
      name: cat.name,
      description: cat.description || "",
      icon: cat.icon || "",
      colorClass: cat.colorClass || "blue",
      sortOrder: String(cat.sortOrder ?? 0),
      status: cat.status || "ACTIVE",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError("Validation", "Category name is required");
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
          name: form.name.trim(),
          description: form.description.trim() || null,
          icon: form.icon.trim() || null,
          colorClass: form.colorClass,
          sortOrder: Number(form.sortOrder) || 0,
          status: form.status,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data?.error || "Failed to save");
        return;
      }
      showSuccess(
        editCat ? "Updated" : "Created",
        editCat ? "Category updated." : "Category created — it will appear in Add Course dropdown."
      );
      setModalOpen(false);
      loadData();
    } catch {
      showError("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    const used = courseCounts[cat.slug] || 0;
    const ok = await showDeleteConfirm(
      `Delete “${cat.name}”?`,
      used > 0
        ? `${used} course(s) use this category. Reassign them first.`
        : "This cannot be undone."
    );
    if (!ok.isConfirmed) return;
    try {
      const res = await fetch(`/api/admin/course-categories/${cat.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data?.error || "Failed to delete");
        return;
      }
      showSuccess("Deleted", "Category deleted.");
      loadData();
    } catch {
      showError("Error", "Network error");
    }
  };

  const toggleStatus = async (cat: Category) => {
    const next = cat.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/admin/course-categories/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data?.error || "Failed to update status");
        return;
      }
      showSuccess("Updated", `Category marked ${next.toLowerCase()}.`);
      loadData();
    } catch {
      showError("Error", "Network error");
    }
  };

  return (
    <div className="space-y-5 pb-8">
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] text-white shadow-md shadow-[#1E4A85]/15">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/55">
              <Link href="/dashboard" className="hover:text-white/90">
                Dashboard
              </Link>
              <span>/</span>
              <Link href="/dashboard/courses" className="hover:text-white/90">
                Courses
              </Link>
              <span>/</span>
              <span className="text-white/80">Categories</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Course Categories
              </h1>
              <span className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#E8D5A3] sm:inline-flex">
                <Layers className="h-3 w-3" />
                Catalogue
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs text-white/60 sm:text-sm">
              Categories appear in Add Course dropdown and on the public course listing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                  Total
                </p>
                <p className="font-bold tabular-nums leading-tight">
                  {categories.length}
                </p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-200/80">
                  Active
                </p>
                <p className="font-bold tabular-nums leading-tight text-emerald-100">
                  {categories.filter((c) => c.status === "ACTIVE").length}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/courses"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Courses
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
              onClick={openCreate}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 text-xs font-bold text-[#0B132B] transition hover:brightness-110"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Category
            </button>
          </div>
        </div>
      </header>

      {loadError && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-sm text-amber-900 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Could not load</p>
              <p className="mt-0.5 text-amber-800/90 dark:text-amber-200/90">
                {loadError}
              </p>
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="h-10 w-full rounded-lg border border-border/70 bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Sorted by display order · used in course form dropdown
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1E4A85]/12 bg-card py-20">
          <Loader2 className="h-9 w-9 animate-spin text-[#1E4A85]" />
          <p className="mt-3 text-sm text-muted-foreground">Loading categories…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1E4A85]/25 bg-[#1E4A85]/[0.03] px-6 py-14 text-center">
          <Layers className="mx-auto h-11 w-11 text-[#1E4A85]/50" />
          <p className="mt-3 font-semibold text-foreground">
            {categories.length === 0 ? "No categories yet" : "No matching categories"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {categories.length === 0
              ? "Create categories so they appear in the Add Course dropdown."
              : "Try a different search."}
          </p>
          {categories.length === 0 && (
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#163A6B]"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((cat, i) => {
            const used = courseCounts[cat.slug] || 0;
            return (
              <motion.article
                key={cat.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.25) }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition hover:border-[#1E4A85]/35 hover:shadow-md"
              >
                <div className="flex items-start gap-3 border-b border-border/60 bg-gradient-to-r from-[#1E4A85]/[0.06] to-transparent p-4">
                  <span
                    className={cn(
                      "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm",
                      colorDot(cat.colorClass)
                    )}
                  >
                    <Tag className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-foreground">
                          {cat.name}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          /{cat.slug}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          cat.status === "ACTIVE"
                            ? "bg-emerald-500/15 text-emerald-700"
                            : "bg-slate-500/15 text-slate-600"
                        )}
                      >
                        {cat.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {cat.description || "No description"}
                  </p>

                  <div className="flex flex-wrap gap-2 text-[10px] font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                      <ArrowUpDown className="h-2.5 w-2.5" />
                      Order {cat.sortOrder}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#1E4A85]/10 px-2 py-0.5 text-[#1E4A85]">
                      <BookOpen className="h-2.5 w-2.5" />
                      {used} course{used === 1 ? "" : "s"}
                    </span>
                    {cat.icon && (
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {cat.icon}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2 border-t border-border/60 pt-3">
                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/70 px-3 py-2 text-xs font-semibold text-[#1E4A85] transition hover:border-[#1E4A85]/40 hover:bg-[#1E4A85]/5"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleStatus(cat)}
                      className="inline-flex items-center justify-center rounded-lg border border-border/70 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted"
                    >
                      {cat.status === "ACTIVE" ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      className="inline-flex items-center justify-center rounded-lg border border-border/70 px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50"
                      aria-label={`Delete ${cat.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCat ? "Edit Category" : "Add Category"}
        description="Saved categories show instantly in the Add Course category dropdown."
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={labelCls}>Category name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Computer, Beauty, Accounting"
              className={inputCls}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={3}
              placeholder="Short line shown on public course listing"
              className={cn(inputCls, "h-auto resize-y py-2")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Icon name</label>
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="FiMonitor"
                className={inputCls}
              />
              <p className="mt-1 text-[10px] text-muted-foreground">
                Optional react-icons name
              </p>
            </div>
            <div>
              <label className={labelCls}>Sort order</label>
              <input
                type="number"
                min={0}
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sortOrder: e.target.value }))
                }
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className={inputCls}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Color</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, colorClass: c.value }))}
                  className={cn(
                    "h-8 w-8 rounded-full ring-2 ring-offset-2 transition-all",
                    c.cls,
                    form.colorClass === c.value
                      ? "scale-110 ring-[#1E4A85]"
                      : "ring-transparent hover:scale-105"
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
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
      </Modal>
    </div>
  );
}
