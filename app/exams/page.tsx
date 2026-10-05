"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { showDeleteConfirm, showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Plus,
  Loader2,
  Clock,
  Users,
  FileQuestion,
  Trash2,
  CheckCircle2,
  Link2,
  Search,
  ArrowRight,
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

type Filter = "all" | "draft" | "published" | "link" | "assigned";

function nextStep(exam: ExamItem): { label: string; href: string } {
  if (exam.questionCount === 0) {
    return { label: "Add questions", href: `/exams/${exam.id}?step=questions` };
  }
  if (exam.accessMode === "ASSIGNED" && exam.targetCount === 0) {
    return { label: "Assign course", href: `/exams/${exam.id}?step=audience` };
  }
  if (exam.status !== "PUBLISHED") {
    return { label: "Review & publish", href: `/exams/${exam.id}?step=publish` };
  }
  if (exam.accessMode === "LINK" && !exam.linkActive) {
    return { label: "Activate link", href: `/exams/${exam.id}?step=publish` };
  }
  return { label: "Open results", href: `/exams/${exam.id}/results` };
}

export default function ExamsAdminPage() {
  const router = useRouter();
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
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "",
    durationMinutes: 60,
    passPercent: 40,
    accessMode: "LINK" as "LINK" | "ASSIGNED",
    franchiseId: "",
    courseId: "",
  });

  const franchiseOptions = franchises ?? [];
  const courseOptions = courses ?? [];
  const list = useMemo(() => exams ?? [], [exams]);

  const counts = useMemo(
    () => ({
      all: list.length,
      draft: list.filter((e) => e.status === "DRAFT").length,
      published: list.filter((e) => e.status === "PUBLISHED").length,
      link: list.filter((e) => e.accessMode === "LINK").length,
      assigned: list.filter((e) => e.accessMode !== "LINK").length,
      live: list.filter((e) => e.accessMode === "LINK" && e.linkActive).length,
    }),
    [list]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((exam) => {
      if (filter === "draft" && exam.status !== "DRAFT") return false;
      if (filter === "published" && exam.status !== "PUBLISHED") return false;
      if (filter === "link" && exam.accessMode !== "LINK") return false;
      if (filter === "assigned" && exam.accessMode === "LINK") return false;
      if (!q) return true;
      return (
        exam.title.toLowerCase().includes(q) ||
        (exam.batchLabel || "").toLowerCase().includes(q)
      );
    });
  }, [list, filter, search]);

  const statusChip = (status: string) => {
    if (status === "PUBLISHED") return "bg-emerald-500/15 text-emerald-800 border-emerald-200";
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
          durationMinutes: form.durationMinutes,
          passPercent: form.passPercent,
          accessMode: form.accessMode,
          requireCamera: true,
          requireFaceDetect: true,
          maxFaceViolations: 3,
          targets:
            form.accessMode === "ASSIGNED"
              ? [{ franchiseId: form.franchiseId, courseId: form.courseId }]
              : [],
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        await showError("Error", json.error || "Failed to create");
        return;
      }
      await showSuccess("Created", "Exam created. Add questions next.");
      setOpen(false);
      setForm({
        title: "",
        durationMinutes: 60,
        passPercent: 40,
        accessMode: "LINK",
        franchiseId: "",
        courseId: "",
      });
      mutate();
      if (json.data?.id) router.push(`/exams/${json.data.id}?step=questions`);
    } finally {
      setSaving(false);
    }
  };

  const removeExam = async (id: string, title: string) => {
    const ok = await showDeleteConfirm(`Delete “${title}”?`, "Questions, links and attempts will be removed.");
    if (!ok.isConfirmed) return;
    const res = await fetch(`/api/exams/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      await showError("Error", j.error || "Delete failed");
      return;
    }
    await showSuccess("Deleted", "Exam removed");
    mutate();
  };

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.all },
    { id: "draft", label: "Draft", count: counts.draft },
    { id: "published", label: "Published", count: counts.published },
    { id: "link", label: "Walk-in", count: counts.link },
    { id: "assigned", label: "Portal", count: counts.assigned },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Breadcrumb />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E4A85] sm:text-3xl">Exams</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Create an exam, add questions, choose who takes it, then publish. Walk-in exams open
            from a tablet link. Portal exams appear on the student&apos;s My Exams page.
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Exams", value: counts.all },
          { label: "Draft", value: counts.draft },
          { label: "Published", value: counts.published },
          { label: "Live links", value: counts.live },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#1E4A85]/12 bg-white px-4 py-3 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-[#1E4A85]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold",
                filter === f.id
                  ? "border-[#1E4A85] bg-[#1E4A85] text-white"
                  : "border-[#1E4A85]/15 bg-white text-[#1E4A85] hover:bg-[#1E4A85]/5"
              )}
            >
              {f.label}
              <span className="ml-1 opacity-70">{f.count}</span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or batch"
            className="w-full rounded-xl border border-[#1E4A85]/15 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1E4A85]/25 bg-white px-6 py-16 text-center">
          <ClipboardList className="mx-auto h-10 w-10 text-[#1E4A85]/40" />
          <p className="mt-3 font-semibold text-foreground">
            {list.length === 0 ? "No exams yet" : "No exams match this filter"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length === 0
              ? "Start with a title and duration. Questions and the audience come in the next steps."
              : "Try another status or clear the search."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((exam) => {
            const next = nextStep(exam);
            return (
              <div
                key={exam.id}
                className="flex flex-col rounded-2xl border border-[#1E4A85]/12 bg-white p-5 shadow-sm"
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
                <div className="mt-2">
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
                      Walk-in link · {exam.linkActive ? "Active" : "Off"}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      Student portal
                      {exam.targetCount ? ` · ${exam.targetCount} batch` : ""}
                    </span>
                  )}
                </div>

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

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <Link
                    href={next.href}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4A85] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#163a6b]"
                  >
                    {next.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`/exams/${exam.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#1E4A85]/15 px-3 py-1.5 text-xs font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/5"
                  >
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
                      onClick={() => removeExam(exam.id, exam.title)}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={createExam}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6"
          >
            <h3 className="text-lg font-bold text-[#1E4A85]">New exam</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Step 1 of 4. Camera and face checks stay on and can be changed after this.
            </p>
            <ol className="mt-3 flex gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <li className="text-[#1E4A85]">1 Details</li>
              <li>2 Questions</li>
              <li>3 Audience</li>
              <li>4 Publish</li>
            </ol>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Who takes it</label>
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
                  <option value="LINK">Walk-in link — tablet at the centre</option>
                  <option value="ASSIGNED">Student portal — a franchise course</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Title</label>
                <input
                  required
                  minLength={3}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. DCA Final Exam"
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
                  <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Pass %</label>
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
                      Course
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
                Create and add questions
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
