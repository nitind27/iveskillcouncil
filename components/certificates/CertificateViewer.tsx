"use client";

import { Download, Printer } from "lucide-react";
import type { CertificateDisplayData } from "@/lib/certificate-display";
import IvesdcCertificateTemplate from "./IvesdcCertificateTemplate";

interface Props {
  data: CertificateDisplayData;
}

export default function CertificateViewer({ data }: Props) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg border border-[#1E4A85]/20 bg-white px-4 py-2 text-sm font-semibold text-[#1E4A85] shadow-sm transition hover:bg-[#1E4A85]/5"
        >
          <Printer className="h-4 w-4" />
          Print / Save PDF
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#163A6B]"
        >
          <Download className="h-4 w-4" />
          Download
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[#1E4A85]/12 bg-slate-200 p-4 dark:bg-slate-900/40">
        <div className="mx-auto w-fit origin-top scale-[0.52] sm:scale-[0.58] md:scale-[0.65]">
          <IvesdcCertificateTemplate data={data} />
        </div>
      </div>
    </div>
  );
}
