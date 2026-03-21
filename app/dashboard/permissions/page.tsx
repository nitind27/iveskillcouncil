"use client";

import React, { useEffect, useState } from "react";
import { Breadcrumb } from "@/components/common";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Shield, Loader2, Save, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_NAMES, ROLES } from "@/lib/permissions";
import { useAuth } from "@/contexts/AuthContext";

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

export default function PermissionsPage() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolePerms, setRolePerms] = useState<Record<number, Set<number>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  const isSuperAdminOrAdmin = user?.roleId === ROLES.SUPER_ADMIN || user?.roleId === ROLES.ADMIN;

  useEffect(() => {
    (async () => {
      try {
        const [permRes, rolesRes] = await Promise.all([
          fetch("/api/permissions", { credentials: "include" }),
          fetch("/api/admin/roles", { credentials: "include" }),
        ]);
        if (!permRes.ok || !rolesRes.ok) {
          setLoading(false);
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
      } finally {
        setLoading(false);
      }
    })();
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
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  };

  const byModule = permissions.reduce((acc, p) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Role Permissions
          </h1>
          <p className="text-muted-foreground mt-1">
            Assign permissions to each role. Only Super Admin can edit.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission matrix</CardTitle>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            Check the permissions each role can have. Click Save per role to apply.
          </CardContent>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-semibold text-foreground">Permission</th>
                  <th className="text-left py-3 px-2 font-semibold text-foreground">Module</th>
                  {roles.map((r) => (
                    <th key={r.id} className="text-center py-3 px-2 font-semibold text-foreground min-w-[100px]">
                      {ROLE_NAMES[r.id as keyof typeof ROLE_NAMES] ?? r.name}
                      {isSuperAdminOrAdmin && (
                        <button
                          type="button"
                          className="ml-2 mt-1 px-2 py-1 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50"
                          onClick={() => saveRole(r.id)}
                          disabled={saving === r.id}
                        >
                          {saving === r.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <Save className="w-3 h-3 inline" />}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(byModule).map(([module, perms]) => (
                  <React.Fragment key={module}>
                    {perms.map((p) => (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-2 text-foreground">{p.label}</td>
                        <td className="py-2 px-2 text-muted-foreground">{p.module}</td>
                        {roles.map((r) => (
                          <td key={r.id} className="text-center py-2 px-2">
                            {r.id === ROLES.SUPER_ADMIN ? (
                              <span className="text-primary font-medium">All</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggle(r.id, p.id)}
                                disabled={!isSuperAdminOrAdmin}
                                className={cn(
                                  "w-8 h-8 rounded border flex items-center justify-center transition-colors",
                                  (rolePerms[r.id]?.has(p.id))
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-border hover:border-primary/50",
                                  !isSuperAdminOrAdmin && "cursor-not-allowed opacity-60"
                                )}
                              >
                                {(rolePerms[r.id]?.has(p.id)) && <Check className="w-4 h-4" />}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
