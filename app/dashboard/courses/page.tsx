"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Loader2, Trash2 } from "lucide-react";
import { showSuccess, showError, showDeleteConfirm } from "@/lib/toast";
import Breadcrumb from "@/components/common/Breadcrumb";

interface Course {
  id: string;
  name: string;
  baseFee: number;
  durationMonths: number;
  type: string;
  franchiseId: string | null;
}

const COURSE_TYPES = ["SILVER", "GOLD", "DIAMOND"] as const;

export default function SuperAdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "SILVER" as (typeof COURSE_TYPES)[number],
    baseFee: "",
    durationMonths: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/courses", { credentials: "include" });
      const data = await res.json();
      if (data?.data) setCourses(data.data);
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
    if (!form.name.trim() || !form.baseFee || !form.durationMonths) {
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
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          type: form.type,
          baseFee: Number(form.baseFee),
          durationMonths: Number(form.durationMonths),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data?.error || "Failed to create course");
        return;
      }
      showSuccess("Created", "Global course created. Franchises can now assign it.");
      setForm({ name: "", description: "", type: "SILVER", baseFee: "", durationMonths: "" });
      setCreateOpen(false);
      loadData();
    } catch {
      showError("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  const globalCourses = courses.filter((c) => !c.franchiseId);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6">
        <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Manage Courses" }]} />
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Manage Courses</h1>
              <p className="text-muted-foreground mt-1">
                Create global courses. Franchise owners can assign these to their branches.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateOpen(!createOpen)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {createOpen ? "Cancel" : "Create Course"}
            </button>
          </div>

          {createOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-6 rounded-xl border border-input bg-card p-6"
            >
              <h3 className="font-semibold text-foreground mb-4">Create global course</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Course name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Full Stack Development"
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description"
                    rows={2}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm resize-none"
                  />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Type *</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
                      className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                    >
                      {COURSE_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Base fee (₹) *</label>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.baseFee}
                      onChange={(e) => setForm((f) => ({ ...f, baseFee: e.target.value }))}
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
                      value={form.durationMonths}
                      onChange={(e) => setForm((f) => ({ ...f, durationMonths: e.target.value }))}
                      placeholder="6"
                      className="w-full rounded-lg border border-input px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                </button>
              </form>
            </motion.div>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Global courses ({globalCourses.length})</h2>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : globalCourses.length === 0 ? (
              <div className="rounded-xl border border-dashed border-input bg-muted/30 p-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium text-foreground">No global courses yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create courses that franchise owners can assign to their branches.
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {globalCourses.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="rounded-xl border border-input bg-card p-5"
                  >
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      ₹{c.baseFee?.toLocaleString?.("en-IN") ?? c.baseFee} • {c.durationMonths} months • {c.type}
                    </p>
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
