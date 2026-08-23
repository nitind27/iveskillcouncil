"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Loader2,
  Save,
  Check,
  Search,
  RefreshCw,
  Lock,
  Users,
  Layers,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_NAMES, ROLES } from "@/lib/permissions";
import { useAuth } from "@/contexts/AuthContext";
import { showSuccess, showError } from "@/lib/toast";

interface Permission {
  id: number;
  key: string;
  label: string;
  module: string;
}

interface Role {
  id: number;
  name: string;
}

const ROLE_CHIP: Record<number, string> = {
  [ROLES.SUPER_ADMIN]: "bg-[#1E4A85]/10 text-[#1E4A85] border-[#1E4A85]/20",
  [ROLES.ADMIN]: "bg-[#C4A35A]/15 text-[#8B6914] border-[#C4A35A]/30",
  [ROLES.SUB_ADMIN]: "bg-violet-500/10 text-violet-800 border-violet-200/80",
  [ROLES.STUDENT]: "bg-emerald-500/10 text-emerald-800 border-emerald-200/80",
  [ROLES.STAFF]: "bg-sky-500/10 text-sky-800 border-sky-200/80",
};

export default function PermissionsPage() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<number, Set<number>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [savedRoleId, setSavedRoleId] = useState<number | null>(null);

  const isSuperAdminOrAdmin =
    user?.roleId === ROLES.SUPER_ADMIN || user?.roleId === ROLES.ADMIN;

  const loadData = async () => {
    setLoading(true);
    try {
      const [permRes, rolesRes] = await Promise.all([
        fetch("/api/permissions", { credentials: "include" }),
        fetch("/api/admin/roles", { credentials: "include" }),
      ]);
      if (!permRes.ok || !rolesRes.ok) {
        showError("Error", "Failed to load permissions data.");
        return;
      }
      const permData = await permRes.json();
      const rolesData = await rolesRes.json();
      const perms: Permission[] = permData.data || [];
      const rolesList: Role[] = rolesData.data || [];
      setPermissions(perms);
      setRoles(rolesList);

      const next: Record<number, Set<number>> = {};
      await Promise.all(
        rolesList.map(async (r: Role) => {
          const res = await fetch(`/api/admin/roles/${r.id}/permissions`, {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            next[r.id] = new Set((data.data || []) as number[]);
          } else {
            next[r.id] = new Set();
          }
        })
      );
      setRolePerms(next);
    } catch {
      showError("Error", "Failed to load permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggle = (roleId: number, permissionId: number) => {
    if (!isSuperAdminOrAdmin) return;
    setRolePerms((prev) => {
      const next = { ...prev };
      const set = new Set(next[roleId] ?? []);
      if (set.has(permissionId)) set.delete(permissionId);
      else set.add(permissionId);
      next[roleId] = set;
      return next;
    });
  };

  const saveRole = async (roleId: number) => {
    if (!isSuperAdminOrAdmin) return;
    setSaving(roleId);
    try {
      const res = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          permissionIds: Array.from(rolePerms[roleId] ?? []),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const roleName = ROLE_NAMES[roleId as keyof typeof ROLE_NAMES] ?? "Role";
      showSuccess("Saved", `${roleName} permissions updated.`);
      setSavedRoleId(roleId);
      setTimeout(() => setSavedRoleId(null), 2000);
    } catch {
      showError("Error", "Could not save role permissions.");
    } finally {
      setSaving(null);
    }
  };

  const modules = useMemo(() => {
    const set = new Set(permissions.map((p) => p.module));
    return Array.from(set).sort();
  }, [permissions]);

  const byModule = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = permissions.filter((p) => {
      if (moduleFilter !== "ALL" && p.module !== moduleFilter) return false;
      if (!q) return true;
      return [p.label, p.key, p.module].join(" ").toLowerCase().includes(q);
    });
    return filtered.reduce(
      (acc, p) => {
        if (!acc[p.module]) acc[p.module] = [];
        acc[p.module].push(p);
        return acc;
      },
      {} as Record<string, Permission[]>
    );
  }, [permissions, search, moduleFilter]);

  const visibleCount = useMemo(
    () => Object.values(byModule).reduce((n, arr) => n + arr.length, 0),
    [byModule]
  );

  const assignedCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const r of roles) {
      if (r.id === ROLES.SUPER_ADMIN) {
        counts[r.id] = permissions.length;
      } else {
        counts[r.id] = rolePerms[r.id]?.size ?? 0;
      }
    }
    return counts;
  }, [roles, rolePerms, permissions.length]);

  if (loading) {
    return (
      <div className="space-y-5 pb-6">
        <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] px-5 py-8 text-white shadow-md sm:px-6">
          <div className="h-6 w-48 animate-pulse rounded bg-white/20" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-white/10" />
        </header>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] text-white shadow-md shadow-[#1E4A85]/15">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/55">
              <Link href="/dashboard" className="hover:text-white/90">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-white/80">Permissions</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Role Permissions</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A35A]/35 bg-[#C4A35A]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#F5E6C8]">
                <Shield className="h-3 w-3" />
                Access control
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs text-white/60 sm:text-sm">
              {isSuperAdminOrAdmin
                ? "Assign permissions to each role. Save per role to apply changes."
                : "View which permissions each role has. Only admins can edit."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                  Permissions
                </p>
                <p className="font-bold tabular-nums leading-tight">{permissions.length}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                  Roles
                </p>
                <p className="font-bold tabular-nums leading-tight">{roles.length}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#F5E6C8]/80">
                  Modules
                </p>
                <p className="font-bold tabular-nums leading-tight text-[#F5E6C8]">
                  {modules.length}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadData()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Toolbar + matrix */}
      <div className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.04] to-transparent px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search permission or module…"
              className="h-9 w-full rounded-lg border border-border/70 bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="h-9 rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
            >
              <option value="ALL">All modules</option>
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              Showing {visibleCount} of {permissions.length}
            </span>
          </div>
        </div>

        {/* Role save strip */}
        <div className="flex flex-wrap gap-2 border-b border-[#1E4A85]/10 bg-muted/20 px-4 py-3 sm:px-5">
          {roles.map((r) => {
            const label = ROLE_NAMES[r.id as keyof typeof ROLE_NAMES] ?? r.name;
            const chip = ROLE_CHIP[r.id] ?? "bg-slate-100 text-slate-700 border-slate-200";
            const isSuper = r.id === ROLES.SUPER_ADMIN;
            return (
              <div
                key={r.id}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs",
                  chip
                )}
              >
                <Users className="h-3.5 w-3.5 shrink-0 opacity-70" />
                <span className="font-semibold">{label}</span>
                <span className="tabular-nums opacity-80">
                  {assignedCounts[r.id] ?? 0}/{permissions.length}
                </span>
                {isSuperAdminOrAdmin && !isSuper && (
                  <button
                    type="button"
                    onClick={() => saveRole(r.id)}
                    disabled={saving === r.id}
                    className={cn(
                      "ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 font-bold transition",
                      savedRoleId === r.id
                        ? "bg-emerald-600 text-white"
                        : "bg-[#1E4A85] text-white hover:bg-[#163A6B] disabled:opacity-50"
                    )}
                  >
                    {saving === r.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : savedRoleId === r.id ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    Save
                  </button>
                )}
                {isSuper && (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase opacity-70">
                    <Lock className="h-3 w-3" />
                    Full
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="overflow-x-auto p-4 sm:p-5">
          {visibleCount === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <KeyRound className="h-10 w-10 text-[#1E4A85]/40" />
              <p className="text-sm font-medium">No permissions match your filters</p>
            </div>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#1E4A85]/15">
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                    Permission
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-[#1E4A85]">
                    Key
                  </th>
                  {roles.map((r) => (
                    <th
                      key={r.id}
                      className="min-w-[88px] px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-[#1E4A85]"
                    >
                      {(ROLE_NAMES[r.id as keyof typeof ROLE_NAMES] ?? r.name).split(" ")[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(byModule).map(([module, perms]) => (
                  <React.Fragment key={module}>
                    <tr className="bg-[#1E4A85]/[0.06]">
                      <td
                        colSpan={2 + roles.length}
                        className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#1E4A85]"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5" />
                          {module}
                          <span className="font-normal normal-case text-muted-foreground">
                            ({perms.length})
                          </span>
                        </span>
                      </td>
                    </tr>
                    {perms.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-[#1E4A85]/5 transition hover:bg-[#1E4A85]/[0.03]"
                      >
                        <td className="px-3 py-2.5 font-medium text-foreground">{p.label}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                          {p.key}
                        </td>
                        {roles.map((r) => (
                          <td key={r.id} className="px-2 py-2.5 text-center">
                            {r.id === ROLES.SUPER_ADMIN ? (
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E4A85]/10 text-xs font-bold text-[#1E4A85]">
                                ✓
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggle(r.id, p.id)}
                                disabled={!isSuperAdminOrAdmin}
                                className={cn(
                                  "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition",
                                  rolePerms[r.id]?.has(p.id)
                                    ? "border-[#1E4A85] bg-[#1E4A85] text-white shadow-sm"
                                    : "border-border/70 hover:border-[#1E4A85]/40 hover:bg-[#1E4A85]/5",
                                  !isSuperAdminOrAdmin && "cursor-not-allowed opacity-60"
                                )}
                              >
                                {rolePerms[r.id]?.has(p.id) && <Check className="h-4 w-4" />}
                              </button>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
