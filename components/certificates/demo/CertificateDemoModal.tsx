"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  X,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  RotateCcw,
  Award,
  BookOpen,
  FileText,
  Building2,
  Medal,
  Sparkles,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Layers,
  ArrowRight,
  Save,
  Check,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import {
  type CertificateTypeId,
  type CertificateDemoData,
  CERTIFICATE_TYPE_CONFIGS,
  SAMPLE_CERTIFICATE_PRESETS,
} from "./types";
import {
  VocationalCertTemplate,
  DiplomaCertTemplate,
  MarksheetTemplate,
  MarksheetTemplateV2,
  AtcAffiliationTemplate,
  MeritCertTemplate,
  WorkshopCertTemplate,
} from "./CertificateTemplates";
import CertificateCustomizerDrawer from "./CertificateCustomizerDrawer";
import {
  loadInitialCertificateConfig,
  fetchServerCertificateConfig,
  saveCertificateConfigToServer,
} from "@/lib/certificate-storage";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface CertificateDemoModalProps {
  open: boolean;
  onClose: () => void;
  initialType?: CertificateTypeId;
}

export function CertificateDemoModal({
  open,
  onClose,
  initialType = "vocational",
}: CertificateDemoModalProps) {
  const [selectedType, setSelectedType] = useState<CertificateTypeId>(initialType);
  const [zoom, setZoom] = useState<number>(58);
  const [showCustomizer, setShowCustomizer] = useState<boolean>(false);
  const [customData, setCustomData] = useState<Record<CertificateTypeId, CertificateDemoData>>(
    () => loadInitialCertificateConfig()
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    fetchServerCertificateConfig().then((res) => {
      if (isMounted && res && res.data) {
        setCustomData(res.data);
        if (res.updatedAt) {
          setLastSavedAt(new Date(res.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
    });
    return () => {
      isMounted = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (open && initialType) {
      setSelectedType(initialType);
    }
  }, [open, initialType]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, handleClose]);

  const currentConfig = useMemo(() => {
    return (
      CERTIFICATE_TYPE_CONFIGS.find((c) => c.id === selectedType) ||
      CERTIFICATE_TYPE_CONFIGS[0]
    );
  }, [selectedType]);

  const activeData = customData[selectedType] || SAMPLE_CERTIFICATE_PRESETS[selectedType];

  const triggerAutoSave = (updated: Record<CertificateTypeId, CertificateDemoData>) => {
    setHasUnsavedChanges(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      const res = await saveCertificateConfigToServer(updated);
      setIsSaving(false);
      if (res.success) {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
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
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      showSuccess("Saved!", "Certificate customizations saved permanently.");
    } else {
      showError("Save Failed", res.error || "Could not save to server");
    }
  };

  const handleResetData = async () => {
    const label =
      CERTIFICATE_TYPE_CONFIGS.find((c) => c.id === selectedType)?.title || selectedType;
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
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
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

  if (!open) return null;

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
    <div className="fixed inset-0 z-[260] flex flex-col bg-slate-950/90 backdrop-blur-md">
      {/* Print Specific CSS to isolate the certificate on print */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 0mm;
        }
        @media print {
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            min-width: 210mm !important;
            min-height: 297mm !important;
            max-width: 210mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          .studio-zoom-container,
          .cert-print-stage,
          .origin-top,
          .student-cert-print-root {
            display: block !important;
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            overflow: hidden !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            transform: none !important;
            transform-origin: 0 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            max-width: 210mm !important;
            max-height: 297mm !important;
            background: transparent !important;
            box-shadow: none !important;
            zoom: 1 !important;
          }
          .certificate-sheet,
          .certificate-sheet * {
            visibility: visible !important;
          }
          .certificate-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            right: auto !important;
            bottom: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            overflow: hidden !important;
            page-break-before: avoid !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-before: avoid !important;
            break-after: avoid !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            transform-origin: 0 0 !important;
            width: 1054px !important;
            height: 1492px !important;
            transform: scale(0.752) !important;
          }
          .certificate-sheet[id*="marksheet2"],
          .certificate-sheet[id*="marksheet-v2"] {
            width: 1054px !important;
            height: 1492px !important;
            min-width: 1054px !important;
            min-height: 1492px !important;
            max-width: 1054px !important;
            max-height: 1492px !important;
            left: 0 !important;
            top: 0 !important;
            right: auto !important;
            transform-origin: 0 0 !important;
            transform: scale(0.752) !important;
          }
          .certificate-sheet[style*="1024"],
          .certificate-sheet[id*="diploma"],
          .certificate-sheet[id*="affiliation"],
          .certificate-sheet[id*="merit"],
          .certificate-sheet[id*="workshop"],
          .certificate-sheet[id*="ivesdc-cert"] {
            width: 723px !important;
            height: 1024px !important;
            transform-origin: 0 0 !important;
            transform: scale(1.098) !important;
          }
        }
      `}</style>

      {/* Top Bar */}
      <header className="no-print flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0F2444] px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#C4A35A] to-[#A88B48] text-slate-950 shadow-sm">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                Certificate Demo Studio
              </h2>
              <span className="hidden sm:inline-block rounded-full bg-[#C4A35A]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#F3E4B8] border border-[#C4A35A]/40">
                Official IVESDC Council
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Interactive high-resolution demos of all certificate & transcript templates
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Border Switcher for Certificate & Marksheet */}
          {(selectedType === "vocational" || selectedType === "marksheet") && (
            <div className="hidden lg:flex items-center rounded-lg border border-white/15 bg-white/5 p-0.5 text-xs">
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

          {/* Customizer Toggle */}
          <button
            type="button"
            onClick={() => setShowCustomizer(!showCustomizer)}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition",
              showCustomizer
                ? "border-[#C4A35A] bg-[#C4A35A] text-slate-950"
                : "border-white/15 bg-white/10 text-white hover:bg-white/20"
            )}
            title="Toggle Live Field Customizer"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Live Editor</span>
          </button>

          {/* Save Changes Button */}
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#D9A74A] to-[#B88728] px-3 text-xs font-black text-slate-950 shadow-md hover:brightness-110 active:scale-95 transition disabled:opacity-60"
            title="Save changes and uploads permanently to server"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="hidden sm:inline">Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Save</span>
              </>
            )}
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(40, z - 10))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white hover:bg-white/20"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          {/* Zoom % */}
          <button
            type="button"
            onClick={() => setZoom(72)}
            className="min-w-[3.5rem] rounded-lg border border-white/10 bg-white/5 py-1 px-2 text-center text-xs font-bold tabular-nums text-white hover:bg-white/10"
            title="Reset Zoom to 72%"
          >
            {zoom}%
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(130, z + 10))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white hover:bg-white/20"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* Print Demo */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#C4A35A]/50 bg-[#C4A35A] px-3 text-xs font-bold text-slate-950 shadow-sm transition hover:bg-[#d8b566]"
            title="Print this certificate demo"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Print Demo</span>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-rose-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Sub Header: Certificate Type Navigation Pills */}
      <nav className="no-print shrink-0 border-b border-white/10 bg-[#0A1A32] px-4 py-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max mx-auto max-w-7xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-[#C4A35A]" />
            Templates:
          </span>

          {CERTIFICATE_TYPE_CONFIGS.map((cfg) => {
            const isActive = cfg.id === selectedType;
            return (
              <button
                key={cfg.id}
                type="button"
                onClick={() => setSelectedType(cfg.id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all",
                  isActive
                    ? "bg-[#1E4A85] text-white shadow-md ring-2 ring-[#C4A35A]/60 scale-[1.02]"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className={isActive ? "text-[#C4A35A]" : "text-slate-400"}>
                  {typeIcon(cfg.id)}
                </span>
                <span>{cfg.title}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase",
                    isActive ? "bg-[#C4A35A] text-slate-950" : "bg-white/10 text-slate-400"
                  )}
                >
                  {cfg.badge}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Workspace Area */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left Drawer: Live Data Customizer */}
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

        {/* Center: Scrollable Certificate Canvas */}
        <main className="flex-1 overflow-auto bg-[#131b28] p-4 sm:p-8 flex justify-center items-start">
            <div
              className="studio-zoom-container mx-auto origin-top transition-transform duration-200"
              style={{
                transform: `scale(${zoom / 100})`,
                marginBottom: "120px",
              }}
            >
            {renderTemplate()}
          </div>
        </main>
      </div>

      {/* Bottom Info & Action Bar */}
      <footer className="no-print shrink-0 border-t border-white/10 bg-[#0F2444] px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[#C4A35A]">
              {typeIcon(selectedType)}
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-2">
                <span>{currentConfig.title}</span>
                <span className="text-slate-400 font-normal">·</span>
                <span className="text-[11px] text-[#C4A35A] font-semibold">
                  {currentConfig.category}
                </span>
              </p>
              <p className="text-[11px] text-slate-300 line-clamp-1">
                {currentConfig.description}
              </p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex items-center gap-2">
            <Link
              href="/certificates/requests"
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              <span>Manage Requests</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/certificates/print"
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4A85] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#163A6B]"
            >
              <Printer className="h-3.5 w-3.5 text-[#C4A35A]" />
              <span>Bulk Print Center</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
