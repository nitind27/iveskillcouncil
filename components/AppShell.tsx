"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const AdminLayout = dynamic(() => import("@/components/adminpanel/AdminLayout"));

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/userpanel") ||
    pathname === "/400" ||
    pathname === "/401" ||
    pathname === "/403" ||
    pathname === "/503"
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
