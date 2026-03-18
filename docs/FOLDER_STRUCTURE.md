# Folder Structure – Multi-Tenant SaaS

```
d:\project ek\
├── app/
│   ├── layout.tsx                 # Root layout (Theme, Auth, AdminLayout)
│   ├── page.tsx                   # Landing / redirect
│   ├── login/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── dashboard/
│   │   ├── page.tsx               # Role-specific dashboard (stats + Recharts)
│   │   ├── userpanel/
│   │   └── permissions/           # SUPER_ADMIN: role permissions matrix
│   ├── subscription/
│   │   └── plans/                 # Plans + plan-wise permissions
│   ├── franchises/               # List/create franchises (data isolation by role)
│   ├── students/                 # Students (SUB_ADMIN: own franchise only)
│   ├── fees/
│   ├── attendance/
│   ├── staff/
│   ├── certificates/
│   ├── events/                   # ADMIN: events
│   ├── blogs/
│   ├── gallery/
│   ├── reports/
│   ├── settings/
│   ├── my-course/                # STUDENT
│   ├── my-fees/
│   ├── feedback/
│   ├── certificate/              # STUDENT read-only certificate
│   ├── assigned-students/        # STAFF
│   ├── userpanel/                # Public user panel
│   ├── api/
│   │   ├── auth/                 # login, logout, me, refresh
│   │   ├── dashboard/            # Role-scoped stats (franchiseId for SUB_ADMIN)
│   │   ├── permissions/          # List permissions
│   │   ├── admin/
│   │   │   ├── roles/            # List roles, GET/PUT role permissions
│   │   │   └── plans/             # List plans, PATCH plan, GET/PUT plan permissions
│   │   └── franchises/          # GET (isolated), POST (create + optional email)
│   └── 403.tsx, 404, etc.
├── components/
│   ├── adminpanel/
│   │   ├── AdminLayout.tsx        # Sidebar + Navbar + role-based route guard
│   │   ├── sidebar/
│   │   │   └── Sidebar.tsx       # Role-based menu (getMenuForRole)
│   │   ├── navbar/
│   │   ├── dashboard/
│   │   │   ├── DashboardStats.tsx # Stats cards (role-aware)
│   │   │   └── DashboardCharts.tsx # Recharts: payments bar, attendance pie
│   │   └── footer/
│   └── common/                    # Card, Modal, Table, Breadcrumb
├── contexts/
│   ├── AuthContext.tsx           # user (incl. permissions), login, logout
│   └── ThemeContext.tsx
├── lib/
│   ├── prisma.ts
│   ├── auth.ts                   # authenticateUser, getUserFromToken, hashPassword
│   ├── get-effective-permissions.ts # Role + plan permissions
│   ├── permissions.ts            # ROLES, PERMISSION_KEYS, hasPermission, ROUTE_MAP
│   ├── role-menu-config.ts       # getMenuForRole, canRoleAccessPath, ROLE_ALLOWED_PATHS
│   ├── api-auth.ts               # getCurrentUser, requireSuperAdmin
│   ├── email.ts                  # sendFranchiseCredentialsEmail, HTML template
│   ├── jwt.ts
│   ├── api-response.ts
│   ├── cache.ts
│   └── rate-limit.ts
├── middleware.ts                 # JWT check on protected paths
├── prisma/
│   └── schema.prisma             # users, roles, franchises, subscription_plans, permissions, etc.
├── scripts/
│   └── seed-database.ts          # Roles, plans, permissions, users, franchise
└── docs/
    └── FOLDER_STRUCTURE.md
```

## Role Permission Logic

- **Sidebar**: `lib/role-menu-config.ts` → `getMenuForRole(roleId)` returns menu sections per role.
- **Route guard**: `AdminLayout` uses `canRoleAccessPath(roleId, pathname)`; redirect to `/403` if not allowed.
- **API data isolation**: SUB_ADMIN: pass `franchiseId` from `getCurrentUser()` and filter all queries by it. ADMIN/SUPER_ADMIN: global.
- **Dashboard API**: Uses `getCurrentUser()`; for SUB_ADMIN forces `franchiseId` so stats are franchise-scoped.

## Plan-Based Feature Flags

- Permissions are stored in DB: `permissions`, `role_permissions`, `plan_permissions`.
- Effective permissions: SUPER_ADMIN (no franchise) = all; else role permissions intersected with plan permissions when user has `franchiseId`.
- Managed from Dashboard → Permissions and Subscription → Plans (SUPER_ADMIN only).
