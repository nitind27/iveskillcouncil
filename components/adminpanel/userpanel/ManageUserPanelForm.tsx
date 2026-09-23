"use client";

import React, { useState, useEffect } from "react";
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
  MessageSquare,
  Pencil,
} from "lucide-react";
import type { UserPanelConfig } from "@/config/userpanel.config";
import { defaultConfig } from "@/config/userpanel.config";
import { cn } from "@/lib/utils";
import WelcomePopupModal from "@/components/userpanel/WelcomePopupModal";
import { ImageEditorModal } from "@/components/common/ImageEditorModal";
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
  { id: "testimonials", label: "Testimonials", icon: MessageSquare },
  { id: "gallery", label: "Gallery", icon: Images },
  { id: "footer", label: "Footer", icon: Footprints },
] as const;

function ensureConfig(c: Partial<UserPanelConfig> | null): UserPanelConfig {
  if (!c || typeof c !== "object") return defaultConfig;
  return {
    welcomePopup: {
      ...defaultConfig.welcomePopup,
      ...(c.welcomePopup ?? {}),
    },
    site: c.site ?? defaultConfig.site,
    nav: c.nav ?? defaultConfig.nav,
    hero: c.hero ?? defaultConfig.hero,
    stats: Array.isArray(c.stats) ? c.stats : defaultConfig.stats,
    about: c.about ?? defaultConfig.about,
    courses: c.courses ?? defaultConfig.courses,
    franchise: c.franchise ?? defaultConfig.franchise,
    offers: c.offers ?? defaultConfig.offers,
    gallery: c.gallery ?? defaultConfig.gallery,
    testimonials: c.testimonials ?? defaultConfig.testimonials,
    footer: c.footer ?? defaultConfig.footer,
  };
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-border/70 bg-background px-3.5 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground transition-colors focus:border-[#1E4A85] focus:outline-none focus:ring-2 focus:ring-[#1E4A85]/15";
const labelClass = "text-sm font-medium text-foreground";
const btnAdd =
  "inline-flex items-center gap-2 rounded-lg border border-dashed border-[#1E4A85]/40 bg-[#1E4A85]/5 px-4 py-2.5 text-sm font-medium text-[#1E4A85] transition-colors hover:border-[#1E4A85]/60 hover:bg-[#1E4A85]/10";
const btnRemove =
  "inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive";

function getFullImageUrl(url: string): string {
  if (typeof window === "undefined") return url;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
  if (url.startsWith("/")) return window.location.origin + url;
  return url;
}

export default function ManageUserPanelForm() {
  const { user } = useAuth();
  const isSuperAdminOrAdmin = Number(user?.roleId) === ROLES.SUPER_ADMIN || Number(user?.roleId) === ROLES.ADMIN;
  const [config, setConfig] = useState<UserPanelConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("welcomePopup");
  const [welcomeUploading, setWelcomeUploading] = useState(false);
  const [welcomeUploadError, setWelcomeUploadError] = useState<string | null>(null);
  const [welcomePreviewOpen, setWelcomePreviewOpen] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroUploadError, setHeroUploadError] = useState<string | null>(null);
  const [heroUrlDraft, setHeroUrlDraft] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [aboutImageUploading, setAboutImageUploading] = useState(false);
  const [aboutImageUploadError, setAboutImageUploadError] = useState<string | null>(null);
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [imageEditorSource, setImageEditorSource] = useState<File | string | null>(null);
  const [imageEditorType, setImageEditorType] = useState<"welcome" | "logo" | "hero" | "about" | null>(null);
  const [imageEditorHeroIndex, setImageEditorHeroIndex] = useState<number | null>(null);
  const [heroFilesQueue, setHeroFilesQueue] = useState<File[]>([]);

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
      const newUrl = data.data.url as string;
      setConfig((c) => ({
        ...c,
        welcomePopup: { ...c.welcomePopup, imageUrl: newUrl },
      }));
      // Auto-save so URL persists immediately
      const saveRes = await fetch("/api/admin/userpanel-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          welcomePopup: { ...config.welcomePopup, imageUrl: newUrl },
        }),
      });
      if (!saveRes.ok) {
        setWelcomeUploadError("Uploaded but failed to save. Click 'Save changes'.");
      }
    } catch {
      setWelcomeUploadError("Network error. Please try again.");
    } finally {
      setWelcomeUploading(false);
    }
  };

  const getHeroImages = (c: UserPanelConfig) => {
    if (Array.isArray(c.hero.backgroundImages) && c.hero.backgroundImages.length > 0) {
      return c.hero.backgroundImages.filter(Boolean);
    }
    return c.hero.backgroundImage ? [c.hero.backgroundImage] : [];
  };

  const setHeroImages = (nextImages: string[]) => {
    setConfig((c) => ({
      ...c,
      hero: {
        ...c.hero,
        backgroundImages: nextImages.length > 0 ? nextImages : undefined,
        // Keep first image in `backgroundImage` for backward compatibility.
        backgroundImage: nextImages[0] ?? "",
      },
    }));
  };

  const uploadLogo = async (file: File) => {
    setLogoUploadError(null);
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (config.site.logoUrl) fd.append("oldUrl", config.site.logoUrl);

      const res = await fetch("/api/admin/logo-upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.data?.url) {
        setLogoUploadError(data?.error || "Upload failed");
        return;
      }
      setConfig((c) => ({ ...c, site: { ...c.site, logoUrl: data.data.url } }));
    } catch {
      setLogoUploadError("Upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  const openImageEditor = (source: File | string, type: "welcome" | "logo" | "hero" | "about", heroIndex?: number) => {
    setImageEditorSource(source);
    setImageEditorType(type);
    setImageEditorHeroIndex(heroIndex ?? null);
    setImageEditorOpen(true);
  };

  const handleImageEditorSave = async (file: File) => {
    if (!imageEditorType) return;
    if (imageEditorType === "welcome") {
      await uploadWelcomeImage(file);
    } else if (imageEditorType === "logo") {
      await uploadLogo(file);
    } else if (imageEditorType === "about") {
      await uploadAboutImage(file);
    } else if (imageEditorType === "hero") {
      if (imageEditorHeroIndex !== null) {
        const res = await uploadHeroImageAndGetUrl(file);
        if (res) {
          setConfig((c) => {
            const prev = getHeroImages(c);
            const next = prev.map((u, j) => (j === imageEditorHeroIndex ? res : u));
            return {
              ...c,
              hero: {
                ...c.hero,
                backgroundImages: next.length > 0 ? next : undefined,
                backgroundImage: next[0] ?? "",
              },
            };
          });
        }
      } else {
        await uploadHeroImages([file]);
        const rest = heroFilesQueue.slice(1);
        setHeroFilesQueue(rest);
        if (rest.length > 0) {
          setImageEditorSource(rest[0]);
          setImageEditorType("hero");
          setImageEditorOpen(true);
          setImageEditorHeroIndex(null);
          return;
        }
      }
    }
    setImageEditorOpen(false);
    setImageEditorSource(null);
    setImageEditorType(null);
    setImageEditorHeroIndex(null);
  };

  const uploadHeroImageAndGetUrl = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/hero-background-image", { method: "POST", body: fd });
      const data = await res.json();
      return res.ok && data?.success && data?.data?.url ? (data.data.url as string) : null;
    } catch {
      return null;
    }
  };

  const closeImageEditor = () => {
    setImageEditorOpen(false);
    setImageEditorSource(null);
    setImageEditorType(null);
    setImageEditorHeroIndex(null);
    setHeroFilesQueue([]);
  };

  const uploadAboutImage = async (file: File) => {
    setAboutImageUploadError(null);
    setAboutImageUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (config.about.image) fd.append("oldUrl", config.about.image);

      const res = await fetch("/api/admin/about-image", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data?.success || !data?.data?.url) {
        setAboutImageUploadError(data?.error || "Upload failed");
        return;
      }
      setConfig((c) => ({ ...c, about: { ...c.about, image: data.data.url } }));
    } catch {
      setAboutImageUploadError("Upload failed");
    } finally {
      setAboutImageUploading(false);
    }
  };

  const uploadHeroImages = async (files: File[]) => {
    if (!files.length) return;
    setHeroUploadError(null);
    setHeroUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/admin/hero-background-image", {
          method: "POST",
          body: fd,
        });

        const data = await res.json();
        if (!res.ok || !data?.success || !data?.data?.url) {
          setHeroUploadError(data?.error || "Upload failed");
          return;
        }

        uploadedUrls.push(data.data.url as string);
      }

      const prev = getHeroImages(config);
      setHeroImages([...prev, ...uploadedUrls]);
    } catch {
      setHeroUploadError("Network error. Please try again.");
    } finally {
      setHeroUploading(false);
    }
  };

  const handleSave = async () => {
    if (!isSuperAdminOrAdmin) return;
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
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <div className="relative">
          <div className="h-14 w-14 animate-spin rounded-full border-2 border-[#1E4A85]/20 border-t-[#1E4A85]" />
          <Loader2 className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-spin text-[#1E4A85]" />
        </div>
        <p className="text-sm text-muted-foreground">Loading user panel settings…</p>
      </div>
    );
  }

  const activeTabMeta = TABS.find((t) => t.id === activeTab);

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] text-white shadow-md shadow-[#1E4A85]/15">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/55">
              <Link href="/dashboard" className="hover:text-white/90">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-white/80">User Panel</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">User Panel Settings</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A35A]/35 bg-[#C4A35A]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#F5E6C8]">
                <Monitor className="h-3 w-3" />
                Public site
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs text-white/60 sm:text-sm">
              Configure hero, stats, courses, franchise section, offers, gallery, and footer on the public homepage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">Sections</p>
                <p className="font-bold tabular-nums leading-tight">{TABS.length}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#F5E6C8]/80">Editing</p>
                <p className="max-w-[88px] truncate text-xs font-bold leading-tight text-[#F5E6C8]">
                  {activeTabMeta?.label ?? "—"}
                </p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-200/80">Popup</p>
                <p className="font-bold tabular-nums leading-tight text-emerald-100">
                  {config.welcomePopup.enabled ? "On" : "Off"}
                </p>
              </div>
            </div>

            <Link
              href="/userpanel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <Monitor className="h-3.5 w-3.5" />
              Preview
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Link>

            {isSuperAdminOrAdmin ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C4A35A] px-4 text-xs font-bold text-[#0B132B] transition hover:brightness-110 disabled:pointer-events-none disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {saving ? "Saving…" : "Save changes"}
              </button>
            ) : (
              <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/70">
                View only — admin can save
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Success message */}
      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Config saved. Refresh the user panel tab to see changes.
        </div>
      )}

      {/* Tabs */}
      <div className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
        <div className="border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.04] to-transparent px-2 pt-2 sm:px-3">
          <nav className="flex flex-wrap gap-1 pb-px" aria-label="Sections">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-t-lg px-3 py-2.5 text-xs font-medium transition sm:px-4 sm:text-sm",
                    activeTab === tab.id
                      ? "border border-b-0 border-[#1E4A85]/15 bg-card text-[#1E4A85] shadow-sm -mb-px"
                      : "text-muted-foreground hover:bg-[#1E4A85]/5 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Welcome Popup */}
          {activeTab === "welcomePopup" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#1E4A85]" />
                    Welcome Popup (User Panel)
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Control whether the popup shows, its size, image, text, button, and how often it appears.
                    Changes apply after Save — then refresh the user panel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setWelcomePreviewOpen(true)}
                  disabled={!config.welcomePopup.imageUrl}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border border-[#1E4A85]/25 bg-[#1E4A85]/5 px-4 py-2.5 text-sm font-semibold text-[#1E4A85] transition hover:bg-[#1E4A85]/10",
                    !config.welcomePopup.imageUrl && "opacity-50 pointer-events-none"
                  )}
                >
                  <Monitor className="w-4 h-4" />
                  Live preview
                </button>
              </div>

              {config.welcomePopup.imageUrl && (
                <WelcomePopupModal
                  open={welcomePreviewOpen}
                  onClose={() => setWelcomePreviewOpen(false)}
                  imageUrl={getFullImageUrl(config.welcomePopup.imageUrl)}
                  size={config.welcomePopup.size ?? "lg"}
                  customWidthPx={config.welcomePopup.customWidthPx}
                  maxHeightVh={config.welcomePopup.maxHeightVh}
                  imageFit={config.welcomePopup.imageFit}
                  altText={config.welcomePopup.altText}
                  title={config.welcomePopup.title}
                  showTitle={config.welcomePopup.showTitle}
                  body={config.welcomePopup.body}
                  showBody={config.welcomePopup.showBody}
                  ctaLabel={config.welcomePopup.ctaLabel}
                  ctaHref={config.welcomePopup.ctaHref}
                  showCta={config.welcomePopup.showCta}
                  showCloseButton={config.welcomePopup.showCloseButton !== false}
                  closeOnBackdrop={config.welcomePopup.closeOnBackdrop !== false}
                  backdropOpacity={config.welcomePopup.backdropOpacity}
                />
              )}

              {/* On / Off */}
              <div
                className={cn(
                  "flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between",
                  config.welcomePopup.enabled
                    ? "border-emerald-300/70 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/30"
                    : "border-border bg-muted/30"
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">Show welcome popup</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {config.welcomePopup.enabled
                      ? "ON — visitors will see the popup (if an image is set)."
                      : "OFF — popup is hidden on the user panel."}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={config.welcomePopup.enabled}
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      welcomePopup: { ...c.welcomePopup, enabled: !c.welcomePopup.enabled },
                    }))
                  }
                  className={cn(
                    "relative h-10 w-[88px] shrink-0 rounded-full transition-colors",
                    config.welcomePopup.enabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 left-1 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-black shadow transition-transform",
                      config.welcomePopup.enabled && "translate-x-[48px]"
                    )}
                  >
                    {config.welcomePopup.enabled ? "ON" : "OFF"}
                  </span>
                </button>
              </div>

              {/* Image */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-foreground">Popup image</p>
                    <p className="text-xs text-muted-foreground">
                      Required for the popup to appear. New upload replaces the previous file.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {config.welcomePopup.imageUrl && (
                      <button
                        type="button"
                        onClick={() => openImageEditor(getFullImageUrl(config.welcomePopup.imageUrl!), "welcome")}
                        disabled={welcomeUploading}
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit image
                      </button>
                    )}
                    <label
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent",
                        welcomeUploading && "pointer-events-none opacity-60"
                      )}
                    >
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
                      {welcomeUploading ? "Uploading…" : "Upload"}
                    </label>
                  </div>
                </div>
                {welcomeUploadError && <p className="text-sm text-destructive">{welcomeUploadError}</p>}
                <div>
                  <label className={labelClass}>Image URL</label>
                  <input
                    className={inputClass}
                    placeholder="/uploads/userpanel/welcome/… or https://…"
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
                </div>
                <div>
                  <label className={labelClass}>Alt text (accessibility)</label>
                  <input
                    className={inputClass}
                    placeholder="Welcome"
                    value={config.welcomePopup.altText ?? ""}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        welcomePopup: { ...c.welcomePopup, altText: e.target.value },
                      }))
                    }
                  />
                </div>
                {config.welcomePopup.imageUrl && (
                  <div className="relative h-52 w-full max-w-xl overflow-hidden rounded-xl border border-border bg-muted">
                    <img
                      src={getFullImageUrl(config.welcomePopup.imageUrl)}
                      alt="Popup preview"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        const t = e.currentTarget;
                        t.style.display = "none";
                        const p = t.parentElement;
                        if (p) {
                          p.innerHTML = `<div class="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground text-sm"><span>Image not found</span><span class="text-xs break-all px-4 text-center">${config.welcomePopup.imageUrl}</span></div>`;
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Size */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div>
                  <p className="text-sm font-bold text-foreground">Size & display</p>
                  <p className="text-xs text-muted-foreground">
                    Pick a preset or set exact max width / height so the popup fits your image.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-5">
                  {(
                    [
                      { id: "sm", label: "S", hint: "448px" },
                      { id: "md", label: "M", hint: "512px" },
                      { id: "lg", label: "L", hint: "672px" },
                      { id: "xl", label: "XL", hint: "896px" },
                      { id: "custom", label: "Custom", hint: "px" },
                    ] as const
                  ).map((opt) => {
                    const active = (config.welcomePopup.size ?? "lg") === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          setConfig((c) => ({
                            ...c,
                            welcomePopup: { ...c.welcomePopup, size: opt.id },
                          }))
                        }
                        className={cn(
                          "rounded-xl border px-3 py-3 text-center transition",
                          active
                            ? "border-[#1E4A85] bg-[#1E4A85]/10 ring-2 ring-[#1E4A85]/25"
                            : "border-border hover:bg-muted/50"
                        )}
                      >
                        <span className="block text-sm font-bold text-foreground">{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground">{opt.hint}</span>
                      </button>
                    );
                  })}
                </div>

                {(config.welcomePopup.size ?? "lg") === "custom" && (
                  <div>
                    <label className={labelClass}>
                      Max width: {config.welcomePopup.customWidthPx ?? 720}px
                    </label>
                    <input
                      type="range"
                      min={280}
                      max={1200}
                      step={10}
                      value={config.welcomePopup.customWidthPx ?? 720}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          welcomePopup: {
                            ...c.welcomePopup,
                            customWidthPx: Number(e.target.value),
                          },
                        }))
                      }
                      className="mt-2 w-full accent-[#1E4A85]"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min={280}
                        max={1200}
                        className={cn(inputClass, "mt-0 max-w-[140px]")}
                        value={config.welcomePopup.customWidthPx ?? 720}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            welcomePopup: {
                              ...c.welcomePopup,
                              customWidthPx: Math.min(1200, Math.max(280, Number(e.target.value) || 720)),
                            },
                          }))
                        }
                      />
                      <span className="text-xs text-muted-foreground">px (280–1200)</span>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Max height: {config.welcomePopup.maxHeightVh ?? 85}vh
                    </label>
                    <input
                      type="range"
                      min={45}
                      max={95}
                      step={1}
                      value={config.welcomePopup.maxHeightVh ?? 85}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          welcomePopup: {
                            ...c.welcomePopup,
                            maxHeightVh: Number(e.target.value),
                          },
                        }))
                      }
                      className="mt-2 w-full accent-[#1E4A85]"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Image fit</label>
                    <select
                      className={inputClass}
                      value={config.welcomePopup.imageFit ?? "contain"}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          welcomePopup: {
                            ...c.welcomePopup,
                            imageFit: e.target.value as "contain" | "cover" | "fill",
                          },
                        }))
                      }
                    >
                      <option value="contain">Contain (full image, no crop)</option>
                      <option value="cover">Cover (fill frame, may crop)</option>
                      <option value="fill">Fill (stretch to frame)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>
                    Backdrop darkness: {config.welcomePopup.backdropOpacity ?? 80}%
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={95}
                    step={5}
                    value={config.welcomePopup.backdropOpacity ?? 80}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        welcomePopup: {
                          ...c.welcomePopup,
                          backdropOpacity: Number(e.target.value),
                        },
                      }))
                    }
                    className="mt-2 w-full accent-[#1E4A85]"
                  />
                </div>
              </div>

              {/* Text & CTA */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div>
                  <p className="text-sm font-bold text-foreground">Text & button</p>
                  <p className="text-xs text-muted-foreground">Optional title, description, and CTA under the image.</p>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                  <label htmlFor="wpShowTitle" className="text-sm font-medium">Show title</label>
                  <input
                    id="wpShowTitle"
                    type="checkbox"
                    checked={Boolean(config.welcomePopup.showTitle)}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        welcomePopup: { ...c.welcomePopup, showTitle: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 rounded border-input text-[#1E4A85]"
                  />
                </div>
                {config.welcomePopup.showTitle && (
                  <div>
                    <label className={labelClass}>Title</label>
                    <input
                      className={inputClass}
                      placeholder="Welcome to our institute"
                      value={config.welcomePopup.title ?? ""}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          welcomePopup: { ...c.welcomePopup, title: e.target.value },
                        }))
                      }
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                  <label htmlFor="wpShowBody" className="text-sm font-medium">Show description</label>
                  <input
                    id="wpShowBody"
                    type="checkbox"
                    checked={Boolean(config.welcomePopup.showBody)}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        welcomePopup: { ...c.welcomePopup, showBody: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 rounded border-input text-[#1E4A85]"
                  />
                </div>
                {config.welcomePopup.showBody && (
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                      className={cn(inputClass, "min-h-[88px] resize-y")}
                      placeholder="Short message for visitors…"
                      value={config.welcomePopup.body ?? ""}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          welcomePopup: { ...c.welcomePopup, body: e.target.value },
                        }))
                      }
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5">
                  <label htmlFor="wpShowCta" className="text-sm font-medium">Show CTA button</label>
                  <input
                    id="wpShowCta"
                    type="checkbox"
                    checked={Boolean(config.welcomePopup.showCta)}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        welcomePopup: { ...c.welcomePopup, showCta: e.target.checked },
                      }))
                    }
                    className="h-4 w-4 rounded border-input text-[#1E4A85]"
                  />
                </div>
                {config.welcomePopup.showCta && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Button label</label>
                      <input
                        className={inputClass}
                        placeholder="Explore courses"
                        value={config.welcomePopup.ctaLabel ?? ""}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            welcomePopup: { ...c.welcomePopup, ctaLabel: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Button link</label>
                      <input
                        className={inputClass}
                        placeholder="/userpanel/courses"
                        value={config.welcomePopup.ctaHref ?? ""}
                        onChange={(e) =>
                          setConfig((c) => ({
                            ...c,
                            welcomePopup: { ...c.welcomePopup, ctaHref: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Behavior */}
              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div>
                  <p className="text-sm font-bold text-foreground">Behavior</p>
                  <p className="text-xs text-muted-foreground">When and how the popup opens / closes.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Show frequency</label>
                    <select
                      className={inputClass}
                      value={config.welcomePopup.frequency ?? "once_per_session"}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          welcomePopup: {
                            ...c.welcomePopup,
                            frequency: e.target.value as
                              | "once_per_session"
                              | "once_ever"
                              | "every_visit",
                          },
                        }))
                      }
                    >
                      <option value="once_per_session">Once per browser session</option>
                      <option value="once_ever">Once ever (this browser)</option>
                      <option value="every_visit">Every page visit</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      Open delay: {config.welcomePopup.delayMs ?? 400}ms
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={3000}
                      step={100}
                      value={config.welcomePopup.delayMs ?? 400}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          welcomePopup: {
                            ...c.welcomePopup,
                            delayMs: Number(e.target.value),
                          },
                        }))
                      }
                      className="mt-3 w-full accent-[#1E4A85]"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-sm font-medium">
                    Show close (X) button
                    <input
                      type="checkbox"
                      checked={config.welcomePopup.showCloseButton !== false}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          welcomePopup: { ...c.welcomePopup, showCloseButton: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-input text-[#1E4A85]"
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 text-sm font-medium">
                    Close on backdrop click
                    <input
                      type="checkbox"
                      checked={config.welcomePopup.closeOnBackdrop !== false}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          welcomePopup: { ...c.welcomePopup, closeOnBackdrop: e.target.checked },
                        }))
                      }
                      className="h-4 w-4 rounded border-input text-[#1E4A85]"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Site */}
          {activeTab === "site" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Layout className="w-5 h-5 text-[#1E4A85]" />
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
                  <label className={labelClass}>Logo letter (fallback)</label>
                  <input
                    className={cn(inputClass, "max-w-[100px]")}
                    value={config.site.logoLetter}
                    maxLength={2}
                    placeholder="E"
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, site: { ...c.site, logoLetter: e.target.value || "E" } }))
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Shown when no logo URL is set.</p>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Logo</label>
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 mt-1.5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Upload logo file</p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG (max 2MB). Same logo shows in user panel, login, and admin.
                        </p>
                      </div>
                      <label className={cn("inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors cursor-pointer", logoUploading && "opacity-60 pointer-events-none")}>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadLogo(f);
                            e.currentTarget.value = "";
                          }}
                        />
                        {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        {logoUploading ? "Uploading…" : "Choose file"}
                      </label>
                    </div>
                    {config.site.logoUrl && (
                      <div className="flex items-center gap-3 flex-wrap">
                        <img src={config.site.logoUrl} alt="Logo" className="h-12 w-auto max-w-[120px] object-contain rounded border border-border" />
                        <button
                          type="button"
                          onClick={() => openImageEditor(getFullImageUrl(config.site.logoUrl!), "logo")}
                          disabled={logoUploading}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfig((c) => ({ ...c, site: { ...c.site, logoUrl: null } }))}
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          Remove logo
                        </button>
                      </div>
                    )}
                    {logoUploadError && <p className="text-sm text-destructive">{logoUploadError}</p>}
                  </div>
                  <div className="mt-2">
                    <label className="text-xs text-muted-foreground">Or paste URL</label>
                    <input
                      className={inputClass}
                      placeholder="/logo/1.png or https://..."
                      value={config.site.logoUrl ?? ""}
                      onChange={(e) =>
                        setConfig((c) => ({ ...c, site: { ...c.site, logoUrl: e.target.value.trim() || null } }))
                      }
                    />
                  </div>
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
                <ImageIcon className="w-5 h-5 text-[#1E4A85]" />
                Hero & Banner
              </h2>
              <div>
                <label className={labelClass}>Hero background images</label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add multiple images. Paste image URL(s) or upload files. Rotation will use this list.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Add image URL</label>
                    <div className="flex gap-3 mt-1">
                      <input
                        className={inputClass}
                        placeholder="https://example.com/image.jpg"
                        value={heroUrlDraft}
                        onChange={(e) => setHeroUrlDraft(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const url = heroUrlDraft.trim();
                          if (!url) return;
                          const prev = getHeroImages(config);
                          setHeroImages([...prev, url]);
                          setHeroUrlDraft("");
                        }}
                        className={btnAdd}
                        disabled={heroUploading}
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Upload image files</label>
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <label
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#1E4A85]/50 bg-[#1E4A85]/5 px-4 py-2.5 text-sm font-medium text-[#1E4A85] transition-colors hover:border-[#1E4A85]/70 hover:bg-[#1E4A85]/10",
                          heroUploading && "opacity-60 pointer-events-none"
                        )}
                      >
                        <Images className="w-4 h-4" />
                        {heroUploading ? "Uploading..." : "Upload images (multiple)"}
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            if (files.length) uploadHeroImages(files);
                            e.target.value = "";
                          }}
                          disabled={heroUploading}
                        />
                      </label>
                      {heroUploadError && <div className="text-sm text-destructive">{heroUploadError}</div>}
                    </div>
                  </div>
                </div>

                {(() => {
                  const heroImages = getHeroImages(config);
                  return (
                    <div className="mt-5 space-y-4">
                      {heroImages.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          No hero images yet. Add a URL or upload files above.
                        </div>
                      ) : (
                        heroImages.map((img, i) => (
                          <div
                            key={`${img}-${i}`}
                            className="rounded-lg border border-border bg-muted/30 p-3 space-y-3"
                          >
                            <div className="flex items-start gap-3 flex-col sm:flex-row sm:items-center">
                              <div className="flex-1">
                                <label className={labelClass}>{`Image #${i + 1} URL`}</label>
                                <input
                                  className={inputClass}
                                  placeholder="https://..."
                                  value={img}
                                  onChange={(e) => {
                                    const next = getHeroImages(config)
                                      .map((x, j) => (j === i ? e.target.value.trim() : x))
                                      .filter(Boolean);
                                    setHeroImages(next);
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => openImageEditor(getFullImageUrl(img), "hero", i)}
                                disabled={heroUploading}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                className={btnRemove}
                                onClick={() => {
                                  const next = getHeroImages(config).filter((_, j) => j !== i);
                                  setHeroImages(next);
                                }}
                                aria-label={`Remove hero image ${i + 1}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="relative h-40 w-full max-w-xl rounded-lg overflow-hidden bg-background border border-border">
                              {/* Preview only; rotation uses the same URLs from config */}
                              <img
                                src={img}
                                alt={`Hero image ${i + 1}`}
                                className="object-cover w-full h-full"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()}
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
                <Menu className="w-5 h-5 text-[#1E4A85]" />
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
                <BarChart3 className="w-5 h-5 text-[#1E4A85]" />
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
                <Info className="w-5 h-5 text-[#1E4A85]" />
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
                <label className={labelClass}>About image</label>
                <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 mt-1.5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Upload image file</p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG (max 5MB). Shown in the About section on user panel.
                      </p>
                    </div>
                    <label className={cn("inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors cursor-pointer", aboutImageUploading && "opacity-60 pointer-events-none")}>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadAboutImage(f);
                          e.currentTarget.value = "";
                        }}
                      />
                      {aboutImageUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      {aboutImageUploading ? "Uploading…" : "Choose file"}
                    </label>
                  </div>
                  {config.about.image && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <img src={config.about.image} alt="About" className="h-24 w-auto max-w-[200px] object-cover rounded border border-border" />
                      <button
                        type="button"
                        onClick={() => openImageEditor(getFullImageUrl(config.about.image), "about")}
                        disabled={aboutImageUploading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfig((c) => ({ ...c, about: { ...c.about, image: "" } }))}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {aboutImageUploadError && <p className="text-sm text-destructive">{aboutImageUploadError}</p>}
                </div>
                <div className="mt-2">
                  <label className="text-xs text-muted-foreground">Or paste URL</label>
                  <input
                    className={inputClass}
                    placeholder="https://... or /path/to/image.jpg"
                    value={config.about.image}
                    onChange={(e) => setConfig((c) => ({ ...c, about: { ...c.about, image: e.target.value } }))}
                  />
                </div>
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
                <BookOpen className="w-5 h-5 text-[#1E4A85]" />
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
                          className="h-4 w-4 accent-[#1E4A85]"
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
                <Building2 className="w-5 h-5 text-[#1E4A85]" />
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
                <div className="sm:col-span-2">
                  <label className={labelClass}>View Details URL (e.g. /userpanel/franchises)</label>
                  <input
                    className={inputClass}
                    placeholder="/userpanel/franchises"
                    value={config.franchise.highlight.detailsUrl ?? ""}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        franchise: {
                          ...c.franchise,
                          highlight: c.franchise.highlight ? { ...c.franchise.highlight, detailsUrl: e.target.value || undefined } : null,
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
                <Tag className="w-5 h-5 text-[#1E4A85]" />
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

          {/* Testimonials */}
          {activeTab === "testimonials" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#1E4A85]" />
                What Our Students Say
              </h2>
              <div>
                <label className={labelClass}>Section title</label>
                <input
                  className={inputClass}
                  value={config.testimonials.sectionTitle}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, testimonials: { ...c.testimonials, sectionTitle: e.target.value } }))
                  }
                />
              </div>
              <div className="space-y-4">
                {config.testimonials.items.map((t, i) => (
                  <div key={t.id} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className={labelClass}>Name</label>
                        <input
                          className={inputClass}
                          value={t.name}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              testimonials: { ...c.testimonials, items: c.testimonials.items.map((it, j) => (j === i ? { ...it, name: e.target.value } : it)) },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Role / Designation</label>
                        <input
                          className={inputClass}
                          value={t.role}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              testimonials: { ...c.testimonials, items: c.testimonials.items.map((it, j) => (j === i ? { ...it, role: e.target.value } : it)) },
                            }))
                          }
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Avatar image URL</label>
                        <input
                          className={inputClass}
                          value={t.avatar}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              testimonials: { ...c.testimonials, items: c.testimonials.items.map((it, j) => (j === i ? { ...it, avatar: e.target.value } : it)) },
                            }))
                          }
                          placeholder="https://..."
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelClass}>Testimonial text</label>
                        <textarea
                          className={inputClass}
                          rows={3}
                          value={t.text}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              testimonials: { ...c.testimonials, items: c.testimonials.items.map((it, j) => (j === i ? { ...it, text: e.target.value } : it)) },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Rating (1-5)</label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          className={inputClass}
                          value={t.rating}
                          onChange={(e) =>
                            setConfig((c) => ({
                              ...c,
                              testimonials: { ...c.testimonials, items: c.testimonials.items.map((it, j) => (j === i ? { ...it, rating: Math.min(5, Math.max(1, parseInt(e.target.value, 10) || 1)) } : it)) },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfig((c) => ({ ...c, testimonials: { ...c.testimonials, items: c.testimonials.items.filter((_, j) => j !== i) } }))}
                      className="text-sm text-muted-foreground hover:text-destructive"
                    >
                      Remove testimonial
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setConfig((c) => ({
                      ...c,
                      testimonials: {
                        ...c.testimonials,
                        items: [...c.testimonials.items, { id: `test-${Date.now()}`, name: "New Student", role: "Role", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", text: "Testimonial text...", rating: 5 }],
                      },
                    }))
                  }
                  className={btnAdd}
                >
                  <Plus className="w-4 h-4" /> Add testimonial
                </button>
              </div>
            </div>
          )}

          {/* Gallery */}
          {activeTab === "gallery" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Images className="w-5 h-5 text-[#1E4A85]" />
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
                <Footprints className="w-5 h-5 text-[#1E4A85]" />
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
        </div>
      </div>

      <ImageEditorModal
        open={imageEditorOpen}
        onClose={closeImageEditor}
        source={imageEditorSource}
        onSave={handleImageEditorSave}
        filename={
          imageEditorType === "logo"
            ? "logo.png"
            : imageEditorType === "about"
              ? "about.png"
              : imageEditorType === "hero"
                ? "hero.png"
                : "welcome-popup.png"
        }
      />
    </div>
  );
}
