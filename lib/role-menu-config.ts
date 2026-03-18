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
  DollarSign,
  ClipboardCheck,
  Users,
  Wallet,
  BookOpen,
  MessageSquare,
  UserCheck,
  Monitor,
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
  {
    id: "main",
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { id: "manage-plans", label: "Manage Plans", icon: Package, href: "/subscription/plans" },
      { id: "manage-franchises", label: "Manage Franchises", icon: Building2, href: "/franchises" },
      { id: "approvals", label: "Approvals", icon: FileCheck, href: "/franchises/pending" },
      { id: "userpanel-settings", label: "User Panel Settings", icon: Monitor, href: "/dashboard/userpanel" },
      { id: "course-enquiries", label: "Course Enquiries", icon: MessageSquare, href: "/dashboard/enquiries" },
      { id: "global-settings", label: "Global Settings", icon: Settings, href: "/settings" },
    ],
  },
];

/** Sidebar menu for ADMIN (Main Institute Admin) */
const ADMIN_MENU: RoleMenuSection[] = [
  {
    id: "main",
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { id: "franchises", label: "Franchises", icon: Building2, href: "/franchises" },
      { id: "students-all", label: "Students (All)", icon: GraduationCap, href: "/students" },
      { id: "certificates", label: "Certificates", icon: Award, href: "/certificates/requests" },
      { id: "events", label: "Events", icon: Calendar, href: "/events" },
      { id: "blogs", label: "Blogs", icon: FileText, href: "/blogs" },
      { id: "gallery", label: "Gallery", icon: Image, href: "/gallery" },
      { id: "reports", label: "Reports", icon: BarChart3, href: "/reports" },
    ],
  },
];

/** Sidebar menu for SUB_ADMIN (Franchise Owner) */
const SUB_ADMIN_MENU: RoleMenuSection[] = [
  {
    id: "main",
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { id: "my-students", label: "My Students", icon: GraduationCap, href: "/students" },
      { id: "fees-management", label: "Fees Management", icon: DollarSign, href: "/fees" },
      { id: "attendance", label: "Attendance", icon: ClipboardCheck, href: "/attendance/manual" },
      { id: "staff-management", label: "Staff Management", icon: Users, href: "/staff" },
      { id: "salary", label: "Salary", icon: Wallet, href: "/staff/salary" },
      { id: "certificate-requests", label: "Certificate Requests", icon: Award, href: "/certificates/requests" },
    ],
  },
];

/** Sidebar menu for STUDENT */
const STUDENT_MENU: RoleMenuSection[] = [
  {
    id: "main",
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { id: "my-course", label: "My Course", icon: BookOpen, href: "/my-course" },
      { id: "my-fees", label: "My Fees", icon: DollarSign, href: "/my-fees" },
      { id: "attendance", label: "Attendance", icon: ClipboardCheck, href: "/attendance" },
      { id: "feedback", label: "Feedback", icon: MessageSquare, href: "/feedback" },
      { id: "certificate", label: "Certificate", icon: Award, href: "/certificate" },
    ],
  },
];

/** Sidebar menu for STAFF */
const STAFF_MENU: RoleMenuSection[] = [
  {
    id: "main",
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
      { id: "attendance", label: "Attendance", icon: ClipboardCheck, href: "/attendance" },
      { id: "assigned-students", label: "Assigned Students", icon: UserCheck, href: "/assigned-students" },
      { id: "salary", label: "Salary", icon: Wallet, href: "/staff/salary" },
    ],
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
    "/dashboard", "/subscription", "/franchises", "/settings", "/dashboard/permissions", "/dashboard/userpanel", "/dashboard/enquiries",
  ],
  [ROLES.ADMIN]: [
    "/dashboard", "/franchises", "/students", "/certificates", "/events", "/blogs", "/gallery", "/reports",
  ],
  [ROLES.SUB_ADMIN]: [
    "/dashboard", "/students", "/fees", "/attendance", "/staff", "/certificates",
  ],
  [ROLES.STUDENT]: [
    "/dashboard", "/my-course", "/my-fees", "/attendance", "/feedback", "/certificate",
  ],
  [ROLES.STAFF]: [
    "/dashboard", "/attendance", "/assigned-students", "/staff",
  ],
};

/** Check if role can access path (path must start with one of allowed prefixes). */
export function canRoleAccessPath(roleId: number, pathname: string): boolean {
  const numRoleId = Number(roleId) || 0;
  const normalizedPath = (pathname || "").replace(/\/$/, "").trim() || "/";
  // SUPER_ADMIN (1) has access to all protected routes
  if (numRoleId === ROLES.SUPER_ADMIN) return true;
  // Dashboard root is allowed for every authenticated user (all roles, including unknown)
  if (normalizedPath === "/dashboard") return true;

  const allowed = ROLE_ALLOWED_PATHS[numRoleId];
  if (!allowed || allowed.length === 0) return false;
  const pathForCheck = (pathname || "").replace(/\/$/, "") || "/";
  return allowed.some((prefix) => pathForCheck === prefix || pathForCheck.startsWith(prefix + "/"));
}
