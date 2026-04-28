"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/adminpanel/sidebar/Sidebar";
import Navbar from "@/components/adminpanel/navbar/Navbar";
import Footer from "@/components/adminpanel/footer/Footer";
import { useAuth } from "@/contexts/AuthContext";
import PageLoader from "@/components/common/PageLoader";
import ChatWidget from "@/components/chat/ChatWidget";
import { canRoleAccessPath } from "@/lib/role-menu-config";
import { ROLES } from "@/lib/permissions";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const pn = pathname || "";

  const isLoginPage = pn === "/login";
  // User panel (courses, booking, Enquire Now) is public — no login required
  const isUserPanelPage = pn === "/" || pn === "/userpanel" || pn.startsWith("/userpanel/");

  useEffect(() => {
    if (!loading && !user && !isLoginPage && !isUserPanelPage) {
      // Don't redirect to /403 as the return URL
      const safeRedirect = (pn === "/403" || pn === "/401") ? "/dashboard" : pn;
      const redirectUrl = `/login?redirect=${encodeURIComponent(safeRedirect)}`;
      window.location.href = redirectUrl;
    }
  }, [loading, user, pn, isLoginPage, isUserPanelPage]);

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

  if (loading && !isLoginPage && !isUserPanelPage) {
    return <PageLoader variant="admin" text="Loading dashboard..." />;
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar onSidebarToggle={() => setIsMobileOpen(!isMobileOpen)} user={user} />
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="container mx-auto px-4 lg:px-6 py-6 bg-background dark:bg-background">
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
