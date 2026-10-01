"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CertificateDemoData } from "@/components/certificates/demo/types";
import OfficialIvesdcCertTemplate from "@/components/certificates/OfficialIvesdcCertTemplate";
import OfficialIvesdcMarksheetTemplateV3 from "@/components/certificates/OfficialIvesdcMarksheetTemplateV3";

export type OfficialDocKind = "vocational" | "marksheet";

export type OfficialPrintPage = {
  key: string;
  kind: OfficialDocKind;
  data: CertificateDemoData;
};

export const OFFICIAL_DOC_LABEL: Record<OfficialDocKind, string> = {
  vocational: "Certificate of Completion",
  marksheet: "Statement of Marks (Result) - 3",
};

/** Renders one official A4 sheet — Certificate of Completion or Result 3. */
export function OfficialDocumentSheet({
  kind,
  data,
  printId,
}: {
  kind: OfficialDocKind;
  data: CertificateDemoData;
  printId: string;
}) {
  return kind === "vocational" ? (
    <OfficialIvesdcCertTemplate data={data} printId={printId} />
  ) : (
    <OfficialIvesdcMarksheetTemplateV3 data={data} printId={printId} />
  );
}

const PRINT_CLASS = "cert-batch-printing";

function waitForRoot(root: HTMLElement, timeoutMs: number): Promise<void> {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const imgs = Array.from(root.querySelectorAll("img"));
      const imagesReady = imgs.every((img) => img.complete);
      const qrPending = root.querySelectorAll(".border-dashed.border-slate-300").length > 0;
      if ((imagesReady && !qrPending) || Date.now() - started > timeoutMs) {
        resolve();
        return;
      }
      setTimeout(tick, 120);
    };
    tick();
  });
}

/**
 * Multi-page A4 print for official documents.
 * Mounts a hidden print root (one A4 page per sheet), waits for images + QR codes, then opens the
 * browser print dialog — choose "Save as PDF" there for a PDF file.
 */
export function useOfficialBatchPrint() {
  const [pages, setPages] = useState<OfficialPrintPage[] | null>(null);
  const [preparing, setPreparing] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const print = useCallback((next: OfficialPrintPage[]) => {
    if (!next.length) return;
    setPreparing(true);
    setPages(next);
  }, []);

  useEffect(() => {
    if (!pages || !rootRef.current) return;
    let cancelled = false;
    const root = rootRef.current;
    const cleanup = () => {
      document.documentElement.classList.remove(PRINT_CLASS);
      window.removeEventListener("afterprint", cleanup);
      setPages(null);
      setPreparing(false);
    };

    (async () => {
      await (document.fonts?.ready ?? Promise.resolve());
      await waitForRoot(root, 8000 + pages.length * 150);
      if (cancelled) return;
      document.documentElement.classList.add(PRINT_CLASS);
      window.addEventListener("afterprint", cleanup);
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (cancelled) return;
          window.print();
          // Some browsers never fire afterprint when the dialog is dismissed quickly.
          setTimeout(() => {
            if (document.documentElement.classList.contains(PRINT_CLASS)) cleanup();
          }, 1500);
        }, 150);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [pages]);

  const node =
    pages && typeof document !== "undefined"
      ? createPortal(
          <div ref={rootRef} className="cert-batch-print-root" aria-hidden>
            {pages.map((p, i) => (
              <div key={p.key} className="cert-batch-page">
                <OfficialDocumentSheet
                  kind={p.kind}
                  data={p.data}
                  printId={p.kind === "vocational" ? `obatch-vocational-${i}` : `obatch-marksheet3-${i}`}
                />
              </div>
            ))}
          </div>,
          document.body
        )
      : null;

  return { print, preparing, node };
}
