"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserPanelConfigProvider } from "@/contexts/UserPanelConfigContext";
import { CourseCartProvider } from "@/contexts/CourseCartContext";
import UserPanelShell from "@/components/userpanel/UserPanelShell";
import { useFranchiseSiteSlug } from "@/hooks/useUserPanelBasePath";
import PageLoader from "@/components/common/PageLoader";

function FranchiseSiteGate({ children }: { children: React.ReactNode }) {
  const slug = useFranchiseSiteSlug();
  const [status, setStatus] = useState<"ok" | "loading" | "missing">(slug ? "loading" : "ok");

  useEffect(() => {
    if (!slug) {
      setStatus("ok");
      return;
    }
    let cancelled = false;
    setStatus("loading");
    fetch(`/api/franchise-panel/${slug}`)
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled) setStatus(res?.success ? "ok" : "missing");
      })
      .catch(() => {
        if (!cancelled) setStatus("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (status === "loading") return <PageLoader text="Loading..." />;

  if (status === "missing") {
    return (
      <div className="userpanel min-h-screen bg-[var(--up-bg)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-extrabold text-[#0F172A] mb-2">Centre not found</h1>
          <p className="text-[#64748B] mb-6">
            No active franchise is available at <strong>/{slug}</strong>.
          </p>
          <Link
            href="/userpanel"
            className="inline-flex items-center rounded-xl bg-[#1E4A85] px-6 py-3 text-sm font-semibold text-white hover:bg-[#163A6B]"
          >
            Go to main site
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function UserPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FranchiseSiteGate>
      <UserPanelConfigProvider>
        <CourseCartProvider>
          <UserPanelShell>{children}</UserPanelShell>
        </CourseCartProvider>
      </UserPanelConfigProvider>
    </FranchiseSiteGate>
  );
}
