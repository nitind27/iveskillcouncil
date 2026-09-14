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
import {
  canAccessFranchiseAdminPath,
  franchiseAppHref,
  franchiseDashboardPath,
  isFranchiseAdminPath,
  isFranchisePublicSitePath,
  shouldPrefixFranchiseApp,
  stripFranchiseAppPrefix,
} from "@/lib/franchise-path";
import { NotFound404 } from "@/components/common/error";

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
  const appPath = isFranchiseAdminPath(pn) ? stripFranchiseAppPrefix(pn) : pn;
  const franchiseSlug = user?.franchise?.slug || null;
  const franchiseHome = franchiseDashboardPath(franchiseSlug);
  const prefixApp = !!(user && shouldPrefixFranchiseApp(user.roleId, franchiseSlug));
  // User panel (courses, booking, Enquire Now) is public — no login required
  const isUserPanelPage = pn === "/" || pn === "/userpanel" || pn.startsWith("/userpanel/");
  const isCertificateStudioPage = appPath.startsWith("/certificates/templates");
  const isFranchisePortalPage = pn === "/f" || pn.startsWith("/f/") || isFranchisePublicSitePath(pn);
  const isPublicPage = isLoginPage || isUserPanelPage || isCertificateStudioPage || isFranchisePortalPage;

  // Confirm session (with refresh) before hard-redirecting to login
  useEffect(() => {
    if (isPublicPage) {
      setAuthChecked(true);
      return;
    }

    // Already logged in — never flash the full-page loader again on route changes
    if (user) {
      setAuthChecked(true);
      return;
    }

    if (loading) {
      setAuthChecked(false);
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
  }, [loading, user, isPublicPage, refreshUser]);

  useEffect(() => {
    // Don't force logout redirect while DB/proxy is temporarily down
    if (!authChecked || loading || user || isPublicPage || dbUnavailable) return;
    const safeRedirect = pn === "/403" || pn === "/401" ? franchiseHome : pn;
    const redirectUrl = `/login?redirect=${encodeURIComponent(safeRedirect)}`;
    window.location.href = redirectUrl;
  }, [authChecked, loading, user, pn, isPublicPage, dbUnavailable, franchiseHome]);

  const roleId = Number(user?.roleId) || 0;
  const isSuperAdminOrAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;
  const ownsThisFranchiseAdmin =
    !isFranchiseAdminPath(pn) ||
    (!!user && canAccessFranchiseAdminPath(pn, roleId, user.franchise?.slug));
  const hasAccess =
    !user // not yet loaded — don't block
    || (isSuperAdminOrAdmin && !isFranchiseAdminPath(pn))
    || (ownsThisFranchiseAdmin && (
      appPath === "/dashboard"
      || appPath === "/admin"
      || appPath.startsWith("/admin/")
      || canRoleAccessPath(roleId, pn)
    ));

  // Franchise users stay on /{slug}/dashboard (same UI, franchise URL)
  useEffect(() => {
    if (loading || !user || !prefixApp || !franchiseSlug) return;
    if (isPublicPage || pn === "/403") return;
    if (isFranchiseAdminPath(pn)) return;
    if (appPath === "/admin" || appPath.startsWith("/admin/")) {
      router.replace(franchiseHome);
      return;
    }
    router.replace(franchiseAppHref(pn, franchiseSlug));
  }, [loading, user, prefixApp, franchiseSlug, pn, appPath, isPublicPage, franchiseHome, router]);

  // /admin → dashboard (alias used by user panel login links)
  useEffect(() => {
    if (!loading && user && (appPath === "/admin" || appPath.startsWith("/admin/"))) {
      router.replace(prefixApp ? franchiseHome : "/dashboard");
    }
  }, [loading, user, appPath, router, prefixApp, franchiseHome]);

  // If user is logged in but landed on /403, send them to dashboard
  useEffect(() => {
    if (!loading && user && pn === "/403") {
      router.replace(prefixApp ? franchiseHome : "/dashboard");
    }
  }, [loading, user, pn, router, prefixApp, franchiseHome]);

  useEffect(() => {
    // Wait until auth is fully resolved AND user is present before checking access
    if (loading || !user || hasAccess) return;
    if (pn === "/403" || pn === "/404") return;
    if (isFranchiseAdminPath(pn) && !ownsThisFranchiseAdmin) return;
    router.replace("/403");
  }, [loading, user, hasAccess, pn, router, ownsThisFranchiseAdmin]);

  // Keep shell visible while tokens refresh — only block when we have no user yet
  if (!user && (loading || !authChecked || dbUnavailable) && !isPublicPage) {
    return (
      <PageLoader
        variant="admin"
        text={dbUnavailable ? "Connecting to database…" : "Loading dashboard..."}
      />
    );
  }

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (pathname === "/403" || pathname === "/404") {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  if (isFranchiseAdminPath(pn) && !ownsThisFranchiseAdmin) {
    return <NotFound404 />;
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
