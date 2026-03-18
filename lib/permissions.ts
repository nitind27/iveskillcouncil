/**
 * Permission keys and helpers for role/plan-based access.
 * SUPER_ADMIN can assign permissions to roles and to subscription plans.
 */

export const ROLES = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  SUB_ADMIN: 3,
  STUDENT: 4,
  STAFF: 5,
} as const;

export type RoleId = (typeof ROLES)[keyof typeof ROLES];

/** All permission keys used in the app. Each key maps to a feature/route. */
export const PERMISSION_KEYS = [
  // Main
  "dashboard.view",
  "userpanel.manage",
  "analytics.view",
  // Subscription
  "subscription.plans.view",
  "subscription.plans.manage",
  "franchises.view",
  "franchises.manage",
  "franchises.approve",
  // Academics
  "courses.view",
  "courses.manage",
  "students.view",
  "students.manage",
  "fees.view",
  "fees.manage",
  // Attendance
  "attendance.view",
  "attendance.manage",
  // Certificates
  "certificates.view",
  "certificates.issue",
  // Staff
  "staff.view",
  "staff.manage",
  // Communication
  "notifications.view",
  "notifications.manage",
  "feedback.view",
  "feedback.manage",
  "email_reminders.manage",
  // System
  "users.view",
  "users.manage",
  "settings.view",
  "settings.manage",
  "permissions.manage",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_LABELS: Record<PermissionKey, { label: string; module: string }> = {
  "dashboard.view": { label: "View Dashboard", module: "Main" },
  "userpanel.manage": { label: "Manage User Panel", module: "Main" },
  "analytics.view": { label: "View Analytics", module: "Main" },
  "subscription.plans.view": { label: "View Subscription Plans", module: "Subscription" },
  "subscription.plans.manage": { label: "Manage Subscription Plans", module: "Subscription" },
  "franchises.view": { label: "View Franchises", module: "Subscription" },
  "franchises.manage": { label: "Manage Franchises", module: "Subscription" },
  "franchises.approve": { label: "Approve Franchises", module: "Subscription" },
  "courses.view": { label: "View Courses", module: "Academics" },
  "courses.manage": { label: "Manage Courses", module: "Academics" },
  "students.view": { label: "View Students", module: "Academics" },
  "students.manage": { label: "Manage Students", module: "Academics" },
  "fees.view": { label: "View Fees", module: "Academics" },
  "fees.manage": { label: "Manage Fees", module: "Academics" },
  "attendance.view": { label: "View Attendance", module: "Attendance" },
  "attendance.manage": { label: "Manage Attendance", module: "Attendance" },
  "certificates.view": { label: "View Certificates", module: "Certificates" },
  "certificates.issue": { label: "Issue Certificates", module: "Certificates" },
  "staff.view": { label: "View Staff", module: "Staff" },
  "staff.manage": { label: "Manage Staff", module: "Staff" },
  "notifications.view": { label: "View Notifications", module: "Communication" },
  "notifications.manage": { label: "Manage Notifications", module: "Communication" },
  "feedback.view": { label: "View Feedback", module: "Communication" },
  "feedback.manage": { label: "Manage Feedback", module: "Communication" },
  "email_reminders.manage": { label: "Manage Email Reminders", module: "Communication" },
  "users.view": { label: "View Users", module: "System" },
  "users.manage": { label: "Manage Users", module: "System" },
  "settings.view": { label: "View Settings", module: "System" },
  "settings.manage": { label: "Manage Settings", module: "System" },
  "permissions.manage": { label: "Manage Permissions", module: "System" },
};

/** Menu item id to permission key mapping (for sidebar filter). */
export const MENU_PERMISSION_MAP: Record<string, PermissionKey> = {
  dashboard: "dashboard.view",
  userpanel: "userpanel.manage",
  analytics: "analytics.view",
  plans: "subscription.plans.view",
  "all-franchises": "franchises.view",
  "pending-approvals": "franchises.approve",
  franchises: "franchises.view",
  courses: "courses.view",
  students: "students.view",
  "fee-structure": "fees.view",
  payments: "fees.view",
  "pending-fees": "fees.view",
  "attendance-manual": "attendance.view",
  "attendance-face": "attendance.view",
  "attendance-reports": "attendance.view",
  "certificate-requests": "certificates.view",
  "certificates-issued": "certificates.view",
  "staff-list": "staff.view",
  "staff-salary": "staff.view",
  notifications: "notifications.view",
  feedback: "feedback.view",
  "email-reminders": "email_reminders.manage",
  users: "users.view",
  general: "settings.view",
  security: "settings.view",
  permissions: "permissions.manage",
};

/** Route path to permission key (for page-level guard). Longest match first. */
export const ROUTE_PERMISSION_MAP: Record<string, PermissionKey> = {
  "/dashboard/permissions": "permissions.manage",
  "/dashboard/userpanel": "userpanel.manage",
  "/dashboard": "dashboard.view",
  "/analytics": "analytics.view",
  "/subscription/plans": "subscription.plans.view",
  "/franchises/pending": "franchises.approve",
  "/franchises": "franchises.view",
  "/courses": "courses.view",
  "/students": "students.view",
  "/fees": "fees.view",
  "/attendance": "attendance.view",
  "/certificates": "certificates.view",
  "/staff": "staff.view",
  "/notifications": "notifications.view",
  "/feedback": "feedback.view",
  "/email-reminders": "email_reminders.manage",
  "/users": "users.view",
  "/settings": "settings.view",
};

export const ROLE_NAMES: Record<RoleId, string> = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.ADMIN]: "Admin",
  [ROLES.SUB_ADMIN]: "Sub Admin",
  [ROLES.STUDENT]: "Student",
  [ROLES.STAFF]: "Staff",
};

/**
 * Check if user has a permission.
 * SUPER_ADMIN without franchise: has all.
 * Otherwise: user must have permission in rolePermissions AND (if franchise user) in planPermissions.
 */
export function hasPermission(
  userPermissions: string[],
  requiredKey: PermissionKey
): boolean {
  if (userPermissions.includes("*")) return true;
  return userPermissions.includes(requiredKey);
}

/** Get required permission key for a path (longest matching route). */
export function getRequiredPermissionForPath(pathname: string): PermissionKey | null {
  const routes = Object.keys(ROUTE_PERMISSION_MAP).sort(
    (a, b) => b.length - a.length
  ) as (keyof typeof ROUTE_PERMISSION_MAP)[];
  for (const route of routes) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return ROUTE_PERMISSION_MAP[route];
    }
  }
  return null;
}
