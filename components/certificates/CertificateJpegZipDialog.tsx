"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toJpeg } from "html-to-image";
import JSZip from "jszip";
import { Award, FileText, X } from "lucide-react";
import type { CertificateDemoData } from "@/components/certificates/demo/types";
import { OfficialDocumentSheet, type OfficialDocKind } from "@/components/certificates/OfficialDocumentPrint";
import { showError, showSuccess } from "@/lib/toast";

type OfficialDocs = {
  studentId: string;
  studentName: string;
  studentCode: string;
  courseName: string | null;
  vocational: CertificateDemoData;
  marksheet: CertificateDemoData;
};

const SHEET_W = 1054;
const SHEET_H = 1492;
const MAX_STUDENTS = 100;
const FETCH_CHUNK = 20;

function safePart(value: string) {
  return value.replace(/[^\w.-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
}

function fileBase(doc: OfficialDocs, index: number) {
  const code = safePart(doc.studentCode || `student-${index + 1}`) || `student-${index + 1}`;
  const name = safePart(doc.studentName || "student");
  const course = safePart(doc.courseName || "");
  return [code, name, course].filter(Boolean).join("_");
}

async function waitUntilReady(node: HTMLElement) {
  if (document.fonts?.ready) await document.fonts.ready;
  const started = Date.now();
  while (Date.now() - started < 8000) {
    const imgs = Array.from(node.querySelectorAll("img"));
    const imagesReady = imgs.every((img) => img.complete);
    const qrPending = node.querySelector(".border-dashed");
    if (imagesReady && !qrPending) return;
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
}

async function captureJpeg(node: HTMLElement) {
  await waitUntilReady(node);
  const base = {
    quality: 0.95,
    cacheBust: true,
    backgroundColor: "#ffffff",
    width: SHEET_W,
    height: SHEET_H,
    canvasWidth: SHEET_W * 2,
    canvasHeight: SHEET_H * 2,
    pixelRatio: 2,
  };
  try {
    return await toJpeg(node, base);
  } catch {
    return await toJpeg(node, { ...base, pixelRatio: 1.5, canvasWidth: Math.round(SHEET_W * 1.5), canvasHeight: Math.round(SHEET_H * 1.5), skipFonts: true });
  }
}

async function loadDocs(ids: string[], courseId?: string | null): Promise<OfficialDocs[]> {
  const out: OfficialDocs[] = [];
  for (let i = 0; i < ids.length; i += FETCH_CHUNK) {
    const chunk = ids.slice(i, i + FETCH_CHUNK);
    const res = await fetch("/api/students/certificates/bulk", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentIds: chunk, ...(courseId ? { courseId } : {}) }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Failed to load certificates");
    out.push(...((json.data?.items ?? []) as OfficialDocs[]));
  }
  return out;
}

export async function collectCertificateStudentIds(filters: {
  status?: string;
  franchiseId?: string;
  courseId?: string;
  search?: string;
}): Promise<{ ids: string[]; total: number }> {
  if (filters.status === "REJECTED") return { ids: [], total: 0 };
  const ids: string[] = [];
  const seen = new Set<string>();
  let page = 1;
  let total = 0;
  let totalPages = 1;
  while (page <= totalPages && page <= 10) {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "100");
    params.set("status", filters.status && filters.status !== "REJECTED" ? filters.status : "APPROVED,ISSUED");
    if (filters.franchiseId) params.set("franchiseId", filters.franchiseId);
    if (filters.courseId) params.set("courseId", filters.courseId);
    if (filters.search) params.set("search", filters.search);
    const res = await fetch(`/api/certificates?${params}`, { credentials: "include" });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Failed to load students");
    const items = (json.data?.items ?? []) as { studentId?: string }[];
    total = Number(json.data?.pagination?.total ?? items.length);
    totalPages = Number(json.data?.pagination?.totalPages ?? 1);
    for (const row of items) {
      if (row.studentId && !seen.has(row.studentId)) {
        seen.add(row.studentId);
        ids.push(row.studentId);
      }
    }
    page += 1;
  }
  return { ids, total: Math.max(total, ids.length) };
}

export function CertificateJpegZipDialog({
  studentIds,
  courseId,
  onClose,
}: {
  studentIds: string[] | null;
  courseId?: string | null;
  onClose: () => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const cancelRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [mounted, setMounted] = useState(false);
  const [label, setLabel] = useState("Preparing certificates…");
  const [progress, setProgress] = useState({
    phase: "load" as "load" | "capture" | "pack",
    index: 0,
    total: 0,
    name: "",
    part: "" as "" | "certificate" | "result",
    done: 0,
    pages: 0,
  });
  const [sheet, setSheet] = useState<{ kind: OfficialDocKind; data: CertificateDemoData; key: string } | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!studentIds?.length) return;
    cancelRef.current = false;
    const ids = studentIds.slice(0, MAX_STUDENTS);
    let cancelled = false;

    const run = async () => {
      try {
        setLabel(`Loading ${ids.length} student${ids.length === 1 ? "" : "s"}…`);
        setProgress({ phase: "load", index: 0, total: ids.length, name: "", part: "", done: 0, pages: ids.length * 2 });
        const docs = await loadDocs(ids, courseId);
        if (cancelled || cancelRef.current) return;
        if (!docs.length) {
          await showError("Nothing to download", "No certificate data found for these students.");
          onCloseRef.current();
          return;
        }

        const zip = new JSZip();
        const folder = zip.folder("certificates") ?? zip;
        const used = new Set<string>();
        let failed = 0;
        let step = 0;
        const pages = docs.length * 2;

        for (let i = 0; i < docs.length; i += 1) {
          if (cancelled || cancelRef.current) return;
          const doc = docs[i];
          const base = fileBase(doc, i);
          const unique = used.has(base) ? `${base}_${i + 1}` : base;
          used.add(unique);

          for (const part of [
            { kind: "vocational" as const, data: doc.vocational, suffix: "certificate" as const },
            { kind: "marksheet" as const, data: doc.marksheet, suffix: "result" as const },
          ]) {
            if (cancelled || cancelRef.current) return;
            const partLabel = part.suffix === "certificate" ? "Certificate" : "Result";
            setLabel(`${i + 1} of ${docs.length} · ${doc.studentName || doc.studentCode} · ${partLabel}`);
            setProgress({
              phase: "capture",
              index: i + 1,
              total: docs.length,
              name: doc.studentName || doc.studentCode,
              part: part.suffix,
              done: step,
              pages,
            });
            setSheet({ kind: part.kind, data: part.data, key: `${doc.studentId}-${part.suffix}` });
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const node = hostRef.current?.querySelector(".certificate-sheet") as HTMLElement | null;
            if (!node) {
              failed += 1;
              step += 1;
              continue;
            }
            try {
              const dataUrl = await captureJpeg(node);
              const base64 = dataUrl.split(",")[1];
              if (!base64) throw new Error("Empty image");
              folder.file(`${unique}_${part.suffix}.jpg`, base64, { base64: true });
            } catch {
              failed += 1;
            }
            step += 1;
            setProgress({
              phase: "capture",
              index: i + 1,
              total: docs.length,
              name: doc.studentName || doc.studentCode,
              part: part.suffix,
              done: step,
              pages,
            });
          }
        }

        if (cancelled || cancelRef.current) return;
        const saved = Object.keys(zip.files).filter((name) => name.endsWith(".jpg")).length;
        if (!saved) {
          await showError("Download failed", "Could not create the certificate images.");
          onCloseRef.current();
          return;
        }

        setLabel("Packing ZIP…");
        setProgress((prev) => ({ ...prev, phase: "pack", part: "", done: prev.pages || prev.done, name: "Packing the ZIP" }));
        setSheet(null);
        const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
        const day = new Date().toISOString().slice(0, 10);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `certificates-results-${day}.zip`;
        link.click();
        URL.revokeObjectURL(url);

        const skipped = studentIds.length > ids.length ? ` First ${MAX_STUDENTS} students only.` : "";
        const miss = failed ? ` ${failed} page(s) could not be captured.` : "";
        await showSuccess("ZIP downloaded", `${docs.length} student(s), certificate + result JPEG.${skipped}${miss}`);
        onCloseRef.current();
      } catch (err) {
        if (!cancelled && !cancelRef.current) {
          await showError("Download failed", err instanceof Error ? err.message : "Could not build the ZIP");
          onCloseRef.current();
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
      cancelRef.current = true;
    };
  }, [studentIds, courseId]);

  if (!studentIds || !mounted) return null;

  return createPortal(
    <>
      <div
        ref={hostRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0"
        style={{ width: SHEET_W, height: SHEET_H, zIndex: 10280 }}
      >
        {sheet ? <OfficialDocumentSheet kind={sheet.kind} data={sheet.data} printId={`zip-${sheet.key}`} /> : null}
      </div>
      <div className="fixed inset-0 z-[10320] flex items-center justify-center bg-[#071525] p-4 text-white">
        <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[#C4A35A]/35 bg-[#0B1F3A] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#C4A35A] to-transparent" />
          <div className="flex items-start justify-between gap-3 px-5 pt-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C4A35A]">Print studio</p>
              <h2 className="mt-1 text-lg font-bold">Building JPEG ZIP</h2>
            </div>
            <button
              type="button"
              onClick={() => {
                cancelRef.current = true;
                onClose();
              }}
              className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Cancel download"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 pb-5 pt-4">
            <div className="flex items-center gap-4">
              <div
                className={`grid h-24 w-24 shrink-0 place-items-center rounded-full ${progress.phase === "load" ? "animate-spin" : ""}`}
                style={{
                  background:
                    progress.phase === "load"
                      ? "conic-gradient(from 0deg, #C4A35A, transparent 70%)"
                      : `conic-gradient(#C4A35A ${Math.min(100, progress.pages ? (progress.done / progress.pages) * 100 : 0) * 3.6}deg, rgba(255,255,255,0.12) 0deg)`,
                }}
              >
                <div className="grid h-[4.6rem] w-[4.6rem] place-items-center rounded-full bg-[#0B1F3A]">
                  <span className="text-xl font-bold tabular-nums">
                    {progress.phase === "load" ? "…" : `${Math.min(100, Math.round(progress.pages ? (progress.done / progress.pages) * 100 : 0))}%`}
                  </span>
                </div>
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{progress.name || "Gathering students"}</p>
                <p className="mt-1 text-xs text-white/60">
                  {progress.phase === "pack"
                    ? "Sealing the archive"
                    : progress.total
                      ? `Student ${Math.max(progress.index, 1)} of ${progress.total}`
                      : label}
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#C4A35A] transition-[width] duration-300"
                    style={{ width: `${progress.phase === "load" ? 8 : Math.min(100, progress.pages ? (progress.done / progress.pages) * 100 : 0)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { id: "certificate" as const, label: "Certificate", Icon: Award },
                { id: "result" as const, label: "Result", Icon: FileText },
              ].map((card) => {
                const active = progress.part === card.id;
                const Icon = card.Icon;
                return (
                  <div
                    key={card.id}
                    className={`rounded-2xl border px-3 py-3 ${active ? "border-[#C4A35A] bg-[#C4A35A]/15" : "border-white/10 bg-white/5"}`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-[#C4A35A]" : "text-white/40"}`} />
                    <p className="mt-2 text-xs font-bold">{card.label}</p>
                    <p className="text-[10px] text-white/50">{active ? "Capturing this page" : progress.phase === "pack" ? "Saved" : "Waiting"}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-white/45">
              {label}. Keep this tab open until the ZIP downloads. Certificate and result artwork stay the same.
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
