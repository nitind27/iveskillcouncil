"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
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
  LayoutDashboard,
  Users,
  Package,
  FileText,
  BarChart3,
  ShoppingCart,
  Mail,
  Calendar,
  CreditCard,
  Shield,
  Database,
  TrendingUp,
  Layers,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

interface MenuItem {
  label: string;
  href?: string;
  icon?: React.ElementType;
  children?: SubMenuItem[];
  drawer?: DrawerContent;
}

interface SubMenuItem {
  label: string;
  href: string;
  icon?: React.ElementType;
  description?: string;
}

interface DrawerContent {
  title: string;
  sections: {
    title: string;
    items: SubMenuItem[];
  }[];
}

const notifications: Notification[] = [
  { id: "1", title: "New user registered", message: "John Doe has joined the platform", time: "2 minutes ago", unread: true },
  { id: "2", title: "Order completed", message: "Order #1234 has been completed", time: "1 hour ago", unread: true },
  { id: "3", title: "System update", message: "New features have been deployed", time: "3 hours ago", unread: false },
  { id: "4", title: "Payment received", message: "Payment of $1,234 received", time: "1 day ago", unread: false },
];

const menuItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Management",
    icon: Layers,
    children: [
      { label: "Users", href: "/users", icon: Users, description: "Manage all users" },
      { label: "Products", href: "/products", icon: Package, description: "Product catalog" },
      { label: "Orders", href: "/orders", icon: ShoppingCart, description: "Order management" },
    ],
  },
  {
    label: "Analytics",
    icon: BarChart3,
    drawer: {
      title: "Analytics & Reports",
      sections: [
        {
          title: "Overview",
          items: [
            { label: "Dashboard Analytics", href: "/analytics/dashboard", icon: BarChart3, description: "Real-time analytics" },
            { label: "Revenue Reports", href: "/analytics/revenue", icon: TrendingUp, description: "Financial insights" },
            { label: "User Analytics", href: "/analytics/users", icon: Users, description: "User behavior data" },
          ],
        },
        {
          title: "Reports",
          items: [
            { label: "Sales Report", href: "/analytics/sales", icon: FileText, description: "Sales performance" },
            { label: "Export Data", href: "/analytics/export", icon: Database, description: "Download reports" },
          ],
        },
      ],
    },
  },
  {
    label: "Settings",
    icon: Settings,
    children: [
      { label: "General", href: "/settings/general", icon: Settings, description: "Basic settings" },
      { label: "Security", href: "/settings/security", icon: Shield, description: "Security & privacy" },
      { label: "Billing", href: "/settings/billing", icon: CreditCard, description: "Payment & billing" },
    ],
  },
];

export default function Navbar({ onSidebarToggle, user }: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setIsNotificationOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
      Object.values(menuRefs.current).forEach((ref) => {
        if (ref && !ref.contains(event.target as Node)) setHoveredMenu(null);
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuEnter = (menuLabel: string) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHoveredMenu(menuLabel);
  };
  const handleMenuLeave = () => {
    const timeout = setTimeout(() => setHoveredMenu(null), 50);
    setHoverTimeout(timeout);
  };

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
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isHovered = hoveredMenu === item.label;
              const hasChildren = item.children && item.children.length > 0;
              const hasDrawer = item.drawer;
              return (
                <div
                  key={item.label}
                  ref={(el) => { menuRefs.current[item.label] = el; }}
                  className="relative"
                  onMouseEnter={() => handleMenuEnter(item.label)}
                  onMouseLeave={handleMenuLeave}
                >
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        "text-gray-700 dark:text-gray-300",
                        "hover:bg-gray-100 dark:hover:bg-gray-700",
                        isHovered && "bg-gray-100 dark:bg-gray-700"
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <button
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        "text-gray-700 dark:text-gray-300",
                        "hover:bg-gray-100 dark:hover:bg-gray-700",
                        isHovered && "bg-gray-100 dark:bg-gray-700"
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span>{item.label}</span>
                      {(hasChildren || hasDrawer) && (
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", isHovered && "rotate-180")} />
                      )}
                    </button>
                  )}
                  {isHovered && hasChildren && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                          >
                            {ChildIcon && (
                              <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-primary/10 transition-colors">
                                <ChildIcon className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-primary" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{child.label}</p>
                              {child.description && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{child.description}</p>
                              )}
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                  {isHovered && hasDrawer && (
                    <div className="absolute top-full left-0 mt-1 w-[600px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 z-50">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{item.drawer!.title}</h3>
                      <div className="grid grid-cols-2 gap-6">
                        {item.drawer!.sections.map((section, sectionIndex) => (
                          <div key={sectionIndex}>
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">{section.title}</h4>
                            <div className="space-y-1">
                              {section.items.map((subItem) => {
                                const SubIcon = subItem.icon;
                                return (
                                  <Link
                                    key={subItem.label}
                                    href={subItem.href}
                                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                                  >
                                    {SubIcon && (
                                      <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-primary/10 transition-colors">
                                        <SubIcon className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-primary" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">{subItem.label}</p>
                                      {subItem.description && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subItem.description}</p>
                                      )}
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</h3>
                  <button onClick={() => setIsNotificationOpen(false)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto p-2">
                  {notifications.map((n) => (
                    <div key={n.id} className={cn("p-4 rounded-lg", n.unread && "bg-blue-50/50 dark:bg-blue-900/20")}>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.time}</p>
                    </div>
                  ))}
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
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left text-gray-700 dark:text-gray-300">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
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
