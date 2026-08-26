"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { ExamLinkPanel } from "@/components/exams/ExamLinkPanel";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Plus,
  Loader2,
  Clock,
  Users,
  FileQuestion,
  Trash2,
  Eye,
  CheckCircle2,
  Link2,
} from "lucide-react";

interface ExamItem {
  id: string;
  title: string;
  durationMinutes: number;
  passPercent: number;
  status: string;
  accessMode?: string;
  linkToken?: string | null;
  linkActive?: boolean;
  batchLabel: string | null;
  questionCount: number;
  attemptCount: number;
  targetCount: number;
  createdAt: string;
}

interface FranchiseOpt {
  id: string;
  name: string;
}
interface CourseOpt {
  id: string;
  name: string;
}

export default function ExamsAdminPage() {
  const { user } = useAuth();
  const canManage =
    Number(user?.roleId) === ROLES.SUPER_ADMIN || Number(user?.roleId) === ROLES.ADMIN;

  const { data: exams, isLoading, mutate } = useSWR<ExamItem[]>("/api/exams", fetcher);
  const { data: franchises } = useSWR<FranchiseOpt[]>(
    canManage ? "/api/franchises?limit=200" : null,
    async (url: string) => {
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json();
      const items = json?.data?.items ?? json?.data ?? [];
      return (Array.isArray(items) ? items : []).map((f: { id: string; name: string }) => ({
        id: String(f.id),
        name: f.name,
      }));
    }
  );
  const { data: courses } = useSWR<CourseOpt[]>(
    canManage ? "/api/courses?limit=200" : null,
    async (url: string) => {
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json();
      const items = json?.data?.items ?? json?.data ?? [];
      return (Array.isArray(items) ? items : []).map((c: { id: string; name: string }) => ({
        id: String(c.id),
        name: c.name,
      }));
    }
  );

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: 60,
    passPercent: 40,
    batchLabel: "",
    accessMode: "LINK" as "LINK" | "ASSIGNED",
    franchiseId: "",
    courseId: "",
    requireCamera: true,
    requireFaceDetect: true,
    maxFaceViolations: 3,
  });

  const franchiseOptions = franchises ?? [];
  const courseOptions = courses ?? [];

  const statusChip = (status: string) => {
    if (status === "PUBLISHED")
      return "bg-emerald-500/15 text-emerald-800 border-emerald-200";
    if (status === "ARCHIVED") return "bg-slate-100 text-slate-600 border-slate-200";
    return "bg-amber-500/15 text-amber-800 border-amber-200";
  };

  const createExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.accessMode === "ASSIGNED" && (!form.franchiseId || !form.courseId)) {
      await showError("Validation", "Select franchise and course for portal exams");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          durationMinutes: form.durationMinutes,
          passPercent: form.passPercent,
          batchLabel: form.batchLabel || null,
          accessMode: form.accessMode,
          requireCamera: form.requireCamera,
          requireFaceDetect: form.requireFaceDetect,
          maxFaceViolations: form.maxFaceViolations,
          targets:
            form.accessMode === "ASSIGNED"
              ? [{ franchiseId: form.franchiseId, courseId: form.courseId }]
              : form.franchiseId && form.courseId
                ? [{ franchiseId: form.franchiseId, courseId: form.courseId }]
                : [],
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        await showError("Error", json.error || "Failed to create");
        return;
      }
      await showSuccess(
        "Created",
        form.accessMode === "LINK"
          ? "Walk-in exam created — add questions, publish, then activate the link"
          : "Exam created — add questions next"
      );
      setOpen(false);
      setForm({
        title: "",
        description: "",
        durationMinutes: 60,
        passPercent: 40,
        batchLabel: "",
        accessMode: "LINK",
        franchiseId: "",
        courseId: "",
        requireCamera: true,
        requireFaceDetect: true,
        maxFaceViolations: 3,
      });
      mutate();
      if (json.data?.id) window.location.href = `/exams/${json.data.id}`;
    } finally {
      setSaving(false);
    }
  };

  const removeExam = async (id: string) => {
    if (!confirm("Delete this exam permanently?")) return;
    const res = await fetch(`/api/exams/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      await showError("Error", j.error || "Delete failed");
      return;
    }
    await showSuccess("Deleted", "Exam removed");
    mutate();
  };

  const list = useMemo(() => exams ?? [], [exams]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Breadcrumb />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E4A85] sm:text-3xl">
            Exams
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create walk-in link exams (tablet on site) — hidden from franchise &amp; student portals
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#163a6b]"
          >
            <Plus className="h-4 w-4" />
            New exam
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1E4A85]/25 bg-white px-6 py-16 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-[#1E4A85]/40" />
          <p className="mt-3 font-semibold text-foreground">No exams yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Institute admin can create an exam and assign it to a franchise course batch.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((exam) => (
            <div
              key={exam.id}
              className="rounded-2xl border border-[#1E4A85]/12 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-[#0B1F3A]">{exam.title}</h2>
                  {exam.batchLabel && (
                    <p className="mt-0.5 text-xs font-medium text-[#C4A35A]">{exam.batchLabel}</p>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase",
                    statusChip(exam.status)
                  )}
                >
                  {exam.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {exam.accessMode === "LINK" ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      exam.linkActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    <Link2 className="h-3 w-3" />
                    Walk-in link · {exam.linkActive ? "Active" : "Deactivated"}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    Portal assigned
                  </span>
                )}
              </div>

              {canManage && exam.accessMode === "LINK" && (
                <div className="mt-3">
                  <ExamLinkPanel
                    examId={exam.id}
                    linkToken={exam.linkToken}
                    linkActive={!!exam.linkActive}
                    published={exam.status === "PUBLISHED"}
                    compact
                    onUpdated={() => mutate()}
                  />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {exam.durationMinutes} min
                </span>
                <span className="inline-flex items-center gap-1">
                  <FileQuestion className="h-3.5 w-3.5" />
                  {exam.questionCount} Q
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {exam.attemptCount} attempts
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Pass {exam.passPercent}%
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/exams/${exam.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E4A85]/15 px-3 py-1.5 text-xs font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {canManage ? "Edit" : "View"}
                </Link>
                <Link
                  href={`/exams/${exam.id}/results`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#C4A35A]/30 px-3 py-1.5 text-xs font-semibold text-[#8a6f2e] hover:bg-[#C4A35A]/10"
                >
                  Results
                </Link>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => removeExam(exam.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={createExam}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <h3 className="text-lg font-bold text-[#1E4A85]">Create exam</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Default: walk-in link (admin opens on tablet). Not shown to franchise or students.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
                  Delivery mode
                </label>
                <select
                  value={form.accessMode}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      accessMode: e.target.value as "LINK" | "ASSIGNED",
                    }))
                  }
                  className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15"
                >
                  <option value="LINK">Walk-in link (tablet) — hidden from portals</option>
                  <option value="ASSIGNED">Assigned to franchise students (portal)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={600}
                    required
                    value={form.durationMinutes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
                    Pass %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.passPercent}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, passPercent: Number(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
                  Batch label (optional)
                </label>
                <input
                  value={form.batchLabel}
                  onChange={(e) => setForm((f) => ({ ...f, batchLabel: e.target.value }))}
                  placeholder="e.g. Morning Batch A"
                  className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15"
                />
              </div>
              {form.accessMode === "ASSIGNED" && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
                      Franchise
                    </label>
                    <select
                      required
                      value={form.franchiseId}
                      onChange={(e) => setForm((f) => ({ ...f, franchiseId: e.target.value }))}
                      className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15"
                    >
                      <option value="">Select franchise</option>
                      {franchiseOptions.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
                      Course / batch
                    </label>
                    <select
                      required
                      value={form.courseId}
                      onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
                      className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15"
                    >
                      <option value="">Select course</option>
                      {courseOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={form.requireCamera}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, requireCamera: e.target.checked }))
                    }
                  />
                  Require camera
                </label>
                <label className="flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={form.requireFaceDetect}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, requireFaceDetect: e.target.checked }))
                    }
                  />
                  Face detect
                </label>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
                  Max proctor violations (then auto-submit)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={form.maxFaceViolations}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxFaceViolations: Number(e.target.value) }))
                  }
                  className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
