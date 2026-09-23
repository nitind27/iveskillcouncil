"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  BookOpen,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Layers,
} from "lucide-react";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { fetcher } from "@/lib/fetcher";
import { showSuccess, showError, showDeleteConfirm } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";

type CourseOption = { id: string; name: string; franchiseId?: string | null };

type SubjectRow = {
  id: string;
  courseId: string;
  name: string;
  maxMarks: number;
  sortOrder: number;
};

type SubjectsPayload = {
  course: {
    id: string;
    name: string;
    canManage: boolean;
    defaultMaxMarks: number;
  };
  subjects: SubjectRow[];
};

function unwrapCourses(data: unknown): CourseOption[] {
  if (Array.isArray(data)) return data as CourseOption[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: CourseOption[] }).data;
  }
  return [];
}

export default function CourseSubjectsPage() {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const isFranchise = roleId === ROLES.SUB_ADMIN;

  const [courseId, setCourseId] = useState("");
  const [newName, setNewName] = useState("");
  const [newMax, setNewMax] = useState("100");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editMax, setEditMax] = useState("100");
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data: coursesRaw } = useSWR("/api/courses", fetcher);
  const courses = unwrapCourses(coursesRaw);

  const subjectsUrl = courseId ? `/api/course-subjects?courseId=${courseId}` : null;
  const { data: payload, isLoading, mutate, error } = useSWR<SubjectsPayload>(
    subjectsUrl,
    fetcher,
    { revalidateOnFocus: false }
  );

  const subjects = payload?.subjects ?? [];
  const canManage = payload?.course.canManage ?? false;
  const defaultMax = payload?.course.defaultMaxMarks ?? 100;

  useEffect(() => {
    setNewName("");
    setNewMax(String(defaultMax));
    setEditingId(null);
  }, [courseId, defaultMax]);

  const handleAdd = useCallback(async () => {
    const name = newName.trim();
    if (!courseId || !name) {
      await showError("Validation", "Enter a subject name");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/course-subjects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          name,
          maxMarks: Number(newMax) || defaultMax,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        await showError("Error", d.error || "Failed to add subject");
        return;
      }
      await showSuccess("Added", "Subject added to course");
      setNewName("");
      mutate();
    } catch {
      await showError("Error", "Failed to add subject");
    } finally {
      setAdding(false);
    }
  }, [courseId, newName, newMax, defaultMax, mutate]);

  const startEdit = (s: SubjectRow) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditMax(String(s.maxMarks));
  };

  const handleSaveEdit = async (id: string) => {
    const name = editName.trim();
    if (!name) {
      await showError("Validation", "Subject name is required");
      return;
    }
    setSavingId(id);
    try {
      const res = await fetch(`/api/course-subjects/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          maxMarks: Number(editMax) || defaultMax,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        await showError("Error", d.error || "Failed to update");
        return;
      }
      await showSuccess("Updated", "Subject saved");
      setEditingId(null);
      mutate();
    } catch {
      await showError("Error", "Failed to update");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (s: SubjectRow) => {
    const ok = await showDeleteConfirm(
      "Delete subject?",
      `"${s.name}" will be removed from this course.`
    );
    if (!ok.isConfirmed) return;
    setSavingId(s.id);
    try {
      const res = await fetch(`/api/course-subjects/${s.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const d = await res.json();
      if (!res.ok) {
        await showError("Error", d.error || "Failed to delete");
        return;
      }
      await showSuccess("Deleted", "Subject removed");
      mutate();
    } catch {
      await showError("Error", "Failed to delete");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Breadcrumb
        items={[
          { label: isFranchise ? "My Courses" : "Courses", href: isFranchise ? "/dashboard/franchise-courses" : "/dashboard/courses" },
          { label: "Subjects" },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <Layers className="h-5 w-5 text-emerald-700" />
            Course Subjects
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Select a course once, add its subjects here. Marks Entry and certificates will use these automatically.
          </p>
        </div>
        <Link
          href="/students/marks"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <BookOpen className="h-4 w-4" />
          Open Marks Entry
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Course</span>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full max-w-xl rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </CardContent>
      </Card>

      {!courseId && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Select a course to view and manage its subjects.
        </div>
      )}

      {courseId && isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading subjects…
        </div>
      )}

      {courseId && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load subjects.
        </div>
      )}

      {courseId && !isLoading && payload && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <span>
              <strong className="text-slate-900">{payload.course.name}</strong>
              {" · "}
              {subjects.length} subject{subjects.length === 1 ? "" : "s"}
            </span>
            {!canManage && (
              <span className="text-amber-700">
                View only — you can edit subjects only on courses you manage.
              </span>
            )}
          </div>

          {canManage && (
            <Card>
              <CardContent className="flex flex-wrap items-end gap-3 p-4">
                <label className="min-w-[220px] flex-1 text-sm">
                  <span className="mb-1 block font-medium text-slate-700">New subject</span>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAdd();
                      }
                    }}
                    placeholder="e.g. MS Word"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="w-28 text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Max marks</span>
                  <input
                    value={newMax}
                    onChange={(e) => setNewMax(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={adding || !newName.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add Subject
                </button>
              </CardContent>
            </Card>
          )}

          {subjects.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              No subjects yet. {canManage ? "Add subjects above." : "Ask institute admin to add subjects for this course."}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">#</th>
                    <th className="px-4 py-2.5 font-semibold">Subject</th>
                    <th className="px-4 py-2.5 font-semibold">Max marks</th>
                    {canManage && <th className="px-4 py-2.5 text-right font-semibold">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s, idx) => {
                    const editing = editingId === s.id;
                    return (
                      <tr key={s.id} className="border-t border-slate-100">
                        <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-2">
                          {editing ? (
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full max-w-md rounded border border-slate-200 px-2 py-1.5"
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium text-slate-900">{s.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {editing ? (
                            <input
                              value={editMax}
                              onChange={(e) => setEditMax(e.target.value.replace(/\D/g, "").slice(0, 3))}
                              className="w-24 rounded border border-slate-200 px-2 py-1.5"
                            />
                          ) : (
                            <span className="tabular-nums text-slate-700">{s.maxMarks}</span>
                          )}
                        </td>
                        {canManage && (
                          <td className="px-4 py-2">
                            <div className="flex justify-end gap-1">
                              {editing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEdit(s.id)}
                                    disabled={savingId === s.id}
                                    className="inline-flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-medium text-white"
                                  >
                                    {savingId === s.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Save className="h-3.5 w-3.5" />
                                    )}
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingId(null)}
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEdit(s)}
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(s)}
                                    disabled={savingId === s.id}
                                    className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
