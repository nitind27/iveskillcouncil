"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import {
  CreditCard,
  Printer,
  X,
  Download,
  Upload,
} from "lucide-react";
import {
  FranchiseIdCardBack,
  FranchiseIdCardFront,
  type FranchiseIdCardData,
} from "@/components/franchises/FranchiseIdCard";
import {
  buildFranchisePartnerId,
  findFranchiseDocUrl,
  formatIdCardDate,
  franchiseLocationLine,
} from "@/lib/franchise-partner-id";
import { cn } from "@/lib/utils";

export type FranchiseIdCardSource = {
  id: string;
  name: string;
  owner: { name: string; email?: string };
  subscriptionStart?: string | null;
  subscriptionEnd?: string | null;
  createdAt?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  documents?: Array<{
    key?: string;
    url?: string;
    label?: string;
    name?: string;
  }> | null;
  status?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  franchise: FranchiseIdCardSource | null;
};

export function FranchiseIdCardModal({ open, onClose, franchise }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [photoOverride, setPhotoOverride] = useState<string | null>(null);

  const issueRaw = franchise?.subscriptionStart || franchise?.createdAt || null;
  const partnerId = franchise
    ? buildFranchisePartnerId(franchise.id, issueRaw)
    : "";

  const kycPhoto = useMemo(
    () => findFranchiseDocUrl(franchise?.documents, ["photo", "photograph", "owner"]),
    [franchise?.documents]
  );

  const cardData: FranchiseIdCardData | null = franchise
    ? {
        partnerId,
        ownerName: franchise.owner.name,
        centerName: franchise.name,
        location: franchiseLocationLine(franchise),
        issueDate: formatIdCardDate(issueRaw),
        validUpto: formatIdCardDate(franchise.subscriptionEnd),
        photoUrl: photoOverride || kycPhoto,
        logoUrl: "/logo/IVESDC LOGO-01.png",
        qrDataUrl,
      }
    : null;

  useEffect(() => {
    if (!open) {
      setPhotoOverride(null);
      setQrDataUrl(null);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !franchise) return;
    const payload = [
      "IVESDC Franchise Partner",
      `ID: ${partnerId}`,
      `Name: ${franchise.owner.name}`,
      `Center: ${franchise.name}`,
      `Valid: ${formatIdCardDate(franchise.subscriptionEnd)}`,
      "www.ivesdc.org",
    ].join("\n");
    QRCode.toDataURL(payload, {
      width: 180,
      margin: 1,
      color: { dark: "#0F2A4A", light: "#FFFFFF" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [open, franchise, partnerId]);

  const handlePrint = () => {
    window.print();
  };

  const handlePhotoFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setPhotoOverride(reader.result);
    };
    reader.readAsDataURL(file);
  };

  if (!open || !franchise || !cardData) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[10060] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Franchise Partner ID Card"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#0B1F3A]/55 backdrop-blur-sm print:hidden"
        aria-label="Close"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-[#F4F7FB] shadow-2xl print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:bg-white print:shadow-none">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] px-4 py-3 text-white print:hidden sm:px-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#E8D5A3]">
              Institute release
            </p>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <CreditCard className="h-5 w-5 text-[#C4A35A]" />
              Franchise Partner ID Card
            </h2>
            <p className="mt-0.5 text-xs text-white/70">
              {franchise.name} · {partnerId}
              {franchise.status && franchise.status !== "ACTIVE" ? (
                <span className="ml-2 rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                  {franchise.status} — release carefully
                </span>
              ) : null}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 p-2 hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 print:overflow-visible print:p-0">
          <div
            id="franchise-id-card-print"
            className="flex flex-wrap items-start justify-center gap-6 print:gap-8"
          >
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E4A85]/70 print:hidden">
                Front
              </p>
              <FranchiseIdCardFront data={cardData} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1E4A85]/70 print:hidden">
                Back
              </p>
              <FranchiseIdCardBack data={cardData} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#1E4A85]/10 bg-white px-4 py-3 print:hidden sm:px-5">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#1E4A85]/30 bg-[#1E4A85]/[0.03] px-3 py-2 text-xs font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/8">
            <Upload className="h-3.5 w-3.5" />
            {photoOverride || kycPhoto ? "Change photo" : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePhotoFile(e.target.files?.[0] || null)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-muted"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A6B]"
              )}
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-[#C4A35A]/50 bg-[#C4A35A]/15 px-4 py-2 text-sm font-semibold text-[#8B6914] hover:bg-[#C4A35A]/25"
              title="Use browser Print → Save as PDF"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * { visibility: hidden !important; }
          #franchise-id-card-print,
          #franchise-id-card-print * { visibility: visible !important; }
          #franchise-id-card-print {
            position: fixed !important;
            left: 50% !important;
            top: 12mm !important;
            transform: translateX(-50%) !important;
            display: flex !important;
            flex-wrap: nowrap !important;
            gap: 10mm !important;
            background: white !important;
            z-index: 99999 !important;
          }
          .id-card-face {
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `,
        }}
      />
    </div>
  );

  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}
