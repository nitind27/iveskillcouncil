"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/adminpanel/sidebar/Sidebar";
import Navbar from "@/components/adminpanel/navbar/Navbar";
import Footer from "@/components/adminpanel/footer/Footer";
import { useAuth } from "@/contexts/AuthContext";
import dynamic from "next/dynamic";
import PageLoader from "@/components/common/PageLoader";

const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"), {
  ssr: false,
});
import { canRoleAccessPath } from "@/lib/role-menu-config";
import { ROLES } from "@/lib/permissions";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, loading, refreshUser, dbUnavailable } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const pn = pathname || "";
  const [authChecked, setAuthChecked] = useState(false);

  const isLoginPage = pn === "/login";
  // User panel (courses, booking, Enquire Now) is public — no login required
  const isUserPanelPage = pn === "/" || pn === "/userpanel" || pn.startsWith("/userpanel/");

  // Confirm session (with refresh) before hard-redirecting to login
  useEffect(() => {
    if (isLoginPage || isUserPanelPage) {
      setAuthChecked(true);
      return;
    }

    if (loading) {
      setAuthChecked(false);
      return;
    }

    if (user) {
      setAuthChecked(true);
      return;
    }

    // loading done, no user yet — try one silent refresh before logout redirect
    let cancelled = false;
    setAuthChecked(false);
    (async () => {
      await refreshUser();
      if (!cancelled) setAuthChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, isLoginPage, isUserPanelPage, refreshUser]);

  useEffect(() => {
    // Don't force logout redirect while DB/proxy is temporarily down
    if (!authChecked || loading || user || isLoginPage || isUserPanelPage || dbUnavailable) return;
    const safeRedirect = pn === "/403" || pn === "/401" ? "/dashboard" : pn;
    const redirectUrl = `/login?redirect=${encodeURIComponent(safeRedirect)}`;
    window.location.href = redirectUrl;
  }, [authChecked, loading, user, pn, isLoginPage, isUserPanelPage, dbUnavailable]);

  const roleId = Number(user?.roleId) || 0;
  const pathNormalized = pn.replace(/\/$/, "").trim() || "/";
  const isSuperAdminOrAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;
  const hasAccess =
    !user // not yet loaded — don't block
    || isSuperAdminOrAdmin
    || pathNormalized === "/dashboard"
    || canRoleAccessPath(roleId, pn);

  // If user is logged in but landed on /403, send them to dashboard
  useEffect(() => {
    if (!loading && user && pn === "/403") {
      router.replace("/dashboard");
    }
  }, [loading, user, pn, router]);

  useEffect(() => {
    // Wait until auth is fully resolved AND user is present before checking access
    if (loading || !user || hasAccess) return;
    if (pn === "/403") return;
    router.replace("/403");
  }, [loading, user, hasAccess, pn, router]);

  if ((loading || !authChecked || (dbUnavailable && !user)) && !isLoginPage && !isUserPanelPage) {
    return (
      <PageLoader
        variant="admin"
        text={dbUnavailable ? "Connecting to database…" : "Loading dashboard..."}
      />
    );
  }

  if (isLoginPage || isUserPanelPage) {
    return <>{children}</>;
  }

  if (pathname === "/403") {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  // Only block render if user is loaded AND confirmed no access
  if (user && !hasAccess) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          user={user}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* overflow-visible so navbar dropdowns are not clipped */}
          <div className="relative z-[60] shrink-0 overflow-visible">
            <Navbar onSidebarToggle={() => setIsMobileOpen(!isMobileOpen)} user={user} />
          </div>
          <main className="relative z-0 min-h-0 flex-1 overflow-y-auto scrollbar-thin">
            <div className="container mx-auto bg-background px-4 py-6 dark:bg-background lg:px-6">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}
