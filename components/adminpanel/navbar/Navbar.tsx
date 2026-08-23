"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import {
  Bell,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  X,
  Loader2,
  MessageSquare,
  Tag,
  Building2,
  FileCheck,
  Award,
  MessageCircle,
  Search,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getMenuForRole } from "@/lib/role-menu-config";
import { fetcher } from "@/lib/fetcher";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavbarProps {
  onSidebarToggle: () => void;
  user?: {
    id: string;
    email: string;
    fullName: string;
    roleId: number;
    roleName: string;
    franchiseId?: string;
  } | null;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  unread: boolean;
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "Just now";
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hr ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)} days ago`;
  return d.toLocaleDateString();
}

const NOTIFICATIONS_SEEN_KEY = "admin-notifications-seen";

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "course_enquiry":
      return <MessageSquare className="h-4 w-4 text-[#1E4A85]" />;
    case "offer_application":
      return <Tag className="h-4 w-4 text-[#C4A35A]" />;
    case "franchise_inquiry":
      return <Building2 className="h-4 w-4 text-emerald-600" />;
    case "pending_franchise":
      return <FileCheck className="h-4 w-4 text-amber-600" />;
    case "certificate_request":
      return <Award className="h-4 w-4 text-[#1E4A85]" />;
    case "feedback":
      return <MessageCircle className="h-4 w-4 text-sky-600" />;
    default:
      return <Bell className="h-4 w-4 text-slate-500" />;
  }
}

type OpenPanel = null | "notifications" | "profile" | `menu:${string}`;

export default function Navbar({ onSidebarToggle, user }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname() || "";
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [quickSearch, setQuickSearch] = useState("");
  const barRef = useRef<HTMLElement>(null);

  const menuSections = getMenuForRole(user?.roleId ?? 1);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPanel(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setOpenPanel(null);
  }, [pathname]);

  const togglePanel = (panel: OpenPanel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  const { data: notifData, isLoading: notifLoading } = useSWR<{
    notifications: NotificationItem[];
  }>(user ? "/api/notifications" : null, fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  });

  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined" || !user?.id) return;
    try {
      const raw = localStorage.getItem(`${NOTIFICATIONS_SEEN_KEY}-${user.id}`);
      if (raw) setSeenIds(new Set(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  }, [user?.id]);

  const markAsSeen = (id: string) => {
    setSeenIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(
          `${NOTIFICATIONS_SEEN_KEY}-${user?.id ?? "default"}`,
          JSON.stringify([...next])
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const allNotifications = notifData?.notifications ?? [];
  const notifications = allNotifications.filter((n) => !seenIds.has(n.id));
  const unreadCount = notifications.filter((n) => n.unread).length;

  const crumbs = pathname.split("/").filter(Boolean);
  const pageTitle = crumbs[crumbs.length - 1]?.replace(/-/g, " ") || "dashboard";

  const isSectionActive = (section: (typeof menuSections)[0]) =>
    section.items.some(
      (item) =>
        pathname === item.href ||
        pathname.startsWith(item.href + "/") ||
        item.children?.some(
          (c) => pathname === c.href || pathname.startsWith(c.href + "/")
        )
    );

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      ref={barRef}
      className="sticky top-0 z-[60] w-full shrink-0"
    >
      {/* Light bar — contrasts dark sidebar */}
      <div className="relative border-b border-slate-200/90 bg-[#F7F9FC] dark:border-slate-800 dark:bg-[#0F172A]">
        {/* Gold accent line */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#C4A35A] to-transparent" />
        {/* Soft navy wash (not solid sidebar navy) */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(30,74,133,0.06)_0%,transparent_40%,rgba(196,163,90,0.05)_100%)] dark:bg-[linear-gradient(90deg,rgba(30,74,133,0.25)_0%,transparent_50%)]" />

        <div className="relative flex h-16 items-center justify-between gap-3 px-3 sm:px-5 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-4">
            <button
              type="button"
              onClick={onSidebarToggle}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1E4A85]/15 bg-white text-[#1E4A85] shadow-sm transition hover:border-[#C4A35A]/40 hover:bg-[#1E4A85]/5 lg:hidden dark:border-white/10 dark:bg-white/5 dark:text-[#E8D5A3]"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden min-w-0 sm:block">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
                <span className="font-semibold text-[#1E4A85] dark:text-[#E8D5A3]">
                  Admin
                </span>
                <ChevronRight className="h-3 w-3" />
                <span className="capitalize">{pageTitle}</span>
              </div>
              <p className="mt-0.5 truncate text-[15px] font-bold tracking-tight text-[#0B1F3A] dark:text-white">
                Control Center
              </p>
            </div>

            <nav className="ml-1 hidden items-center gap-1 xl:flex">
              {menuSections.slice(0, 5).map((section) => {
                if (!section.items.length) return null;
                const isDropdown = section.items.length > 1;
                const panelId = `menu:${section.id}` as const;
                const isOpen = openPanel === panelId;
                const firstItem = section.items[0];
                const Icon = firstItem.icon;
                const active = isSectionActive(section);

                return (
                  <div key={section.id} className="relative">
                    {isDropdown ? (
                      <>
                        <button
                          type="button"
                          onClick={() => togglePanel(panelId)}
                          aria-expanded={isOpen}
                          className={cn(
                            "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-all",
                            active || isOpen
                              ? "border-[#1E4A85]/20 bg-[#1E4A85] text-white shadow-md shadow-[#1E4A85]/25"
                              : "border-transparent text-[#1E4A85]/80 hover:border-[#1E4A85]/15 hover:bg-white hover:text-[#1E4A85] dark:text-slate-200 dark:hover:bg-white/10"
                          )}
                        >
                          {Icon && <Icon className="h-3.5 w-3.5" />}
                          <span>{section.label || firstItem.label}</span>
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 transition-transform duration-200",
                              isOpen && "rotate-180"
                            )}
                          />
                        </button>

                        {isOpen && (
                          <div
                            className="absolute left-0 top-[calc(100%+0.5rem)] z-[80] min-w-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-12px_rgba(11,31,58,0.35)] dark:border-slate-700 dark:bg-slate-900"
                            role="menu"
                          >
                            <div className="border-b border-slate-100 bg-gradient-to-r from-[#0B1F3A] to-[#1E4A85] px-4 py-2.5 dark:border-slate-800">
                              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#E8D5A3]">
                                {section.label || firstItem.label}
                              </p>
                            </div>
                            <div className="max-h-[min(70vh,28rem)] space-y-0.5 overflow-y-auto p-1.5">
                              {section.items.map((item) => {
                                const ItemIcon = item.icon;
                                const itemActive = isItemActive(item.href);
                                const hasChildren =
                                  !!item.children && item.children.length > 0;

                                return (
                                  <div key={item.id}>
                                    <Link
                                      href={item.href}
                                      onClick={() => setOpenPanel(null)}
                                      role="menuitem"
                                      className={cn(
                                        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition",
                                        itemActive
                                          ? "bg-[#1E4A85]/10 text-[#1E4A85]"
                                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                                      )}
                                    >
                                      {ItemIcon && (
                                        <span
                                          className={cn(
                                            "flex h-8 w-8 items-center justify-center rounded-lg",
                                            itemActive
                                              ? "bg-[#C4A35A] text-[#0B132B]"
                                              : "bg-[#1E4A85]/8 text-[#1E4A85] dark:bg-white/10 dark:text-[#E8D5A3]"
                                          )}
                                        >
                                          <ItemIcon className="h-4 w-4" />
                                        </span>
                                      )}
                                      <span className="flex-1 text-sm font-semibold">
                                        {item.label}
                                      </span>
                                      {item.badge && (
                                        <span className="rounded-full bg-[#C4A35A]/20 px-2 py-0.5 text-[10px] font-bold text-[#8B6914]">
                                          {item.badge}
                                        </span>
                                      )}
                                    </Link>
                                    {hasChildren && (
                                      <div className="mb-1 ml-4 space-y-0.5 border-l border-slate-100 pl-2 dark:border-slate-800">
                                        {item.children!.map((child) => {
                                          const childActive = isItemActive(
                                            child.href
                                          );
                                          return (
                                            <Link
                                              key={child.id}
                                              href={child.href}
                                              onClick={() => setOpenPanel(null)}
                                              className={cn(
                                                "block rounded-lg px-3 py-2 text-[13px] font-medium transition",
                                                childActive
                                                  ? "bg-[#C4A35A]/15 text-[#1E4A85]"
                                                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"
                                              )}
                                            >
                                              {child.label}
                                            </Link>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={firstItem.href}
                        className={cn(
                          "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-all",
                          active
                            ? "border-[#1E4A85]/20 bg-[#1E4A85] text-white shadow-md shadow-[#1E4A85]/25"
                            : "border-transparent text-[#1E4A85]/80 hover:border-[#1E4A85]/15 hover:bg-white hover:text-[#1E4A85] dark:text-slate-200 dark:hover:bg-white/10"
                        )}
                      >
                        {Icon && <Icon className="h-3.5 w-3.5" />}
                        <span>{t(`menu.${firstItem.id}`, firstItem.label)}</span>
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Quick find…"
                className="h-10 w-40 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:w-52 focus:border-[#C4A35A]/60 focus:ring-2 focus:ring-[#C4A35A]/20 lg:w-48 dark:border-slate-700 dark:bg-white/5 dark:text-white"
              />
            </div>

            <LanguageSwitcher variant="admin" className="hidden sm:flex" />

            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#1E4A85] shadow-sm transition hover:border-[#C4A35A]/40 hover:bg-[#C4A35A]/10 dark:border-white/10 dark:bg-white/5 dark:text-[#E8D5A3]"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => togglePanel("notifications")}
                aria-expanded={openPanel === "notifications"}
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition",
                  openPanel === "notifications"
                    ? "border-[#1E4A85] bg-[#1E4A85] text-white"
                    : "border-slate-200 bg-white text-[#1E4A85] hover:border-[#C4A35A]/40 hover:bg-[#C4A35A]/10 dark:border-white/10 dark:bg-white/5 dark:text-[#E8D5A3]"
                )}
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C4A35A] px-1 text-[10px] font-bold text-[#0B132B] ring-2 ring-[#F7F9FC] dark:ring-[#0F172A]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {openPanel === "notifications" && (
                <div
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-[80] w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-12px_rgba(11,31,58,0.35)] dark:border-slate-700 dark:bg-slate-900"
                  role="dialog"
                  aria-label="Notifications"
                >
                  <div className="flex items-center justify-between bg-gradient-to-r from-[#0B1F3A] to-[#1E4A85] px-4 py-3 text-white">
                    <div>
                      <h3 className="text-sm font-bold">Notifications</h3>
                      <p className="text-[11px] text-white/65">
                        {unreadCount} unread update{unreadCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenPanel(null)}
                      className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-[min(70vh,28rem)] overflow-y-auto p-2">
                    {notifLoading && !notifications.length ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-7 w-7 animate-spin text-[#1E4A85]" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-12 text-center text-sm text-slate-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <Link
                          key={n.id}
                          href={n.href}
                          onClick={() => {
                            markAsSeen(n.id);
                            setOpenPanel(null);
                          }}
                          className={cn(
                            "mb-1 flex gap-3 rounded-xl p-3 transition hover:bg-slate-50 dark:hover:bg-white/5",
                            n.unread && "bg-[#1E4A85]/[0.06]"
                          )}
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                            <NotificationIcon type={n.type} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {n.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                              {n.message}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {timeAgo(n.createdAt)}
                            </p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                type="button"
                onClick={() => togglePanel("profile")}
                aria-expanded={openPanel === "profile"}
                className={cn(
                  "flex items-center gap-2 rounded-xl border py-1.5 pl-1.5 pr-2.5 shadow-sm transition sm:pr-3",
                  openPanel === "profile"
                    ? "border-[#1E4A85] bg-[#1E4A85] text-white"
                    : "border-slate-200 bg-white text-[#0B1F3A] hover:border-[#C4A35A]/40 dark:border-white/10 dark:bg-white/5 dark:text-white"
                )}
                aria-label="User menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#C4A35A] to-[#A8893E] text-sm font-bold text-[#0B132B] ring-2 ring-[#C4A35A]/25">
                  {user?.fullName?.charAt(0).toUpperCase() || "U"}
                </span>
                <div className="hidden text-left lg:block">
                  <p
                    className={cn(
                      "max-w-[120px] truncate text-xs font-bold leading-tight",
                      openPanel === "profile" ? "text-white" : "text-[#0B1F3A] dark:text-white"
                    )}
                  >
                    {user?.fullName || "User"}
                  </p>
                  <p
                    className={cn(
                      "text-[10px]",
                      openPanel === "profile"
                        ? "text-[#E8D5A3]"
                        : "text-[#C4A35A]"
                    )}
                  >
                    {user?.roleName || "User"}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "hidden h-3.5 w-3.5 transition lg:block",
                    openPanel === "profile"
                      ? "rotate-180 text-white/80"
                      : "text-slate-400"
                  )}
                />
              </button>

              {openPanel === "profile" && (
                <div
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-[80] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-12px_rgba(11,31,58,0.35)] dark:border-slate-700 dark:bg-slate-900"
                  role="menu"
                >
                  <div className="bg-gradient-to-r from-[#0B1F3A] to-[#1E4A85] px-4 py-3.5 text-white">
                    <p className="text-sm font-bold">{user?.fullName || "User"}</p>
                    <p className="truncate text-xs text-white/65">
                      {user?.email || ""}
                    </p>
                    {user?.franchiseId && (
                      <p className="mt-1 text-[10px] text-[#E8D5A3]">
                        Franchise #{user.franchiseId}
                      </p>
                    )}
                  </div>
                  <div className="py-1.5">
                    <Link
                      href="/profile"
                      onClick={() => setOpenPanel(null)}
                      role="menuitem"
                      className="mx-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E4A85]/10 text-[#1E4A85]">
                        <User className="h-4 w-4" />
                      </span>
                      Profile
                    </Link>
                    <Link
                      href="/account"
                      onClick={() => setOpenPanel(null)}
                      role="menuitem"
                      className="mx-1.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E4A85]/10 text-[#1E4A85]">
                        <Settings className="h-4 w-4" />
                      </span>
                      Account & Password
                    </Link>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      type="button"
                      onClick={logout}
                      role="menuitem"
                      className="mx-1.5 flex w-[calc(100%-0.75rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/40">
                        <LogOut className="h-4 w-4" />
                      </span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
