"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { usePincodeLookup } from "@/hooks/usePincodeLookup";
import {
  Card,
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardContent,
  CardFooter,
} from "@/components/common/Card";
import {
  Settings,
  Loader2,
  Save,
  Globe,
  MapPin,
  Calendar,
  Shield,
  Bell,
  Wrench,
  Share2,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import type { GlobalSettingsConfig } from "@/lib/global-settings-types";
import { DEFAULT_GLOBAL_CONFIG } from "@/lib/global-settings-types";
import { fetcher } from "@/lib/fetcher";

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
const labelClass = "block text-sm font-medium text-foreground mb-1";

type SectionId =
  | "general"
  | "contact"
  | "localization"
  | "security"
  | "notifications"
  | "maintenance"
  | "social";

const SECTIONS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: Globe },
  { id: "contact", label: "Contact", icon: MapPin },
  { id: "localization", label: "Localization", icon: Calendar },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "social", label: "Social Links", icon: Share2 },
];

function mergeConfig(
  prev: GlobalSettingsConfig,
  section: keyof GlobalSettingsConfig,
  data: object
): GlobalSettingsConfig {
  return {
    ...prev,
    [section]: { ...(prev[section] as object), ...data },
  };
}

export default function GlobalSettingsPage() {
  const { data: fetchedConfig, isLoading, mutate } = useSWR<GlobalSettingsConfig>(
    "/api/settings/global",
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 3000, keepPreviousData: true }
  );
  const [config, setConfig] = useState<GlobalSettingsConfig>(DEFAULT_GLOBAL_CONFIG);
  const [saving, setSaving] = useState<SectionId | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("general");

  const { fetchByPincode, loading: pincodeLoading, error: pincodeError, clearError: clearPincodeError } = usePincodeLookup(
    (data) =>
      setConfig((prev) =>
        mergeConfig(prev, "contact", {
          address: prev.contact?.address || data.area,
          city: data.city,
          state: data.state,
        })
      )
  );

  // Sync form when SWR data loads or after save
  React.useEffect(() => {
    if (fetchedConfig) setConfig({ ...DEFAULT_GLOBAL_CONFIG, ...fetchedConfig });
  }, [fetchedConfig]);

  const saveSection = async (section: SectionId, payload: Partial<GlobalSettingsConfig>) => {
    setSaving(section);
    try {
      const res = await fetch("/api/settings/global", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        await showError("Error", data.error || "Failed to save.");
        return;
      }
      if (data.data) mutate(data.data, false);
      await showSuccess("Saved", "Settings updated successfully.");
    } catch (e) {
      await showError("Error", "Failed to save settings.");
    } finally {
      setSaving(null);
    }
  };

  if (isLoading && !fetchedConfig) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const g = config.general ?? DEFAULT_GLOBAL_CONFIG.general!;
  const c = config.contact ?? DEFAULT_GLOBAL_CONFIG.contact!;
  const l = config.localization ?? DEFAULT_GLOBAL_CONFIG.localization!;
  const s = config.security ?? DEFAULT_GLOBAL_CONFIG.security!;
  const n = config.notifications ?? DEFAULT_GLOBAL_CONFIG.notifications!;
  const m = config.maintenance ?? DEFAULT_GLOBAL_CONFIG.maintenance!;
  const soc = config.social ?? DEFAULT_GLOBAL_CONFIG.social!;

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div className="flex items-center gap-2">
        <Settings className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Global Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure app-wide options. Only Super Admin can edit.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Side nav */}
        <nav className="md:w-56 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-left text-sm font-medium transition-colors whitespace-nowrap ${
                activeSection === id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">
          {/* General */}
          {activeSection === "general" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  General
                </CardTitle>
                <CardSubtitle className="text-sm">
                  App name, logo, tagline and support email.
                </CardSubtitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={labelClass}>App Name</label>
                  <input
                    type="text"
                    value={g.appName ?? ""}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "general", { appName: e.target.value })
                      )
                    }
                    className={inputClass}
                    placeholder="EduKit"
                  />
                </div>
                <div>
                  <label className={labelClass}>Tagline</label>
                  <input
                    type="text"
                    value={g.tagline ?? ""}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "general", { tagline: e.target.value })
                      )
                    }
                    className={inputClass}
                    placeholder="Learning Management"
                  />
                </div>
                <div>
                  <label className={labelClass}>Logo URL</label>
                  <input
                    type="url"
                    value={g.logoUrl ?? ""}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "general", { logoUrl: e.target.value })
                      )
                    }
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className={labelClass}>Favicon URL</label>
                  <input
                    type="url"
                    value={g.faviconUrl ?? ""}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "general", { faviconUrl: e.target.value })
                      )
                    }
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className={labelClass}>Support Email</label>
                  <input
                    type="email"
                    value={g.supportEmail ?? ""}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "general", { supportEmail: e.target.value })
                      )
                    }
                    className={inputClass}
                    placeholder="support@example.com"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <button
                  type="button"
                  onClick={() => saveSection("general", { general: config.general })}
                  disabled={saving === "general"}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving === "general" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save General
                </button>
              </CardFooter>
            </Card>
          )}

          {/* Contact */}
          {activeSection === "contact" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Contact
                </CardTitle>
                <CardSubtitle className="text-sm">
                  Default contact details shown across the app.
                </CardSubtitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      value={c.email ?? ""}
                      onChange={(e) =>
                        setConfig((prev) =>
                          mergeConfig(prev, "contact", { email: e.target.value })
                        )
                      }
                      className={inputClass}
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      type="text"
                      value={c.phone ?? ""}
                      onChange={(e) =>
                        setConfig((prev) =>
                          mergeConfig(prev, "contact", { phone: e.target.value })
                        )
                      }
                      className={inputClass}
                      placeholder="+91..."
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Address</label>
                  <input
                    type="text"
                    value={c.address ?? ""}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "contact", { address: e.target.value })
                      )
                    }
                    className={inputClass}
                    placeholder="Street, area (auto from pincode)"
                  />
                </div>
                <div>
                  <label className={labelClass}>Pincode</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={c.pincode ?? ""}
                      onChange={(e) => {
                        setConfig((prev) => mergeConfig(prev, "contact", { pincode: e.target.value }));
                        clearPincodeError();
                      }}
                      className={inputClass}
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => fetchByPincode(c.pincode ?? "")}
                      disabled={pincodeLoading || (c.pincode ?? "").trim().replace(/\D/g, "").length !== 6}
                      className="px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap flex items-center gap-2"
                    >
                      {pincodeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                      Get area
                    </button>
                  </div>
                  {pincodeError && <p className="mt-1 text-xs text-amber-600">{pincodeError}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>City</label>
                    <input
                      type="text"
                      value={c.city ?? ""}
                      onChange={(e) =>
                        setConfig((prev) =>
                          mergeConfig(prev, "contact", { city: e.target.value })
                        )
                      }
                      className={inputClass}
                      placeholder="Auto from pincode"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>State</label>
                    <input
                      type="text"
                      value={c.state ?? ""}
                      onChange={(e) =>
                        setConfig((prev) =>
                          mergeConfig(prev, "contact", { state: e.target.value })
                        )
                      }
                      className={inputClass}
                      placeholder="Auto from pincode"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input
                    type="url"
                    value={c.website ?? ""}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "contact", { website: e.target.value })
                      )
                    }
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <button
                  type="button"
                  onClick={() => saveSection("contact", { contact: config.contact })}
                  disabled={saving === "contact"}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving === "contact" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Contact
                </button>
              </CardFooter>
            </Card>
          )}

          {/* Localization */}
          {activeSection === "localization" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Localization
                </CardTitle>
                <CardSubtitle className="text-sm">
                  Timezone, date/time format and currency.
                </CardSubtitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={labelClass}>Timezone</label>
                  <select
                    value={l.timezone ?? "Asia/Kolkata"}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "localization", { timezone: e.target.value })
                      )
                    }
                    className={inputClass}
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Date Format</label>
                    <select
                      value={l.dateFormat ?? "DD/MM/YYYY"}
                      onChange={(e) =>
                        setConfig((prev) =>
                          mergeConfig(prev, "localization", {
                            dateFormat: e.target.value,
                          })
                        )
                      }
                      className={inputClass}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Time Format</label>
                    <select
                      value={l.timeFormat ?? "12h"}
                      onChange={(e) =>
                        setConfig((prev) =>
                          mergeConfig(prev, "localization", {
                            timeFormat: e.target.value,
                          })
                        )
                      }
                      className={inputClass}
                    >
                      <option value="12h">12 hour</option>
                      <option value="24h">24 hour</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Currency</label>
                    <input
                      type="text"
                      value={l.currency ?? "INR"}
                      onChange={(e) =>
                        setConfig((prev) =>
                          mergeConfig(prev, "localization", {
                            currency: e.target.value,
                          })
                        )
                      }
                      className={inputClass}
                      placeholder="INR"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Currency Symbol</label>
                    <input
                      type="text"
                      value={l.currencySymbol ?? "₹"}
                      onChange={(e) =>
                        setConfig((prev) =>
                          mergeConfig(prev, "localization", {
                            currencySymbol: e.target.value,
                          })
                        )
                      }
                      className={inputClass}
                      placeholder="₹"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Locale</label>
                  <select
                    value={l.locale ?? "en-IN"}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "localization", { locale: e.target.value })
                      )
                    }
                    className={inputClass}
                  >
                    <option value="en-IN">English (India)</option>
                    <option value="en-US">English (US)</option>
                    <option value="hi-IN">Hindi</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter>
                <button
                  type="button"
                  onClick={() =>
                    saveSection("localization", {
                      localization: config.localization,
                    })
                  }
                  disabled={saving === "localization"}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving === "localization" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Localization
                </button>
              </CardFooter>
            </Card>
          )}

          {/* Security */}
          {activeSection === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security
                </CardTitle>
                <CardSubtitle className="text-sm">
                  Session, login attempts and password rules.
                </CardSubtitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className={labelClass}>Session timeout (minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={s.sessionTimeoutMinutes ?? 60}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "security", {
                          sessionTimeoutMinutes: Number(e.target.value) || 60,
                        })
                      )
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Max login attempts</label>
                  <input
                    type="number"
                    min={3}
                    max={20}
                    value={s.maxLoginAttempts ?? 5}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "security", {
                          maxLoginAttempts: Number(e.target.value) || 5,
                        })
                      )
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Minimum password length</label>
                  <input
                    type="number"
                    min={6}
                    max={32}
                    value={s.passwordMinLength ?? 8}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "security", {
                          passwordMinLength: Number(e.target.value) || 8,
                        })
                      )
                    }
                    className={inputClass}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="require2FA"
                    checked={s.require2FA ?? false}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "security", {
                          require2FA: e.target.checked,
                        })
                      )
                    }
                    className="w-4 h-4 rounded border-input text-primary"
                  />
                  <label htmlFor="require2FA" className="text-sm font-medium">
                    Require 2FA (when implemented)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="allowRegistration"
                    checked={s.allowRegistration ?? false}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "security", {
                          allowRegistration: e.target.checked,
                        })
                      )
                    }
                    className="w-4 h-4 rounded border-input text-primary"
                  />
                  <label htmlFor="allowRegistration" className="text-sm font-medium">
                    Allow self registration
                  </label>
                </div>
              </CardContent>
              <CardFooter>
                <button
                  type="button"
                  onClick={() => saveSection("security", { security: config.security })}
                  disabled={saving === "security"}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving === "security" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Security
                </button>
              </CardFooter>
            </Card>
          )}

          {/* Notifications */}
          {activeSection === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                <CardSubtitle className="text-sm">
                  Email and in-app notification preferences.
                </CardSubtitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="emailEnabled"
                    checked={n.emailEnabled ?? true}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "notifications", {
                          emailEnabled: e.target.checked,
                        })
                      )
                    }
                    className="w-4 h-4 rounded border-input text-primary"
                  />
                  <label htmlFor="emailEnabled" className="text-sm font-medium">
                    Email notifications enabled
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Default From Name</label>
                    <input
                      type="text"
                      value={n.defaultFromName ?? ""}
                      onChange={(e) =>
                        setConfig((prev) =>
                          mergeConfig(prev, "notifications", {
                            defaultFromName: e.target.value,
                          })
                        )
                      }
                      className={inputClass}
                      placeholder="EduKit"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Default From Email</label>
                    <input
                      type="email"
                      value={n.defaultFromEmail ?? ""}
                      onChange={(e) =>
                        setConfig((prev) =>
                          mergeConfig(prev, "notifications", {
                            defaultFromEmail: e.target.value,
                          })
                        )
                      }
                      className={inputClass}
                      placeholder="noreply@example.com"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notifyNewUser"
                    checked={n.notifyNewUser ?? true}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "notifications", {
                          notifyNewUser: e.target.checked,
                        })
                      )
                    }
                    className="w-4 h-4 rounded border-input text-primary"
                  />
                  <label htmlFor="notifyNewUser" className="text-sm font-medium">
                    Notify on new user registration
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notifyNewFranchise"
                    checked={n.notifyNewFranchise ?? true}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "notifications", {
                          notifyNewFranchise: e.target.checked,
                        })
                      )
                    }
                    className="w-4 h-4 rounded border-input text-primary"
                  />
                  <label htmlFor="notifyNewFranchise" className="text-sm font-medium">
                    Notify on new franchise creation
                  </label>
                </div>
              </CardContent>
              <CardFooter>
                <button
                  type="button"
                  onClick={() =>
                    saveSection("notifications", {
                      notifications: config.notifications,
                    })
                  }
                  disabled={saving === "notifications"}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving === "notifications" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Notifications
                </button>
              </CardFooter>
            </Card>
          )}

          {/* Maintenance */}
          {activeSection === "maintenance" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Maintenance
                </CardTitle>
                <CardSubtitle className="text-sm">
                  Put the app in maintenance mode and show a message to users.
                </CardSubtitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="maintenanceEnabled"
                    checked={m.enabled ?? false}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "maintenance", {
                          enabled: e.target.checked,
                        })
                      )
                    }
                    className="w-4 h-4 rounded border-input text-primary"
                  />
                  <label htmlFor="maintenanceEnabled" className="text-sm font-medium">
                    Maintenance mode enabled
                  </label>
                </div>
                <div>
                  <label className={labelClass}>Maintenance message</label>
                  <textarea
                    value={m.message ?? ""}
                    onChange={(e) =>
                      setConfig((prev) =>
                        mergeConfig(prev, "maintenance", {
                          message: e.target.value,
                        })
                      )
                    }
                    className={inputClass + " min-h-[80px]"}
                    placeholder="We are under maintenance. Please try again later."
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <button
                  type="button"
                  onClick={() =>
                    saveSection("maintenance", { maintenance: config.maintenance })
                  }
                  disabled={saving === "maintenance"}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving === "maintenance" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Maintenance
                </button>
              </CardFooter>
            </Card>
          )}

          {/* Social */}
          {activeSection === "social" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Share2 className="w-5 h-5" />
                  Social Links
                </CardTitle>
                <CardSubtitle className="text-sm">
                  URLs for footer and public pages.
                </CardSubtitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "facebook" as const, label: "Facebook" },
                  { key: "twitter" as const, label: "Twitter / X" },
                  { key: "instagram" as const, label: "Instagram" },
                  { key: "linkedin" as const, label: "LinkedIn" },
                  { key: "youtube" as const, label: "YouTube" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className={labelClass}>{label}</label>
                    <input
                      type="url"
                      value={soc[key] ?? ""}
                      onChange={(e) =>
                        setConfig((prev) =>
                          mergeConfig(prev, "social", { [key]: e.target.value })
                        )
                      }
                      className={inputClass}
                      placeholder={`https://${key}.com/...`}
                    />
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <button
                  type="button"
                  onClick={() => saveSection("social", { social: config.social })}
                  disabled={saving === "social"}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving === "social" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Social
                </button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
