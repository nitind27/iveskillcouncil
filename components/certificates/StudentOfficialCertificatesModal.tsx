"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Award, FileText, Loader2, Printer, X, ZoomIn, ZoomOut } from "lucide-react";
import { VocationalCertTemplate, MarksheetTemplateV2 } from "@/components/certificates/demo/CertificateTemplates";
import type { CertificateDemoData } from "@/components/certificates/demo/types";
import { cn } from "@/lib/utils";

type CertTab = "vocational" | "marksheet";

interface Props {
  studentId: string | null;
  open: boolean;
  initialTab?: CertTab;
  onClose: () => void;
}

export function StudentOfficialCertificatesModal({
  studentId,
  open,
  initialTab = "vocational",
  onClose,
}: Props) {
  const [tab, setTab] = useState<CertTab>(initialTab);
  const [zoom, setZoom] = useState(52);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vocational, setVocational] = useState<CertificateDemoData | null>(null);
  const [marksheet, setMarksheet] = useState<CertificateDemoData | null>(null);
  const [studentName, setStudentName] = useState("");

  const load = useCallback(() => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/students/${studentId}/certificates`, { credentials: "include" })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Failed to load certificates");
        setVocational(json.data.vocational);
        setMarksheet(json.data.marksheet);
        setStudentName(json.data.studentName || "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    load();
  }, [open, initialTab, load]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const active = tab === "vocational" ? vocational : marksheet;

  /** Reset screen zoom so print CSS can fit sheet to A4 (1 page, full bleed). */
  const handlePrint = () => {
    const prevZoom = zoom;
    setZoom(100);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    const run = () => {
      window.print();
      setZoom(prevZoom);
    };
    // Allow React to paint unscaled sheet before print dialog
    requestAnimationFrame(() => {
      setTimeout(run, 120);
    });
  };

  const modal = (
    <div className="fixed inset-0 z-[10200] flex flex-col bg-slate-950/90 backdrop-blur-md">
      <div className="no-print flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0B1F3A] px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#C4A35A]">Official documents</p>
          <h2 className="truncate text-base font-bold">{studentName || "Student certificates"}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-lg border border-white/15 bg-white/5 sm:flex">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(28, z - 6))}
              className="p-2 hover:bg-white/10"
              aria-label="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-xs tabular-nums text-white/70">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(90, z + 6))}
              className="p-2 hover:bg-white/10"
              aria-label="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!active || loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 py-2 text-xs font-bold text-[#0B1F3A] hover:bg-[#d4b56c] disabled:opacity-50"
            title="Print fit to A4 (one page, no margins)"
          >
            <Printer className="h-3.5 w-3.5" />
            Print A4
          </button>
          <button type="button" onClick={onClose} className="rounded-lg bg-white/10 p-2 hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="no-print flex shrink-0 gap-2 border-b border-white/10 bg-[#122B4D] px-4 py-2">
        <button
          type="button"
          onClick={() => setTab("vocational")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
            tab === "vocational" ? "bg-white text-[#1E4A85]" : "text-white/70 hover:bg-white/10 hover:text-white"
          )}
        >
          <Award className="h-3.5 w-3.5" />
          Certificate
        </button>
        <button
          type="button"
          onClick={() => setTab("marksheet")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
            tab === "marksheet" ? "bg-white text-[#1E4A85]" : "text-white/70 hover:bg-white/10 hover:text-white"
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          Marksheet
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-slate-800/80 p-4">
        {loading && (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-[#C4A35A]" />
          </div>
        )}
        {error && (
          <p className="mx-auto max-w-md rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
        {!loading && !error && active && (
          <div className="flex justify-center">
            {/* Screen zoom only — print CSS forces scale(0.752) to fill A4 */}
            <div
              className="student-cert-print-root studio-zoom-container cert-print-stage origin-top"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              {tab === "vocational" && vocational ? (
                <VocationalCertTemplate data={vocational} />
              ) : marksheet ? (
                <MarksheetTemplateV2 data={marksheet} />
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
