/**
 * Role-based sidebar menu configuration.
 * Single source of truth for which menu items each role sees.
 * Multi-tenant: SUB_ADMIN sees only their franchise scope; ADMIN/SUPER_ADMIN see global.
 */

import {
  LayoutDashboard,
  Package,
  Building2,
  Shield,
  FileCheck,
  Settings,
  GraduationCap,
  Award,
  Calendar,
  Image,
  FileText,
  BarChart3,
  IndianRupee,
  ClipboardCheck,
  Users,
  Wallet,
  BookOpen,
  MessageSquare,
  UserCheck,
  Monitor,
  Tag,
  HelpCircle,
  Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROLES } from "./permissions";

export interface RoleMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string;
  children?: RoleMenuItem[];
}

export interface RoleMenuSection {
  id: string;
  label?: string;
  items: RoleMenuItem[];
}

/** Sidebar menu for SUPER_ADMIN */
const SUPER_ADMIN_MENU: RoleMenuSection[] = [
  { id: "dashboard", label: "Dashboard", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }] },
  {
    id: "management",
    label: "Management",
    items: [
      { id: "manage-plans", label: "Manage Plans", icon: Package, href: "/subscription/plans" },
      { id: "manage-courses", label: "Manage Courses", icon: BookOpen, href: "/dashboard/courses" },
      { id: "manage-franchises", label: "Manage Franchises", icon: Building2, href: "/franchises" },
      { id: "franchise-applications", label: "Franchise Applications", icon: FileCheck, href: "/dashboard/franchise-applications" },
      { id: "all-students", label: "All Students", icon: GraduationCap, href: "/students" },
      { id: "fees-management", label: "Fees Management", icon: IndianRupee, href: "/fees" },
      { id: "approvals", label: "Approvals", icon: FileCheck, href: "/franchises/pending" },
      { id: "course-enquiries", label: "Course Enquiries", icon: MessageSquare, href: "/dashboard/enquiries" },
      { id: "franchise-inquiries", label: "Franchise Inquiries", icon: Building2, href: "/dashboard/franchise-inquiries" },
      { id: "offer-applications", label: "Offer Applications", icon: Tag, href: "/dashboard/offer-applications" },
      { id: "support-requests", label: "Support Requests", icon: HelpCircle, href: "/dashboard/support" },
      { id: "announcements", label: "Announcements", icon: Megaphone, href: "/announcements" },
    ],
  },
  { id: "analytics", label: "Analytics", items: [{ id: "reports", label: "Reports", icon: BarChart3, href: "/reports" }] },
  {
    id: "communication",
    label: "Communication",
    items: [
      { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      { id: "userpanel-settings", label: "User Panel Settings", icon: Monitor, href: "/dashboard/userpanel" },
      { id: "permissions", label: "Role Permissions", icon: Shield, href: "/dashboard/permissions" },
      { id: "global-settings", label: "Global Settings", icon: Settings, href: "/settings" },
    ],
  },
];

/** Sidebar menu for ADMIN (Institute Admin) - Same as SUPER_ADMIN for full functionality */
const ADMIN_MENU: RoleMenuSection[] = SUPER_ADMIN_MENU;

/** Sidebar menu for SUB_ADMIN (Franchise Owner) */
const SUB_ADMIN_MENU: RoleMenuSection[] = [
  { id: "dashboard", label: "Dashboard", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }] },
  {
    id: "management",
    label: "Management",
    items: [
      { id: "my-courses", label: "My Courses", icon: BookOpen, href: "/dashboard/franchise-courses" },
      { id: "my-students", label: "My Students", icon: GraduationCap, href: "/students" },
      { id: "fees-management", label: "Fees Management", icon: IndianRupee, href: "/fees" },
      { id: "attendance", label: "Attendance", icon: ClipboardCheck, href: "/attendance/manual" },
      { id: "staff-management", label: "Staff Management", icon: Users, href: "/staff" },
      { id: "certificate-requests", label: "Certificate Requests", icon: Award, href: "/certificates/requests" },
      { id: "announcements", label: "Announcements", icon: Megaphone, href: "/announcements" },
    ],
  },
  { id: "analytics", label: "Analytics", items: [{ id: "reports", label: "Reports", icon: BarChart3, href: "/reports" }] },
  {
    id: "communication",
    label: "Communication",
    items: [
      { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [{ id: "salary", label: "Salary", icon: Wallet, href: "/staff/salary" }],
  },
];

/** Sidebar menu for STUDENT */
const STUDENT_MENU: RoleMenuSection[] = [
  { id: "dashboard", label: "Dashboard", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }] },
  {
    id: "management",
    label: "Management",
    items: [
      { id: "my-course", label: "My Course", icon: BookOpen, href: "/my-course" },
      { id: "my-fees", label: "My Fees", icon: IndianRupee, href: "/my-fees" },
      { id: "attendance", label: "Attendance", icon: ClipboardCheck, href: "/attendance" },
      { id: "feedback", label: "Feedback", icon: MessageSquare, href: "/feedback" },
      { id: "certificate", label: "Certificate", icon: Award, href: "/certificate" },
    ],
  },
  { id: "analytics", label: "Analytics", items: [] },
  { id: "settings", label: "Settings", items: [] },
];

/** Sidebar menu for STAFF */
const STAFF_MENU: RoleMenuSection[] = [
  { id: "dashboard", label: "Dashboard", items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }] },
  {
    id: "management",
    label: "Management",
    items: [
      { id: "attendance", label: "Attendance", icon: ClipboardCheck, href: "/attendance" },
      { id: "assigned-students", label: "Assigned Students", icon: UserCheck, href: "/assigned-students" },
    ],
  },
  { id: "analytics", label: "Analytics", items: [] },
  {
    id: "settings",
    label: "Settings",
    items: [{ id: "salary", label: "Salary", icon: Wallet, href: "/staff/salary" }],
  },
];

const ROLE_MENU_MAP: Record<number, RoleMenuSection[]> = {
  [ROLES.SUPER_ADMIN]: SUPER_ADMIN_MENU,
  [ROLES.ADMIN]: ADMIN_MENU,
  [ROLES.SUB_ADMIN]: SUB_ADMIN_MENU,
  [ROLES.STUDENT]: STUDENT_MENU,
  [ROLES.STAFF]: STAFF_MENU,
};

/**
 * Get sidebar menu sections for a role.
 * Used for role-based UI; data isolation is enforced in API layer.
 */
export function getMenuForRole(roleId: number): RoleMenuSection[] {
  return ROLE_MENU_MAP[roleId] ?? [{
    id: "main",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" }],
  }];
}

/** Paths allowed per role (for middleware/layout). Empty array = no access. */
export const ROLE_ALLOWED_PATHS: Record<number, string[]> = {
  [ROLES.SUPER_ADMIN]: [
    "/dashboard", "/subscription", "/franchises", "/settings", "/dashboard/permissions", "/dashboard/userpanel", "/dashboard/enquiries", "/dashboard/offer-applications",
    "/dashboard/franchise-applications", "/dashboard/courses",
    "/students", "/certificates", "/fees", "/attendance", "/staff", "/events", "/blogs", "/gallery", "/reports",
    "/profile", "/account", "/chat",
  ],
  [ROLES.ADMIN]: [
    "/dashboard", "/subscription", "/franchises", "/settings", "/dashboard/permissions", "/dashboard/userpanel", "/dashboard/enquiries", "/dashboard/offer-applications", "/dashboard/support",
    "/dashboard/franchise-applications", "/dashboard/courses",
    "/students", "/certificates", "/fees", "/attendance", "/staff", "/events", "/blogs", "/gallery", "/reports",
    "/profile", "/account", "/chat",
  ],
  [ROLES.SUB_ADMIN]: [
    "/dashboard", "/dashboard/franchise-courses", "/students", "/fees", "/attendance", "/staff", "/certificates", "/reports",
    "/announcements", "/profile", "/account", "/chat",
  ],
  [ROLES.STUDENT]: [
    "/dashboard", "/my-course", "/my-fees", "/attendance", "/feedback", "/certificate",
    "/profile", "/account",
  ],
  [ROLES.STAFF]: [
    "/dashboard", "/attendance", "/assigned-students", "/staff",
    "/profile", "/account",
  ],
};

/** Check if role can access path (path must start with one of allowed prefixes). */
export function canRoleAccessPath(roleId: number, pathname: string): boolean {
  const numRoleId = Number(roleId) || 0;
  const normalizedPath = (pathname || "").replace(/\/$/, "").trim() || "/";

  // SUPER_ADMIN and ADMIN have access to everything
  if (numRoleId === ROLES.SUPER_ADMIN || numRoleId === ROLES.ADMIN) return true;

  // Dashboard root is allowed for every authenticated user
  if (normalizedPath === "/dashboard") return true;

  // Public/special paths — always allow
  if (normalizedPath.startsWith("/f/")) return true;
  if (normalizedPath.startsWith("/api/")) return true;
  if (normalizedPath === "/403" || normalizedPath === "/404") return true;

  const allowed = ROLE_ALLOWED_PATHS[numRoleId];
  if (!allowed || allowed.length === 0) return false;

  const pathForCheck = (pathname || "").replace(/\/$/, "") || "/";
  return allowed.some(
    (prefix) => pathForCheck === prefix || pathForCheck.startsWith(prefix + "/")
  );
}
