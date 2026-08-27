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
  ClipboardList,
  BarChart3,
  Inbox,
  Printer,
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

/** Sidebar menu for SUPER_ADMIN / ADMIN — ordered by daily work flow */
const SUPER_ADMIN_MENU: RoleMenuSection[] = [
  {
    id: "overview",
    label: "1. Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    id: "course-setup",
    label: "2. Course Setup",
    items: [
      {
        id: "course-categories",
        label: "Course Categories",
        icon: Tag,
        href: "/dashboard/course-categories",
      },
      { id: "manage-courses", label: "Manage Courses", icon: BookOpen, href: "/dashboard/courses" },
    ],
  },
  {
    id: "franchise-network",
    label: "3. Franchise Network",
    items: [
      { id: "manage-plans", label: "Subscription Plans", icon: Package, href: "/subscription/plans" },
      {
        id: "franchise-inquiries",
        label: "Franchise Inquiries",
        icon: Inbox,
        href: "/dashboard/franchise-inquiries",
      },
      {
        id: "franchise-applications",
        label: "Applications",
        icon: ClipboardList,
        href: "/dashboard/franchise-applications",
      },
      { id: "approvals", label: "Pending Approvals", icon: FileCheck, href: "/franchises/pending" },
      { id: "manage-franchises", label: "All Franchises", icon: Building2, href: "/franchises" },
    ],
  },
  {
    id: "students-ops",
    label: "4. Students & Learning",
    items: [
      { id: "all-students", label: "Students", icon: GraduationCap, href: "/students" },
      { id: "exams", label: "Exams", icon: ClipboardList, href: "/exams" },
      { id: "fees-management", label: "Fees Management", icon: IndianRupee, href: "/fees" },
    ],
  },
  {
    id: "certificates",
    label: "5. Certificates",
    items: [
      {
        id: "certificate-requests",
        label: "Requests",
        icon: Award,
        href: "/certificates/requests",
      },
      {
        id: "certificates-print",
        label: "Print Certificates",
        icon: Printer,
        href: "/certificates/print",
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
    id: "leads-support",
    label: "6. Leads & Support",
    items: [
      {
        id: "course-enquiries",
        label: "Course Enquiries",
        icon: MessageSquare,
        href: "/dashboard/enquiries",
      },
      {
        id: "offer-applications",
        label: "Offer Applications",
        icon: Tag,
        href: "/dashboard/offer-applications",
      },
      {
        id: "support-requests",
        label: "Support Requests",
        icon: HelpCircle,
        href: "/dashboard/support",
      },
    ],
  },
  {
    id: "communication",
    label: "7. Communication",
    items: [
      { id: "announcements", label: "Announcements", icon: Megaphone, href: "/announcements" },
      { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
    ],
  },
  {
    id: "analytics",
    label: "8. Reports",
    items: [{ id: "reports", label: "Reports", icon: BarChart3, href: "/reports" }],
  },
  {
    id: "settings",
    label: "9. System",
    items: [
      {
        id: "userpanel-settings",
        label: "User Panel",
        icon: Monitor,
        href: "/dashboard/userpanel",
      },
      {
        id: "permissions",
        label: "Role Permissions",
        icon: Shield,
        href: "/dashboard/permissions",
      },
      { id: "global-settings", label: "Global Settings", icon: Settings, href: "/settings" },
    ],
  },
];

const ADMIN_MENU: RoleMenuSection[] = SUPER_ADMIN_MENU;

/** Sidebar menu for SUB_ADMIN (Franchise Owner) — centre work flow */
const SUB_ADMIN_MENU: RoleMenuSection[] = [
  {
    id: "overview",
    label: "1. Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    id: "centre-academics",
    label: "2. My Centre",
    items: [
      { id: "my-courses", label: "My Courses", icon: BookOpen, href: "/dashboard/franchise-courses" },
      { id: "my-students", label: "My Students", icon: GraduationCap, href: "/students" },
      { id: "attendance", label: "Attendance", icon: ClipboardCheck, href: "/attendance/manual" },
      { id: "fees-management", label: "Fees Management", icon: IndianRupee, href: "/fees" },
    ],
  },
  {
    id: "team",
    label: "3. Team",
    items: [
      { id: "staff-management", label: "Staff", icon: Users, href: "/staff" },
      { id: "salary", label: "Salary", icon: Wallet, href: "/staff/salary" },
    ],
  },
  {
    id: "certificates",
    label: "4. Certificates",
    items: [
      {
        id: "certificate-requests",
        label: "Certificate Requests",
        icon: Award,
        href: "/certificates/requests",
      },
    ],
  },
  {
    id: "communication",
    label: "5. Communication",
    items: [
      { id: "announcements", label: "Announcements", icon: Megaphone, href: "/announcements" },
      { id: "chat", label: "Chat", icon: MessageSquare, href: "/chat" },
    ],
  },
  {
    id: "analytics",
    label: "6. Reports",
    items: [{ id: "reports", label: "Reports", icon: BarChart3, href: "/reports" }],
  },
];

/** Sidebar menu for STUDENT — learning journey */
const STUDENT_MENU: RoleMenuSection[] = [
  {
    id: "overview",
    label: "1. Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    id: "learning",
    label: "2. My Learning",
    items: [
      { id: "my-course", label: "My Course", icon: BookOpen, href: "/my-course" },
      { id: "my-exams", label: "My Exams", icon: ClipboardList, href: "/my-exams" },
      { id: "attendance", label: "Attendance", icon: ClipboardCheck, href: "/attendance" },
    ],
  },
  {
    id: "fees-cert",
    label: "3. Fees & Certificate",
    items: [
      { id: "my-fees", label: "My Fees", icon: IndianRupee, href: "/my-fees" },
      { id: "certificate", label: "Certificate", icon: Award, href: "/certificate" },
    ],
  },
  {
    id: "feedback",
    label: "4. Feedback",
    items: [
      { id: "feedback", label: "Feedback", icon: MessageSquare, href: "/feedback" },
    ],
  },
];

/** Sidebar menu for STAFF — daily work */
const STAFF_MENU: RoleMenuSection[] = [
  {
    id: "overview",
    label: "1. Overview",
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    ],
  },
  {
    id: "work",
    label: "2. My Work",
    items: [
      { id: "attendance", label: "Attendance", icon: ClipboardCheck, href: "/attendance" },
      {
        id: "assigned-students",
        label: "Assigned Students",
        icon: UserCheck,
        href: "/assigned-students",
      },
    ],
  },
  {
    id: "payroll",
    label: "3. Payroll",
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
 * Empty sections are omitted.
 */
export function getMenuForRole(roleId: number): RoleMenuSection[] {
  const sections =
    ROLE_MENU_MAP[roleId] ??
    [
      {
        id: "main",
        label: "Overview",
        items: [
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        ],
      },
    ];
  return sections.filter((s) => s.items.length > 0);
}

/** Paths allowed per role (for middleware/layout). Empty array = no access. */
export const ROLE_ALLOWED_PATHS: Record<number, string[]> = {
  [ROLES.SUPER_ADMIN]: [
    "/dashboard",
    "/subscription",
    "/franchises",
    "/settings",
    "/dashboard/permissions",
    "/dashboard/userpanel",
    "/dashboard/enquiries",
    "/dashboard/offer-applications",
    "/dashboard/support",
    "/dashboard/franchise-applications",
    "/dashboard/franchise-inquiries",
    "/dashboard/courses",
    "/dashboard/course-categories",
    "/students",
    "/certificates",
    "/fees",
    "/attendance",
    "/staff",
    "/events",
    "/blogs",
    "/gallery",
    "/reports",
    "/exams",
    "/announcements",
    "/profile",
    "/account",
    "/chat",
  ],
  [ROLES.ADMIN]: [
    "/dashboard",
    "/subscription",
    "/franchises",
    "/settings",
    "/dashboard/permissions",
    "/dashboard/userpanel",
    "/dashboard/enquiries",
    "/dashboard/offer-applications",
    "/dashboard/support",
    "/dashboard/franchise-applications",
    "/dashboard/franchise-inquiries",
    "/dashboard/courses",
    "/dashboard/course-categories",
    "/students",
    "/certificates",
    "/fees",
    "/attendance",
    "/staff",
    "/events",
    "/blogs",
    "/gallery",
    "/reports",
    "/exams",
    "/announcements",
    "/profile",
    "/account",
    "/chat",
  ],
  [ROLES.SUB_ADMIN]: [
    "/dashboard",
    "/dashboard/franchise-courses",
    "/students",
    "/fees",
    "/attendance",
    "/staff",
    "/certificates",
    "/reports",
    "/announcements",
    "/profile",
    "/account",
    "/chat",
  ],
  [ROLES.STUDENT]: [
    "/dashboard",
    "/my-course",
    "/my-fees",
    "/attendance",
    "/feedback",
    "/certificate",
    "/my-exams",
    "/profile",
    "/account",
  ],
  [ROLES.STAFF]: [
    "/dashboard",
    "/attendance",
    "/assigned-students",
    "/staff",
    "/profile",
    "/account",
  ],
};

/** Check if role can access path (path must start with one of allowed prefixes). */
export function canRoleAccessPath(roleId: number, pathname: string): boolean {
  const numRoleId = Number(roleId) || 0;
  const normalizedPath = (pathname || "").replace(/\/$/, "").trim() || "/";

  if (numRoleId === ROLES.SUPER_ADMIN || numRoleId === ROLES.ADMIN) return true;
  if (normalizedPath === "/dashboard") return true;

  if (normalizedPath === "/admin" || normalizedPath.startsWith("/admin/")) {
    return true;
  }

  if (normalizedPath.startsWith("/f/")) return true;
  if (normalizedPath.startsWith("/exam-link")) return true;
  if (normalizedPath.startsWith("/api/")) return true;
  if (normalizedPath === "/403" || normalizedPath === "/404") return true;

  const allowed = ROLE_ALLOWED_PATHS[numRoleId];
  if (!allowed || allowed.length === 0) return false;

  const pathForCheck = (pathname || "").replace(/\/$/, "") || "/";
  return allowed.some(
    (prefix) => pathForCheck === prefix || pathForCheck.startsWith(prefix + "/")
  );
}
