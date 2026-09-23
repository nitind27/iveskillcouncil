"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  FileText,
  Building2,
  Medal,
  Sparkles,
  Printer,
  Sliders,
  RotateCcw,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Maximize2,
  Save,
  Check,
  Loader2,
} from "lucide-react";
import {
  type CertificateTypeId,
  type CertificateDemoData,
  CERTIFICATE_TYPE_CONFIGS,
  SAMPLE_CERTIFICATE_PRESETS,
} from "@/components/certificates/demo/types";
import {
  VocationalCertTemplate,
  DiplomaCertTemplate,
  MarksheetTemplate,
  MarksheetTemplateV2,
  AtcAffiliationTemplate,
  MeritCertTemplate,
  WorkshopCertTemplate,
} from "@/components/certificates/demo/CertificateTemplates";
import CertificateCustomizerDrawer from "@/components/certificates/demo/CertificateCustomizerDrawer";
import {
  loadInitialCertificateConfig,
  fetchServerCertificateConfig,
  saveCertificateConfigToServer,
} from "@/lib/certificate-storage";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function CertificateTemplatesPage() {
  const [selectedType, setSelectedType] = useState<CertificateTypeId>("marksheet");
  const [zoom, setZoom] = useState<number>(58);
  const [showCustomizer, setShowCustomizer] = useState<boolean>(true);
  const [customData, setCustomData] = useState<Record<CertificateTypeId, CertificateDemoData>>(
    () => loadInitialCertificateConfig()
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Optional ?type=marksheet2 deep-link
  useEffect(() => {
    const typeParam = new URLSearchParams(window.location.search).get("type");
    if (typeParam && CERTIFICATE_TYPE_CONFIGS.some((c) => c.id === typeParam)) {
      setSelectedType(typeParam as CertificateTypeId);
    }
  }, []);

  // Sync latest persisted state from server on component mount
  useEffect(() => {
    let isMounted = true;
    fetchServerCertificateConfig().then((res) => {
      if (isMounted && res && res.data) {
        setCustomData(res.data);
        if (res.updatedAt) {
          const timeStr = new Date(res.updatedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          setLastSavedAt(timeStr);
        }
      }
    });
    return () => {
      isMounted = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const currentConfig =
    CERTIFICATE_TYPE_CONFIGS.find((c) => c.id === selectedType) ||
    CERTIFICATE_TYPE_CONFIGS[0];

  const activeData = customData[selectedType] || SAMPLE_CERTIFICATE_PRESETS[selectedType];

  // Debounced auto-save function
  const triggerAutoSave = (updated: Record<CertificateTypeId, CertificateDemoData>) => {
    setHasUnsavedChanges(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      const res = await saveCertificateConfigToServer(updated);
      setIsSaving(false);
      if (res.success) {
        setHasUnsavedChanges(false);
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setLastSavedAt(timeStr);
      }
    }, 1200);
  };

  const handleFieldChange = (field: keyof CertificateDemoData, value: unknown) => {
    setCustomData((prev) => {
      const updated = {
        ...prev,
        [selectedType]: {
          ...prev[selectedType],
          [field]: value,
        },
      };
      triggerAutoSave(updated);
      return updated;
    });
  };

  const handleSave = async () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setIsSaving(true);
    const res = await saveCertificateConfigToServer(customData);
    setIsSaving(false);
    if (res.success) {
      setHasUnsavedChanges(false);
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setLastSavedAt(timeStr);
      showSuccess("Saved Successfully!", "All certificate edits, custom sizes & uploaded images are saved permanently.");
    } else {
      showError("Save Failed", res.error || "Could not save to server");
    }
  };

  const handleResetData = async () => {
    const label = currentConfig.title;
    if (
      !window.confirm(
        `Reset only "${label}" to factory defaults?\n\nOther certificate templates will stay as they are.`
      )
    ) {
      return;
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    const preset = JSON.parse(
      JSON.stringify(SAMPLE_CERTIFICATE_PRESETS[selectedType])
    ) as CertificateDemoData;
    const next = { ...customData, [selectedType]: preset };
    setCustomData(next);
    setIsSaving(true);
    const res = await saveCertificateConfigToServer(next);
    setIsSaving(false);
    if (res.success) {
      setHasUnsavedChanges(false);
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setLastSavedAt(timeStr);
      showSuccess("Reset Completed", `"${label}" restored. Other templates unchanged.`);
    } else {
      setHasUnsavedChanges(true);
      showError("Reset Save Failed", res.error || "Defaults applied locally but could not save to server");
    }
  };

  const handlePrint = () => {
    const prevZoom = zoom;
    setZoom(100);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        setZoom(prevZoom);
      }, 120);
    });
  };

  const renderTemplate = () => {
    switch (selectedType) {
      case "vocational":
        return <VocationalCertTemplate data={activeData} />;
      case "diploma":
        return <DiplomaCertTemplate data={activeData} />;
      case "marksheet":
        return <MarksheetTemplate data={activeData} />;
      case "marksheet2":
        return <MarksheetTemplateV2 data={activeData} />;
      case "affiliation":
        return <AtcAffiliationTemplate data={activeData} />;
      case "merit":
        return <MeritCertTemplate data={activeData} />;
      case "workshop":
        return <WorkshopCertTemplate data={activeData} />;
      default:
        return <VocationalCertTemplate data={activeData} />;
    }
  };

  const typeIcon = (id: CertificateTypeId) => {
    switch (id) {
      case "vocational":
        return <Award className="h-4 w-4" />;
      case "diploma":
        return <BookOpen className="h-4 w-4" />;
      case "marksheet":
        return <FileText className="h-4 w-4" />;
      case "marksheet2":
        return <FileText className="h-4 w-4" />;
      case "affiliation":
        return <Building2 className="h-4 w-4" />;
      case "merit":
        return <Medal className="h-4 w-4" />;
      case "workshop":
        return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1E4A85] dark:text-[#C4A35A]">
            <Award className="h-4 w-4" />
            <span>National Council Official Layouts</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Certificate & Marksheet Demos
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Interactive preview of all institutional certificate types, diplomas, marksheets, and ATC center accreditation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/certificates/requests"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <span>Requests</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/certificates/print"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E4A85] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#163A6B]"
          >
            <Printer className="h-3.5 w-3.5 text-[#C4A35A]" />
            <span>Bulk Print Center</span>
          </Link>
        </div>
      </div>

      {/* Template Selector Cards Grid */}
      <div className="no-print grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {CERTIFICATE_TYPE_CONFIGS.map((cfg) => {
          const isActive = cfg.id === selectedType;
          return (
            <button
              key={cfg.id}
              type="button"
              onClick={() => setSelectedType(cfg.id)}
              className={cn(
                "group relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all",
                isActive
                  ? "border-[#1E4A85] bg-gradient-to-b from-[#1E4A85]/10 to-[#1E4A85]/5 shadow-md ring-2 ring-[#1E4A85]/30 dark:border-[#C4A35A] dark:from-[#C4A35A]/15 dark:to-transparent"
                  : "border-slate-200 bg-white hover:border-[#1E4A85]/40 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900"
              )}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl",
                      isActive
                        ? "bg-[#1E4A85] text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 group-hover:bg-[#1E4A85]/10 group-hover:text-[#1E4A85] dark:bg-slate-800 dark:text-slate-300"
                    )}
                  >
                    {typeIcon(cfg.id)}
                  </span>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-black uppercase", cfg.badgeColor)}>
                    {cfg.badge}
                  </span>
                </div>
                <h3 className="mt-2.5 text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {cfg.title}
                </h3>
                <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-1">
                  {cfg.category}
                </p>
              </div>

              {isActive && (
                <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#1E4A85] dark:text-[#C4A35A]">
                  <span>Viewing Live</span>
                  <CheckCircle2 className="h-3 w-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Studio Viewport */}
      <div className="studio-root-container rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden shadow-xl dark:border-slate-800">
        {/* Studio Top Control Strip */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0F2444] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C4A35A] text-slate-950">
              {typeIcon(selectedType)}
            </span>
            <div>
              <p className="text-xs font-extrabold text-white">{currentConfig.title}</p>
              <p className="text-[10px] text-slate-300">{currentConfig.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Border Switcher for Certificate & Marksheet */}
            {(selectedType === "vocational" || selectedType === "marksheet") && (
              <div className="hidden sm:flex items-center rounded-lg border border-white/15 bg-white/5 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleFieldChange("borderStyle", "ornate")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-bold transition",
                    (!activeData.borderStyle || activeData.borderStyle === "ornate")
                      ? "bg-[#C4A35A] text-slate-950 shadow-sm"
                      : "text-slate-300 hover:text-white"
                  )}
                  title="Official Ornate Gold & Navy Border from cert.jpeg"
                >
                  Ornate Gold Border
                </button>
                <button
                  type="button"
                  onClick={() => handleFieldChange("borderStyle", "guilloche")}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-bold transition",
                    activeData.borderStyle === "guilloche"
                      ? "bg-[#1E4A85] text-white shadow-sm ring-1 ring-white/30"
                      : "text-slate-300 hover:text-white"
                  )}
                  title="Security Guilloche Blue Border from res.jpeg"
                >
                  Security Blue Border
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowCustomizer(!showCustomizer)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition",
                showCustomizer
                  ? "border-[#C4A35A] bg-[#C4A35A] text-slate-950"
                  : "border-white/15 bg-white/10 text-white hover:bg-white/20"
              )}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>{showCustomizer ? "Hide Editor" : "Customize Sample"}</span>
            </button>

            {/* Save Changes Button & Auto-Save Status */}
            <div className="flex items-center gap-1.5">
              {hasUnsavedChanges ? (
                <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Unsaved</span>
                </span>
              ) : lastSavedAt ? (
                <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span>Saved</span>
                </span>
              ) : null}

              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="flex h-8 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#D9A74A] to-[#B88728] px-3 text-xs font-black text-slate-950 shadow-md hover:brightness-110 active:scale-95 transition disabled:opacity-60"
                title="Save all changes and uploads permanently to server"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(40, z - 10))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white hover:bg-white/20"
            >
              -
            </button>
            <span className="min-w-[3rem] text-center text-xs font-bold text-white tabular-nums">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(130, z + 10))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white hover:bg-white/20"
            >
              +
            </button>

            {/* Print A4 Paper Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-amber-400/40 bg-gradient-to-r from-amber-500/25 to-amber-600/20 px-3 text-xs font-black text-amber-200 hover:from-amber-500/35 hover:to-amber-600/30 active:scale-95 transition shadow-sm"
              title="Print directly on A4 paper or save as PDF (100% exact fit, zero page-2 overflow)"
            >
              <Printer className="h-3.5 w-3.5 text-amber-300" />
              <span>Print A4 Paper / PDF</span>
              <span className="hidden sm:inline rounded bg-amber-400/20 px-1 py-0.2 text-[9px] font-mono text-amber-300">
                A4
              </span>
            </button>
          </div>
        </div>

        {/* Studio Content */}
        <div className="studio-body-container flex h-[900px] bg-[#071322] overflow-hidden">
          {showCustomizer && (
            <CertificateCustomizerDrawer
              activeData={activeData}
              selectedType={selectedType}
              onFieldChange={handleFieldChange}
              onResetData={handleResetData}
              onSave={handleSave}
              isSaving={isSaving}
              lastSavedAt={lastSavedAt}
            />
          )}

          <div className="studio-overflow-container flex-1 overflow-auto p-8 flex justify-center items-start">
            <div
              className="cert-print-stage studio-zoom-container mx-auto origin-top transition-transform duration-200"
              style={{ transform: `scale(${zoom / 100})` }}
            >
              {renderTemplate()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
