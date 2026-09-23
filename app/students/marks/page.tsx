"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { ClipboardList, Loader2, Save, Search } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { showSuccess, showError } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";

type MarksCell = { obtainedMarks: number; maxMarks: number };

type MarksStudent = {
  id: string;
  studentCode: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: string;
  franchiseName: string | null;
  marks: Record<string, MarksCell>;
};

type MarksPayload = {
  course: {
    id: string;
    name: string;
    subjects: string[];
    subjectMeta?: { name: string; maxMarks: number }[];
    defaultMaxMarks: number;
  };
  students: MarksStudent[];
  message?: string;
};

type CourseOption = { id: string; name: string };

function unwrapList(data: unknown): CourseOption[] {
  if (Array.isArray(data)) return data as CourseOption[];
  if (data && typeof data === "object") {
    const d = data as { data?: CourseOption[]; courses?: CourseOption[] };
    return d.data ?? d.courses ?? [];
  }
  return [];
}

export default function StudentMarksPage() {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const showFranchiseFilter = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  const [courseId, setCourseId] = useState("");
  const [franchiseId, setFranchiseId] = useState("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [grid, setGrid] = useState<Record<string, Record<string, string>>>({});
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: coursesRaw } = useSWR("/api/courses", fetcher);
  const courses = unwrapList(coursesRaw);

  const { data: franchisesRaw } = useSWR(
    showFranchiseFilter ? "/api/franchises?limit=100" : null,
    fetcher
  );
  const franchises = unwrapList(franchisesRaw);

  const marksUrl = courseId
    ? `/api/students/marks?courseId=${courseId}${
        franchiseId ? `&franchiseId=${franchiseId}` : ""
      }${searchDebounced ? `&search=${encodeURIComponent(searchDebounced)}` : ""}`
    : null;

  const { data: payload, error, isLoading, mutate } = useSWR<MarksPayload>(
    marksUrl,
    fetcher,
    { revalidateOnFocus: false }
  );

  const subjects = payload?.course.subjects ?? [];
  const students = payload?.students ?? [];
  const defaultMax = payload?.course.defaultMaxMarks ?? 100;
  const subjectMaxMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of payload?.course.subjectMeta ?? []) {
      map.set(s.name, s.maxMarks);
    }
    return map;
  }, [payload]);

  const maxFor = (subject: string) => subjectMaxMap.get(subject) ?? defaultMax;

  useEffect(() => {
    if (!payload) {
      setGrid({});
      setDirty(false);
      return;
    }
    const next: Record<string, Record<string, string>> = {};
    for (const s of payload.students) {
      next[s.id] = {};
      for (const subject of payload.course.subjects) {
        const cell = s.marks[subject];
        next[s.id][subject] = cell ? String(cell.obtainedMarks) : "";
      }
    }
    setGrid(next);
    setDirty(false);
  }, [payload]);

  const filledCount = useMemo(() => {
    let n = 0;
    for (const sid of Object.keys(grid)) {
      for (const sub of Object.keys(grid[sid] || {})) {
        const v = grid[sid][sub];
        if (v !== "" && Number.isFinite(Number(v))) n += 1;
      }
    }
    return n;
  }, [grid]);

  const setMark = (studentId: string, subject: string, value: string) => {
    // Allow empty / digits only
    if (value !== "" && !/^\d{0,3}$/.test(value)) return;
    setGrid((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [subject]: value },
    }));
    setDirty(true);
  };

  const fillColumn = (subject: string, value: string) => {
    if (value !== "" && !/^\d{0,3}$/.test(value)) return;
    setGrid((prev) => {
      const next = { ...prev };
      for (const s of students) {
        next[s.id] = { ...(next[s.id] || {}), [subject]: value };
      }
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    if (!courseId || subjects.length === 0) return;

    const entries: {
      studentId: string;
      subjectName: string;
      obtainedMarks: number;
      maxMarks: number;
    }[] = [];

    for (const s of students) {
      for (const subject of subjects) {
        const raw = grid[s.id]?.[subject];
        if (raw === undefined || raw === "") continue;
        const obtained = Number(raw);
        if (!Number.isFinite(obtained) || obtained < 0) {
          await showError("Validation", `Invalid marks for ${s.fullName} — ${subject}`);
          return;
        }
        if (obtained > maxFor(subject)) {
          await showError(
            "Validation",
            `${s.fullName}: ${subject} cannot exceed ${maxFor(subject)}`
          );
          return;
        }
        entries.push({
          studentId: s.id,
          subjectName: subject,
          obtainedMarks: obtained,
          maxMarks: maxFor(subject),
        });
      }
    }

    if (entries.length === 0) {
      await showError("Validation", "Enter at least one mark before saving");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/students/marks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseId, entries }),
      });
      const d = await res.json();
      if (!res.ok) {
        await showError("Error", d.error || "Failed to save marks");
        return;
      }
      await showSuccess("Saved", d.message || `${entries.length} marks saved`);
      setDirty(false);
      mutate();
    } catch {
      await showError("Error", "Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Breadcrumb
        items={[
          { label: "Students", href: "/students" },
          { label: "Marks Entry" },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-slate-900">
            <ClipboardList className="h-5 w-5 text-emerald-700" />
            Student Marks
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Filter by course, then enter subject-wise marks for the class.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={!courseId || !dirty || saving || subjects.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Marks
        </button>
      </div>

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Course / Class</span>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setDirty(false);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select course…</option>
              {courses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          {showFranchiseFilter && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Franchise</span>
              <select
                value={franchiseId}
                onChange={(e) => setFranchiseId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">All franchises</option>
                {franchises.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {(f as CourseOption & { name?: string }).name || f.id}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block font-medium text-slate-700">Search student</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, code, phone…"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm"
              />
            </div>
          </label>
        </CardContent>
      </Card>

      {!courseId && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Select a course to load students and subjects.
        </div>
      )}

      {courseId && isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading class marks…
        </div>
      )}

      {courseId && error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load marks. Try again.
        </div>
      )}

      {courseId && !isLoading && payload && subjects.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {payload.message ? (
            payload.message
          ) : (
            <>
              No subjects on this course. Add them from{" "}
              <a href="/dashboard/subjects" className="font-semibold underline">
                Course Subjects
              </a>{" "}
              first.
            </>
          )}
        </div>
      )}

      {courseId && !isLoading && payload && subjects.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <span>
              <strong className="text-slate-900">{payload.course.name}</strong>
              {" · "}
              {students.length} student{students.length === 1 ? "" : "s"}
              {" · "}
              {subjects.length} subject{subjects.length === 1 ? "" : "s"}
              {" · "}
              Max {defaultMax}
            </span>
            <span className={dirty ? "text-amber-700" : "text-slate-400"}>
              {dirty ? "Unsaved changes" : `${filledCount} cells filled`}
            </span>
          </div>

          {students.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              No students enrolled in this course
              {franchiseId ? " for the selected franchise" : ""}.
            </div>
          ) : (
            <div className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100">
                  <tr>
                    <th className="sticky left-0 z-20 whitespace-nowrap border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700">
                      #
                    </th>
                    <th className="sticky left-10 z-20 min-w-[180px] border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700">
                      Student
                    </th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">
                      Code
                    </th>
                    {showFranchiseFilter && (
                      <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left font-semibold text-slate-700">
                        Franchise
                      </th>
                    )}
                    {subjects.map((subject) => (
                      <th
                        key={subject}
                        className="min-w-[110px] border-b border-slate-200 px-2 py-2 text-center font-semibold text-slate-700"
                      >
                        <div className="mb-1 line-clamp-2 leading-tight">{subject}</div>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Fill all"
                          title={`Set ${subject} for all students`}
                          className="w-full rounded border border-slate-200 px-1 py-0.5 text-center text-xs font-normal"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              fillColumn(subject, (e.target as HTMLInputElement).value);
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value !== "") fillColumn(subject, e.target.value);
                          }}
                        />
                      </th>
                    ))}
                    <th className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-center font-semibold text-slate-700">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => {
                    let total = 0;
                    let hasAny = false;
                    for (const subject of subjects) {
                      const raw = grid[s.id]?.[subject];
                      if (raw !== undefined && raw !== "" && Number.isFinite(Number(raw))) {
                        total += Number(raw);
                        hasAny = true;
                      }
                    }
                    return (
                      <tr key={s.id} className="odd:bg-white even:bg-slate-50/60 hover:bg-emerald-50/40">
                        <td className="sticky left-0 z-10 border-r border-slate-100 bg-inherit px-3 py-1.5 text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="sticky left-10 z-10 min-w-[180px] border-r border-slate-100 bg-inherit px-3 py-1.5">
                          <div className="font-medium text-slate-900">{s.fullName}</div>
                          <div className="text-xs text-slate-400">{s.phone || s.email}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs text-slate-600">
                          {s.studentCode}
                        </td>
                        {showFranchiseFilter && (
                          <td className="whitespace-nowrap px-3 py-1.5 text-xs text-slate-500">
                            {s.franchiseName || "—"}
                          </td>
                        )}
                        {subjects.map((subject) => (
                          <td key={subject} className="px-1.5 py-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={grid[s.id]?.[subject] ?? ""}
                              onChange={(e) => setMark(s.id, subject, e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-center tabular-nums focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              placeholder="0"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-1.5 text-center font-semibold tabular-nums text-slate-800">
                          {hasAny ? total : "—"}
                        </td>
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
