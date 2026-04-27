"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, ExternalLink, Upload, X } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";

interface PanelConfig {
  logoUrl?: string;
  siteName?: string;
  tagline?: string;
  primaryColor?: string;
  bannerUrl?: string;
  welcomeText?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

interface Props {
  franchiseId: string;
  franchiseName: string;
}

const inputCls = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";
const labelCls = "block text-sm font-medium text-foreground mb-1";

export default function FranchisePanelConfig({ franchiseId, franchiseName }: Props) {
  const [slug,       setSlug]       = useState("");
  const [config,     setConfig]     = useState<PanelConfig>({});
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/franchises/${franchiseId}/panel-config`, { credentials: "include" })
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setSlug(res.data.slug || "");
          setConfig((res.data.panelConfig as PanelConfig) || {});
        }
      })
      .finally(() => setLoading(false));
  }, [franchiseId]);

  const uploadAsset = async (assetType: string, file: File) => {
    setUploading(assetType);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("assetType", assetType);
      const res  = await fetch(`/api/admin/franchises/${franchiseId}/upload-panel-asset`, { method: "POST", body: form, credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.success) { showError("Upload failed", data.error || ""); return; }
      setConfig((c) => ({ ...c, [assetType === "logo" ? "logoUrl" : "bannerUrl"]: data.data.url }));
      showSuccess("Uploaded", `${assetType} uploaded.`);
    } catch { showError("Error", "Upload failed"); }
    finally { setUploading(null); }
  };

  const save = async () => {
    if (!slug.trim()) { showError("Validation", "URL slug is required"); return; }
    const safeSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/franchises/${franchiseId}/panel-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slug: safeSlug, panelConfig: config }),
      });
      const data = await res.json();
      if (!res.ok) { showError("Error", data.error || "Failed"); return; }
      setSlug(data.data.slug || safeSlug);
      showSuccess("Saved", "Panel config saved. Portal is live.");
    } catch { showError("Error", "Network error"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const portalUrl = slug ? `${process.env.NEXT_PUBLIC_APP_URL || ""}/f/${slug}` : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground">Franchise Portal Config</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Set the custom URL and branding for <strong>{franchiseName}</strong>&apos;s portal.</p>
        </div>
        {portalUrl && (
          <a href={portalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
            <ExternalLink className="w-4 h-4" /> View Portal
          </a>
        )}
      </div>

      {/* URL Slug */}
      <div>
        <label className={labelCls}>Portal URL Slug <span className="text-red-500">*</span></label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">/f/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="nitin-institute"
            className={inputCls}
          />
        </div>
        {slug && <p className="text-xs text-muted-foreground mt-1">Portal URL: <strong>/f/{slug}</strong></p>}
      </div>

      {/* Logo */}
      <div>
        <label className={labelCls}>Franchise Logo</label>
        <div className="flex items-center gap-4">
          {config.logoUrl ? (
            <div className="relative">
              <img src={config.logoUrl} alt="logo" className="h-16 w-auto max-w-[160px] object-contain rounded-xl border border-input" />
              <button onClick={() => setConfig((c) => ({ ...c, logoUrl: undefined }))} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"><X className="w-3 h-3" /></button>
            </div>
          ) : null}
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAsset("logo", f); }} />
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors">
              {uploading === "logo" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading === "logo" ? "Uploading..." : "Upload Logo"}
            </span>
          </label>
        </div>
      </div>

      {/* Banner */}
      <div>
        <label className={labelCls}>Hero Banner Image</label>
        <div className="flex items-center gap-4">
          {config.bannerUrl ? (
            <div className="relative">
              <img src={config.bannerUrl} alt="banner" className="h-16 w-32 object-cover rounded-xl border border-input" />
              <button onClick={() => setConfig((c) => ({ ...c, bannerUrl: undefined }))} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"><X className="w-3 h-3" /></button>
            </div>
          ) : null}
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAsset("banner", f); }} />
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors">
              {uploading === "banner" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading === "banner" ? "Uploading..." : "Upload Banner"}
            </span>
          </label>
        </div>
      </div>

      {/* Text fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Site Name (shown on portal)</label>
          <input type="text" value={config.siteName || ""} onChange={(e) => setConfig((c) => ({ ...c, siteName: e.target.value }))} placeholder={franchiseName} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Primary Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={config.primaryColor || "#2D5DA8"} onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))} className="w-10 h-10 rounded-lg border border-input cursor-pointer p-0.5" />
            <input type="text" value={config.primaryColor || "#2D5DA8"} onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))} className={`${inputCls} flex-1`} placeholder="#2D5DA8" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Tagline</label>
          <input type="text" value={config.tagline || ""} onChange={(e) => setConfig((c) => ({ ...c, tagline: e.target.value }))} placeholder="Quality education for all" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Welcome Text</label>
          <input type="text" value={config.welcomeText || ""} onChange={(e) => setConfig((c) => ({ ...c, welcomeText: e.target.value }))} placeholder="Welcome to our institute" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Contact Email</label>
          <input type="email" value={config.contactEmail || ""} onChange={(e) => setConfig((c) => ({ ...c, contactEmail: e.target.value }))} placeholder="contact@institute.com" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Contact Phone</label>
          <input type="tel" value={config.contactPhone || ""} onChange={(e) => setConfig((c) => ({ ...c, contactPhone: e.target.value }))} placeholder="+91 98765 43210" className={inputCls} />
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 shadow-md transition-all"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {saving ? "Saving..." : "Save Panel Config"}
      </motion.button>
    </div>
  );
}
