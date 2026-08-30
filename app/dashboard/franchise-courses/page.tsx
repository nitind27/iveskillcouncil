"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  IndianRupee,
  Calendar,
  Edit2,
  RefreshCw,
} from "lucide-react";
import { showSuccess, showError, showDeleteConfirm } from "@/lib/toast";
import Breadcrumb from "@/components/common/Breadcrumb";
import {
  CourseFormModal,
  emptyCourseForm,
  courseToForm,
  type CourseFormState,
  type CourseCategoryOption,
} from "@/components/courses/CourseFormModal";
import { courseFormToApiBody, validateCourseForm } from "@/lib/course-form-api";

interface AssignedCourse {
  id: string;
  courseId: string;
  courseName: string;
  customFee: number;
  type: string;
  durationMonths: number;
  isOwn?: boolean;
}

interface AvailableCourse {
  id: string;
  name: string;
  baseFee: number;
  durationMonths: number;
  type: string;
}

export default function FranchiseCoursesPage() {
  const [assigned, setAssigned] = useState<AssignedCourse[]>([]);
  const [available, setAvailable] = useState<AvailableCourse[]>([]);
  const [categories, setCategories] = useState<CourseCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedToAssign, setSelectedToAssign] = useState<Set<string>>(new Set());

  const [courseOpen, setCourseOpen] = useState(false);
  const [editCourseId, setEditCourseId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<CourseFormState>(emptyCourseForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesRes, assignableRes, catRes] = await Promise.all([
        fetch("/api/franchise/courses", { credentials: "include" }),
        fetch("/api/courses?assignable=1", { credentials: "include" }),
        fetch("/api/course-categories/public"),
      ]);
      const coursesData = await coursesRes.json();
      const assignableData = await assignableRes.json();
      const catData = await catRes.json();

      if (coursesData?.data) {
        setAssigned(coursesData.data.courses ?? []);
      }
      if (assignableData?.data) {
        setAvailable(assignableData.data);
      }
      if (catData?.data) {
        setCategories(
          catData.data.map((c: { id: number; name: string; slug: string }) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
          }))
        );
      }
    } catch {
      showError("Error", "Failed to load courses");
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

  const openCreateCourse = () => {
    setEditCourseId(null);
    setCourseForm(emptyCourseForm());
    setCourseOpen(true);
  };

  const openEditCourse = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data?.data) {
        showError("Error", data?.error || "Could not load course");
        return;
      }
      setEditCourseId(courseId);
      setCourseForm(courseToForm(data.data as Record<string, unknown>));
      setCourseOpen(true);
    } catch {
      showError("Error", "Network error");
    }
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateCourseForm(courseForm);
    if (validationError) {
      showError("Validation", validationError);
      return;
    }
    setSaving(true);
    try {
      const url = editCourseId ? `/api/courses/${editCourseId}` : "/api/courses";
      const method = editCourseId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(courseFormToApiBody(courseForm)),
      });
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data?.error || "Failed to save course");
        return;
      }
      showSuccess(
        editCourseId ? "Updated" : "Created",
        editCourseId ? "Course updated." : "Course created for your franchise."
      );
      setCourseOpen(false);
      loadData();
    } catch {
      showError("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (selectedToAssign.size === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/franchise/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseIds: Array.from(selectedToAssign) }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data?.error || "Failed to add courses");
        return;
      }
      showSuccess("Done", "Courses added to your franchise");
      setSelectedToAssign(new Set());
      setAssignOpen(false);
      loadData();
    } catch {
      showError("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (courseId: string, courseName: string) => {
    const ok = await showDeleteConfirm(
      "Remove course?",
      `Remove "${courseName}" from your franchise? This will hide it from the user panel.`
    );
    if (!ok?.isConfirmed) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/franchise/courses?courseId=${courseId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data?.error || "Failed to remove");
        return;
      }
      showSuccess("Removed", "Course removed from your franchise");
      loadData();
    } catch {
      showError("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  const toggleAssign = (id: string) => {
    setSelectedToAssign((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "My Courses" }]} />
        <div className="mt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
              <p className="mt-1 text-muted-foreground">
                Create courses with the same fields as institute admin — award, syllabus, media,
                exam fees, and more.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={openCreateCourse}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1E4A85] px-4 py-2.5 font-medium text-white hover:bg-[#163A6B]"
              >
                <Plus className="h-4 w-4" />
                Create Course
              </button>
              <button
                type="button"
                onClick={() => setAssignOpen(!assignOpen)}
                disabled={available.length === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 font-medium hover:bg-muted disabled:opacity-50"
              >
                <BookOpen className="h-4 w-4" />
                Assign from Global
                {available.length > 0 && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{available.length}</span>
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {assignOpen && available.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 rounded-xl border border-input bg-card p-6"
              >
                <h3 className="mb-4 font-semibold text-foreground">Assign global courses</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Select courses created by institute admin to add to your franchise.
                </p>
                <ul className="mb-4 max-h-48 space-y-2 overflow-y-auto">
                  {available.map((c) => (
                    <li
                      key={c.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 hover:bg-muted/50"
                      onClick={() => toggleAssign(c.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedToAssign.has(c.id)}
                        onChange={() => toggleAssign(c.id)}
                        className="rounded"
                      />
                      <span className="font-medium">{c.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ₹{c.baseFee?.toLocaleString?.("en-IN") ?? c.baseFee} • {c.durationMonths}{" "}
                        months
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={saving || selectedToAssign.size === 0}
                    className="rounded-lg bg-[#1E4A85] px-4 py-2 font-medium text-white disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `Add ${selectedToAssign.size} selected`
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignOpen(false);
                      setSelectedToAssign(new Set());
                    }}
                    className="rounded-lg border border-input px-4 py-2 hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Your franchise courses ({assigned.length})
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-[#1E4A85]" />
              </div>
            ) : assigned.length === 0 ? (
              <div className="rounded-xl border border-dashed border-input bg-muted/30 p-12 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="font-medium text-foreground">No courses yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a course with full details or assign from global catalogue.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assigned.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex flex-col rounded-xl border border-input bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground">{c.courseName}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <IndianRupee className="h-4 w-4" />
                            ₹{c.customFee.toLocaleString("en-IN")}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {c.durationMonths} months
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                            {c.type}
                          </span>
                          {c.isOwn && (
                            <span className="rounded-full bg-[#1E4A85]/10 px-2 py-0.5 text-xs font-medium text-[#1E4A85]">
                              Own course
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {c.isOwn && (
                          <button
                            type="button"
                            onClick={() => openEditCourse(c.courseId)}
                            className="rounded-lg p-2 text-[#1E4A85] hover:bg-[#1E4A85]/10"
                            title="Edit course"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemove(c.courseId, c.courseName)}
                          disabled={saving}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                          title="Remove from franchise"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CourseFormModal
        open={courseOpen}
        editId={editCourseId}
        form={courseForm}
        setForm={setCourseForm}
        categories={categories}
        saving={saving}
        imageUploading={imageUploading}
        onClose={() => setCourseOpen(false)}
        onSubmit={handleSaveCourse}
        onUploadImage={uploadCoverImage}
        onClearImage={() => setCourseForm((f) => ({ ...f, imageUrl: "" }))}
        showCategoryAdminLink={false}
      />
    </div>
  );
}
