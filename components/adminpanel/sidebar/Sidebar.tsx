"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
} from "lucide-react";
import { useLogoConfig } from "@/hooks/useLogoConfig";
import { useTrimmedImage } from "@/hooks/useTrimmedImage";
import { cn } from "@/lib/utils";
import { getMenuForRole, type RoleMenuItem } from "@/lib/role-menu-config";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFranchiseAppHref, useFranchiseDashboardPath, useStrippedAppPath } from "@/hooks/useFranchiseAppPath";

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  onToggleCollapse: () => void;
  user?: {
    id: string;
    email: string;
    fullName: string;
    roleId: number;
    roleName: string;
    franchiseId?: string;
    permissions?: string[];
  } | null;
}

export default function Sidebar({
  isCollapsed,
  isMobileOpen,
  onMobileClose,
  onToggleCollapse,
  user,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pn = pathname || "";
  const { logoUrl, siteName } = useLogoConfig();
  const logoSrc = useTrimmedImage(logoUrl) ?? logoUrl;
  const [tip, setTip] = useState<{ label: string; top: number } | null>(null);
  const showTip = (e: React.MouseEvent<HTMLElement>, label: string) => {
    if (!isCollapsed) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTip({ label, top: r.top + r.height / 2 });
  };
  const hideTip = () => setTip(null);
  const { t } = useLanguage();
  const appHref = useFranchiseAppHref();
  const dashboardPath = useFranchiseDashboardPath();
  const appPath = useStrippedAppPath();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const roleId = user?.roleId ?? 0;
  const menuSectionsFiltered = useMemo(() => getMenuForRole(roleId), [roleId]);

  useEffect(() => {
    const activePaths = new Set<string>();
    menuSectionsFiltered.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some((child) => appHref(child.href) === pn || child.href === appPath);
          if (hasActiveChild || appHref(item.href) === pn || item.href === appPath) {
            activePaths.add(item.id);
          }
        }
      });
    });
    setExpandedItems((prev) => {
      const same =
        prev.size === activePaths.size &&
        [...activePaths].every((id) => prev.has(id));
      return same ? prev : activePaths;
    });
  }, [pn, appPath, appHref, menuSectionsFiltered]);

  useEffect(() => {
    if (!isCollapsed) setTip(null);
  }, [isCollapsed]);

  const goTo = (href: string) => {
    setTip(null);
    const target = appHref(href);
    if (isMobileOpen) onMobileClose();
    if (target && target !== "#" && target !== pn) {
      router.push(target);
    }
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    const full = appHref(href);
    if (href === "/dashboard") return appPath === "/dashboard";
    return pn === full || appPath === href || appPath.startsWith(href + "/");
  };

  const renderMenuItem = (item: RoleMenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const active = isActive(item.href);
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            type="button"
            onClick={() => !isCollapsed && toggleExpanded(item.id)}
            onMouseEnter={(e) => showTip(e, t(`menu.${item.id}`, item.label))}
            onMouseLeave={hideTip}
            className={cn(
              "group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-200",
              "text-white/70 hover:bg-white/10 hover:text-white",
              !isCollapsed && "hover:translate-x-0.5",
              active && "bg-white/10 text-white",
              isCollapsed && "justify-center px-2",
              level > 0 && "pl-5"
            )}
            aria-label={isCollapsed ? t(`menu.${item.id}`, item.label) : undefined}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[#C4A35A]" />
            )}
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition",
                active
                  ? "bg-[#C4A35A] text-[#0B132B]"
                  : "bg-white/8 text-[#E8D5A3] group-hover:bg-white/12"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left text-[12.5px] font-medium">
                  {t(`menu.${item.id}`, item.label)}
                </span>
                {item.badge && (
                  <span className="rounded-full bg-[#C4A35A] px-1.5 py-0.5 text-[9px] font-bold text-[#0B132B]">
                    {item.badge}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-white/45" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-white/45" />
                )}
              </>
            )}
          </button>
          {!isCollapsed && isExpanded && (
            <div className="mt-0.5 ml-3 space-y-0.5 border-l border-white/10 pl-2.5">
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={appHref(item.href || "/dashboard")}
        prefetch
        onClick={(e) => {
          e.preventDefault();
          goTo(item.href || "/dashboard");
        }}
        onMouseEnter={(e) => showTip(e, t(`menu.${item.id}`, item.label))}
        onMouseLeave={hideTip}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-200",
          "text-white/70 hover:bg-white/10 hover:text-white",
          !isCollapsed && "hover:translate-x-0.5",
          active && "bg-[#C4A35A]/15 text-white",
          isCollapsed && "justify-center px-2",
          level > 0 && "pl-5"
        )}
        aria-label={isCollapsed ? t(`menu.${item.id}`, item.label) : undefined}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-[#C4A35A]" />
        )}
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition",
            active
              ? "bg-[#C4A35A] text-[#0B132B] shadow-sm shadow-[#C4A35A]/30"
              : "bg-white/[0.07] text-[#E8D5A3] group-hover:bg-white/12"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate text-[12.5px] font-medium">
              {t(`menu.${item.id}`, item.label)}
            </span>
            {item.badge && (
              <span className="rounded-full bg-[#C4A35A] px-1.5 py-0.5 text-[9px] font-bold text-[#0B132B]">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col lg:sticky",
          "bg-gradient-to-b from-[#0B1F3A] via-[#122B4D] to-[#0F2744]",
          "border-r border-white/10 shadow-xl shadow-black/20",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[4.5rem]" : "w-[17rem]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,163,90,0.1),transparent_50%)]" />

        <div
          className={cn(
            "relative flex h-14 shrink-0 items-center justify-center border-b sm:h-[calc(3.75rem+1px)]",
            logoSrc ? "border-slate-200/80 bg-white" : "border-white/10"
          )}
        >
          <Link
            href={dashboardPath}
            aria-label={siteName || "Dashboard"}
            className={cn(
              "group/logo flex h-full w-full items-center justify-center",
              isCollapsed ? "px-2" : "px-4"
            )}
            onMouseEnter={(e) => showTip(e, siteName || "Dashboard")}
            onMouseLeave={hideTip}
          >
            {logoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoSrc}
                alt={siteName}
                draggable={false}
                className={cn(
                  "block select-none object-contain transition-transform duration-300 group-hover/logo:scale-105",
                  isCollapsed ? "max-h-9 max-w-full" : "h-11 max-w-full sm:h-12"
                )}
              />
            ) : isCollapsed ? (
              <Building2 className="h-5 w-5 text-[#C4A35A]" />
            ) : (
              <span className="min-w-0">
                <span className="block truncate text-lg font-bold tracking-tight text-white">{siteName || "IVESDC"}</span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#C4A35A]">
                  {t("common.adminPanel", "Admin Panel")}
                </span>
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={onMobileClose}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-[#0B1F3A]/80 text-white shadow transition hover:bg-[#0B1F3A] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-3.5 top-[4.75rem] z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-[#C4A35A]/60 bg-[#0F2744] text-[#E8D5A3] shadow-lg shadow-black/30 transition-all duration-200 hover:scale-110 hover:bg-[#C4A35A] hover:text-[#0B132B] lg:flex"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>

        {isCollapsed && tip && (
          <div
            className="pointer-events-none fixed z-[60] -translate-y-1/2 whitespace-nowrap rounded-lg border border-[#C4A35A]/40 bg-[#0B1F3A] px-2.5 py-1.5 text-xs font-semibold text-white shadow-xl shadow-black/30"
            style={{ top: tip.top, left: "calc(4.5rem + 10px)" }}
          >
            <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-l border-[#C4A35A]/40 bg-[#0B1F3A]" />
            {tip.label}
          </div>
        )}

        <nav
          className="relative flex-1 overflow-y-auto px-2.5 py-3 sidebar-scrollbar"
          onScroll={hideTip}
        >
          <div className="space-y-4">
            {menuSectionsFiltered.map((section, idx) => (
              <div key={section.id}>
                {!isCollapsed && section.label ? (
                  <div className="mb-1.5 flex items-center gap-2 px-2.5">
                    <h3 className="shrink-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#C4A35A]/90">
                      {t(`sections.${section.id}`, section.label)}
                    </h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
                  </div>
                ) : (
                  isCollapsed &&
                  idx > 0 && <div className="mx-auto mb-2 h-px w-7 bg-white/15" />
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => renderMenuItem(item))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="relative shrink-0 border-t border-white/10 p-2.5">
          {!isCollapsed ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <p className="truncate text-xs font-bold text-white">
                {user?.fullName || siteName || "IVESDC"}
              </p>
              <p className="truncate text-[10px] text-[#E8D5A3]/90">
                {user?.roleName || "Management System"}
              </p>
            </div>
          ) : (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#C4A35A]/20 text-xs font-bold text-[#E8D5A3]">
              {(user?.fullName || "U").charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
