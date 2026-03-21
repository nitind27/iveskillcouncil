"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getMenuForRole } from "@/lib/role-menu-config";
import { fetcher } from "@/lib/fetcher";

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
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    case "offer_application":
      return <Tag className="w-4 h-4 text-amber-500" />;
    case "franchise_inquiry":
      return <Building2 className="w-4 h-4 text-emerald-500" />;
    case "pending_franchise":
      return <FileCheck className="w-4 h-4 text-orange-500" />;
    case "certificate_request":
      return <Award className="w-4 h-4 text-purple-500" />;
    case "feedback":
      return <MessageCircle className="w-4 h-4 text-cyan-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
}

export default function Navbar({ onSidebarToggle, user }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const menuSections = getMenuForRole(user?.roleId ?? 1);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notificationRef.current && !notificationRef.current.contains(target)) setIsNotificationOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setIsProfileOpen(false);
      const clickedInsideAnyMenu = Object.values(menuRefs.current).some((ref) => ref?.contains(target));
      if (!clickedInsideAnyMenu) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (sectionId: string) => {
    setOpenMenuId((prev) => (prev === sectionId ? null : sectionId));
  };

  const { data: notifData, isLoading: notifLoading } = useSWR<{ notifications: NotificationItem[] }>(
    user ? "/api/notifications" : null,
    fetcher,
    { refreshInterval: 60000, revalidateOnFocus: true }
  );

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
        localStorage.setItem(`${NOTIFICATIONS_SEEN_KEY}-${user?.id ?? "default"}`, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const allNotifications = notifData?.notifications ?? [];
  const notifications = allNotifications.filter((n) => !seenIds.has(n.id));
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-50 w-full h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-95 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-6">
          <button
            onClick={onSidebarToggle}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <nav className="hidden lg:flex items-center gap-1">
            {menuSections.map((section) => {
              if (!section.items.length) return null;
              const isDropdown = section.items.length > 1;
              const isOpen = openMenuId === section.id;
              const firstItem = section.items[0];
              const Icon = firstItem.icon;

              return (
                <div
                  key={section.id}
                  ref={(el) => { menuRefs.current[section.id] = el; }}
                  className="relative"
                >
                  {isDropdown ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleMenu(section.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          "text-gray-700 dark:text-gray-300",
                          "hover:bg-gray-100 dark:hover:bg-gray-700",
                          isOpen && "bg-gray-100 dark:bg-gray-700"
                        )}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{section.label || firstItem.label}</span>
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isOpen && "rotate-180")} />
                      </button>
                      {isOpen && (
                        <div className="absolute top-full left-0 mt-1 pt-1 min-w-[220px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                          {section.items.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <Link
                                key={item.id}
                                href={item.href}
                                onClick={() => setOpenMenuId(null)}
                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group text-left"
                              >
                                {ItemIcon && (
                                  <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-primary/10 transition-colors">
                                    <ItemIcon className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-primary" />
                                  </div>
                                )}
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</span>
                                {item.badge && (
                                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{item.badge}</span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={firstItem.href}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        "text-gray-700 dark:text-gray-300",
                        "hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{firstItem.label}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
              )}
            </button>
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</h3>
                  <button onClick={() => setIsNotificationOpen(false)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-[28rem] overflow-y-auto p-2">
                  {notifLoading && !notifications.length ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        href={n.href}
                        onClick={() => {
                          markAsSeen(n.id);
                          setIsNotificationOpen(false);
                        }}
                        className={cn(
                          "flex gap-3 p-3 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/80 block",
                          n.unread && "bg-blue-50/60 dark:bg-blue-900/20"
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <NotificationIcon type={n.type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">{user?.fullName?.charAt(0).toUpperCase() || "U"}</span>
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.fullName || "User"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.roleName || "User"}</p>
              </div>
              <ChevronDown className={cn("hidden lg:block w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200", isProfileOpen && "rotate-180")} />
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{user?.fullName || "User"}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ""}</p>
                  {user?.franchiseId && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Franchise ID: {user.franchiseId}</p>}
                </div>
                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left text-gray-700 dark:text-gray-300"
                  >
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setIsProfileOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left text-gray-700 dark:text-gray-300"
                  >
                    <Settings className="w-4 h-4" /> Account & Password
                  </Link>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                  <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left text-red-600 dark:text-red-400">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
