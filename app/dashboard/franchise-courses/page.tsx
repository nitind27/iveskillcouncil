"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  IndianRupee,
  Calendar,
} from "lucide-react";
import { showSuccess, showError, showDeleteConfirm } from "@/lib/toast";
import Breadcrumb from "@/components/common/Breadcrumb";

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

const COURSE_TYPES = ["SILVER", "GOLD", "DIAMOND"] as const;

export default function FranchiseCoursesPage() {
  const [assigned, setAssigned] = useState<AssignedCourse[]>([]);
  const [available, setAvailable] = useState<AvailableCourse[]>([]);
  const [franchiseName, setFranchiseName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedToAssign, setSelectedToAssign] = useState<Set<string>>(new Set());
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    type: "SILVER" as (typeof COURSE_TYPES)[number],
    baseFee: "",
    durationMonths: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesRes, assignableRes] = await Promise.all([
        fetch("/api/franchise/courses", { credentials: "include" }),
        fetch("/api/courses?assignable=1", { credentials: "include" }),
      ]);
      const coursesData = await coursesRes.json();
      const assignableData = await assignableRes.json();

      if (coursesData?.data) {
        setAssigned(coursesData.data.courses ?? []);
        setFranchiseName(coursesData.data.franchise?.name ?? "");
      }
      if (assignableData?.data) {
        setAvailable(assignableData.data);
      }
    } catch {
      showError("Error", "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.baseFee || !createForm.durationMonths) {
      showError("Validation", "Name, Fee and Duration are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: createForm.name.trim(),
          description: createForm.description.trim() || undefined,
          type: createForm.type,
          baseFee: Number(createForm.baseFee),
          durationMonths: Number(createForm.durationMonths),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data?.error || "Failed to create course");
        return;
      }
      showSuccess("Created", "Course added to your franchise");
      setCreateForm({ name: "", description: "", type: "SILVER", baseFee: "", durationMonths: "" });
      setCreateOpen(false);
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
    if (!ok || !ok.isConfirmed) return;
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
              <p className="text-muted-foreground mt-1">
                Manage courses for your franchise. These will appear on the user panel for your branch.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {createOpen ? "Cancel" : "Create Course"}
              </button>
              <button
                type="button"
                onClick={() => setAssignOpen(!assignOpen)}
                disabled={available.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-input bg-background font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                <BookOpen className="w-4 h-4" />
                Assign from Global
                {available.length > 0 && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{available.length}</span>
                )}
              </button>
            </div>
          </div>

          {/* Create form */}
          <AnimatePresence>
            {createOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 rounded-xl border border-input bg-card p-6"
              >
                <h3 className="font-semibold text-foreground mb-4">Create new course</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Course name *</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Full Stack Development"
                      className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Brief description"
                      rows={2}
                      className="w-full rounded-lg border border-input px-3 py-2 text-sm resize-none"
                    />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Type *</label>
                      <select
                        value={createForm.type}
                        onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as typeof createForm.type }))}
                        className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                      >
                        {COURSE_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Fee (₹) *</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={createForm.baseFee}
                        onChange={(e) => setCreateForm((f) => ({ ...f, baseFee: e.target.value }))}
                        placeholder="0"
                        className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Duration (months) *</label>
                      <input
                        type="number"
                        min={1}
                        value={createForm.durationMonths}
                        onChange={(e) => setCreateForm((f) => ({ ...f, durationMonths: e.target.value }))}
                        placeholder="6"
                        className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Add"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateOpen(false)}
                      className="px-4 py-2 rounded-lg border border-input bg-background hover:bg-muted"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Assign from global */}
          <AnimatePresence>
            {assignOpen && available.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 rounded-xl border border-input bg-card p-6"
              >
                <h3 className="font-semibold text-foreground mb-4">Assign global courses</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select courses created by super admin to add to your franchise.
                </p>
                <ul className="space-y-2 max-h-48 overflow-y-auto mb-4">
                  {available.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleAssign(c.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedToAssign.has(c.id)}
                        onChange={() => toggleAssign(c.id)}
                        className="rounded"
                      />
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground text-sm">
                        ₹{c.baseFee?.toLocaleString?.("en-IN") ?? c.baseFee} • {c.durationMonths} months
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={saving || selectedToAssign.size === 0}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : `Add ${selectedToAssign.size} selected`}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAssignOpen(false); setSelectedToAssign(new Set()); }}
                    className="px-4 py-2 rounded-lg border border-input bg-background hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Assigned courses list */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Your franchise courses ({assigned.length})
            </h2>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : assigned.length === 0 ? (
              <div className="rounded-xl border border-dashed border-input bg-muted/30 p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium text-foreground">No courses yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a new course or assign from global courses to add to your franchise.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assigned.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-xl border border-input bg-card p-5 flex flex-col"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-foreground">{c.courseName}</h3>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            ₹{c.customFee.toLocaleString("en-IN")}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {c.durationMonths} months
                          </span>
                        </div>
                        {c.isOwn && (
                          <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            Own
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(c.courseId, c.courseName)}
                        disabled={saving}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
