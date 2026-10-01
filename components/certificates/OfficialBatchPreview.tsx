"use client";

import { useEffect, useState } from "react";
import { Award, FileText, Files, Loader2, Printer, X } from "lucide-react";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { CertificateDemoData } from "@/components/certificates/demo/types";
import {
  OFFICIAL_DOC_LABEL,
  OfficialDocumentSheet,
  useOfficialBatchPrint,
  type OfficialDocKind,
  type OfficialPrintPage,
} from "@/components/certificates/OfficialDocumentPrint";

export type DocChoice = "both" | OfficialDocKind;

type OfficialDocs = {
  studentId: string;
  studentName: string;
  studentCode: string;
  franchiseName: string;
  courseName: string | null;
  vocational: CertificateDemoData;
  marksheet: CertificateDemoData;
};

export const DOC_CHOICES: { id: DocChoice; label: string; hint: string; icon: typeof Award }[] = [
  { id: "both", label: "Both", hint: "Certificate + Marksheet", icon: Files },
  { id: "vocational", label: "Certificate", hint: "Certificate of Completion", icon: Award },
  { id: "marksheet", label: "Marksheet", hint: "Statement of Marks (Result) - 3", icon: FileText },
];

function pagesFor(docs: OfficialDocs[], choice: DocChoice): OfficialPrintPage[] {
  const out: OfficialPrintPage[] = [];
  for (const d of docs) {
    if (choice !== "marksheet") out.push({ key: `${d.studentId}-vocational`, kind: "vocational", data: d.vocational });
    if (choice !== "vocational") out.push({ key: `${d.studentId}-marksheet`, kind: "marksheet", data: d.marksheet });
  }
  return out;
}

function SheetThumb({ kind, data, scale, id }: { kind: OfficialDocKind; data: CertificateDemoData; scale: number; id: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="overflow-hidden rounded-md bg-white shadow-xl ring-1 ring-black/10"
        style={{ width: 1054 * scale, height: 1492 * scale }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 1054 }}>
          <OfficialDocumentSheet kind={kind} data={data} printId={id} />
        </div>
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">{OFFICIAL_DOC_LABEL[kind]}</p>
    </div>
  );
}

interface Props {
  /** Students to load; `null` keeps the preview closed. */
  studentIds: string[] | null;
  onClose: () => void;
  choice?: DocChoice;
  onChoiceChange?: (choice: DocChoice) => void;
  /** Extra action shown in the toolbar after documents load (e.g. "Mark as issued"). */
  extraAction?: React.ReactNode;
}

/** Full-screen preview of Certificate of Completion + Result 3 for one or many students, with A4 batch print. */
export function OfficialBatchPreview({ studentIds, onClose, choice: choiceProp, onChoiceChange, extraAction }: Props) {
  const [innerChoice, setInnerChoice] = useState<DocChoice>("both");
  const choice = choiceProp ?? innerChoice;
  const setChoice = (c: DocChoice) => {
    setInnerChoice(c);
    onChoiceChange?.(c);
  };
  const [docs, setDocs] = useState<OfficialDocs[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const batch = useOfficialBatchPrint();
  const idsKey = studentIds ? studentIds.join(",") : "";

  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    setLoading(true);
    setDocs([]);
    (async () => {
      try {
        const res = await fetch("/api/students/certificates/bulk", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentIds: idsKey.split(",") }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load documents");
        const items = (json.data?.items ?? []) as OfficialDocs[];
        if (cancelled) return;
        setDocs(items);
        setActiveId(items[0]?.studentId ?? null);
      } catch (e) {
        if (cancelled) return;
        onClose();
        await showError("Error", e instanceof Error ? e.message : "Failed to load documents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  if (!studentIds) return <>{batch.node}</>;

  const active = docs.find((d) => d.studentId === activeId) ?? docs[0];
  const totalPages = pagesFor(docs, choice).length;

  return (
    <>
      <div className="fixed inset-0 z-[10200] flex flex-col bg-slate-950/90 backdrop-blur-md">
        <div className="no-print flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0B1F3A] px-4 py-3 text-white">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C4A35A]">Print preview</p>
            <h2 className="truncate text-base font-bold">
              {loading ? "Loading documents…" : `${docs.length} student(s) · ${totalPages} A4 page(s)`}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-white/15 bg-white/5 p-0.5">
              {DOC_CHOICES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChoice(c.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-bold transition",
                    choice === c.id ? "bg-white text-[#0B1F3A]" : "text-white/70 hover:text-white"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {active && docs.length > 1 && (
              <button
                type="button"
                onClick={() => batch.print(pagesFor([active], choice))}
                disabled={batch.preparing}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#C4A35A]/50 bg-white/5 px-3 py-2 text-xs font-bold text-[#F5E6C8] hover:bg-white/10 disabled:opacity-50"
              >
                <Printer className="h-3.5 w-3.5" />
                This student
              </button>
            )}
            <button
              type="button"
              onClick={() => batch.print(pagesFor(docs, choice))}
              disabled={!docs.length || loading || batch.preparing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 py-2 text-xs font-bold text-[#0B1F3A] hover:bg-[#d4b56c] disabled:opacity-50"
            >
              {batch.preparing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
              {batch.preparing ? "Preparing…" : `Print all / PDF (${totalPages})`}
            </button>
            {!loading && docs.length > 0 && extraAction}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-9 w-9 animate-spin text-[#C4A35A]" />
          </div>
        ) : (
          <div className="no-print flex min-h-0 flex-1">
            {docs.length > 1 && (
              <ul className="w-64 shrink-0 overflow-auto border-r border-white/10 bg-[#0B1F3A]/60 p-2">
                {docs.map((d, i) => (
                  <li key={d.studentId}>
                    <button
                      type="button"
                      onClick={() => setActiveId(d.studentId)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left transition",
                        active?.studentId === d.studentId ? "bg-white text-[#0B1F3A]" : "text-white/80 hover:bg-white/10"
                      )}
                    >
                      <span className="block truncate text-xs font-bold">
                        {i + 1}. {d.studentName}
                      </span>
                      <span className="block truncate text-[10px] opacity-70">
                        {d.studentCode} · {d.courseName || "—"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="min-w-0 flex-1 overflow-auto p-6">
              {active ? (
                <div className="flex flex-wrap items-start justify-center gap-6">
                  {choice !== "marksheet" && (
                    <SheetThumb kind="vocational" data={active.vocational} scale={0.42} id="opreview-vocational" />
                  )}
                  {choice !== "vocational" && (
                    <SheetThumb kind="marksheet" data={active.marksheet} scale={0.42} id="opreview-marksheet3" />
                  )}
                </div>
              ) : (
                <p className="text-center text-sm text-white/70">No documents.</p>
              )}
            </div>
          </div>
        )}
      </div>
      {batch.node}
    </>
  );
}
