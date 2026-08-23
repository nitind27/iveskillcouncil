"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X,
  Loader2,
  Printer,
  Download,
  ZoomIn,
  ZoomOut,
  Award,
  FileWarning,
  Pencil,
  Save,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CertificateDisplayData } from "@/lib/certificate-display";
import { gradeFromPercent } from "@/lib/certificate-display";
import type { CertificateFieldKey } from "./IvesdcCertificateTemplate";
import IvesdcCertificateTemplate from "./IvesdcCertificateTemplate";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/toast";

interface Props {
  certificateId: string;
  open: boolean;
  onClose: () => void;
  studentName?: string;
  editable?: boolean;
}

const EDIT_FIELDS: { key: CertificateFieldKey; label: string }[] = [
  { key: "serialNumber", label: "Sr. No." },
  { key: "certificateNumber", label: "Certificate No." },
  { key: "atcCode", label: "ATC Code" },
  { key: "atcName", label: "ATC Name" },
  { key: "studentName", label: "Student Name" },
  { key: "parentName", label: "D/S/O" },
  { key: "registrationNumber", label: "Registration No." },
  { key: "courseName", label: "Course Name" },
  { key: "grade", label: "Grade" },
  { key: "trainingStart", label: "Training Start" },
  { key: "trainingEnd", label: "Training End" },
  { key: "issueDate", label: "Date of Issue" },
  { key: "trainingCentre", label: "Training Centre" },
  { key: "trainingCentreName", label: "Training Centre Name" },
];

export function CertificatePreviewModal({
  certificateId,
  open,
  onClose,
  studentName,
  editable = true,
}: Props) {
  const [data, setData] = useState<CertificateDisplayData | null>(null);
  const [original, setOriginal] = useState<CertificateDisplayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(85);
  const [editMode, setEditMode] = useState(false);

  const handleClose = useCallback(() => {
    setEditMode(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, handleClose]);

  useEffect(() => {
    if (!open || !certificateId) {
      setData(null);
      setOriginal(null);
      setError(null);
      setZoom(85);
      setEditMode(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/certificates/${certificateId}/document`, { credentials: "include" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load certificate");
        const loaded = json.data as CertificateDisplayData;
        setData(loaded);
        setOriginal(loaded);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [open, certificateId]);

  const handleFieldChange = (field: CertificateFieldKey, value: string | number | null) => {
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value };
      if (field === "marksPercent" && typeof value === "number") {
        const g = gradeFromPercent(value);
        next.grade = g.grade;
        next.gradeLabel = g.label;
      }
      return next;
    });
  };

  const handleReset = () => {
    if (original) setData({ ...original });
  };

  const handleSave = async () => {
    if (!data || !certificateId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/certificates/${certificateId}/document`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ overrides: data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Save failed");
      const saved = json.data as CertificateDisplayData;
      setData(saved);
      setOriginal(saved);
      showSuccess("Saved", "Certificate details updated.");
    } catch (e) {
      showError("Error", e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex flex-col bg-black/80"
        onClick={handleClose}
      >
        {/* Prominent close button — always on top */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          aria-label="Close preview"
          className="no-print fixed right-4 top-4 z-[220] flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/30 bg-white text-[#1E4A85] shadow-2xl transition hover:scale-105 hover:bg-red-50 hover:text-red-600 sm:right-6 sm:top-6 sm:h-14 sm:w-14"
        >
          <X className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={2.5} />
        </button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="flex h-full flex-col pt-16 sm:pt-20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Toolbar */}
          <div className="no-print mx-4 mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#1E4A85] px-4 py-2.5 sm:mx-6">
            <div className="min-w-0 pr-12">
              <p className="truncate text-sm font-bold text-white">
                {data?.studentName || studentName || "Certificate Preview"}
              </p>
              <p className="truncate text-xs text-white/60">
                {data?.certificateNumber || "IVESDC Official Certificate"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {data?.isDraft && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                  <FileWarning className="h-3 w-3" />
                  Draft
                </span>
              )}
              {editable && data && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditMode((v) => !v)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                      editMode
                        ? "bg-[#C4A35A] text-[#0B132B]"
                        : "border border-white/20 text-white hover:bg-white/10"
                    )}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {editMode ? "Editing" : "Edit"}
                  </button>
                  {editMode && (
                    <>
                      <button
                        type="button"
                        onClick={handleReset}
                        className="rounded-lg border border-white/20 p-1.5 text-white hover:bg-white/10"
                        title="Reset changes"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save
                      </button>
                    </>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(50, z - 8))}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="min-w-[2.5rem] text-center text-xs font-semibold text-white/80">{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(120, z + 8))}
                className="rounded-lg p-1.5 text-white/80 hover:bg-white/10"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={!data}
                className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={!data}
                className="inline-flex items-center gap-1 rounded-lg bg-[#C4A35A] px-2.5 py-1.5 text-xs font-bold text-[#0B132B] disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 gap-0 overflow-hidden px-4 pb-4 sm:px-6">
            {/* Edit sidebar */}
            {editMode && data && (
              <aside className="no-print mr-3 hidden w-64 shrink-0 overflow-y-auto rounded-xl border border-white/10 bg-white/95 p-3 shadow-xl lg:block">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                  Edit certificate fields
                </p>
                <div className="space-y-2.5">
                  {EDIT_FIELDS.map(({ key, label }) => (
                    <label key={key} className="block">
                      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
                      <input
                        type="text"
                        value={String(data[key] ?? "")}
                        onChange={(e) => handleFieldChange(key, e.target.value)}
                        className="mt-0.5 w-full rounded-lg border border-border/70 px-2 py-1.5 text-xs outline-none focus:border-[#1E4A85] focus:ring-1 focus:ring-[#1E4A85]/20"
                      />
                    </label>
                  ))}
                  <label className="block">
                    <span className="text-[10px] font-semibold text-muted-foreground">Marks %</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={data.marksPercent ?? ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "marksPercent",
                          e.target.value === "" ? null : Number(e.target.value)
                        )
                      }
                      className="mt-0.5 w-full rounded-lg border border-border/70 px-2 py-1.5 text-xs outline-none focus:border-[#1E4A85]"
                    />
                  </label>
                </div>
              </aside>
            )}

            {/* Certificate canvas */}
            <div className="flex flex-1 items-start justify-center overflow-auto rounded-xl bg-slate-300/40 p-4 dark:bg-slate-950/60">
              {loading ? (
                <div className="flex flex-col items-center gap-3 py-24 text-white/80">
                  <Loader2 className="h-10 w-10 animate-spin text-[#C4A35A]" />
                  <p className="text-sm">Loading certificate…</p>
                </div>
              ) : error ? (
                <div className="max-w-md rounded-2xl bg-white p-8 text-center">
                  <Award className="mx-auto mb-3 h-10 w-10 text-red-400" />
                  <p className="font-semibold text-red-600">{error}</p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-4 rounded-lg bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Close
                  </button>
                </div>
              ) : data ? (
                <div
                  className="origin-top transition-transform duration-200"
                  style={{ transform: `scale(${zoom / 100})` }}
                >
                  <IvesdcCertificateTemplate
                    data={data}
                    editable={editMode}
                    onFieldChange={handleFieldChange}
                    className="shadow-2xl"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Inline preview panel for split-view on issued page */
export function CertificatePreviewPanel({
  certificateId,
  studentName,
  className,
  onOpenFullscreen,
}: {
  certificateId: string | null;
  studentName?: string;
  className?: string;
  onOpenFullscreen?: () => void;
}) {
  const [data, setData] = useState<CertificateDisplayData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!certificateId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/certificates/${certificateId}/document`, { credentials: "include" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load");
        setData(json.data as CertificateDisplayData);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [certificateId]);

  if (!certificateId) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#1E4A85]/25 bg-[#1E4A85]/[0.03] p-8 text-center",
          className
        )}
      >
        <Award className="mb-3 h-12 w-12 text-[#1E4A85]/30" />
        <p className="font-medium text-muted-foreground">Select a certificate to preview</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center rounded-2xl bg-muted/30 py-24", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600", className)}>
        {error}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="no-print flex items-center justify-between gap-2 rounded-xl border border-[#1E4A85]/10 bg-[#1E4A85]/5 px-4 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#1E4A85]">
            {data?.studentName || studentName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{data?.certificateNumber}</p>
        </div>
        <div className="flex gap-1.5">
          {onOpenFullscreen && (
            <button
              type="button"
              onClick={onOpenFullscreen}
              className="rounded-lg border border-[#1E4A85]/20 px-2.5 py-1.5 text-xs font-semibold text-[#1E4A85]"
            >
              Expand
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#1E4A85] px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
        </div>
      </div>
      <div className="overflow-auto rounded-2xl border border-[#1E4A85]/12 bg-slate-200 p-2 dark:bg-slate-900/40">
        {data && (
          <div className="mx-auto origin-top scale-[0.42] sm:scale-[0.48] xl:scale-[0.52]">
            <IvesdcCertificateTemplate data={data} />
          </div>
        )}
      </div>
    </div>
  );
}
