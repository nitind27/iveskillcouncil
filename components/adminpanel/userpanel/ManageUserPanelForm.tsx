"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/common/Card";
import Link from "next/link";
import {
  Monitor,
  ExternalLink,
  Save,
  Loader2,
  Plus,
  Trash2,
  Layout,
  ImageIcon,
  Menu,
  BarChart3,
  Info,
  BookOpen,
  Building2,
  Tag,
  Images,
  Footprints,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { UserPanelConfig } from "@/config/userpanel.config";
import { defaultConfig } from "@/config/userpanel.config";
import { cn } from "@/lib/utils";
import WelcomePopupModal from "@/components/userpanel/WelcomePopupModal";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";

const STAT_ICON_OPTIONS = [
  { value: "courses", label: "Courses" },
  { value: "enrollments", label: "Enrollments" },
  { value: "branches", label: "Branches" },
  { value: "events", label: "Events" },
  { value: "offers", label: "Offers" },
] as const;

const COLOR_OPTIONS = [
  "from-indigo-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-purple-600",
];

const TABS = [
  { id: "welcomePopup", label: "Welcome Popup", icon: Sparkles },
  { id: "site", label: "Site", icon: Layout },
  { id: "hero", label: "Hero & Banner", icon: ImageIcon },
  { id: "nav", label: "Nav Links", icon: Menu },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "about", label: "About", icon: Info },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "franchise", label: "Franchise", icon: Building2 },
  { id: "offers", label: "Offers", icon: Tag },
  { id: "gallery", label: "Gallery", icon: Images },
  { id: "footer", label: "Footer", icon: Footprints },
] as const;

function ensureConfig(c: Partial<UserPanelConfig> | null): UserPanelConfig {
  if (!c || typeof c !== "object") return defaultConfig;
  return {
    welcomePopup: c.welcomePopup ?? defaultConfig.welcomePopup,
    site: c.site ?? defaultConfig.site,
    nav: c.nav ?? defaultConfig.nav,
    hero: c.hero ?? defaultConfig.hero,
    stats: Array.isArray(c.stats) ? c.stats : defaultConfig.stats,
    about: c.about ?? defaultConfig.about,
    courses: c.courses ?? defaultConfig.courses,
    franchise: c.franchise ?? defaultConfig.franchise,
    offers: c.offers ?? defaultConfig.offers,
    gallery: c.gallery ?? defaultConfig.gallery,
    footer: c.footer ?? defaultConfig.footer,
  };
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";
const labelClass = "text-sm font-medium text-foreground";
const btnAdd =
  "inline-flex items-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 hover:border-primary/70 transition-colors";
const btnRemove =
  "inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors";

export default function ManageUserPanelForm() {
  const { user } = useAuth();
  const isSuperAdmin = Number(user?.roleId) === ROLES.SUPER_ADMIN;
  const [config, setConfig] = useState<UserPanelConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("site");
  const [welcomeUploading, setWelcomeUploading] = useState(false);
  const [welcomeUploadError, setWelcomeUploadError] = useState<string | null>(null);
  const [welcomePreviewOpen, setWelcomePreviewOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/userpanel-config")
      .then((r) => r.json())
      .then((res) => {
        if (res?.data) setConfig(ensureConfig(res.data));
      })
      .catch(() => setConfig(defaultConfig))
      .finally(() => setLoading(false));
  }, []);

  const uploadWelcomeImage = async (file: File) => {
    setWelcomeUploadError(null);
    setWelcomeUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (config.welcomePopup.imageUrl) fd.append("oldUrl", config.welcomePopup.imageUrl);

      const res = await fetch("/api/admin/welcome-popup-image", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.data?.url) {
        setWelcomeUploadError(data?.error || "Upload failed");
        return;
      }
      setConfig((c) => ({
        ...c,
        welcomePopup: { ...c.welcomePopup, imageUrl: data.data.url as string },
      }));
    } catch {
      setWelcomeUploadError("Network error. Please try again.");
    } finally {
      setWelcomeUploading(false);
    }
  };

  const handleSave = async () => {
    if (!isSuperAdmin) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/userpanel-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data?.success) {
        setConfig(ensureConfig(data.data));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <Loader2 className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">Loading user panel settings…</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 mb-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                Content
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Manage User Panel
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Edit banner, hero, stats, courses, offers, and all content visitors see on the public homepage.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/userpanel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              <Monitor className="w-4 h-4" />
              View User Panel
              <ExternalLink className="w-4 h-4 opacity-60" />
            </Link>
            {isSuperAdmin ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all",
                  "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none shadow-sm"
                )}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? "Saving…" : "Save changes"}
              </button>
            ) : (
              <span className="text-sm text-muted-foreground">
                Only Super Admin can save changes.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Success message */}
      {saved && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-800 dark:text-green-200">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          Config saved. Refresh the user panel tab to see changes.
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex flex-wrap gap-1" aria-label="Sections">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-t-lg px-4 py-3 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border border-b-0 border-border bg-card text-foreground -mb-px"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content card */}
      <Card variant="default" className="overflow-hidden">
        <CardContent className="p-6 md:p-8">
          {/* Welcome Popup */}
          {activeTab === "welcomePopup" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Welcome Popup (User Panel)
              </h2>
              {config.welcomePopup.imageUrl && (
                <WelcomePopupModal
                  open={welcomePreviewOpen}
                  onClose={() => setWelcomePreviewOpen(false)}
                  imageUrl={config.welcomePopup.imageUrl}
                  size={config.welcomePopup.size ?? "lg"}
                />
              )}
              <p className="text-sm text-muted-foreground max-w-xl">
                When enabled, a professional modal with your image is shown once per browser session when a user opens the user panel. Only visible if you enable it and set an image URL.
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="welcomePopupEnabled"
                  checked={config.welcomePopup.enabled}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      welcomePopup: { ...c.welcomePopup, enabled: e.target.checked },
                    }))
                  }
                  className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary/20"
                />
                <label htmlFor="welcomePopupEnabled" className={labelClass}>
                  Enable welcome popup on user panel (show once per session)
                </label>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Upload image file</p>
                    <p className="text-xs text-muted-foreground">
                      Uploading a new file will replace the old uploaded image (old file will be deleted).
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setWelcomePreviewOpen(true)}
                      disabled={!config.welcomePopup.imageUrl}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors",
                        (!config.welcomePopup.imageUrl || welcomeUploading) && "opacity-60 pointer-events-none"
                      )}
                    >
                      <Monitor className="w-4 h-4" />
                      Preview
                    </button>
                    <label className={cn("inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors cursor-pointer", welcomeUploading && "opacity-60 pointer-events-none")}>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadWelcomeImage(f);
                          e.currentTarget.value = "";
                        }}
                      />
                      {welcomeUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      {welcomeUploading ? "Uploading…" : "Choose file"}
                    </label>
                  </div>
                </div>
                {welcomeUploadError && (
                  <div className="text-sm text-destructive">{welcomeUploadError}</div>
                )}
              </div>

              <div>
                <label className={labelClass}>Popup image URL</label>
                <input
                  className={inputClass}
                  placeholder="https://..."
                  value={config.welcomePopup.imageUrl ?? ""}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      welcomePopup: {
                        ...c.welcomePopup,
                        imageUrl: e.target.value.trim() || null,
                      },
                    }))
                  }
                />
                {config.welcomePopup.imageUrl && (
                  <div className="mt-3 relative h-48 w-full max-w-xl rounded-lg overflow-hidden bg-muted border border-border">
                    <img
                      src={config.welcomePopup.imageUrl}
                      alt="Popup preview"
                      className="object-contain w-full h-full"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Modal size</label>
                  <select
                    className={inputClass}
                    value={config.welcomePopup.size ?? "lg"}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        welcomePopup: {
                          ...c.welcomePopup,
                          size: e.target.value as any,
                        },
                      }))
                    }
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Site */}
          {activeTab === "site" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Layout className="w-5 h-5 text-primary" />
                Site (Logo & Name)
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Site name</label>
                  <input
                    className={inputClass}
                    value={config.site.name}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, site: { ...c.site, name: e.target.value } }))
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Logo letter</label>
                  <input
                    className={cn(inputClass, "max-w-[100px]")}
                    value={config.site.logoLetter}
                    maxLength={2}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, site: { ...c.site, logoLetter: e.target.value || "E" } }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Tagline</label>
                <input
                  className={inputClass}
                  value={config.site.tagline}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, site: { ...c.site, tagline: e.target.value } }))
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Header marquee (welcome message)</label>
                <input
                  className={inputClass}
                  placeholder="Welcome message shown in the header bar..."
                  value={config.site.headerMarquee ?? ""}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, site: { ...c.site, headerMarquee: e.target.value || undefined } }))
                  }
                />
                <p className="mt-1 text-xs text-muted-foreground">Shown in the user panel navbar as a scrolling marquee.</p>
              </div>
            </div>
          )}

          {/* Hero */}
          {activeTab === "hero" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                Hero & Banner
              </h2>
              <div>
                <label className={labelClass}>Banner / background image URL</label>
                <input
                  className={inputClass}
                  placeholder="https://..."
                  value={config.hero.backgroundImage}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, hero: { ...c.hero, backgroundImage: e.target.value } }))
                  }
                />
                {config.hero.backgroundImage && (
                  <div className="mt-3 relative h-40 w-full max-w-xl rounded-lg overflow-hidden bg-muted border border-border">
                    <img
                      src={config.hero.backgroundImage}
                      alt="Banner preview"
                      className="object-cover w-full h-full"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Greeting prefix</label>
                <input
                  className={inputClass}
                  value={config.hero.greetingPrefix}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, hero: { ...c.hero, greetingPrefix: e.target.value } }))
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Subtitle</label>
                <textarea
                  className={cn(inputClass, "min-h-[100px] resize-y")}
                  value={config.hero.subtitle}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, hero: { ...c.hero, subtitle: e.target.value } }))
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Primary button label</label>
                  <input
                    className={inputClass}
                    value={config.hero.ctaPrimary.label}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        hero: { ...c.hero, ctaPrimary: { ...c.hero.ctaPrimary, label: e.target.value } },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Primary button href</label>
                  <input
                    className={inputClass}
                    value={config.hero.ctaPrimary.href}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        hero: { ...c.hero, ctaPrimary: { ...c.hero.ctaPrimary, href: e.target.value } },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Secondary button label</label>
                  <input
                    className={inputClass}
                    value={config.hero.ctaSecondary.label}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        hero: { ...c.hero, ctaSecondary: { ...c.hero.ctaSecondary, label: e.target.value } },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Secondary button href</label>
                  <input
                    className={inputClass}
                    value={config.hero.ctaSecondary.href}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        hero: { ...c.hero, ctaSecondary: { ...c.hero.ctaSecondary, href: e.target.value } },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Nav */}
          {activeTab === "nav" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Menu className="w-5 h-5 text-primary" />
                Nav menu links
              </h2>
              <div className="space-y-4">
                {config.nav.links.map((link, i) => (
                  <div key={i} className="flex gap-3 items-end flex-wrap">
                    <div className="flex-1 min-w-[180px]">
                      <label className={labelClass}>Label</label>
                      <input
                        className={inputClass}
                        value={link.label}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            nav: {
                              ...c.nav,
                              links: c.nav.links.map((l, j) => (j === i ? { ...l, label: e.target.value } : l)),
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <label className={labelClass}>Link (href)</label>
                      <input
                        className={inputClass}
                        value={link.href}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            nav: {
                              ...c.nav,
                              links: c.nav.links.map((l, j) => (j === i ? { ...l, href: e.target.value } : l)),
                            },
                          }))
                        }
                      />
                    </div>
                    <button type="button" onClick={() => setConfig((c) => ({ ...c, nav: { ...c.nav, links: c.nav.links.filter((_, j) => j !== i) } }))} className={btnRemove}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, nav: { ...c.nav, links: [...c.nav.links, { label: "New link", href: "#" }] } }))}
                  className={btnAdd}
                >
                  <Plus className="w-4 h-4" /> Add link
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Stats (counts)
              </h2>
              <div className="space-y-4">
                {config.stats.map((stat, i) => (
                  <div key={stat.id} className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex-1 min-w-[140px]">
                      <label className={labelClass}>Label</label>
                      <input
                        className={inputClass}
                        value={stat.label}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            stats: c.stats.map((s, j) => (j === i ? { ...s, label: e.target.value } : s)),
                          }))
                        }
                      />
                    </div>
                    <div className="w-28">
                      <label className={labelClass}>Value</label>
                      <input
                        type="number"
                        className={inputClass}
                        value={stat.value}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            stats: c.stats.map((s, j) => (j === i ? { ...s, value: parseInt(e.target.value, 10) || 0 } : s)),
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Icon</label>
                      <select
                        className={inputClass}
                        value={stat.iconKey}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            stats: c.stats.map((s, j) => (j === i ? { ...s, iconKey: e.target.value as typeof stat.iconKey } : s)),
                          }))
                        }
                      >
                        {STAT_ICON_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="min-w-[200px]">
                      <label className={labelClass}>Color</label>
                      <select
                        className={inputClass}
                        value={stat.colorClass}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            stats: c.stats.map((s, j) => (j === i ? { ...s, colorClass: e.target.value } : s)),
                          }))
                        }
                      >
                        {COLOR_OPTIONS.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <button type="button" onClick={() => setConfig((c) => ({ ...c, stats: c.stats.filter((_, j) => j !== i) }))} className={btnRemove}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      stats: [...c.stats, { id: `stat-${Date.now()}`, label: "New stat", value: 0, iconKey: "courses", colorClass: COLOR_OPTIONS[0] }],
                    }))
                  }
                  className={btnAdd}
                >
                  <Plus className="w-4 h-4" /> Add stat
                </button>
              </div>
            </div>
          )}

          {/* About */}
          {activeTab === "about" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                About section
              </h2>
              <div>
                <label className={labelClass}>Title</label>
                <input
                  className={inputClass}
                  value={config.about.title}
                  onChange={(e) => setConfig((c) => ({ ...c, about: { ...c.about, title: e.target.value } }))}
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  className={cn(inputClass, "min-h-[120px] resize-y")}
                  value={config.about.description}
                  onChange={(e) => setConfig((c) => ({ ...c, about: { ...c.about, description: e.target.value } }))}
                />
              </div>
              <div>
                <label className={labelClass}>About image URL</label>
                <input
                  className={inputClass}
                  value={config.about.image}
                  onChange={(e) => setConfig((c) => ({ ...c, about: { ...c.about, image: e.target.value } }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Button label</label>
                  <input
                    className={inputClass}
                    value={config.about.buttonLabel}
                    onChange={(e) => setConfig((c) => ({ ...c, about: { ...c.about, buttonLabel: e.target.value } }))}
                  />
                </div>
                <div>
                  <label className={labelClass}>Button href</label>
                  <input
                    className={inputClass}
                    value={config.about.buttonHref}
                    onChange={(e) => setConfig((c) => ({ ...c, about: { ...c.about, buttonHref: e.target.value } }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Courses */}
          {activeTab === "courses" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Courses
              </h2>
              <div>
                <label className={labelClass}>Section title</label>
                <input
                  className={inputClass}
                  value={config.courses.sectionTitle}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, courses: { ...c.courses, sectionTitle: e.target.value } }))
                  }
                />
              </div>
              <div className="space-y-4">
                {config.courses.items.map((course, i) => (
                  <div key={course.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="text-sm text-muted-foreground">
                        Course #{i + 1}
                      </div>
                      <label className="inline-flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={course.enabled !== false}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              courses: {
                                ...c.courses,
                                items: c.courses.items.map((it, j) =>
                                  j === i ? { ...it, enabled: e.target.checked } : it
                                ),
                              },
                            }))
                          }
                          className="h-4 w-4 accent-primary"
                        />
                        Visible on user panel
                      </label>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className={labelClass}>Title</label>
                        <input
                          className={inputClass}
                          value={course.title}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              courses: { ...c.courses, items: c.courses.items.map((it, j) => (j === i ? { ...it, title: e.target.value } : it)) },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Slug (URL)</label>
                        <input
                          className={inputClass}
                          placeholder="e.g. full-stack-development"
                          value={course.slug ?? ""}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              courses: { ...c.courses, items: c.courses.items.map((it, j) => (j === i ? { ...it, slug: e.target.value.trim() || undefined } : it)) },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Duration</label>
                        <input
                          className={inputClass}
                          value={course.duration}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              courses: { ...c.courses, items: c.courses.items.map((it, j) => (j === i ? { ...it, duration: e.target.value } : it)) },
                            }))
                          }
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className={labelClass}>Image URL</label>
                        <input
                          className={inputClass}
                          value={course.image}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              courses: { ...c.courses, items: c.courses.items.map((it, j) => (j === i ? { ...it, image: e.target.value } : it)) },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea
                        className={cn(inputClass, "min-h-[80px] resize-y")}
                        value={course.description ?? ""}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            courses: { ...c.courses, items: c.courses.items.map((it, j) => (j === i ? { ...it, description: e.target.value.trim() || undefined } : it)) },
                          }))
                        }
                        placeholder="Short description for course card and detail page"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div>
                        <label className={labelClass}>Enrolled (count)</label>
                        <input
                          type="number"
                          className={inputClass}
                          value={course.enrolled ?? ""}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              courses: { ...c.courses, items: c.courses.items.map((it, j) => (j === i ? { ...it, enrolled: e.target.value === "" ? undefined : parseInt(e.target.value, 10) || 0 } : it)) },
                            }))
                          }
                          placeholder="1240"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Lectures</label>
                        <input
                          type="number"
                          className={inputClass}
                          value={course.lectures ?? ""}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              courses: { ...c.courses, items: c.courses.items.map((it, j) => (j === i ? { ...it, lectures: e.target.value === "" ? undefined : parseInt(e.target.value, 10) || 0 } : it)) },
                            }))
                          }
                          placeholder="48"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Videos</label>
                        <input
                          type="number"
                          className={inputClass}
                          value={course.videos ?? ""}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              courses: { ...c.courses, items: c.courses.items.map((it, j) => (j === i ? { ...it, videos: e.target.value === "" ? undefined : parseInt(e.target.value, 10) || 0 } : it)) },
                            }))
                          }
                          placeholder="120"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Notes (label)</label>
                        <input
                          className={inputClass}
                          value={course.notes ?? ""}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              courses: { ...c.courses, items: c.courses.items.map((it, j) => (j === i ? { ...it, notes: e.target.value.trim() || undefined } : it)) },
                            }))
                          }
                          placeholder="PDF notes per module"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig((c) => ({ ...c, courses: { ...c.courses, items: c.courses.items.filter((_, j) => j !== i) } }))}
                      className="text-sm text-muted-foreground hover:text-destructive"
                    >
                      Remove course
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      courses: {
                        ...c.courses,
                        items: [...c.courses.items, { id: `course-${Date.now()}`, title: "New course", duration: "0 Months", image: "", slug: "", enabled: true }],
                      },
                    }))
                  }
                  className={btnAdd}
                >
                  <Plus className="w-4 h-4" /> Add course
                </button>
              </div>
            </div>
          )}

          {/* Franchise */}
          {activeTab === "franchise" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Franchise highlight
              </h2>
              {!config.franchise.highlight ? (
                <p className="text-sm text-muted-foreground py-4">No franchise highlight configured. Add one in config if needed.</p>
              ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Branch name</label>
                  <input
                    className={inputClass}
                    value={config.franchise.highlight.name}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        franchise: {
                          ...c.franchise,
                          highlight: c.franchise.highlight ? { ...c.franchise.highlight, name: e.target.value } : null,
                        },
                      }))
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Image URL</label>
                  <input
                    className={inputClass}
                    value={config.franchise.highlight.image}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        franchise: {
                          ...c.franchise,
                          highlight: c.franchise.highlight ? { ...c.franchise.highlight, image: e.target.value } : null,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Location</label>
                  <input
                    className={inputClass}
                    value={config.franchise.highlight.location}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        franchise: {
                          ...c.franchise,
                          highlight: c.franchise.highlight ? { ...c.franchise.highlight, location: e.target.value } : null,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Head name</label>
                  <input
                    className={inputClass}
                    value={config.franchise.highlight.head}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        franchise: {
                          ...c.franchise,
                          highlight: c.franchise.highlight ? { ...c.franchise.highlight, head: e.target.value } : null,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Contact</label>
                  <input
                    className={inputClass}
                    value={config.franchise.highlight.contact}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        franchise: {
                          ...c.franchise,
                          highlight: c.franchise.highlight ? { ...c.franchise.highlight, contact: e.target.value } : null,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    className={inputClass}
                    value={config.franchise.highlight.email}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        franchise: {
                          ...c.franchise,
                          highlight: c.franchise.highlight ? { ...c.franchise.highlight, email: e.target.value } : null,
                        },
                      }))
                    }
                  />
                </div>
              </div>
              )}
            </div>
          )}

          {/* Offers */}
          {activeTab === "offers" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Offers
              </h2>
              <div>
                <label className={labelClass}>Section title</label>
                <input
                  className={inputClass}
                  value={config.offers.sectionTitle}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, offers: { ...c.offers, sectionTitle: e.target.value } }))
                  }
                />
              </div>
              <div className="space-y-4">
                {config.offers.items.map((offer, i) => (
                  <div key={offer.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className={labelClass}>Title</label>
                        <input
                          className={inputClass}
                          value={offer.title}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              offers: { ...c.offers, items: c.offers.items.map((it, j) => (j === i ? { ...it, title: e.target.value } : it)) },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Discount %</label>
                        <input
                          type="number"
                          className={inputClass}
                          value={offer.discount}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              offers: { ...c.offers, items: c.offers.items.map((it, j) => (j === i ? { ...it, discount: parseInt(e.target.value, 10) || 0 } : it)) },
                            }))
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Description</label>
                        <input
                          className={inputClass}
                          value={offer.description}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              offers: { ...c.offers, items: c.offers.items.map((it, j) => (j === i ? { ...it, description: e.target.value } : it)) },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig((c) => ({ ...c, offers: { ...c.offers, items: c.offers.items.filter((_, j) => j !== i) } }))}
                      className="text-sm text-muted-foreground hover:text-destructive"
                    >
                      Remove offer
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      offers: { ...c.offers, items: [...c.offers.items, { id: `offer-${Date.now()}`, title: "New offer", discount: 10, description: "" }] },
                    }))
                  }
                  className={btnAdd}
                >
                  <Plus className="w-4 h-4" /> Add offer
                </button>
              </div>
            </div>
          )}

          {/* Gallery */}
          {activeTab === "gallery" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Images className="w-5 h-5 text-primary" />
                Gallery
              </h2>
              <div>
                <label className={labelClass}>Section title</label>
                <input
                  className={inputClass}
                  value={config.gallery.sectionTitle}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, gallery: { ...c.gallery, sectionTitle: e.target.value } }))
                  }
                />
              </div>
              <div className="space-y-4">
                {config.gallery.images.map((img, i) => (
                  <div key={i} className="flex gap-3 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <label className={labelClass}>Image URL</label>
                      <input
                        className={inputClass}
                        value={img.src}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            gallery: { ...c.gallery, images: c.gallery.images.map((im, j) => (j === i ? { ...im, src: e.target.value } : im)) },
                          }))
                        }
                      />
                    </div>
                    <div className="w-40">
                      <label className={labelClass}>Alt text</label>
                      <input
                        className={inputClass}
                        value={img.alt ?? ""}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            gallery: { ...c.gallery, images: c.gallery.images.map((im, j) => (j === i ? { ...im, alt: e.target.value || undefined } : im)) },
                          }))
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig((c) => ({ ...c, gallery: { ...c.gallery, images: c.gallery.images.filter((_, j) => j !== i) } }))}
                      className={btnRemove}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setConfig((c) => ({ ...c, gallery: { ...c.gallery, images: [...c.gallery.images, { src: "", alt: "" }] } }))}
                  className={btnAdd}
                >
                  <Plus className="w-4 h-4" /> Add image
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          {activeTab === "footer" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Footprints className="w-5 h-5 text-primary" />
                Footer & Contact
              </h2>
              <div>
                <label className={labelClass}>Tagline</label>
                <input
                  className={inputClass}
                  value={config.footer.tagline}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, footer: { ...c.footer, tagline: e.target.value } }))
                  }
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Contact email</label>
                  <input
                    className={inputClass}
                    value={config.footer.contact.email}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        footer: { ...c.footer, contact: { ...c.footer.contact, email: e.target.value } },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Contact phone</label>
                  <input
                    className={inputClass}
                    value={config.footer.contact.phone}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        footer: { ...c.footer, contact: { ...c.footer.contact, phone: e.target.value } },
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Copyright text</label>
                <input
                  className={inputClass}
                  value={config.footer.copyrightText}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, footer: { ...c.footer, copyrightText: e.target.value } }))
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
