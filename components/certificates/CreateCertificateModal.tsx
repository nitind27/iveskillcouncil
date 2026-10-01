"use client";

import { useState, useEffect } from "react";
import { GlassModal } from "@/components/common/GlassModal";
import { Loader2, Award, Users, User, Search, CheckSquare, Square } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  studentCode?: string;
  fullName: string;
  email: string;
  courseName: string;
  courseId?: string;
  franchiseName: string;
}

const STUDENT_PAGE_SIZE = 50;

interface Course {
  id: string;
  name: string;
}

interface CreateCertificateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCertificateModal({ open, onClose, onSuccess }: CreateCertificateModalProps) {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const isFranchise = roleId === ROLES.SUB_ADMIN;

  const [mode, setMode] = useState<"single" | "batch">("batch");
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [courseId, setCourseId] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedIds(new Set());
    setSearch("");
    setDebouncedSearch("");
    setPage(1);
    setCourseId("");
    setMode("single");
    fetch(isFranchise ? "/api/students/franchise-courses" : "/api/courses?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        const raw = json?.data ?? json;
        const list = Array.isArray(raw) ? raw : (raw?.items ?? []);
        setCourses(
          list.map((c: { id: string; name: string; courseName?: string }) => ({
            id: c.id,
            name: c.name ?? c.courseName ?? "Course",
          }))
        );
      })
      .catch(() => setCourses([]));
  }, [open, isFranchise]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: String(STUDENT_PAGE_SIZE) });
    if (debouncedSearch) qs.set("search", debouncedSearch);
    fetch(`/api/students?${qs}`, { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const raw = json?.data ?? json;
        const list: Student[] = Array.isArray(raw?.items) ? raw.items : [];
        setStudents((prev) => (page === 1 ? list : [...prev, ...list]));
        setHasMore(page < (raw?.pagination?.totalPages ?? 1));
      })
      .catch(() => {
        if (!cancelled) setStudents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, page, debouncedSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "batch") {
      if (!courseId) {
        await showError("Validation", "Select a course / batch");
        return;
      }
    } else if (!selectedIds.size) {
      await showError("Validation", "Select at least one student");
      return;
    }

    setSubmitting(true);
    try {
      const body = mode === "batch" ? { courseId } : { studentIds: Array.from(selectedIds) };
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        await showError("Error", data.error || "Failed to create certificate request");
        return;
      }

      const payload = data.data ?? data;
      const msg = `Request sent: ${payload.created ?? 0} student(s), ${payload.skipped ?? 0} already requested`;

      await showSuccess("Success", msg);
      onClose();
      onSuccess?.();
    } catch {
      await showError("Error", "Failed to create certificate request");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";
  const labelClass = "block text-sm font-medium text-foreground mb-1";

  const visibleStudents = students;
  const allVisibleSelected = visibleStudents.length > 0 && visibleStudents.every((s) => selectedIds.has(s.id));

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleStudents.forEach((s) => next.delete(s.id));
      else visibleStudents.forEach((s) => next.add(s.id));
      return next;
    });
  };

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title="Request Certificate"
      size="lg"
      closeOnOverlayClick={!submitting}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isFranchise && (
          <div className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Request goes to institute admin. You cannot print certificates — hard copies will be sent by
            the institute after approval.
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("batch")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition",
              mode === "batch"
                ? "border-[#1E4A85] bg-[#1E4A85]/10 text-[#1E4A85]"
                : "border-border hover:bg-muted/50"
            )}
          >
            <Users className="h-4 w-4" />
            Whole batch (course)
          </button>
          <button
            type="button"
            onClick={() => setMode("single")}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition",
              mode === "single"
                ? "border-[#1E4A85] bg-[#1E4A85]/10 text-[#1E4A85]"
                : "border-border hover:bg-muted/50"
            )}
          >
            <User className="h-4 w-4" />
            Select students
          </button>
        </div>

        {mode === "batch" ? (
          <div>
            <label className={labelClass}>Course / Batch *</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className={inputClass}
              required
              disabled={loading}
            >
              <option value="">{loading ? "Loading courses…" : "Select course / batch"}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {courseId && (
              <p className="mt-1 text-xs text-muted-foreground">
                All active / completed students of this batch will be requested (already requested are skipped)
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="text-sm font-medium text-foreground">Students *</label>
              <span className="text-xs font-semibold text-[#1E4A85]">{selectedIds.size} selected</span>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, student ID, email or phone"
                className={cn(inputClass, "pl-8")}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={toggleAllVisible}
                disabled={!visibleStudents.length}
                className="inline-flex items-center gap-1 font-semibold text-[#1E4A85] hover:underline disabled:opacity-40"
              >
                {allVisibleSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                {allVisibleSelected ? "Unselect shown" : `Select shown (${visibleStudents.length})`}
              </button>
              {selectedIds.size > 0 && (
                <button type="button" onClick={() => setSelectedIds(new Set())} className="text-muted-foreground hover:underline">
                  Clear
                </button>
              )}
            </div>
            <div className="mt-1.5 max-h-64 overflow-auto rounded-lg border border-border">
              {loading && visibleStudents.length === 0 ? (
                <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading students…
                </p>
              ) : visibleStudents.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No students found</p>
              ) : (
                visibleStudents.map((s) => {
                  const on = selectedIds.has(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleStudent(s.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 border-b border-border/50 px-3 py-2 text-left last:border-b-0 transition",
                        on ? "bg-[#1E4A85]/[0.07]" : "hover:bg-muted/50"
                      )}
                    >
                      {on ? (
                        <CheckSquare className="h-4 w-4 shrink-0 text-[#1E4A85]" />
                      ) : (
                        <Square className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{s.fullName}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">
                          {[s.studentCode, s.courseName, isFranchise ? null : s.franchiseName].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
              {hasMore && visibleStudents.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-1.5 py-2 text-xs font-semibold text-[#1E4A85] hover:bg-muted/50 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Load more students
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Students who already have a request are skipped automatically.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
            Send Request
          </button>
        </div>
      </form>
    </GlassModal>
  );
}
