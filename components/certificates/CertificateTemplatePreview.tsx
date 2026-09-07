"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, X, ZoomIn, ZoomOut } from "lucide-react";
import type { CertificateDisplayData } from "@/lib/certificate-display";
import IvesdcCertificateTemplate from "./IvesdcCertificateTemplate";

/** Sample data so admin can preview the official certificate layout. */
export const SAMPLE_CERTIFICATE_DATA: CertificateDisplayData = {
  id: "0",
  serialNumber: "000001",
  certificateNumber: "CERT-SAMPLE-2026",
  atcCode: "ATC00001",
  atcName: "IVESDC Authorised Training Centre",
  studentName: "Sample Student Name",
  parentName: "Sample Parent Name",
  registrationNumber: "REG-000001",
  courseName: "Computer Concept (CCC)",
  grade: "A",
  gradeLabel: "Very Good",
  marksPercent: 90,
  trainingStart: "01 Jan 2026",
  trainingEnd: "30 Jun 2026",
  issueDate: "01 Jul 2026",
  trainingCentre: "Songadh, Gujarat",
  trainingCentreName: "IVESDC Authorised Training Centre",
  franchiseAddress: "Songadh, Gujarat",
  status: "ISSUED",
  isDraft: false,
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CertificateTemplatePreviewModal({ open, onClose }: Props) {
  const [zoom, setZoom] = useState(70);

  const handleClose = useCallback(() => {
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
    if (!open) setZoom(70);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[250] flex flex-col bg-black/85">
      <div className="no-print flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#1E4A85] px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-bold text-white">
            <Eye className="h-4 w-4 text-[#C4A35A]" />
            Certificate Template Preview
          </p>
          <p className="text-xs text-white/60">
            Official IVESDC format with sample data — layout check only
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(40, z - 10))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[3rem] text-center text-xs font-semibold tabular-nums text-white/80">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(120, z + 10))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div
          className="mx-auto w-fit origin-top"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          <IvesdcCertificateTemplate data={SAMPLE_CERTIFICATE_DATA} />
        </div>
      </div>
    </div>
  );
}

export function CertificateTemplatePreviewButton({
  className = "",
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "inline-flex items-center gap-1.5 rounded-xl border border-[#1E4A85]/25 bg-white px-4 py-3 text-sm font-semibold text-[#1E4A85] transition hover:bg-[#1E4A85]/5"
        }
      >
        <Eye className="h-4 w-4" />
        Preview template
      </button>
      <CertificateTemplatePreviewModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Lightweight loading placeholder while modal mounts */
export function CertificateTemplatePreviewSkeleton() {
  return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
    </div>
  );
}
