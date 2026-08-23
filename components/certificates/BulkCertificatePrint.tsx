"use client";

import { useEffect, useState } from "react";
import { Loader2, Printer, X } from "lucide-react";
import type { CertificateDisplayData } from "@/lib/certificate-display";
import IvesdcCertificateTemplate from "./IvesdcCertificateTemplate";
import { showError } from "@/lib/toast";

interface BulkCertificatePrintProps {
  open: boolean;
  onClose: () => void;
  ids?: string[];
  franchiseId?: string;
  courseId?: string;
}

export function BulkCertificatePrint({
  open,
  onClose,
  ids,
  franchiseId,
  courseId,
}: BulkCertificatePrintProps) {
  const [items, setItems] = useState<CertificateDisplayData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setItems([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/certificates/bulk-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids, franchiseId, courseId, status: "ISSUED" }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load");
        if (!cancelled) setItems(json.data?.items ?? []);
      })
      .catch(async (e) => {
        if (!cancelled) {
          await showError("Error", e instanceof Error ? e.message : "Failed to load certificates");
          onClose();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, ids, franchiseId, courseId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[250] flex flex-col bg-black/85">
      <div className="no-print flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#1E4A85] px-4 py-3 sm:px-6">
        <div>
          <p className="text-sm font-bold text-white">Batch Print — {items.length} certificate(s)</p>
          <p className="text-xs text-white/60">Print all selected certificates for dispatch to franchise</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!items.length || loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 py-2 text-xs font-bold text-[#0B132B] disabled:opacity-40"
          >
            <Printer className="h-4 w-4" />
            Print All
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/20 p-2 text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-24 text-white/80">
            <Loader2 className="h-10 w-10 animate-spin text-[#C4A35A]" />
            <p className="text-sm">Loading certificates for print…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-muted-foreground">
            No issued certificates found for the selected filters.
          </div>
        ) : (
          <div id="bulk-cert-print-root" className="mx-auto space-y-6">
            {items.map((data, i) => (
              <div key={data.certificateNumber ?? i} className="cert-print-page mx-auto w-fit">
                <IvesdcCertificateTemplate data={data} printId={`ivesdc-cert-${i}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: 724px 1024px;
            margin: 0;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #bulk-cert-print-root,
          #bulk-cert-print-root * {
            visibility: visible !important;
          }
          #bulk-cert-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
          }
          .cert-print-page {
            page-break-after: always;
            break-after: page;
          }
          .cert-print-page:last-child {
            page-break-after: auto;
          }
          [id^="ivesdc-cert-"] {
            width: 724px !important;
            height: 1024px !important;
            box-shadow: none !important;
            margin: 0 auto !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
