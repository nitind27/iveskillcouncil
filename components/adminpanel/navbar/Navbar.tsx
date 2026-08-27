"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Hash,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { StudentProfileDrawer } from "@/components/students/StudentProfileDrawer";
import { ROLES } from "@/lib/permissions";

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

type OpenPanel = null | "notifications" | "profile" | "search";

const iconBtn =
  "flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-[#1E4A85] shadow-sm transition hover:border-[#C4A35A]/45 hover:bg-[#C4A35A]/8 dark:border-white/10 dark:bg-white/5 dark:text-[#E8D5A3]";

export default function Navbar({ onSidebarToggle, user }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname() || "";
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [quickSearch, setQuickSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);
  const barRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const canSearchStudents =
    Number(user?.roleId) === ROLES.SUPER_ADMIN ||
    Number(user?.roleId) === ROLES.ADMIN ||
    Number(user?.roleId) === ROLES.SUB_ADMIN;

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(quickSearch.trim()), 280);
    return () => window.clearTimeout(t);
  }, [quickSearch]);

  const { data: lookupData, isLoading: lookupLoading } = useSWR<{
    items: Array<{
      id: string;
      studentCode: string;
      fullName: string;
      email: string;
      courseName: string | null;
      franchiseName: string;
    }>;
  }>(
    canSearchStudents && debouncedSearch.length >= 2
      ? `/api/students/lookup?q=${encodeURIComponent(debouncedSearch)}`
      : null,
    fetcher,
    { keepPreviousData: true }
  );
  const lookupItems = lookupData?.items ?? [];
  const showLookup =
    canSearchStudents &&
    quickSearch.trim().length >= 2 &&
    (openPanel === "search" || quickSearch.length > 0);

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

  useEffect(() => {
    if (openPanel === "search") {
      searchInputRef.current?.focus();
    }
  }, [openPanel]);

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

  const initials = useMemo(() => {
    const name = user?.fullName?.trim() || "U";
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 1).toUpperCase();
  }, [user?.fullName]);

  return (
    <>
    <header ref={barRef} className="sticky top-0 z-[60] w-full shrink-0">
      <div className="relative border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-[#0F172A]/95">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C4A35A]/70 to-transparent" />

        <div className="relative flex h-14 items-center justify-between gap-2 px-3 sm:h-[3.75rem] sm:gap-3 sm:px-4 lg:px-5">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onSidebarToggle}
              className={cn(iconBtn, "lg:hidden")}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 hidden sm:block">
              <p className="truncate text-[13px] font-bold tracking-tight text-[#0B1F3A] dark:text-white">
                {t("common.adminPanel", "Admin Panel")}
              </p>
              {user?.roleName && (
                <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {user.roleName}
                  {user.franchiseId ? " · Franchise" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
            {/* Desktop search — Student ID */}
            <div className="relative hidden lg:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={quickSearch}
                onChange={(e) => {
                  setQuickSearch(e.target.value);
                  setOpenPanel("search");
                }}
                onFocus={() => setOpenPanel("search")}
                placeholder={
                  canSearchStudents
                    ? t("nav.searchStudent", "Student ID…")
                    : t("nav.search", "Search…")
                }
                className="h-9 w-40 rounded-xl border border-slate-200/90 bg-slate-50/80 py-1.5 pl-8 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:w-56 focus:border-[#1E4A85]/30 focus:bg-white focus:ring-2 focus:ring-[#1E4A85]/10 xl:w-48 dark:border-slate-700 dark:bg-white/5 dark:text-white"
              />
              {showLookup && openPanel === "search" && (
                <div className="absolute right-0 top-[calc(100%+0.45rem)] z-[80] w-[min(22rem,calc(100vw-1.25rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <p className="border-b border-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#1E4A85]/70">
                    Students
                  </p>
                  {lookupLoading && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-[#1E4A85]" />
                    </div>
                  )}
                  {!lookupLoading && !lookupItems.length && (
                    <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                      No student found for “{debouncedSearch}”
                    </p>
                  )}
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {lookupItems.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileStudentId(s.id);
                            setOpenPanel(null);
                            setQuickSearch("");
                          }}
                          className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-[#1E4A85]/5"
                        >
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E4A85]/10 font-mono text-[10px] font-bold text-[#1E4A85]">
                            <Hash className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-[#0B1F3A]">
                              {s.fullName}
                            </span>
                            <span className="mt-0.5 block font-mono text-[10px] font-bold text-[#C4A35A]">
                              {s.studentCode}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                              {s.courseName || "No course"} · {s.franchiseName}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Mobile/tablet search toggle */}
            <div className="relative lg:hidden">
              <button
                type="button"
                onClick={() => togglePanel("search")}
                className={cn(
                  iconBtn,
                  openPanel === "search" && "border-[#1E4A85] bg-[#1E4A85] text-white"
                )}
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
              {openPanel === "search" && (
                <div className="absolute right-0 top-[calc(100%+0.45rem)] z-[80] w-[min(20rem,calc(100vw-1.25rem))] rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      ref={searchInputRef}
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                      placeholder={
                        canSearchStudents
                          ? "Student ID e.g. STU-2026-…"
                          : t("nav.search", "Search…")
                      }
                      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-[#1E4A85]/30 focus:ring-2 focus:ring-[#1E4A85]/10 dark:border-slate-700 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                  {canSearchStudents && quickSearch.trim().length >= 2 && (
                    <ul className="mt-2 max-h-60 overflow-y-auto border-t border-slate-100 pt-1">
                      {lookupLoading && (
                        <li className="flex justify-center py-3">
                          <Loader2 className="h-4 w-4 animate-spin text-[#1E4A85]" />
                        </li>
                      )}
                      {!lookupLoading &&
                        lookupItems.map((s) => (
                          <li key={s.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setProfileStudentId(s.id);
                                setOpenPanel(null);
                                setQuickSearch("");
                              }}
                              className="w-full rounded-lg px-2 py-2 text-left hover:bg-[#1E4A85]/5"
                            >
                              <span className="block text-sm font-semibold">{s.fullName}</span>
                              <span className="font-mono text-[10px] text-[#C4A35A]">
                                {s.studentCode}
                              </span>
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <LanguageSwitcher variant="admin" className="hidden md:flex" />

            <button
              type="button"
              onClick={toggleTheme}
              className={iconBtn}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Chat */}
            <Link
              href="/chat"
              className={cn(
                iconBtn,
                "relative",
                (pathname === "/chat" || pathname.startsWith("/chat/")) &&
                  "border-[#1E4A85] bg-[#1E4A85] text-white hover:border-[#1E4A85] hover:bg-[#1E4A85]"
              )}
              aria-label={t("nav.chat", "Chat")}
              title={t("nav.chat", "Chat")}
            >
              <MessageCircle className="h-4 w-4" />
            </Link>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => togglePanel("notifications")}
                aria-expanded={openPanel === "notifications"}
                className={cn(
                  iconBtn,
                  "relative",
                  openPanel === "notifications" &&
                    "border-[#1E4A85] bg-[#1E4A85] text-white hover:bg-[#1E4A85]"
                )}
                aria-label={t("nav.notifications", "Notifications")}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[#C4A35A] px-1 text-[9px] font-bold text-[#0B132B] ring-2 ring-white dark:ring-[#0F172A]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {openPanel === "notifications" && (
                <div
                  className="absolute right-0 top-[calc(100%+0.45rem)] z-[80] w-[min(20rem,calc(100vw-1.25rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
                  role="dialog"
                  aria-label="Notifications"
                >
                  <div className="flex items-center justify-between bg-[#1E4A85] px-4 py-3 text-white">
                    <div>
                      <h3 className="text-sm font-bold">
                        {t("nav.notifications", "Notifications")}
                      </h3>
                      <p className="text-[11px] text-white/65">
                        {unreadCount} unread
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
                  <div className="max-h-[min(70vh,26rem)] overflow-y-auto p-1.5">
                    {notifLoading && !notifications.length ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-[#1E4A85]" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-10 text-center text-sm text-slate-500">
                        {t("nav.noNotifications", "No notifications")}
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
                            "mb-0.5 flex gap-2.5 rounded-xl p-2.5 transition hover:bg-slate-50 dark:hover:bg-white/5",
                            n.unread && "bg-[#1E4A85]/[0.05]"
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
                  "flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white py-1 pl-1 pr-1.5 shadow-sm transition sm:pr-2.5 dark:border-white/10 dark:bg-white/5",
                  openPanel === "profile" &&
                    "border-[#1E4A85] bg-[#1E4A85] dark:bg-[#1E4A85]"
                )}
                aria-label="User menu"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#C4A35A] to-[#A8893E] text-[11px] font-bold text-[#0B132B] sm:h-8 sm:w-8 sm:text-xs">
                  {initials}
                </span>
                <div className="hidden min-w-0 text-left xl:block">
                  <p
                    className={cn(
                      "max-w-[100px] truncate text-xs font-bold leading-tight",
                      openPanel === "profile"
                        ? "text-white"
                        : "text-[#0B1F3A] dark:text-white"
                    )}
                  >
                    {user?.fullName || "User"}
                  </p>
                  <p
                    className={cn(
                      "max-w-[100px] truncate text-[10px]",
                      openPanel === "profile" ? "text-[#E8D5A3]" : "text-[#C4A35A]"
                    )}
                  >
                    {user?.roleName || "User"}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "hidden h-3.5 w-3.5 xl:block",
                    openPanel === "profile" ? "text-white/80" : "text-slate-400"
                  )}
                />
              </button>

              {openPanel === "profile" && (
                <div
                  className="absolute right-0 top-[calc(100%+0.45rem)] z-[80] w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
                  role="menu"
                >
                  <div className="bg-[#1E4A85] px-4 py-3 text-white">
                    <p className="text-sm font-bold">{user?.fullName || "User"}</p>
                    <p className="truncate text-xs text-white/65">{user?.email || ""}</p>
                  </div>
                  <div className="space-y-0.5 p-1.5">
                    {/* Language on mobile inside profile */}
                    <div className="border-b border-slate-100 px-2 py-2 md:hidden dark:border-slate-800">
                      <LanguageSwitcher variant="admin" />
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setOpenPanel(null)}
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E4A85]/10 text-[#1E4A85]">
                        <User className="h-4 w-4" />
                      </span>
                      {t("nav.profile", "Profile")}
                    </Link>
                    <Link
                      href="/account"
                      onClick={() => setOpenPanel(null)}
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E4A85]/10 text-[#1E4A85]">
                        <Settings className="h-4 w-4" />
                      </span>
                      {t("nav.settings", "Account")}
                    </Link>
                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                    <button
                      type="button"
                      onClick={logout}
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <LogOut className="h-4 w-4" />
                      </span>
                      {t("nav.logout", "Logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
      <StudentProfileDrawer
        open={!!profileStudentId}
        studentId={profileStudentId}
        onClose={() => setProfileStudentId(null)}
      />
    </>
  );
}
