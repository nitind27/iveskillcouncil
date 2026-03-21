"use client";

import React, { useState, useEffect } from "react";
import { Modal, ModalBody, ModalFooter } from "@/components/common/Modal";
import { Loader2, BookOpen, Plus, Trash2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";

interface AssignedCourse {
  id: string;
  courseId: string;
  courseName: string;
  customFee: number;
  type: string;
}

interface AvailableCourse {
  id: string;
  name: string;
  baseFee: number;
  durationMonths: number;
}

interface FranchiseCourseManagerProps {
  open: boolean;
  onClose: () => void;
  franchiseId: string;
  franchiseName: string;
  onUpdated?: () => void;
}

export default function FranchiseCourseManager({
  open,
  onClose,
  franchiseId,
  franchiseName,
  onUpdated,
}: FranchiseCourseManagerProps) {
  const [assigned, setAssigned] = useState<AssignedCourse[]>([]);
  const [available, setAvailable] = useState<AvailableCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());

  const loadData = async () => {
    if (!open || !franchiseId) return;
    setLoading(true);
    try {
      const [assignedRes, coursesRes] = await Promise.all([
        fetch(`/api/admin/franchise/${franchiseId}/courses`, { credentials: "include" }),
        fetch(`/api/courses?assignable=1&franchiseId=${franchiseId}`, { credentials: "include" }),
      ]);
      const assignedData = await assignedRes.json();
      const coursesData = await coursesRes.json();

      const assignedList = assignedData?.data?.courses ?? [];
      const allCourses = coursesData?.data ?? [];
      const assignedIds = new Set(assignedList.map((c: AssignedCourse) => c.courseId));
      const availableList = allCourses.filter((c: AvailableCourse) => !assignedIds.has(c.id.toString()));

      setAssigned(assignedList);
      setAvailable(availableList);
    } catch {
      showError("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [open, franchiseId]);

  const handleAdd = async () => {
    if (selectedToAdd.size === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/franchise/${franchiseId}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ courseIds: Array.from(selectedToAdd) }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data?.error || "Failed to add courses");
        return;
      }
      await showSuccess("Done", "Courses assigned successfully");
      setSelectedToAdd(new Set());
      loadData();
      onUpdated?.();
    } catch {
      showError("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (courseId: string) => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/franchise/${franchiseId}/courses?courseId=${courseId}`,
        { method: "DELETE", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data?.error || "Failed to remove course");
        return;
      }
      await showSuccess("Done", "Course removed from franchise");
      loadData();
      onUpdated?.();
    } catch {
      showError("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title={`Manage Courses - ${franchiseName}`}>
      <ModalBody>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Assigned courses */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Assigned courses ({assigned.length})</h3>
              {assigned.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 rounded-lg bg-muted/50 border border-dashed">
                  No courses assigned. Add from the list below.
                </p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {assigned.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-muted/50 border"
                    >
                      <div>
                        <span className="font-medium">{c.courseName}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          ₹{c.customFee.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(c.courseId)}
                        disabled={saving}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Add courses */}
            {available.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Add courses</h3>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {available.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-lg border hover:bg-muted/30 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedToAdd.has(c.id.toString())}
                        onChange={() => toggleSelect(c.id.toString())}
                        className="rounded border-input"
                      />
                      <div className="flex-1">
                        <span className="font-medium">{c.name}</span>
                        <span className="text-muted-foreground text-sm ml-2">
                          ₹{c.baseFee?.toLocaleString?.("en-IN") ?? c.baseFee} • {c.durationMonths} months
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={saving || selectedToAdd.size === 0}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add {selectedToAdd.size > 0 ? `(${selectedToAdd.size})` : ""} selected
                </button>
              </div>
            )}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-input bg-background hover:bg-muted transition-colors"
        >
          Close
        </button>
      </ModalFooter>
    </Modal>
  );
}
