"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Award, Files, FileText, Loader2, Printer, X, ZoomIn, ZoomOut } from "lucide-react";
import type { CertificateDemoData } from "@/components/certificates/demo/types";
import {
  OfficialDocumentSheet,
  useOfficialBatchPrint,
  type OfficialDocKind,
} from "@/components/certificates/OfficialDocumentPrint";
import { cn } from "@/lib/utils";

type CertTab = OfficialDocKind;

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
  const [studentCode, setStudentCode] = useState("");
  const batch = useOfficialBatchPrint();

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
        setStudentCode(json.data.studentCode || "");
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
  const keyBase = studentId || "student";

  const printCurrent = () => {
    if (!active) return;
    batch.print([{ key: `${keyBase}-${tab}`, kind: tab, data: active }]);
  };

  const printBoth = () => {
    if (!vocational || !marksheet) return;
    batch.print([
      { key: `${keyBase}-vocational`, kind: "vocational", data: vocational },
      { key: `${keyBase}-marksheet`, kind: "marksheet", data: marksheet },
    ]);
  };

  const busy = loading || batch.preparing;

  const modal = (
    <div className="fixed inset-0 z-[10200] flex flex-col bg-slate-950/90 backdrop-blur-md">
      <div className="no-print flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0B1F3A] px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#C4A35A]">Official documents</p>
          <h2 className="truncate text-base font-bold">
            {studentName || "Student certificates"}
            {studentCode ? <span className="ml-2 text-xs font-semibold text-white/55">{studentCode}</span> : null}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            onClick={printCurrent}
            disabled={!active || busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C4A35A]/50 bg-white/5 px-3 py-2 text-xs font-bold text-[#F5E6C8] hover:bg-white/10 disabled:opacity-50"
            title="Print this page on A4 — choose Save as PDF in the dialog for a PDF"
          >
            <Printer className="h-3.5 w-3.5" />
            Print {tab === "vocational" ? "Certificate" : "Marksheet"}
          </button>
          <button
            type="button"
            onClick={printBoth}
            disabled={!vocational || !marksheet || busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 py-2 text-xs font-bold text-[#0B1F3A] hover:bg-[#d4b56c] disabled:opacity-50"
            title="Certificate + Marksheet as 2 A4 pages"
          >
            {batch.preparing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Files className="h-3.5 w-3.5" />}
            Print both (PDF)
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
          Certificate of Completion
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
          Statement of Marks (Result 3)
        </button>
      </div>

      <div className="no-print min-h-0 flex-1 overflow-auto bg-slate-800/80 p-4">
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
            <div style={{ width: 1054 * (zoom / 100), height: 1492 * (zoom / 100) }}>
              <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left", width: 1054 }}>
                <OfficialDocumentSheet
                  kind={tab}
                  data={active}
                  printId={tab === "vocational" ? "student-cert-vocational" : "student-cert-marksheet3"}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (typeof document === "undefined") return modal;
  return (
    <>
      {createPortal(modal, document.body)}
      {batch.node}
    </>
  );
}
