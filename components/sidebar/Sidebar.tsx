"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  BarChart3,
  ShoppingCart,
  Package,
  Bell,
  Mail,
  Calendar,
  ChevronRight,
  ChevronDown,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Building2,
  GraduationCap,
  BookOpen,
  CreditCard,
  ClipboardCheck,
  Award,
  UserCheck,
  IndianRupee,
  TrendingUp,
  Shield,
  FileCheck,
  MessageSquare,
  BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarSection, SidebarMenuItem } from "@/types/sidebar";

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
  } | null;
}

const menuSections: SidebarSection[] = [
  {
    id: "main",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
      },
      {
        id: "analytics",
        label: "Analytics & Reports",
        icon: BarChart3,
        href: "/analytics",
      },
    ],
  },
  {
    id: "subscription",
    label: "Subscription Management",
    items: [
      {
        id: "plans",
        label: "Subscription Plans",
        icon: Shield,
        href: "/subscription/plans",
      },
      {
        id: "franchises",
        label: "Franchises",
        icon: Building2,
        href: "/franchises",
        children: [
          {
            id: "all-franchises",
            label: "All Franchises",
            icon: Building2,
            href: "/franchises",
          },
          {
            id: "pending-approvals",
            label: "Pending Approvals",
            icon: FileCheck,
            href: "/franchises/pending",
          },
        ],
      },
    ],
  },
  {
    id: "academics",
    label: "Academics",
    items: [
      {
        id: "courses",
        label: "Courses",
        icon: BookOpen,
        href: "/courses",
      },
      {
        id: "students",
        label: "Students",
        icon: GraduationCap,
        href: "/students",
      },
      {
        id: "fees",
        label: "Fee Management",
        icon: IndianRupee,
        href: "/fees",
        children: [
          {
            id: "fee-structure",
            label: "Fee Structure",
            icon: CreditCard,
            href: "/fees/structure",
          },
          {
            id: "payments",
            label: "Payments",
            icon: IndianRupee,
            href: "/fees/payments",
          },
          {
            id: "pending-fees",
            label: "Pending Fees",
            icon: TrendingUp,
            href: "/fees/pending",
          },
        ],
      },
    ],
  },
  {
    id: "attendance",
    label: "Attendance",
    items: [
      {
        id: "attendance-manual",
        label: "Manual Attendance",
        icon: ClipboardCheck,
        href: "/attendance/manual",
      },
      {
        id: "attendance-face",
        label: "Face Recognition",
        icon: UserCheck,
        href: "/attendance/face-recognition",
      },
      {
        id: "attendance-reports",
        label: "Attendance Reports",
        icon: FileText,
        href: "/attendance/reports",
      },
    ],
  },
  {
    id: "certificates",
    label: "Certificates",
    items: [
      {
        id: "certificate-requests",
        label: "Certificate Requests",
        icon: Award,
        href: "/certificates/requests",
      },
      {
        id: "certificates-issued",
        label: "Issued Certificates",
        icon: FileCheck,
        href: "/certificates/issued",
      },
    ],
  },
  {
    id: "staff",
    label: "Staff Management",
    items: [
      {
        id: "staff-list",
        label: "Staff Members",
        icon: Users,
        href: "/staff",
      },
      {
        id: "staff-salary",
        label: "Salary Management",
        icon: IndianRupee,
        href: "/staff/salary",
      },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    items: [
      {
        id: "notifications",
        label: "Notifications",
        icon: BellRing,
        href: "/notifications",
      },
      {
        id: "feedback",
        label: "Feedback & Complaints",
        icon: MessageSquare,
        href: "/feedback",
      },
      {
        id: "email-reminders",
        label: "Email Reminders",
        icon: Mail,
        href: "/email-reminders",
      },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      {
        id: "users",
        label: "User Management",
        icon: Users,
        href: "/users",
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
        href: "/settings",
        children: [
          {
            id: "general",
            label: "General Settings",
            icon: Settings,
            href: "/settings/general",
          },
          {
            id: "security",
            label: "Security",
            icon: Shield,
            href: "/settings/security",
          },
        ],
      },
    ],
  },
];

export default function Sidebar({
  isCollapsed,
  isMobileOpen,
  onMobileClose,
  onToggleCollapse,
  user,
}: SidebarProps) {
  const pathname = usePathname();
  const pn = pathname || "";
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Auto-expand parent items if child is active
    const activePaths = new Set<string>();
    menuSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const hasActiveChild = item.children.some(
            (child) => child.href === pn
          );
          if (hasActiveChild || item.href === pn) {
            activePaths.add(item.id);
          }
        }
      });
    });
    setExpandedItems(activePaths);
  }, [pn]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pn === href || pn.startsWith(href + "/");
  };

  const renderMenuItem = (item: SidebarMenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const active = isActive(item.href);
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <div key={item.id}>
          <button
            onClick={() => !isCollapsed && toggleExpanded(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              "text-sidebar-foreground",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              active && "bg-sidebar-accent text-sidebar-accent-foreground",
              isCollapsed && "justify-center",
              level > 0 && "pl-6"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <Icon className={cn("flex-shrink-0 text-sidebar-foreground", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left text-sm font-medium">
                  {item.label}
                </span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                    {item.badge}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-sidebar-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
                )}
              </>
            )}
          </button>
          {!isCollapsed && isExpanded && (
            <div className="mt-1 ml-4 space-y-1 border-l border-sidebar-border pl-4">
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
          if (isMobileOpen) {
            onMobileClose();
          }
        }}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "text-sidebar-foreground",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
          isCollapsed && "justify-center",
          level > 0 && "pl-6"
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className={cn("flex-shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
        {!isCollapsed && (
          <>
            <span className="flex-1 text-sm">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
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
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen",
          "bg-sidebar border-r border-sidebar-border",
          "transition-all duration-300 ease-in-out",
          "flex flex-col",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Franchise Institute
            </h2>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                onMobileClose();
              } else {
                onToggleCollapse();
              }
            }}
            className="lg:flex hidden items-center justify-center w-8 h-8 rounded-lg hover:bg-sidebar-accent transition-colors"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-sidebar-foreground" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-sidebar-foreground" />
            )}
          </button>
          <button
            onClick={onMobileClose}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-sidebar-accent transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4 text-sidebar-foreground" />
          </button>
        </div>

        {/* Sidebar Content */}
        <nav className="flex-1 overflow-y-auto sidebar-scrollbar p-4 space-y-6">
          {menuSections.map((section) => (
            <div key={section.id} className="space-y-1">
              {!isCollapsed && section.label && (
                <h3 className="px-3 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider mb-2">
                  {section.label}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => renderMenuItem(item))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-sidebar-border">
          {!isCollapsed && (
            <div className="px-3 py-2 text-xs text-sidebar-foreground/70">
              <p className="font-medium">Franchise Institute</p>
              <p className="text-xs">Management System v1.0.0</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

