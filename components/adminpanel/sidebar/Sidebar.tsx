"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Building2,
} from "lucide-react";
import { useLogoConfig } from "@/hooks/useLogoConfig";
import { cn } from "@/lib/utils";
import { getMenuForRole, type RoleMenuItem } from "@/lib/role-menu-config";

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
  const pn = pathname || "";
  const { logoUrl, siteName } = useLogoConfig();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const roleId = user?.roleId ?? 0;
  const menuSectionsFiltered = getMenuForRole(roleId);

  useEffect(() => {
    const activePaths = new Set<string>();
    menuSectionsFiltered.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some((child) => child.href === pn);
          if (hasActiveChild || item.href === pn) {
            activePaths.add(item.id);
          }
        }
      });
    });
    setExpandedItems(activePaths);
  }, [pn, menuSectionsFiltered]);

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
    return pn === href || pn.startsWith(href + "/");
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
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
              "text-white/75 hover:bg-white/10 hover:text-white",
              active && "bg-white/10 text-white",
              isCollapsed && "justify-center px-2",
              level > 0 && "pl-6"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#C4A35A]" />
            )}
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                active
                  ? "bg-[#C4A35A] text-[#0B132B] shadow-md shadow-[#C4A35A]/30"
                  : "bg-white/10 text-[#E8D5A3] group-hover:bg-white/15"
              )}
            >
              <Icon className={cn(isCollapsed ? "h-4 w-4" : "h-3.5 w-3.5")} />
            </span>
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left text-[13px] font-semibold">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="rounded-full bg-[#C4A35A] px-1.5 py-0.5 text-[10px] font-bold text-[#0B132B]">
                    {item.badge}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-white/50" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-white/50" />
                )}
              </>
            )}
          </button>
          {!isCollapsed && isExpanded && (
            <div className="mt-1 ml-4 space-y-0.5 border-l border-white/10 pl-3">
              {item.children!.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href || "#"}
        onClick={() => {
          if (isMobileOpen) onMobileClose();
        }}
        className={cn(
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
          "text-white/75 hover:bg-white/10 hover:text-white",
          active && "bg-gradient-to-r from-[#C4A35A]/25 to-transparent text-white",
          isCollapsed && "justify-center px-2",
          level > 0 && "pl-6"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#C4A35A] shadow-[0_0_12px_rgba(196,163,90,0.6)]" />
        )}
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
            active
              ? "bg-[#C4A35A] text-[#0B132B] shadow-md shadow-[#C4A35A]/35"
              : "bg-white/10 text-[#E8D5A3] group-hover:bg-white/15"
          )}
        >
          <Icon className={cn(isCollapsed ? "h-4 w-4" : "h-3.5 w-3.5")} />
        </span>
        {!isCollapsed && (
          <>
            <span className="flex-1 text-[13px] font-semibold">{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-[#C4A35A] px-1.5 py-0.5 text-[10px] font-bold text-[#0B132B]">
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
          isCollapsed ? "w-[4.5rem]" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(196,163,90,0.12),transparent_50%)]" />

        <div className="relative flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-3">
          {!isCollapsed && (
            <Link
              href="/dashboard"
              className="block min-w-0 flex-1 overflow-hidden pr-1"
              aria-label={siteName || "Dashboard"}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="block h-12 w-full max-w-full object-contain object-left"
                />
              ) : (
                <div className="min-w-0">
                  <p className="truncate text-base font-bold tracking-tight text-white">
                    {siteName || "IVESDC"}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#C4A35A]">
                    Admin Panel
                  </p>
                </div>
              )}
            </Link>
          )}
          {isCollapsed && (
            <Link
              href="/dashboard"
              className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center"
              aria-label={siteName || "Dashboard"}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={siteName} className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-5 w-5 text-[#C4A35A]" />
              )}
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 1024) onMobileClose();
              else onToggleCollapse();
            }}
            className="hidden h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white lg:flex"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="relative flex-1 space-y-5 overflow-y-auto p-3 sidebar-scrollbar">
          {menuSectionsFiltered.map((section) => (
            <div key={section.id} className="space-y-1">
              {!isCollapsed && section.label && (
                <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#C4A35A]/80">
                  {section.label}
                </h3>
              )}
              {isCollapsed && (
                <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => renderMenuItem(item))}
              </div>
            </div>
          ))}
        </nav>

        <div className="relative border-t border-white/10 p-3">
          {!isCollapsed ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
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
