"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Issued certificates are printed from the Print Center (official Certificate + Result 3 templates). */
export default function IssuedCertificatesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/certificates/print?status=ISSUED");
  }, [router]);

  return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
    </div>
  );
}
