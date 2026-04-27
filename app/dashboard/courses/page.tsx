"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Loader2, Trash2, Edit2, Tag, X, Check } from "lucide-react";
import { showSuccess, showError, showDeleteConfirm } from "@/lib/toast";
import Breadcrumb from "@/components/common/Breadcrumb";

interface Course {
  id: string;
  name: string;
  description?: string | null;
  baseFee: number;
  durationMonths: number;
  type: string;
  category: string | null;
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

const COLOR_OPTIONS = [
  { value: "blue",    label: "Blue",    cls: "bg-blue-500" },
  { value: "green",   label: "Green",   cls: "bg-green-500" },
  { value: "pink",    label: "Pink",    cls: "bg-pink-500" },
  { value: "orange",  label: "Orange",  cls: "bg-orange-500" },
  { value: "violet",  label: "Violet",  cls: "bg-violet-500" },
  { value: "amber",   label: "Amber",   cls: "bg-amber-500" },
  { value: "emerald", label: "Emerald", cls: "bg-emerald-500" },
  { value: "cyan",    label: "Cyan",    cls: "bg-cyan-500" },
  { value: "gray",    label: "Gray",    cls: "bg-gray-500" },
];

const inputCls = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
const labelCls = "block text-sm font-medium text-foreground mb-1";

export default function SuperAdminCoursesPage() {
  const [courses,    setCourses]    = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [activeTab,  setActiveTab]  = useState<"courses" | "categories">("courses");

  // Course form
  const [courseOpen, setCourseOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({
    name: "", description: "", type: "SILVER" as typeof COURSE_TYPES[number],
    category: "", baseFee: "", durationMonths: "",
  });

  // Category form
  const [catOpen,  setCatOpen]  = useState(false);
  const [editCat,  setEditCat]  = useState<Category | null>(null);
  const [catForm,  setCatForm]  = useState({
    name: "", description: "", icon: "", colorClass: "blue", sortOrder: "99",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, catRes] = await Promise.all([
        fetch("/api/courses", { credentials: "include" }),
        fetch("/api/admin/course-categories", { credentials: "include" }),
      ]);
      const cData   = await cRes.json();
      const catData = await catRes.json();
      if (cData?.data)   setCourses(cData.data);
      if (catData?.data) setCategories(catData.data);
    } catch {
      showError("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Course handlers ──────────────────────────────────────────────────────
  const openCreateCourse = () => {
    setEditCourse(null);
    setCourseForm({ name: "", description: "", type: "SILVER", category: "", baseFee: "", durationMonths: "" });
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
      const url    = editCourse ? `/api/courses/${editCourse.id}` : "/api/courses";
      const method = editCourse ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name:          courseForm.name.trim(),
          description:   courseForm.description.trim() || undefined,
          type:          courseForm.type,
          category:      courseForm.category || null,
          baseFee:       Number(courseForm.baseFee),
          durationMonths: Number(courseForm.durationMonths),
        }),
      });
      const data = await res.json();
      if (!res.ok) { showError("Error", data?.error || "Failed"); return; }
      showSuccess(editCourse ? "Updated" : "Created", editCourse ? "Course updated." : "Course created.");
      setCourseOpen(false);
      loadData();
    } catch { showError("Error", "Network error"); }
    finally { setSaving(false); }
  };

  const handleDeleteCourse = async (id: string, name: string) => {
    const ok = await showDeleteConfirm(`Delete "${name}"?`, "This cannot be undone.");
    if (!ok) return;
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) { showError("Error", "Failed to delete"); return; }
      showSuccess("Deleted", "Course deleted.");
      loadData();
    } catch { showError("Error", "Network error"); }
  };

  // ── Category handlers ────────────────────────────────────────────────────
  const openCreateCat = () => {
    setEditCat(null);
    setCatForm({ name: "", description: "", icon: "", colorClass: "blue", sortOrder: "99" });
    setCatOpen(true);
  };

  const openEditCat = (cat: Category) => {
    setEditCat(cat);
    setCatForm({
      name:       cat.name,
      description: cat.description || "",
      icon:        cat.icon || "",
      colorClass:  cat.colorClass || "blue",
      sortOrder:   String(cat.sortOrder),
    });
    setCatOpen(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) { showError("Validation", "Name is required"); return; }
    setSaving(true);
    try {
      const url    = editCat ? `/api/admin/course-categories/${editCat.id}` : "/api/admin/course-categories";
      const method = editCat ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name:        catForm.name.trim(),
          description: catForm.description.trim() || null,
          icon:        catForm.icon.trim() || null,
          colorClass:  catForm.colorClass,
          sortOrder:   Number(catForm.sortOrder) || 99,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showError("Error", data?.error || "Failed"); return; }
      showSuccess(editCat ? "Updated" : "Created", editCat ? "Category updated." : "Category created.");
      setCatOpen(false);
      loadData();
    } catch { showError("Error", "Network error"); }
    finally { setSaving(false); }
  };

  const handleDeleteCat = async (cat: Category) => {
    const ok = await showDeleteConfirm(`Delete "${cat.name}"?`, "All courses in this category must be reassigned first.");
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/course-categories/${cat.id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) { showError("Error", data?.error || "Failed"); return; }
      showSuccess("Deleted", "Category deleted.");
      loadData();
    } catch { showError("Error", "Network error"); }
  };

  const globalCourses = courses.filter((c) => !c.franchiseId);
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c]));

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-7xl mx-auto">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Manage Courses" }]} />

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Courses</h1>
            <p className="text-muted-foreground mt-1 text-sm">Create categories and global courses. Franchises assign courses to their branches.</p>
          </div>
          <div className="flex gap-2">
            {activeTab === "courses" ? (
              <button onClick={openCreateCourse} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm">
                <Plus className="w-4 h-4" /> Add Course
              </button>
            ) : (
              <button onClick={openCreateCat} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors text-sm">
                <Plus className="w-4 h-4" /> Add Category
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit mb-8">
          {(["courses", "categories"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "courses" ? `Courses (${globalCourses.length})` : `Categories (${categories.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── COURSES TAB ── */}
            {activeTab === "courses" && (
              <motion.div key="courses" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {globalCourses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-input bg-muted/30 p-12 text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="font-medium text-foreground">No global courses yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Create courses that franchise owners can assign to their branches.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {globalCourses.map((c, i) => {
                      const cat = c.category ? catMap[c.category] : null;
                      return (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="rounded-xl border border-input bg-card p-5 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-foreground text-sm leading-snug">{c.name}</h3>
                            <div className="flex gap-1 flex-shrink-0">
                              <button
                                onClick={() => {
                                  setEditCourse(c);
                                  setCourseForm({
                                    name: c.name, description: c.description || "",
                                    type: c.type as typeof COURSE_TYPES[number],
                                    category: c.category || "", baseFee: String(c.baseFee),
                                    durationMonths: String(c.durationMonths),
                                  });
                                  setCourseOpen(true);
                                }}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCourse(c.id, c.name)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
                          <div className="flex flex-wrap gap-1.5 mt-auto">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{c.type}</span>
                            {cat && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5" />{cat.name}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground ml-auto">₹{c.baseFee.toLocaleString("en-IN")} · {c.durationMonths}m</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── CATEGORIES TAB ── */}
            {activeTab === "categories" && (
              <motion.div key="categories" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {categories.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-input bg-muted/30 p-12 text-center">
                    <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="font-medium text-foreground">No categories yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Add categories to organise courses on the public page.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((cat, i) => {
                      const courseCount = globalCourses.filter((c) => c.category === cat.slug).length;
                      const colorDot = COLOR_OPTIONS.find((c) => c.value === cat.colorClass);
                      return (
                        <motion.div
                          key={cat.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="rounded-xl border border-input bg-card p-5 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {colorDot && <span className={`w-3 h-3 rounded-full flex-shrink-0 ${colorDot.cls}`} />}
                              <h3 className="font-semibold text-foreground text-sm">{cat.name}</h3>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => openEditCat(cat)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteCat(cat)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                          <div className="flex items-center gap-2 mt-auto">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {courseCount} course{courseCount !== 1 ? "s" : ""}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-auto">Order: {cat.sortOrder}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                              {cat.status}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ── Course Form Modal ── */}
        <AnimatePresence>
          {courseOpen && (
            <motion.div
              key="course-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setCourseOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 16 }}
                className="bg-background rounded-2xl shadow-2xl border border-border w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h3 className="font-bold text-foreground">{editCourse ? "Edit Course" : "Create Course"}</h3>
                  <button onClick={() => setCourseOpen(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
                  <div>
                    <label className={labelCls}>Course name *</label>
                    <input type="text" value={courseForm.name} onChange={(e) => setCourseForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Full Stack Development" className={inputCls} required />
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Type *</label>
                      <select value={courseForm.type} onChange={(e) => setCourseForm((f) => ({ ...f, type: e.target.value as typeof COURSE_TYPES[number] }))} className={inputCls}>
                        {COURSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Category</label>
                      <select value={courseForm.category} onChange={(e) => setCourseForm((f) => ({ ...f, category: e.target.value }))} className={inputCls}>
                        <option value="">— None —</option>
                        {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Base fee (₹) *</label>
                      <input type="number" min={0} value={courseForm.baseFee} onChange={(e) => setCourseForm((f) => ({ ...f, baseFee: e.target.value }))} className={inputCls} required />
                    </div>
                    <div>
                      <label className={labelCls}>Duration (months) *</label>
                      <input type="number" min={1} value={courseForm.durationMonths} onChange={(e) => setCourseForm((f) => ({ ...f, durationMonths: e.target.value }))} className={inputCls} required />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setCourseOpen(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {editCourse ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Category Form Modal ── */}
        <AnimatePresence>
          {catOpen && (
            <motion.div
              key="cat-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={(e) => e.target === e.currentTarget && setCatOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 16 }}
                className="bg-background rounded-2xl shadow-2xl border border-border w-full max-w-md"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <h3 className="font-bold text-foreground">{editCat ? "Edit Category" : "Create Category"}</h3>
                  <button onClick={() => setCatOpen(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleSaveCat} className="p-6 space-y-4">
                  <div>
                    <label className={labelCls}>Category name *</label>
                    <input type="text" value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Computer" className={inputCls} required />
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <input type="text" value={catForm.description} onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Icon name</label>
                      <input type="text" value={catForm.icon} onChange={(e) => setCatForm((f) => ({ ...f, icon: e.target.value }))} placeholder="FiMonitor" className={inputCls} />
                      <p className="text-[10px] text-muted-foreground mt-1">react-icons name (optional)</p>
                    </div>
                    <div>
                      <label className={labelCls}>Sort order</label>
                      <input type="number" min={0} value={catForm.sortOrder} onChange={(e) => setCatForm((f) => ({ ...f, sortOrder: e.target.value }))} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Color</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setCatForm((f) => ({ ...f, colorClass: c.value }))}
                          className={`w-7 h-7 rounded-full ${c.cls} ring-2 ring-offset-2 transition-all ${catForm.colorClass === c.value ? "ring-foreground scale-110" : "ring-transparent"}`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setCatOpen(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {editCat ? "Update" : "Create"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
