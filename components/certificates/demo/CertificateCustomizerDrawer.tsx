"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  User,
  FileText,
  Building2,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Sliders,
  Minus,
  Search,
  Award,
  Layers,
  Stamp,
  QrCode,
  PenTool,
  Type,
  Maximize2,
  Move,
  ArrowUpDown,
  ArrowLeftRight,
  Barcode as BarcodeIcon,
  Save,
  Check,
  Loader2,
  Printer,
} from "lucide-react";
import EnrollmentBarcode, { convertNumberToDigitWords } from "../EnrollmentBarcode";
import CertificateQRCode from "../CertificateQRCode";
import { uploadCertificateAsset } from "@/lib/certificate-storage";
import {
  DEFAULT_PARTNER_LOGOS,
  CERTIFICATE_TYPE_CONFIGS,
  type CertificateDemoData,
  type CertificateTypeId,
  type MarksheetSubject,
  type GradeSystemRow,
  type PartnerLogoItem,
} from "./types";
import { cn } from "@/lib/utils";

interface Props {
  activeData: CertificateDemoData;
  selectedType: CertificateTypeId;
  onFieldChange: (field: keyof CertificateDemoData, value: unknown) => void;
  onResetData: () => void;
  onSave?: () => Promise<void> | void;
  isSaving?: boolean;
  lastSavedAt?: string | null;
  className?: string;
}

type CategoryTab = "all" | "logos" | "typography" | "padding" | "border" | "student" | "signatures" | "marks" | "center";

// -------------------------------------------------------------
// REUSABLE SOFT SIZE SLIDER WITH DIRECT NUDGE & PRESETS
// -------------------------------------------------------------
interface SizeSliderProps {
  label: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  quickPresets?: { label: string; value: number }[];
  onChange: (val: number) => void;
  onReset?: () => void;
  colorTheme?: "gold" | "blue" | "emerald";
}

function SizeSliderControl({
  label,
  value,
  defaultValue,
  min,
  max,
  step = 1,
  unit = "px",
  quickPresets = [],
  onChange,
  onReset,
  colorTheme = "gold",
}: SizeSliderProps) {
  const isModified = value !== defaultValue;

  const accentColorClass =
    colorTheme === "gold"
      ? "text-[#C4A35A]"
      : colorTheme === "emerald"
      ? "text-emerald-400"
      : "text-sky-400";

  const badgeBgClass =
    colorTheme === "gold"
      ? "bg-[#C4A35A]/15 border-[#C4A35A]/30 text-[#F4CF74]"
      : colorTheme === "emerald"
      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
      : "bg-sky-500/15 border-sky-500/30 text-sky-300";

  return (
    <div className="rounded-xl border border-white/8 bg-black/25 p-2.5 transition hover:border-white/15">
      {/* Header with Title and Current Value */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
          <Sliders className={cn("h-3 w-3", accentColorClass)} />
          <span>{label}</span>
        </span>

        <div className="flex items-center gap-1.5">
          {/* Nudge Decrease Button */}
          <button
            type="button"
            onClick={() => onChange(Math.max(min, value - step))}
            className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-slate-300 hover:bg-white/20 active:scale-90 transition"
            title="Decrease 1 step"
          >
            <Minus className="h-2.5 w-2.5" />
          </button>

          {/* Value Display Badge */}
          <span
            className={cn(
              "min-w-[44px] rounded px-1.5 py-0.5 text-center text-[10.5px] font-extrabold tabular-nums border",
              badgeBgClass
            )}
          >
            {value}
            {unit}
          </span>

          {/* Nudge Increase Button */}
          <button
            type="button"
            onClick={() => onChange(Math.min(max, value + step))}
            className="flex h-5 w-5 items-center justify-center rounded bg-white/10 text-slate-300 hover:bg-white/20 active:scale-90 transition"
            title="Increase 1 step"
          >
            <Plus className="h-2.5 w-2.5" />
          </button>

          {/* Reset Size Button */}
          {isModified && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="ml-1 text-[9.5px] font-semibold text-amber-400 hover:underline"
              title={`Reset to default (${defaultValue}${unit})`}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Quick Dropdown Preset Selector */}
      {quickPresets.length > 0 && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-white/5 px-2 py-1 border border-white/5">
          <span className="text-[10px] font-semibold text-slate-400">
            Size Dropdown:
          </span>
          <select
            value={
              quickPresets.some((p) => p.value === value)
                ? String(value)
                : "custom"
            }
            onChange={(e) => {
              const val = e.target.value;
              if (val !== "custom") {
                onChange(Number(val));
              }
            }}
            className="rounded-md border border-white/15 bg-[#09172B] px-2 py-0.5 text-[10.5px] font-bold text-[#F4CF74] outline-none focus:border-[#C4A35A] cursor-pointer shadow-sm hover:border-white/30 transition"
          >
            {quickPresets.map((preset) => (
              <option key={preset.label} value={String(preset.value)}>
                {preset.label} ({preset.value}{unit})
              </option>
            ))}
            {!quickPresets.some((p) => p.value === value) && (
              <option value="custom">Custom: {value}{unit}</option>
            )}
          </select>
        </div>
      )}

      {/* Smooth Slider Bar */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold text-slate-500">{min}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-lg bg-white/15 accent-[#C4A35A] transition hover:bg-white/25"
        />
        <span className="text-[9px] font-bold text-slate-500">{max}</span>
      </div>

      {/* Quick Preset Buttons (if provided) */}
      {quickPresets.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Presets:
          </span>
          {quickPresets.map((preset) => {
            const isSelected = value === preset.value;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(preset.value)}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[9.5px] font-bold transition",
                  isSelected
                    ? "bg-[#C4A35A] text-slate-950 shadow-sm"
                    : "bg-white/8 text-slate-300 hover:bg-white/15 hover:text-white"
                )}
              >
                {preset.label} ({preset.value}
                {unit})
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// IMAGE UPLOADER CARD WITH BUILT-IN RESIZING CONTROLS
// -------------------------------------------------------------
interface ImageUploaderWithSizerProps {
  label: string;
  category?: string;
  description?: string;
  currentValue?: string;
  defaultPreview: string;
  onUpload: (url: string) => void;
  onResetAsset: () => void;
  // Sizing properties
  sizeControl?: {
    label: string;
    value: number;
    defaultValue: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    quickPresets?: { label: string; value: number }[];
    onChange: (val: number) => void;
    onReset: () => void;
  };
  // Optional secondary size control (e.g., width)
  secondarySizeControl?: {
    label: string;
    value: number;
    defaultValue: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    quickPresets?: { label: string; value: number }[];
    onChange: (val: number) => void;
    onReset: () => void;
  };
}

function ImageUploaderWithSizer({
  label,
  category = "asset",
  description,
  currentValue,
  defaultPreview,
  onUpload,
  onResetAsset,
  sizeControl,
  secondarySizeControl,
}: ImageUploaderWithSizerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isCustom = !!currentValue && currentValue !== defaultPreview;
  const displaySrc = currentValue || defaultPreview;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadCertificateAsset(file, category);
      if (res.url) {
        onUpload(res.url);
      }
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-3 transition hover:border-[#C4A35A]/35 shadow-sm space-y-2.5">
      {/* Top Header: Label & Status */}
      <div className="flex items-center justify-between">
        <label className="text-[11.5px] font-bold text-white flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5 text-[#C4A35A]" />
          <span>{label}</span>
        </label>
        {isCustom ? (
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-extrabold text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span>Custom Saved</span>
          </span>
        ) : (
          <span className="text-[9px] font-semibold text-slate-400">Default Asset</span>
        )}
      </div>

      {description && <p className="text-[10px] text-slate-400 leading-tight">{description}</p>}

      {/* Upload Action & Thumbnail Preview Row */}
      <div className="flex items-center gap-2.5 rounded-xl bg-black/20 p-2 border border-white/5">
        {/* Thumbnail Preview */}
        <div className="relative h-13 w-16 shrink-0 rounded-lg border border-white/15 bg-white/5 flex items-center justify-center overflow-hidden p-1 shadow-inner">
          {displaySrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displaySrc} alt={label} className="h-full w-full object-contain" />
          ) : (
            <span className="text-[9px] text-slate-500">None</span>
          )}
        </div>

        {/* Upload & Reset Buttons */}
        <div className="flex flex-1 flex-col gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={isUploading}
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#1E4A85] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#285ea6] active:scale-[0.98] transition shadow-sm disabled:opacity-60"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-[#C4A35A]" />
                <span>Uploading & Saving...</span>
              </>
            ) : (
              <>
                <Upload className="h-3 w-3 text-[#C4A35A]" />
                <span>Upload New Image</span>
              </>
            )}
          </button>

          {isCustom && (
            <button
              type="button"
              disabled={isUploading}
              onClick={onResetAsset}
              className="text-left text-[9.5px] font-semibold text-rose-400 hover:text-rose-300 hover:underline transition disabled:opacity-50"
            >
              Reset to Default Preset Image
            </button>
          )}
        </div>
      </div>

      {/* Built-in Size Sliders */}
      {sizeControl && (
        <SizeSliderControl
          label={sizeControl.label}
          value={sizeControl.value}
          defaultValue={sizeControl.defaultValue}
          min={sizeControl.min}
          max={sizeControl.max}
          step={sizeControl.step}
          unit={sizeControl.unit}
          quickPresets={sizeControl.quickPresets}
          onChange={sizeControl.onChange}
          onReset={sizeControl.onReset}
        />
      )}

      {secondarySizeControl && (
        <SizeSliderControl
          label={secondarySizeControl.label}
          value={secondarySizeControl.value}
          defaultValue={secondarySizeControl.defaultValue}
          min={secondarySizeControl.min}
          max={secondarySizeControl.max}
          step={secondarySizeControl.step}
          unit={secondarySizeControl.unit}
          quickPresets={secondarySizeControl.quickPresets}
          onChange={secondarySizeControl.onChange}
          onReset={secondarySizeControl.onReset}
          colorTheme="blue"
        />
      )}
    </div>
  );
}

// -------------------------------------------------------------
// GOVERNMENT & PARTNER LOGOS MANAGER (SINGLE-SINGLE UPLOAD)
// -------------------------------------------------------------
interface PartnerLogosManagerProps {
  partnerLogos: PartnerLogoItem[];
  partnerLogosUrl?: string;
  partnerLogosHeight: number;
  defaultPartnerLogosHeight: number;
  onUpdatePartnerLogos: (logos: PartnerLogoItem[]) => void;
  onUpdateCombinedUrl: (url?: string) => void;
  onHeightChange: (h: number) => void;
  onResetHeight: () => void;
}

function PartnerLogosManager({
  partnerLogos,
  partnerLogosUrl,
  partnerLogosHeight,
  defaultPartnerLogosHeight,
  onUpdatePartnerLogos,
  onUpdateCombinedUrl,
  onHeightChange,
  onResetHeight,
}: PartnerLogosManagerProps) {
  // If partnerLogos is empty but partnerLogosUrl is set, default mode to strip; otherwise individual
  const [mode, setMode] = useState<"individual" | "strip">(
    partnerLogos && partnerLogos.length > 0 ? "individual" : "individual"
  );
  const [expandedLogos, setExpandedLogos] = useState<boolean>(true);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleUploadSingle = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(index);
    try {
      const res = await uploadCertificateAsset(file, "partner-logo");
      if (res.url) {
        const next = [...partnerLogos];
        next[index] = { ...next[index], url: res.url };
        onUpdatePartnerLogos(next);
      }
    } finally {
      setUploadingIdx(null);
      e.target.value = "";
    }
  };

  const handleNameChange = (index: number, name: string) => {
    const next = [...partnerLogos];
    next[index] = { ...next[index], name };
    onUpdatePartnerLogos(next);
  };

  const handleRemove = (index: number) => {
    if (partnerLogos.length <= 1) return;
    const next = [...partnerLogos];
    next.splice(index, 1);
    onUpdatePartnerLogos(next);
  };

  const handleResetSingle = (index: number) => {
    const defaultItem =
      DEFAULT_PARTNER_LOGOS.find((d) => d.id === partnerLogos[index]?.id) ||
      DEFAULT_PARTNER_LOGOS[index];
    if (defaultItem) {
      const next = [...partnerLogos];
      next[index] = { ...next[index], url: defaultItem.url, name: defaultItem.name };
      onUpdatePartnerLogos(next);
    }
  };

  const handleAddNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsAddingNew(true);
    try {
      const res = await uploadCertificateAsset(file, "partner-logo");
      if (res.url) {
        const next = [...partnerLogos];
        const newNum = next.length + 1;
        const cleanName =
          file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || `Partner Logo ${newNum}`;
        next.push({
          id: `partner-${Date.now()}`,
          name: cleanName,
          url: res.url,
        });
        onUpdatePartnerLogos(next);
      }
    } finally {
      setIsAddingNew(false);
      e.target.value = "";
    }
  };

  const handleResetAll = () => {
    onUpdatePartnerLogos(DEFAULT_PARTNER_LOGOS);
  };

  const switchToIndividual = () => {
    setMode("individual");
    if (!partnerLogos || partnerLogos.length === 0) {
      onUpdatePartnerLogos(DEFAULT_PARTNER_LOGOS);
    }
  };

  const switchToStrip = () => {
    setMode("strip");
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#09162A]/90 p-3 shadow-md space-y-3">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
              Government &amp; Partner Logos Strip
            </h4>
            <p className="text-[11px] text-slate-400">
              Upload logos single-single or as a full strip.
            </p>
          </div>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/30">
            {mode === "individual" ? `${partnerLogos.length} Logos` : "Strip Image"}
          </span>
        </div>

        {/* Mode Toggle Pills */}
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-black/40 p-1 border border-white/10">
          <button
            type="button"
            onClick={switchToIndividual}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1 text-xs font-bold transition",
              mode === "individual"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            <span>Single-Single Logos</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.2 text-[9px]",
                mode === "individual" ? "bg-black/30 text-slate-950 font-black" : "bg-white/10"
              )}
            >
              {partnerLogos.length}
            </span>
          </button>
          <button
            type="button"
            onClick={switchToStrip}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md py-1 text-xs font-bold transition",
              mode === "strip"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            )}
          >
            <span>Combined Strip Image</span>
          </button>
        </div>
      </div>

      {/* Shared Strip Height Controller */}
      <SizeSliderControl
        label="Logos Strip Height"
        value={partnerLogosHeight}
        defaultValue={defaultPartnerLogosHeight}
        min={25}
        max={75}
        step={1}
        quickPresets={[
          { label: "Compact", value: 34 },
          { label: "Default", value: defaultPartnerLogosHeight },
          { label: "Tall", value: 58 },
        ]}
        onChange={onHeightChange}
        onReset={onResetHeight}
        colorTheme="gold"
      />

      {/* INDIVIDUAL LOGOS MODE */}
      {mode === "individual" && (
        <div className="space-y-2 pt-1 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300">
              Manage Each Logo Individually:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setExpandedLogos(!expandedLogos)}
                className="text-[10px] font-semibold text-slate-300 hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition"
              >
                {expandedLogos ? "Collapse List" : "Expand List"}
              </button>
              <button
                type="button"
                onClick={handleResetAll}
                className="text-[10px] font-bold text-amber-300 hover:text-amber-200 px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 transition flex items-center gap-1"
                title="Reset all logos back to the 8 default government logos"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                <span>Reset All 8</span>
              </button>
            </div>
          </div>

          {expandedLogos && (
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
              {partnerLogos.map((logo, idx) => {
                const defaultItem =
                  DEFAULT_PARTNER_LOGOS.find((d) => d.id === logo.id) ||
                  DEFAULT_PARTNER_LOGOS[idx];
                const isModified =
                  defaultItem &&
                  (logo.url !== defaultItem.url || logo.name !== defaultItem.name);

                return (
                  <div
                    key={logo.id || idx}
                    className="rounded-lg border border-white/10 bg-[#06101E] p-2 transition hover:border-[#F4CF74]/50 shadow-sm"
                  >
                    {/* Top Row: # Index Badge, Name Input, Delete */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-black text-amber-300 border border-amber-500/30">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={logo.name}
                        onChange={(e) => handleNameChange(idx, e.target.value)}
                        placeholder="Logo name (e.g. Ministry / Council)..."
                        className="flex-1 rounded border border-white/10 bg-black/40 px-2 py-0.5 text-[11px] text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none font-medium"
                      />
                      {isModified && (
                        <button
                          type="button"
                          onClick={() => handleResetSingle(idx)}
                          title="Reset to default"
                          className="p-1 text-slate-400 hover:text-amber-300 rounded hover:bg-white/10 transition"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        disabled={partnerLogos.length <= 1}
                        title="Remove this logo"
                        className="p-1 text-slate-400 hover:text-red-400 disabled:opacity-20 rounded hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Bottom Row: Thumbnail & Upload Button */}
                    <div className="flex items-center gap-2.5">
                      <label className="relative flex h-10 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded bg-white p-1 border border-slate-300 shadow-sm hover:ring-2 hover:ring-amber-400/50 transition" title="Click to upload/replace this logo">
                        {uploadingIdx === idx ? (
                          <div className="flex items-center justify-center h-full w-full bg-slate-900/60">
                            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                          </div>
                        ) : (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={logo.url}
                            alt={logo.name}
                            className="h-full w-full object-contain"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingIdx === idx}
                          className="hidden"
                          onChange={(e) => handleUploadSingle(idx, e)}
                        />
                      </label>

                      <div className="flex-1 flex flex-col gap-1">
                        <label className={cn(
                          "flex items-center justify-center gap-1.5 rounded border border-amber-400/40 bg-amber-500/15 px-2 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/25 hover:border-amber-400/70 cursor-pointer transition",
                          uploadingIdx === idx && "opacity-50 cursor-not-allowed"
                        )}>
                          {uploadingIdx === idx ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin text-amber-300" />
                              <span>Saving to server...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-3 w-3" />
                              <span>Upload / Replace Logo</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingIdx === idx}
                            className="hidden"
                            onChange={(e) => handleUploadSingle(idx, e)}
                          />
                        </label>
                        <span className="text-[9.5px] text-slate-400 truncate">
                          PNG, JPG, SVG • live in strip
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add New Partner Logo Button */}
              <div className="pt-1">
                <label className={cn(
                  "flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/20 bg-white/5 py-2 text-xs font-bold text-slate-300 hover:border-amber-400/60 hover:bg-white/10 hover:text-amber-300 transition",
                  isAddingNew && "opacity-50 cursor-not-allowed"
                )}>
                  {isAddingNew ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                      <span>Uploading & Saving to Server...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>+ Add Another Partner Logo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isAddingNew}
                    className="hidden"
                    onChange={handleAddNew}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* COMBINED STRIP MODE */}
      {mode === "strip" && (
        <div className="pt-1 border-t border-white/10">
          <ImageUploaderWithSizer
            category="partner-strip"
            label="Combined Strip Banner Image"
            description="Single full-width image containing all accreditation logos."
            currentValue={partnerLogosUrl}
            defaultPreview="/cert/partner-logos.png"
            onUpload={onUpdateCombinedUrl}
            onResetAsset={() => onUpdateCombinedUrl(undefined)}
          />
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// PADDING & LAYOUT SPACING MANAGER (SLIDERS & PRESETS)
// -------------------------------------------------------------
interface PaddingLayoutManagerProps {
  paddingTop: number;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  headerSpacing: number;
  contentSpacing: number;
  defaultPaddingTop: number;
  defaultPaddingBottom: number;
  defaultPaddingLeft: number;
  defaultPaddingRight: number;
  defaultHeaderSpacing: number;
  defaultContentSpacing: number;
  onPaddingChange: (
    field: "paddingTop" | "paddingBottom" | "paddingLeft" | "paddingRight" | "headerSpacing" | "contentSpacing",
    val: number | undefined
  ) => void;
  onResetAllPadding: () => void;
  onApplyUniform: (val: number) => void;
}

function PaddingLayoutManager({
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  headerSpacing,
  contentSpacing,
  defaultPaddingTop,
  defaultPaddingBottom,
  defaultPaddingLeft,
  defaultPaddingRight,
  defaultHeaderSpacing,
  defaultContentSpacing,
  onPaddingChange,
  onResetAllPadding,
  onApplyUniform,
}: PaddingLayoutManagerProps) {
  const avgPadding = Math.round((paddingTop + paddingBottom + paddingLeft + paddingRight) / 4);
  const [uniformVal, setUniformVal] = useState<number>(avgPadding);

  React.useEffect(() => {
    setUniformVal(Math.round((paddingTop + paddingBottom + paddingLeft + paddingRight) / 4));
  }, [paddingTop, paddingBottom, paddingLeft, paddingRight]);

  const isCustomized =
    paddingTop !== defaultPaddingTop ||
    paddingBottom !== defaultPaddingBottom ||
    paddingLeft !== defaultPaddingLeft ||
    paddingRight !== defaultPaddingRight ||
    headerSpacing !== defaultHeaderSpacing ||
    contentSpacing !== defaultContentSpacing;

  return (
    <div className="space-y-3">
      {/* 1. Interactive Mini Box Model Visualizer */}
      <div className="rounded-xl border border-white/10 bg-[#06101E] p-3 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Maximize2 className="h-3 w-3" />
            <span>Interactive Box Model</span>
          </span>
          {isCustomized && (
            <button
              type="button"
              onClick={onResetAllPadding}
              className="flex items-center gap-1 rounded bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30 transition"
              title="Reset all padding to authentic default"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              <span>Reset Padding</span>
            </button>
          )}
        </div>

        {/* Visual Box Diagram */}
        <div className="relative mx-auto max-w-[280px] rounded-lg border-2 border-dashed border-sky-400/40 bg-slate-900/80 p-2 text-center select-none">
          {/* Top Padding Indicator */}
          <div className="flex items-center justify-center gap-1 text-[10px] font-black text-sky-300 pb-1">
            <span>▲ Top:</span>
            <span className="rounded bg-sky-500/20 px-1.5 py-0.2 font-mono text-sky-200 border border-sky-500/30">
              {paddingTop}px
            </span>
          </div>

          {/* Inner Content Area Representation */}
          <div className="flex items-center justify-between gap-1 py-2 px-1">
            {/* Left Indicator */}
            <div className="text-[10px] font-black text-emerald-300 flex flex-col items-center">
              <span>◀ Left</span>
              <span className="rounded bg-emerald-500/20 px-1 py-0.2 font-mono text-emerald-200 border border-emerald-500/30 text-[9.5px]">
                {paddingLeft}px
              </span>
            </div>

            {/* Center Canvas Area Pill */}
            <div className="flex-1 mx-1 rounded-md border border-white/10 bg-[#0A192F] py-2 px-1 shadow-sm flex flex-col items-center justify-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300">
                Live Document
              </span>
              <span className="text-[9px] font-medium text-slate-400">
                ↔ {paddingLeft + paddingRight}px Horiz • ↕ {paddingTop + paddingBottom}px Vert
              </span>
            </div>

            {/* Right Indicator */}
            <div className="text-[10px] font-black text-emerald-300 flex flex-col items-center">
              <span>Right ▶</span>
              <span className="rounded bg-emerald-500/20 px-1 py-0.2 font-mono text-emerald-200 border border-emerald-500/30 text-[9.5px]">
                {paddingRight}px
              </span>
            </div>
          </div>

          {/* Bottom Padding Indicator */}
          <div className="flex items-center justify-center gap-1 text-[10px] font-black text-sky-300 pt-1">
            <span>▼ Bottom:</span>
            <span className="rounded bg-sky-500/20 px-1.5 py-0.2 font-mono text-sky-200 border border-sky-500/30">
              {paddingBottom}px
            </span>
          </div>
        </div>

        {/* Quick Profiles Pills */}
        <div className="mt-2.5 flex items-center justify-center gap-1.5 pt-2 border-t border-white/10">
          <span className="text-[9.5px] font-semibold text-slate-400">Quick:</span>
          <button
            type="button"
            onClick={() => onApplyUniform(72)}
            className="rounded px-2 py-0.5 text-[9.5px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            Safe (72px)
          </button>
          <button
            type="button"
            onClick={onResetAllPadding}
            className="rounded px-2 py-0.5 text-[9.5px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition"
          >
            Default Balanced
          </button>
          <button
            type="button"
            onClick={() => onApplyUniform(110)}
            className="rounded px-2 py-0.5 text-[9.5px] font-bold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            Design (110px)
          </button>
        </div>
      </div>

      {/* 2. Master All 4 Sides Uniform Padding Slider */}
      <div className="rounded-xl border border-white/10 bg-[#09162A]/90 p-3 shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Move className="h-3.5 w-3.5 text-amber-400" />
            <span>All 4 Sides (Uniform Padding)</span>
          </span>
          <span className="text-[10px] text-slate-400">Slides all borders equally</span>
        </div>
        <SizeSliderControl
          label="All Sides Equal Padding"
          value={uniformVal}
          defaultValue={Math.round((defaultPaddingTop + defaultPaddingLeft) / 2)}
          min={72}
          max={140}
          step={1}
          quickPresets={[
            { label: "Safe (72px)", value: 72 },
            { label: "Design (110px)", value: 110 },
            { label: "Spacious (120px)", value: 120 },
            { label: "Deep (130px)", value: 130 },
          ]}
          onChange={(val) => {
            setUniformVal(val);
            onApplyUniform(val);
          }}
          onReset={onResetAllPadding}
          colorTheme="gold"
        />
      </div>

      {/* 3. Individual 4-Directional Sliders */}
      <div className="rounded-xl border border-white/10 bg-[#09162A]/90 p-3 shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>Vertical Padding (Top &amp; Bottom)</span>
          </span>
        </div>

        {/* Top Padding */}
        <SizeSliderControl
          label="Top Margin / Padding (▲)"
          value={paddingTop}
          defaultValue={defaultPaddingTop}
          min={72}
          max={140}
          step={1}
          quickPresets={[
            { label: "Safe (72px)", value: 72 },
            { label: `Default (${defaultPaddingTop}px)`, value: defaultPaddingTop },
            { label: "Spacious (120px)", value: 120 },
            { label: "Deep (130px)", value: 130 },
          ]}
          onChange={(val) => onPaddingChange("paddingTop", val)}
          onReset={() => onPaddingChange("paddingTop", undefined)}
          colorTheme="blue"
        />

        {/* Bottom Padding */}
        <SizeSliderControl
          label="Bottom Margin / Padding (▼)"
          value={paddingBottom}
          defaultValue={defaultPaddingBottom}
          min={72}
          max={140}
          step={1}
          quickPresets={[
            { label: "Safe (72px)", value: 72 },
            { label: `Default (${defaultPaddingBottom}px)`, value: defaultPaddingBottom },
            { label: "Spacious (120px)", value: 120 },
            { label: "Deep (130px)", value: 130 },
          ]}
          onChange={(val) => onPaddingChange("paddingBottom", val)}
          onReset={() => onPaddingChange("paddingBottom", undefined)}
          colorTheme="blue"
        />
      </div>

      {/* 4. Horizontal Padding (Left & Right) */}
      <div className="rounded-xl border border-white/10 bg-[#09162A]/90 p-3 shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span>Horizontal Padding (Left &amp; Right)</span>
          </span>
        </div>

        {/* Left Padding */}
        <SizeSliderControl
          label="Left Margin / Padding (◀)"
          value={paddingLeft}
          defaultValue={defaultPaddingLeft}
          min={72}
          max={140}
          step={1}
          quickPresets={[
            { label: "Safe (72px)", value: 72 },
            { label: `Default (${defaultPaddingLeft}px)`, value: defaultPaddingLeft },
            { label: "Spacious (120px)", value: 120 },
            { label: "Wide (130px)", value: 130 },
          ]}
          onChange={(val) => onPaddingChange("paddingLeft", val)}
          onReset={() => onPaddingChange("paddingLeft", undefined)}
          colorTheme="emerald"
        />

        {/* Right Padding */}
        <SizeSliderControl
          label="Right Margin / Padding (▶)"
          value={paddingRight}
          defaultValue={defaultPaddingRight}
          min={72}
          max={140}
          step={1}
          quickPresets={[
            { label: "Safe (72px)", value: 72 },
            { label: `Default (${defaultPaddingRight}px)`, value: defaultPaddingRight },
            { label: "Spacious (120px)", value: 120 },
            { label: "Wide (130px)", value: 130 },
          ]}
          onChange={(val) => onPaddingChange("paddingRight", val)}
          onReset={() => onPaddingChange("paddingRight", undefined)}
          colorTheme="emerald"
        />
      </div>

      {/* 5. Inner Section Gaps & Breathing Room */}
      <div className="rounded-xl border border-white/10 bg-[#09162A]/90 p-3 shadow-md space-y-3">
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
          <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5" />
            <span>Section Spacing &amp; Gaps</span>
          </span>
          <span className="text-[10px] text-slate-400">Vertical breathing room</span>
        </div>

        {/* Header Gap */}
        <SizeSliderControl
          label="Header Bottom Spacing"
          value={headerSpacing}
          defaultValue={defaultHeaderSpacing}
          min={0}
          max={35}
          step={1}
          quickPresets={[
            { label: "Flush (0px)", value: 0 },
            { label: `Default (${defaultHeaderSpacing}px)`, value: defaultHeaderSpacing },
            { label: "Spacious (14px)", value: 14 },
            { label: "Relaxed (22px)", value: 22 },
          ]}
          onChange={(val) => onPaddingChange("headerSpacing", val)}
          onReset={() => onPaddingChange("headerSpacing", undefined)}
          colorTheme="gold"
        />

        {/* Content Gap */}
        <SizeSliderControl
          label="Body &amp; Table Gap"
          value={contentSpacing}
          defaultValue={defaultContentSpacing}
          min={0}
          max={35}
          step={1}
          quickPresets={[
            { label: "Compact (2px)", value: 2 },
            { label: `Default (${defaultContentSpacing}px)`, value: defaultContentSpacing },
            { label: "Spacious (12px)", value: 12 },
            { label: "Relaxed (20px)", value: 20 },
          ]}
          onChange={(val) => onPaddingChange("contentSpacing", val)}
          onReset={() => onPaddingChange("contentSpacing", undefined)}
          colorTheme="gold"
        />
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// COLLAPSIBLE DROPDOWN ACCORDION SECTION
// -------------------------------------------------------------
interface DropdownSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  children: React.ReactNode;
  accent?: "gold" | "blue" | "emerald" | "purple";
}

function DropdownSection({
  title,
  subtitle,
  icon,
  isOpen,
  onToggle,
  badge,
  children,
  accent = "gold",
}: DropdownSectionProps) {
  const iconColor =
    accent === "gold"
      ? "text-[#C4A35A] bg-[#C4A35A]/15 border-[#C4A35A]/30"
      : accent === "emerald"
      ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30"
      : accent === "purple"
      ? "text-purple-400 bg-purple-500/15 border-purple-500/30"
      : "text-sky-400 bg-sky-500/15 border-sky-500/30";

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm",
        isOpen
          ? "border-white/20 bg-[#0E1E36]"
          : "border-white/10 bg-[#0A1628]/80 hover:border-white/15 hover:bg-[#0C1B30]"
      )}
    >
      {/* Collapsible Dropdown Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3.5 text-left transition select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border", iconColor)}>
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-white tracking-wide">{title}</span>
              {badge && (
                <span className="rounded-full bg-white/10 px-2 py-0.2 text-[9px] font-extrabold text-[#C4A35A] border border-white/10">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 hidden sm:inline">
            {isOpen ? "Close" : "Open"}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[#C4A35A] transition-transform duration-200",
              isOpen ? "rotate-180" : "rotate-0"
            )}
          />
        </div>
      </button>

      {/* Expanded Accordion Body */}
      {isOpen && (
        <div className="border-t border-white/10 p-3.5 space-y-3 bg-[#081426]/70">
          {children}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// MAIN CERTIFICATE CUSTOMIZER DRAWER
// -------------------------------------------------------------
export default function CertificateCustomizerDrawer({
  activeData,
  selectedType,
  onFieldChange,
  onResetData,
  onSave,
  isSaving = false,
  lastSavedAt,
  className = "",
}: Props) {
  const isMarksheetV1 = selectedType === "marksheet";
  const isMarksheetV2 = selectedType === "marksheet2";
  const isMarksheet = isMarksheetV1 || isMarksheetV2;
  const currentTypeConfig =
    CERTIFICATE_TYPE_CONFIGS.find((c) => c.id === selectedType) || CERTIFICATE_TYPE_CONFIGS[0];

  // Category Tab
  const [activeTab, setActiveTab] = useState<CategoryTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Collapsible Dropdown Accordion States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    logos: true,
    typography: true,
    padding: true,
    watermark: true,
    student: true,
    signatures: false,
    border: false,
    candidate: true,
    marks: true,
    center: false,
  });

  // When user switches certificate type, reopen core sections for that template only
  useEffect(() => {
    setActiveTab(isMarksheetV2 ? "border" : "all");
    setSearchQuery("");
    setOpenSections({
      logos: true,
      typography: true,
      padding: true,
      watermark: true,
      student: true,
      signatures: false,
      border: isMarksheetV2,
      candidate: true,
      marks: isMarksheet,
      center: false,
    });
  }, [selectedType, isMarksheet, isMarksheetV2]);

  const logosControlCount = isMarksheetV2 ? 2 : isMarksheetV1 ? 5 : 4;

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    setOpenSections({
      logos: true,
      typography: true,
      padding: true,
      watermark: true,
      student: true,
      signatures: true,
      border: true,
      candidate: true,
      marks: true,
      center: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      logos: false,
      padding: false,
      student: false,
      signatures: false,
      border: false,
      candidate: false,
      marks: false,
      center: false,
    });
  };

  // Marksheet Subjects Handling
  const handleSubjectChange = (index: number, field: keyof MarksheetSubject, val: unknown) => {
    const subjects = [...(activeData.subjects || [])];
    if (!subjects[index]) return;
    subjects[index] = { ...subjects[index], [field]: val };

    if (field === "totalMax" || field === "totalObtained") {
      const max = Number(field === "totalMax" ? val : subjects[index].totalMax) || 100;
      const obt = Number(field === "totalObtained" ? val : subjects[index].totalObtained) || 0;
      subjects[index].grade = `${max > 0 ? ((obt / max) * 100).toFixed(0) : 0}%`;
    }

    onFieldChange("subjects", subjects);

    const totalMax = subjects.reduce((sum, s) => sum + s.totalMax, 0);
    const totalObt = subjects.reduce((sum, s) => sum + s.totalObtained, 0);
    if (totalMax > 0) {
      const pct = Number(((totalObt / totalMax) * 100).toFixed(2));
      onFieldChange("marksPercent", pct);
    }
  };

  const handleAddSubject = () => {
    const subjects = [...(activeData.subjects || [])];
    const newIdx = subjects.length + 1;
    subjects.push({
      code: `SUB-0${newIdx}`,
      name: `New Subject Module ${newIdx}`,
      maxTheory: 100,
      marksTheory: 85,
      maxPractical: 0,
      marksPractical: 0,
      totalMax: 100,
      totalObtained: 85,
      grade: "85%",
    });
    onFieldChange("subjects", subjects);
  };

  const defaultGradeSystem: GradeSystemRow[] = [
    { grade: "A+", label: "Excellent", range: "85% & Above" },
    { grade: "A", label: "Very Good", range: "70% to 84%" },
    { grade: "B", label: "Good", range: "55% to 69%" },
    { grade: "C", label: "Average", range: "40% to 54%" },
    { grade: "D", label: "Below Average", range: "Below 40%" },
  ];

  const handleGradeSystemChange = (
    index: number,
    field: keyof GradeSystemRow,
    val: string
  ) => {
    const list = [...(activeData.gradeSystem || defaultGradeSystem)];
    if (!list[index]) return;
    list[index] = { ...list[index], [field]: val };
    onFieldChange("gradeSystem", list);
  };

  const handleRemoveSubject = (idx: number) => {
    const subjects = [...(activeData.subjects || [])];
    if (subjects.length <= 1) return;
    subjects.splice(idx, 1);
    onFieldChange("subjects", subjects);
  };

  // Filter sections visibility based on Tab or Search
  const query = searchQuery.trim().toLowerCase();
  const shouldShowSection = (secId: string, terms: string[]) => {
    if (activeTab !== "all") {
      if (activeTab === "logos" && secId !== "logos" && secId !== "border") return false;
      if (activeTab === "typography" && secId !== "typography") return false;
      if (activeTab === "padding" && secId !== "padding") return false;
      if (activeTab === "student" && secId !== "student" && secId !== "candidate") return false;
      if (activeTab === "signatures" && secId !== "signatures") return false;
      if (activeTab === "marks" && secId !== "marks") return false;
      if (activeTab === "center" && secId !== "center") return false;
      if (activeTab === "border" && secId !== "border") return false;
    }
    if (!query) return true;
    return terms.some((t) => t.toLowerCase().includes(query));
  };

  // Dimensions & Defaults
  const defaultLogoH = isMarksheetV2 ? 159 : isMarksheetV1 ? 92 : 84;
  const currentLogoH = activeData.logoHeight || defaultLogoH;

  const defaultLogoW = isMarksheetV2 ? 220 : isMarksheetV1 ? 195 : 180;
  const currentLogoW = activeData.logoWidth || defaultLogoW;

  const defaultTitleFont = isMarksheetV2 ? 22 : isMarksheetV1 ? 20.5 : 20;
  const currentTitleFont = activeData.titleFontSize || defaultTitleFont;

  const defaultIsoSize = isMarksheetV1 ? 92 : 84;
  const currentIsoSize = activeData.isoSealSize || defaultIsoSize;

  const defaultPartnerH = isMarksheetV1 ? 46 : 44;
  const currentPartnerH = activeData.partnerLogosHeight || defaultPartnerH;

  const defaultPhotoW = isMarksheetV2 ? 108 : isMarksheetV1 ? 138 : 72;
  const currentPhotoW = activeData.photoWidth || defaultPhotoW;

  const defaultPhotoH = isMarksheetV2 ? 132 : isMarksheetV1 ? 152 : 86;
  const currentPhotoH = activeData.photoHeight || defaultPhotoH;

  const defaultStudentSigH = isMarksheetV1 ? 36 : 28;
  const currentStudentSigH = activeData.studentSigHeight || defaultStudentSigH;

  const defaultStampSize = isMarksheetV2 ? 90 : isMarksheetV1 ? 82 : 84;
  const currentStampSize = activeData.stampSize || defaultStampSize;

  const defaultDirectorSigH = isMarksheetV2 ? 34 : isMarksheetV1 ? 44 : 48;
  const currentDirectorSigH = activeData.directorSigHeight || defaultDirectorSigH;

  const defaultGoldMedalSize = 125;
  const currentGoldMedalSize = activeData.goldMedalSize || defaultGoldMedalSize;

  const defaultQrSize = isMarksheetV2 ? 72 : isMarksheet ? 76 : 52;
  const currentQrSize = activeData.qrCodeSize || defaultQrSize;

  // Padding & Layout Spacing Defaults
  const defaultPaddingTop = isMarksheetV2 ? 110 : isMarksheet ? 48 : 66;
  const currentPaddingTop =
    activeData.paddingTop !== undefined ? activeData.paddingTop : defaultPaddingTop;

  const defaultPaddingBottom = isMarksheetV2 ? 116 : isMarksheet ? 42 : 68;
  const currentPaddingBottom =
    activeData.paddingBottom !== undefined ? activeData.paddingBottom : defaultPaddingBottom;

  const defaultPaddingLeft = isMarksheetV2 ? 110 : isMarksheet ? 56 : 58;
  const currentPaddingLeft =
    activeData.paddingLeft !== undefined ? activeData.paddingLeft : defaultPaddingLeft;

  const defaultPaddingRight = isMarksheetV2 ? 110 : isMarksheet ? 56 : 58;
  const currentPaddingRight =
    activeData.paddingRight !== undefined ? activeData.paddingRight : defaultPaddingRight;

  const defaultHeaderSpacing = isMarksheetV2 ? 4 : isMarksheet ? 2 : 4;
  const currentHeaderSpacing =
    activeData.headerSpacing !== undefined ? activeData.headerSpacing : defaultHeaderSpacing;

  const defaultContentSpacing = isMarksheetV2 ? 6 : isMarksheet ? 4 : 8;
  const currentContentSpacing =
    activeData.contentSpacing !== undefined ? activeData.contentSpacing : defaultContentSpacing;

  const handlePaddingChange = (
    field: "paddingTop" | "paddingBottom" | "paddingLeft" | "paddingRight" | "headerSpacing" | "contentSpacing",
    val: number | undefined
  ) => {
    onFieldChange(field, val);
  };

  const handleApplyUniformPadding = (val: number) => {
    onFieldChange("paddingTop", val);
    onFieldChange("paddingBottom", val);
    onFieldChange("paddingLeft", val);
    onFieldChange("paddingRight", val);
  };

  const handleResetAllPadding = () => {
    onFieldChange("paddingTop", undefined);
    onFieldChange("paddingBottom", undefined);
    onFieldChange("paddingLeft", undefined);
    onFieldChange("paddingRight", undefined);
    onFieldChange("headerSpacing", undefined);
    onFieldChange("contentSpacing", undefined);
  };

  // Typography & Font Sizing Defaults
  const defaultInnerFontScale = 100;
  const currentInnerFontScale = activeData.innerFontScale || defaultInnerFontScale;

  const defaultCandidateFont = 13;
  const currentCandidateFont = activeData.candidateFontSize || defaultCandidateFont;

  const defaultTableFont = 12;
  const currentTableFont = activeData.tableFontSize || defaultTableFont;

  const defaultCertBodyFont = 15.5;
  const currentCertBodyFont = activeData.certBodyFontSize || defaultCertBodyFont;

  const defaultStudentNameFont = isMarksheet ? 14 : 44;
  const currentStudentNameFont = activeData.studentNameFontSize || defaultStudentNameFont;

  return (
    <aside
      className={cn(
        "no-print shrink-0 border-r border-white/10 bg-[#071322] flex flex-col text-slate-200 select-none shadow-2xl z-20",
        className
      )}
      style={{ width: "24.5rem" }}
    >
      {/* 1. Header Toolbar — scoped to the active template only */}
      <div className="shrink-0 border-b border-white/10 p-3.5 bg-[#050E1B]">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#C4A35A] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#F4CF74] shrink-0" />
              <span className="truncate">Live Editor · {currentTypeConfig.title}</span>
            </h3>
            <p className="text-[10.5px] text-slate-400 mt-0.5 truncate">
              {currentTypeConfig.badge ? (
                <span className="text-[#F4CF74]/90">{currentTypeConfig.badge}</span>
              ) : null}
              {currentTypeConfig.badge ? " · " : null}
              Controls &amp; logos for this template only
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onResetData}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10.5px] font-bold text-sky-400 hover:bg-white/10 active:scale-95 transition"
              title={`Reset only "${currentTypeConfig.title}" to factory defaults`}
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
            {onSave && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => onSave()}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#D9A74A] to-[#B88728] px-2.5 py-1 text-[10.5px] font-black text-slate-950 shadow-sm hover:brightness-110 active:scale-95 transition disabled:opacity-60"
                title="Save all changes and uploads permanently"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3" />
                    <span>Save</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Search Bar + Quick Expand/Collapse */}
        <div className="mt-2.5 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search controls (e.g. logo, photo, size)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 pl-8 pr-2.5 py-1.5 text-[11px] text-white placeholder-slate-500 outline-none focus:border-[#C4A35A]"
            />
          </div>
          <button
            type="button"
            onClick={expandAll}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[9.5px] font-bold text-slate-300 hover:bg-white/10 hover:text-white transition whitespace-nowrap"
            title="Expand all dropdown sections"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[9.5px] font-bold text-slate-300 hover:bg-white/10 hover:text-white transition whitespace-nowrap"
            title="Collapse all dropdown sections"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="shrink-0 border-b border-white/10 bg-[#06101E] px-3 py-2 flex flex-wrap items-center gap-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition whitespace-nowrap",
            activeTab === "all"
              ? "bg-[#C4A35A] text-slate-950 shadow-sm"
              : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          All Dropdowns
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("logos")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition whitespace-nowrap",
            activeTab === "logos"
              ? "bg-[#C4A35A] text-slate-950 shadow-sm"
              : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          Logos &amp; Sizes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("typography")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition whitespace-nowrap",
            activeTab === "typography"
              ? "bg-[#C4A35A] text-slate-950 shadow-sm"
              : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          Font &amp; UI Scale
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("padding");
          }}
          className={cn(
            "rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition whitespace-nowrap",
            activeTab === "padding"
              ? "bg-[#C4A35A] text-slate-950 shadow-sm"
              : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          Padding &amp; Layout
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("border");
            setOpenSections((prev) => ({ ...prev, border: true }));
          }}
          className={cn(
            "rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition whitespace-nowrap",
            activeTab === "border"
              ? "bg-[#C4A35A] text-slate-950 shadow-sm"
              : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          Border
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("student")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition whitespace-nowrap",
            activeTab === "student"
              ? "bg-[#C4A35A] text-slate-950 shadow-sm"
              : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          Student
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("signatures")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition whitespace-nowrap",
            activeTab === "signatures"
              ? "bg-[#C4A35A] text-slate-950 shadow-sm"
              : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          Signatures &amp; Stamps
        </button>
        {isMarksheet && (
          <button
            type="button"
            onClick={() => setActiveTab("marks")}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition whitespace-nowrap",
              activeTab === "marks"
                ? "bg-[#C4A35A] text-slate-950 shadow-sm"
                : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            )}
          >
            Marks Table
          </button>
        )}
        <button
          type="button"
          onClick={() => setActiveTab("center")}
          className={cn(
            "rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition whitespace-nowrap",
            activeTab === "center"
              ? "bg-[#C4A35A] text-slate-950 shadow-sm"
              : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          Center &amp; Legal
        </button>
      </div>

      {/* 3. Main Scrollable List of Dropdown Accordions */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
        {/* ================= SECTION 1: LOGOS, SEALS & HEADER SIZES ================= */}
        {shouldShowSection("logos", ["logo", "seal", "iso", "partner", "title", "header", "size"]) && (
          <DropdownSection
            id="logos"
            title={
              isMarksheetV2
                ? "1. Logo & Title Sizing"
                : "1. Logo, Seals & Header Sizing"
            }
            subtitle={
              isMarksheetV2
                ? "Institute logo & title size for Result - 2 only"
                : "Upload and adjust height, width & font sizes"
            }
            icon={<Building2 className="h-4 w-4" />}
            isOpen={openSections.logos}
            onToggle={() => toggleSection("logos")}
            badge={`${logosControlCount} Controls`}
          >
            {/* Result Form 2: fixed IVESDC_header.svg — not dynamic logo/title */}
            {isMarksheetV2 ? (
              <>
                <ImageUploaderWithSizer
                  category="header"
                  label="Fixed Header (IVESDC_header.svg)"
                  description="Full header is a fixed SVG — logo, title, ribbon & legal text are baked in. Replace only if you have a new header file."
                  currentValue={activeData.customHeaderUrl}
                  defaultPreview="/certificates/IVESDC_header.svg"
                  onUpload={(val) => onFieldChange("customHeaderUrl", val)}
                  onResetAsset={() =>
                    onFieldChange("customHeaderUrl", "/certificates/IVESDC_header.svg")
                  }
                  sizeControl={{
                    label: "Header Height",
                    value: activeData.headerHeight || 128,
                    defaultValue: 128,
                    min: 80,
                    max: 220,
                    step: 2,
                    quickPresets: [
                      { label: "Compact", value: 100 },
                      { label: "Default", value: 128 },
                      { label: "Large", value: 160 },
                      { label: "XL", value: 190 },
                    ],
                    onChange: (val) => onFieldChange("headerHeight", val),
                    onReset: () => onFieldChange("headerHeight", undefined),
                  }}
                />
                <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[10px] text-amber-100/90 leading-snug">
                  Header height / photo / stamp / QR / padding all resize live inside the border.
                  Use <span className="font-bold text-amber-200">Padding &amp; Layout</span> to keep
                  content clear of the floral/Design frame.
                </p>
              </>
            ) : (
              <ImageUploaderWithSizer
                category="institute-logo"
                label="Institute Brand Lockup (Logo)"
                description="Top-left institutional crest logo. Adjust height & container width smoothly."
                currentValue={activeData.logoUrl}
                defaultPreview="/cert/ivesdc-logo.png"
                onUpload={(val) => onFieldChange("logoUrl", val)}
                onResetAsset={() => onFieldChange("logoUrl", undefined)}
                sizeControl={{
                  label: "Logo Image Height",
                  value: currentLogoH,
                  defaultValue: defaultLogoH,
                  min: 40,
                  max: 170,
                  step: 2,
                  quickPresets: [
                    { label: "Compact", value: 65 },
                    { label: "Default", value: defaultLogoH },
                    { label: "Enlarged", value: 110 },
                    { label: "Jumbo", value: 135 },
                  ],
                  onChange: (val) => onFieldChange("logoHeight", val),
                  onReset: () => onFieldChange("logoHeight", undefined),
                }}
                secondarySizeControl={{
                  label: "Logo Container Width",
                  value: currentLogoW,
                  defaultValue: defaultLogoW,
                  min: 120,
                  max: 300,
                  step: 5,
                  quickPresets: [
                    { label: "Narrow", value: 160 },
                    { label: "Standard", value: defaultLogoW },
                    { label: "Wide", value: 240 },
                  ],
                  onChange: (val) => onFieldChange("logoWidth", val),
                  onReset: () => onFieldChange("logoWidth", undefined),
                }}
              />
            )}

            {/* Title Font Size — not used on Result Form 2 (header is fixed SVG) */}
            {!isMarksheetV2 && (
            <SizeSliderControl
              label="Institution Title Font Size"
              value={currentTitleFont}
              defaultValue={defaultTitleFont}
              min={14}
              max={isMarksheetV2 ? 28 : 26}
              step={0.5}
              quickPresets={
                isMarksheetV2
                  ? [
                      { label: "Compact", value: 18 },
                      { label: "Default", value: defaultTitleFont },
                      { label: "Prominent", value: 24 },
                      { label: "Large", value: 26 },
                    ]
                  : [
                      { label: "Compact", value: 16 },
                      { label: "Default", value: defaultTitleFont },
                      { label: "Prominent", value: 22 },
                      { label: "Bold Hero", value: 24 },
                    ]
              }
              onChange={(val) => onFieldChange("titleFontSize", val)}
              onReset={() => onFieldChange("titleFontSize", undefined)}
              colorTheme="gold"
            />
            )}

            {/* ISO seal — certificates + Result (V1) only; not on Result - 2 */}
            {!isMarksheetV2 && (
              <ImageUploaderWithSizer
                category="iso-seal"
                label="Certified ISO Emblem Seal"
                description="Top-right circular gold ISO certification medal seal."
                currentValue={activeData.isoSealUrl}
                defaultPreview="/cert/iso-seal.png"
                onUpload={(val) => onFieldChange("isoSealUrl", val)}
                onResetAsset={() => onFieldChange("isoSealUrl", undefined)}
                sizeControl={{
                  label: "ISO Seal Diameter",
                  value: currentIsoSize,
                  defaultValue: defaultIsoSize,
                  min: 40,
                  max: 140,
                  step: 2,
                  quickPresets: [
                    { label: "Small", value: 64 },
                    { label: "Default", value: defaultIsoSize },
                    { label: "Large", value: 110 },
                  ],
                  onChange: (val) => onFieldChange("isoSealSize", val),
                  onReset: () => onFieldChange("isoSealSize", undefined),
                }}
              />
            )}

            {/* Statement of Marks cartouche banner — Result (V1) + Result - 2 */}
            {isMarksheet && (
              <ImageUploaderWithSizer
                category="title-banner"
                label="Statement of Marks Title Plaque Banner"
                description={
                  isMarksheetV2
                    ? "Optional custom badge for STATEMENT OF MARKS (blank-form cartouche). Leave default for built-in badge."
                    : "Authentic royal navy blue cartouche with gold outline. Adjust height & width smoothly."
                }
                currentValue={activeData.customBannerUrl}
                defaultPreview="/cert/res-statement-banner.png?v=authentic"
                onUpload={(val) => onFieldChange("customBannerUrl", val)}
                onResetAsset={() => onFieldChange("customBannerUrl", undefined)}
                sizeControl={{
                  label: "Banner Height",
                  value: activeData.bannerHeight || (isMarksheetV2 ? 42 : 54),
                  defaultValue: isMarksheetV2 ? 42 : 54,
                  min: 36,
                  max: 80,
                  step: 2,
                  quickPresets: [
                    { label: "Compact (44px)", value: 44 },
                    { label: "Default", value: isMarksheetV2 ? 42 : 54 },
                    { label: "Enlarged (62px)", value: 62 },
                    { label: "Jumbo (70px)", value: 70 },
                  ],
                  onChange: (val) => onFieldChange("bannerHeight", val),
                  onReset: () => onFieldChange("bannerHeight", undefined),
                }}
                secondarySizeControl={{
                  label: "Banner Width",
                  value: activeData.bannerWidth || (isMarksheetV2 ? 320 : 387),
                  defaultValue: isMarksheetV2 ? 320 : 387,
                  min: 280,
                  max: 560,
                  step: 5,
                  quickPresets: [
                    { label: "Compact (340px)", value: 340 },
                    { label: "Default", value: isMarksheetV2 ? 320 : 387 },
                    { label: "Wide (440px)", value: 440 },
                    { label: "Max (500px)", value: 500 },
                  ],
                  onChange: (val) => onFieldChange("bannerWidth", val),
                  onReset: () => onFieldChange("bannerWidth", undefined),
                }}
              />
            )}

            {/* Partner logos — certificates + Result (V1) only; not on Result - 2 */}
            {!isMarksheetV2 && (
              <PartnerLogosManager
                partnerLogos={activeData.partnerLogos || DEFAULT_PARTNER_LOGOS}
                partnerLogosUrl={activeData.partnerLogosUrl}
                partnerLogosHeight={currentPartnerH}
                defaultPartnerLogosHeight={defaultPartnerH}
                onUpdatePartnerLogos={(logos) => onFieldChange("partnerLogos", logos)}
                onUpdateCombinedUrl={(url) => onFieldChange("partnerLogosUrl", url)}
                onHeightChange={(val) => onFieldChange("partnerLogosHeight", val)}
                onResetHeight={() => onFieldChange("partnerLogosHeight", undefined)}
              />
            )}
          </DropdownSection>
        )}

        {/* ================= SECTION 2: INNER CONTENT FONT SCALING & TYPOGRAPHY ================= */}
        {shouldShowSection("typography", [
          "typography",
          "font",
          "scale",
          "text",
          "size",
          "bada",
          "increase",
          "andar",
          "particulars",
          "candidate",
          "table",
          "marks",
        ]) && (
          <DropdownSection
            id="typography"
            title="2. Inner Content Font Scaling & Typography (Sliders)"
            subtitle="Slide to enlarge internal text, particulars & marks table smoothly"
            icon={<Type className="h-4 w-4" />}
            isOpen={openSections.typography}
            onToggle={() => toggleSection("typography")}
            badge={`${currentInnerFontScale}% Scale`}
            accent="gold"
          >
            <div className="space-y-3">
              {/* Informational Callout */}
              <div className="rounded-xl border border-[#C4A35A]/25 bg-[#C4A35A]/10 p-2.5">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#F4CF74]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Master Font &amp; UI Scale</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                  Easily increase or decrease all internal certificate text and table typography. Use the master slider or fine-tune individual sections below.
                </p>
              </div>

              {/* Master Content Font Scale (%) */}
              <SizeSliderControl
                label="Master Inner Content Scale (%)"
                value={currentInnerFontScale}
                defaultValue={defaultInnerFontScale}
                min={80}
                max={150}
                step={1}
                unit="%"
                quickPresets={[
                  { label: "Compact 90%", value: 90 },
                  { label: "Default 100%", value: 100 },
                  { label: "Enlarged 110%", value: 110 },
                  { label: "Large 120%", value: 120 },
                  { label: "Jumbo 135%", value: 135 },
                ]}
                onChange={(val) => onFieldChange("innerFontScale", val)}
                onReset={() => onFieldChange("innerFontScale", undefined)}
                colorTheme="gold"
              />

              {isMarksheet ? (
                <>
                  {/* Candidate Particulars Font Size (px) */}
                  <SizeSliderControl
                    label="Candidate Particulars Font Size"
                    value={currentCandidateFont}
                    defaultValue={defaultCandidateFont}
                    min={11}
                    max={22}
                    step={0.5}
                    unit="px"
                    quickPresets={[
                      { label: "Compact (12px)", value: 12 },
                      { label: "Default (13px)", value: 13 },
                      { label: "Medium (15px)", value: 15 },
                      { label: "Large (17px)", value: 17 },
                      { label: "Hero (19px)", value: 19 },
                    ]}
                    onChange={(val) => onFieldChange("candidateFontSize", val)}
                    onReset={() => onFieldChange("candidateFontSize", undefined)}
                    colorTheme="blue"
                  />

                  {/* Marks Table Font Size (px) */}
                  <SizeSliderControl
                    label="Subjects Table Font Size"
                    value={currentTableFont}
                    defaultValue={defaultTableFont}
                    min={10}
                    max={20}
                    step={0.5}
                    unit="px"
                    quickPresets={[
                      { label: "Compact (11px)", value: 11 },
                      { label: "Default (12px)", value: 12 },
                      { label: "Medium (14px)", value: 14 },
                      { label: "Large (16px)", value: 16 },
                      { label: "Bold (18px)", value: 18 },
                    ]}
                    onChange={(val) => onFieldChange("tableFontSize", val)}
                    onReset={() => onFieldChange("tableFontSize", undefined)}
                    colorTheme="emerald"
                  />
                </>
              ) : (
                <>
                  {/* Certificate Body Font Size (px) */}
                  <SizeSliderControl
                    label="Certificate Body Text Size"
                    value={currentCertBodyFont}
                    defaultValue={defaultCertBodyFont}
                    min={12}
                    max={24}
                    step={0.5}
                    unit="px"
                    quickPresets={[
                      { label: "Compact (14px)", value: 14 },
                      { label: "Default (15.5px)", value: 15.5 },
                      { label: "Large (18px)", value: 18 },
                      { label: "Prominent (21px)", value: 21 },
                    ]}
                    onChange={(val) => onFieldChange("certBodyFontSize", val)}
                    onReset={() => onFieldChange("certBodyFontSize", undefined)}
                    colorTheme="blue"
                  />

                  {/* Student Name Font Size (px) */}
                  <SizeSliderControl
                    label="Student Cursive Name Size"
                    value={currentStudentNameFont}
                    defaultValue={defaultStudentNameFont}
                    min={30}
                    max={64}
                    step={2}
                    unit="px"
                    quickPresets={[
                      { label: "Compact (38px)", value: 38 },
                      { label: "Default (44px)", value: 44 },
                      { label: "Large (52px)", value: 52 },
                      { label: "Hero (60px)", value: 60 },
                    ]}
                    onChange={(val) => onFieldChange("studentNameFontSize", val)}
                    onReset={() => onFieldChange("studentNameFontSize", undefined)}
                    colorTheme="gold"
                  />
                </>
              )}
            </div>
          </DropdownSection>
        )}

        {/* ================= SECTION 3: PAGE & LAYOUT PADDING ================= */}
        {shouldShowSection("padding", [
          "padding",
          "margin",
          "spacing",
          "gap",
          "layout",
          "top",
          "bottom",
          "left",
          "right",
        ]) && (
          <DropdownSection
            id="padding"
            title="3. Page & Layout Padding (Sliders)"
            subtitle="Slide to adjust top, bottom, left & right margins softly"
            icon={<Maximize2 className="h-4 w-4" />}
            isOpen={openSections.padding}
            onToggle={() => toggleSection("padding")}
            badge="6 Controls"
            accent="gold"
          >
            <PaddingLayoutManager
              paddingTop={currentPaddingTop}
              paddingBottom={currentPaddingBottom}
              paddingLeft={currentPaddingLeft}
              paddingRight={currentPaddingRight}
              headerSpacing={currentHeaderSpacing}
              contentSpacing={currentContentSpacing}
              defaultPaddingTop={defaultPaddingTop}
              defaultPaddingBottom={defaultPaddingBottom}
              defaultPaddingLeft={defaultPaddingLeft}
              defaultPaddingRight={defaultPaddingRight}
              defaultHeaderSpacing={defaultHeaderSpacing}
              defaultContentSpacing={defaultContentSpacing}
              onPaddingChange={handlePaddingChange}
              onResetAllPadding={handleResetAllPadding}
              onApplyUniform={handleApplyUniformPadding}
            />
          </DropdownSection>
        )}

        {/* ================= SECTION 4: WATERMARK & SECURITY PATTERN ================= */}
        {shouldShowSection("watermark", [
          "watermark",
          "background",
          "pattern",
          "crest",
          "seal",
          "grid",
          "bich",
          "flower",
          "shadow",
        ]) && (
          <DropdownSection
            id="watermark"
            title={
              isMarksheetV2
                ? "4. Shadow Flower Background"
                : "4. Background Security Watermark & Pattern"
            }
            subtitle={
              isMarksheetV2
                ? "Official bgcert geometric pattern inside floral border"
                : "Control background watermark style, opacity slider & color"
            }
            icon={<Sparkles className="h-4 w-4" />}
            isOpen={openSections.watermark}
            onToggle={() => toggleSection("watermark")}
            badge={activeData.watermarkType === "none" ? "Hidden" : `${Math.round((activeData.watermarkOpacity !== undefined ? activeData.watermarkOpacity : 0.04) * 100)}% Opacity`}
            accent="purple"
          >
            <div className="space-y-4">
              {/* Pattern Style Choice */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Watermark Pattern Style:
                </label>
                <div className={cn("grid gap-2", isMarksheetV2 ? "grid-cols-2" : "grid-cols-3")}>
                  {[
                    ...(isMarksheetV2
                      ? [
                          {
                            id: "shadow-flower",
                            label: "Shadow Flower",
                            desc: "Official embossed geometric (bgcert)",
                          },
                        ]
                      : []),
                    { id: "tiled-grid", label: "Tiled Grid", desc: "Repeating diagonal seal" },
                    { id: "crest", label: "Central Crest", desc: "Single large emblem" },
                    { id: "none", label: "None", desc: "Pure white background" },
                  ].map((wStyle) => {
                    const isSelected =
                      (activeData.watermarkType ||
                        (isMarksheetV2
                          ? "shadow-flower"
                          : selectedType === "marksheet"
                            ? "tiled-grid"
                            : "crest")) === wStyle.id;
                    return (
                      <button
                        key={wStyle.id}
                        type="button"
                        onClick={() => onFieldChange("watermarkType", wStyle.id)}
                        className={cn(
                          "rounded-xl border p-2 text-left transition text-xs",
                          isSelected
                            ? "border-[#1E4A85] bg-[#1E4A85]/10 font-bold text-[#1E4A85] dark:border-[#C4A35A] dark:bg-[#C4A35A]/15 dark:text-[#C4A35A]"
                            : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                        )}
                      >
                        <div className="text-[11px] font-bold leading-tight">{wStyle.label}</div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">{wStyle.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opacity Slider */}
              {activeData.watermarkType !== "none" && (
                <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Background Pattern Opacity:
                    </span>
                    <span className="rounded bg-purple-100 px-2 py-0.5 font-mono text-[11px] font-black text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      {Math.round(
                        (activeData.watermarkOpacity !== undefined
                          ? activeData.watermarkOpacity
                          : isMarksheetV2
                            ? 0.55
                            : 0.04) * 100
                      )}
                      %
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={isMarksheetV2 ? 1 : 0.2}
                    step={isMarksheetV2 ? 0.01 : 0.005}
                    value={
                      activeData.watermarkOpacity !== undefined
                        ? activeData.watermarkOpacity
                        : isMarksheetV2
                          ? 0.55
                          : 0.04
                    }
                    onChange={(e) =>
                      onFieldChange("watermarkOpacity", parseFloat(e.target.value))
                    }
                    className="w-full accent-purple-600 cursor-pointer"
                  />

                  <div className="flex items-center gap-1.5 pt-1">
                    {(isMarksheetV2
                      ? [
                          { label: "Soft", val: 0.35 },
                          { label: "Default", val: 0.55 },
                          { label: "Strong", val: 0.75 },
                          { label: "Full", val: 1 },
                        ]
                      : [
                          { label: "Off (0%)", val: 0 },
                          { label: "Subtle (3%)", val: 0.03 },
                          { label: "Default (5%)", val: 0.05 },
                          { label: "Vivid (10%)", val: 0.1 },
                        ]
                    ).map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => onFieldChange("watermarkOpacity", p.val)}
                        className={cn(
                          "rounded-md border px-2 py-1 text-[10px] font-bold transition flex-1 text-center",
                          Math.abs(
                            (activeData.watermarkOpacity !== undefined
                              ? activeData.watermarkOpacity
                              : isMarksheetV2
                                ? 0.55
                                : 0.04) - p.val
                          ) < 0.02
                            ? "border-purple-600 bg-purple-600 text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {isMarksheetV2 && (
                    <ImageUploaderWithSizer
                      category="bg-pattern"
                      label="Background Pattern Image"
                      description="Default is /certificates/bgcert.png (shadow flower). Upload to replace."
                      currentValue={activeData.backgroundPatternUrl}
                      defaultPreview="/certificates/bgcert.png"
                      onUpload={(val) => onFieldChange("backgroundPatternUrl", val)}
                      onResetAsset={() =>
                        onFieldChange("backgroundPatternUrl", "/certificates/bgcert.png")
                      }
                    />
                  )}
                </div>
              )}
            </div>
          </DropdownSection>
        )}

        {/* ================= SECTION 5: STUDENT PHOTO & SIGNATURE ================= */}
        {shouldShowSection("student", ["photo", "student", "signature", "portrait"]) && (
          <DropdownSection
            id="student"
            title={isMarksheetV2 ? "5. Student Photo" : "5. Student Photo & Signature"}
            subtitle={
              isMarksheetV2
                ? "Passport photo size for Result - 2"
                : "Upload photo, student sign & control dimensions"
            }
            icon={<User className="h-4 w-4" />}
            isOpen={openSections.student}
            onToggle={() => toggleSection("student")}
            accent="blue"
          >
            {/* Student Photo Upload + Width & Height Controls */}
            <ImageUploaderWithSizer
              category="student-photo"
              label="Student Passport Photo"
              description="Candidate portrait picture. Adjust width, height or pick a passport preset."
              currentValue={activeData.photoUrl}
              defaultPreview="/cert/sample-student-photo.png"
              onUpload={(val) => onFieldChange("photoUrl", val)}
              onResetAsset={() => onFieldChange("photoUrl", undefined)}
              sizeControl={{
                label: "Photo Width",
                value: currentPhotoW,
                defaultValue: defaultPhotoW,
                min: isMarksheetV2 ? 60 : 50,
                max: isMarksheetV2 ? 200 : 180,
                step: 2,
                quickPresets: isMarksheetV2
                  ? [
                      { label: "Compact (90px)", value: 90 },
                      { label: "Default (108px)", value: 108 },
                      { label: "Large (140px)", value: 140 },
                      { label: "XL (170px)", value: 170 },
                    ]
                  : isMarksheet
                  ? [
                      { label: "Compact (95px)", value: 95 },
                      { label: "Standard (120px)", value: 120 },
                      { label: "Default (138px)", value: defaultPhotoW },
                      { label: "Large (155px)", value: 155 },
                    ]
                  : [
                      { label: "Passport (72px)", value: 72 },
                      { label: "Standard (95px)", value: 95 },
                      { label: "Large (115px)", value: 115 },
                    ],
                onChange: (val) => onFieldChange("photoWidth", val),
                onReset: () => onFieldChange("photoWidth", undefined),
              }}
              secondarySizeControl={{
                label: "Photo Height",
                value: currentPhotoH,
                defaultValue: defaultPhotoH,
                min: isMarksheetV2 ? 70 : 60,
                max: isMarksheetV2 ? 240 : 200,
                step: 2,
                quickPresets: isMarksheetV2
                  ? [
                      { label: "Compact (110px)", value: 110 },
                      { label: "Default (132px)", value: 132 },
                      { label: "Large (165px)", value: 165 },
                      { label: "XL (200px)", value: 200 },
                    ]
                  : isMarksheet
                  ? [
                      { label: "Compact (115px)", value: 115 },
                      { label: "Standard (135px)", value: 135 },
                      { label: "Default (152px)", value: defaultPhotoH },
                      { label: "Large (170px)", value: 170 },
                    ]
                  : [
                      { label: "Passport (86px)", value: 86 },
                      { label: "Standard (115px)", value: 115 },
                      { label: "Tall (140px)", value: 140 },
                    ],
                onChange: (val) => onFieldChange("photoHeight", val),
                onReset: () => onFieldChange("photoHeight", undefined),
              }}
            />

            {/* Student Signature — certificates + Result (V1) only */}
            {!isMarksheetV2 && (
              <ImageUploaderWithSizer
                category="student-sig"
                label="Student Signature"
                description="Candidate signature line underneath the photograph."
                currentValue={activeData.studentSignatureUrl}
                defaultPreview="/cert/sample-student-sig.png"
                onUpload={(val) => onFieldChange("studentSignatureUrl", val)}
                onResetAsset={() => onFieldChange("studentSignatureUrl", undefined)}
                sizeControl={{
                  label: "Signature Height",
                  value: currentStudentSigH,
                  defaultValue: defaultStudentSigH,
                  min: 18,
                  max: 60,
                  step: 2,
                  quickPresets: [
                    { label: "Compact", value: 22 },
                    { label: "Default", value: defaultStudentSigH },
                    { label: "Prominent", value: 38 },
                  ],
                  onChange: (val) => onFieldChange("studentSigHeight", val),
                  onReset: () => onFieldChange("studentSigHeight", undefined),
                }}
              />
            )}
          </DropdownSection>
        )}

        {/* ================= SECTION 6: SIGNATURES, STAMPS & BADGES ================= */}
        {shouldShowSection("signatures", ["director", "stamp", "seal", "medal", "qr", "signatory", "signature"]) && (
          <DropdownSection
            id="signatures"
            title="6. Stamps, Signatures & Verification"
            subtitle={
              isMarksheetV2
                ? "Upload Director stamp + signature (Result Form 2 footer). Resize live."
                : "Council stamp, Director signature, medals & QR size"
            }
            icon={<Award className="h-4 w-4" />}
            isOpen={openSections.signatures}
            onToggle={() => toggleSection("signatures")}
            accent="emerald"
          >
            {/* Official Stamp / Seal */}
            <ImageUploaderWithSizer
              category="stamp"
              label={isMarksheetV2 ? "Director Stamp (Upload)" : "Council Blue Stamp"}
              description={
                isMarksheetV2
                  ? "Circular stamp over Director Signature line (bottom-right). Upload PNG."
                  : "Circular verification seal overlaid above director signature."
              }
              currentValue={activeData.stampUrl}
              defaultPreview="/cert/stamp-blue.png"
              onUpload={(val) => onFieldChange("stampUrl", val)}
              onResetAsset={() => onFieldChange("stampUrl", undefined)}
              sizeControl={{
                label: isMarksheetV2 ? "Stamp Size" : "Stamp Diameter",
                value: currentStampSize,
                defaultValue: defaultStampSize,
                min: isMarksheetV2 ? 50 : 45,
                max: isMarksheetV2 ? 180 : 130,
                step: 2,
                quickPresets: isMarksheetV2
                  ? [
                      { label: "Small", value: 70 },
                      { label: "Standard", value: 90 },
                      { label: "Large", value: 120 },
                      { label: "XL", value: 150 },
                    ]
                  : [
                      { label: "Compact", value: 60 },
                      { label: "Standard", value: defaultStampSize },
                      { label: "Large", value: 100 },
                    ],
                onChange: (val) => onFieldChange("stampSize", val),
                onReset: () => onFieldChange("stampSize", undefined),
              }}
            />

            {/* Director Signature */}
            <ImageUploaderWithSizer
              category="director-sig"
              label={isMarksheetV2 ? "Director Signature (Upload)" : "Director Official Signature"}
              description={
                isMarksheetV2
                  ? "Handwritten signature overlaid on the stamp (bottom-right). Upload PNG."
                  : "Official signature image of the director."
              }
              currentValue={activeData.directorSignatureUrl}
              defaultPreview="/cert/sig-director.png"
              onUpload={(val) => onFieldChange("directorSignatureUrl", val)}
              onResetAsset={() => onFieldChange("directorSignatureUrl", undefined)}
              sizeControl={{
                label: "Director Signature Height",
                value: currentDirectorSigH,
                defaultValue: defaultDirectorSigH,
                min: 25,
                max: 85,
                step: 2,
                quickPresets: [
                  { label: "Compact", value: 34 },
                  { label: "Standard", value: defaultDirectorSigH },
                  { label: "Large", value: 62 },
                ],
                onChange: (val) => onFieldChange("directorSigHeight", val),
                onReset: () => onFieldChange("directorSigHeight", undefined),
              }}
            />

            {/* Director Designation Title */}
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-2.5">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Signatory Title Text
              </label>
              <input
                type="text"
                value={activeData.directorTitle || (isMarksheet ? "Director Signature" : "Director")}
                onChange={(e) => onFieldChange("directorTitle", e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A]"
              />
            </div>

            {/* Gold Medal Seal (for certificate) */}
            {!isMarksheet && (
              <ImageUploaderWithSizer
                category="gold-medal"
                label="Gold Medal Ribbon Badge"
                description="Center laurel gold medal seal with hanging ribbons."
                currentValue={activeData.goldMedalUrl}
                defaultPreview="/cert/seal-gold-medal.png"
                onUpload={(val) => onFieldChange("goldMedalUrl", val)}
                onResetAsset={() => onFieldChange("goldMedalUrl", undefined)}
                sizeControl={{
                  label: "Gold Medal Height",
                  value: currentGoldMedalSize,
                  defaultValue: defaultGoldMedalSize,
                  min: 75,
                  max: 180,
                  step: 5,
                  quickPresets: [
                    { label: "Compact", value: 95 },
                    { label: "Standard", value: defaultGoldMedalSize },
                    { label: "Prominent", value: 155 },
                  ],
                  onChange: (val) => onFieldChange("goldMedalSize", val),
                  onReset: () => onFieldChange("goldMedalSize", undefined),
                }}
              />
            )}

            {/* Verification QR Code Size Slider */}
            <SizeSliderControl
              label={
                isMarksheetV2
                  ? "Verification QR + Barcode Size"
                  : "Verification QR Code Size"
              }
              value={currentQrSize}
              defaultValue={defaultQrSize}
              min={isMarksheetV2 ? 40 : 35}
              max={isMarksheetV2 ? 140 : 110}
              step={2}
              quickPresets={
                isMarksheetV2
                  ? [
                      { label: "Compact", value: 56 },
                      { label: "Standard", value: 72 },
                      { label: "Large", value: 96 },
                      { label: "XL", value: 120 },
                    ]
                  : [
                      { label: "Compact", value: 48 },
                      { label: "Standard", value: defaultQrSize },
                      { label: "Large", value: 85 },
                    ]
              }
              onChange={(val) => onFieldChange("qrCodeSize", val)}
              onReset={() => onFieldChange("qrCodeSize", undefined)}
              colorTheme="emerald"
            />

            {/* Hologram — manual sticker only (no upload) — Result Form 2 */}
            {isMarksheetV2 && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 space-y-2.5">
                <div>
                  <span className="text-[11px] font-bold text-amber-200 flex items-center gap-1.5">
                    <Stamp className="h-3.5 w-3.5" />
                    Security Hologram (manual 23 × 23 mm)
                  </span>
                  <p className="mt-0.5 text-[9.5px] text-slate-400 leading-snug">
                    Upload nahi — print ke baad physical hologram sticker yahan paste karo.
                    Box sirf placement guide hai (fixed 23×23 mm).
                  </p>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeData.showHologramGuide !== false}
                    onChange={(e) =>
                      onFieldChange("showHologramGuide", e.target.checked)
                    }
                    className="rounded border-white/30"
                  />
                  Show hologram placement box on marksheet
                </label>
                <div className="flex items-center justify-center rounded-lg border border-dashed border-amber-400/40 bg-white/95 p-3">
                  <div
                    className="flex flex-col items-center justify-center border border-dashed border-slate-400 bg-slate-50 text-center"
                    style={{ width: "23mm", height: "23mm", boxSizing: "border-box" }}
                  >
                    <span className="px-1 text-[8px] font-black uppercase text-slate-500 leading-tight">
                      Hologram
                    </span>
                    <span className="mt-0.5 text-[7px] font-bold text-slate-500">
                      23×23 mm
                    </span>
                    <span className="mt-0.5 text-[6px] font-semibold text-slate-400">
                      Manual sticker
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Live Vector QR Preview — auto from enrollment */}
            <div className="rounded-xl border border-white/10 bg-[#06101E] p-3 shadow-inner space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Dynamic QR (auto-generate)</span>
                </span>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-mono text-emerald-300 border border-emerald-500/30">
                  From enrollment
                </span>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-snug">
                Enrollment / marksheet number badalte hi QR naya generate hota hai — fixed image nahi.
              </p>
              <div className="flex items-center justify-center p-3 bg-white/95 rounded-lg border border-slate-300 shadow-sm">
                <CertificateQRCode
                  key={`preview-qr-${activeData.registrationNumber}-${activeData.certificateNumber}-${currentQrSize}`}
                  docType={isMarksheet ? "marksheet" : "certificate"}
                  enrollmentNo={activeData.registrationNumber || "4739846"}
                  certificateNo={activeData.certificateNumber || activeData.serialNumber}
                  studentName={activeData.studentName}
                  verificationWebsite={activeData.verificationWebsite || "www.iveskillcouncil.edu.in"}
                  size={Math.min(currentQrSize, 85)}
                  color="#0E2A54"
                  mode="card"
                  captionLine1="Scan QR to Verify"
                  captionLine2={isMarksheet ? "This Marksheet" : `Enr: ${activeData.registrationNumber || "4739846"}`}
                />
              </div>
              <div className="text-[9.5px] text-slate-400 leading-tight space-y-0.5">
                <p>
                  <strong className="text-slate-300">Target URL:</strong>{" "}
                  <span className="font-mono text-sky-400 break-all">
                    https://{activeData.verificationWebsite || "www.iveskillcouncil.edu.in"}/verify?type={isMarksheet ? "marksheet" : "certificate"}&amp;enr={activeData.registrationNumber || "4739846"}
                  </span>
                </p>
                <p className="text-[9px] text-slate-500">
                  Rendered using mathematical vector SVG with official 2-module quiet zone margin and clean outer padding. Guaranteed 100% sharp and instantly scannable by phone cameras.
                </p>
              </div>
            </div>
          </DropdownSection>
        )}

        {/* ================= SECTION 7: BORDER & CUSTOM FRAME ================= */}
        {shouldShowSection("border", ["border", "frame", "guilloche", "ornate", "custom border", "design", "floral"]) && (
          <DropdownSection
            id="border"
            title="7. Official Border & Custom Frame"
            subtitle="Floral, Design.svg, or upload your own A4 frame"
            icon={<Layers className="h-4 w-4" />}
            isOpen={openSections.border}
            onToggle={() => toggleSection("border")}
          >
            {/* Border Selector */}
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-2.5">
              <label className="block text-[11px] font-bold text-[#C4A35A] mb-1.5 uppercase tracking-wide">
                Select Official Border
              </label>
              {isMarksheetV2 ? (
                (() => {
                  const borderUrl = activeData.customBorderUrl || "";
                  const isDesignBorder =
                    borderUrl.includes("Design.svg") ||
                    borderUrl.includes("DESIGN_BORDER");
                  const isFloralBorder =
                    !borderUrl ||
                    borderUrl.includes("ONLY_OUTSIDE_FLORAL_BORDER") ||
                    borderUrl.includes("certificate_border_last_image");
                  return (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onFieldChange("borderStyle", "guilloche");
                          onFieldChange(
                            "customBorderUrl",
                            "/border/ONLY_OUTSIDE_FLORAL_BORDER.svg"
                          );
                        }}
                        className={cn(
                          "rounded-lg overflow-hidden text-left transition border",
                          isFloralBorder && !isDesignBorder
                            ? "border-[#C4A35A] bg-[#C4A35A]/15 ring-1 ring-[#C4A35A]/50"
                            : "border-white/10 bg-white/5 hover:border-white/25"
                        )}
                      >
                        <div className="relative h-16 w-full bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/border/ONLY_OUTSIDE_FLORAL_BORDER.svg"
                            alt="Floral border"
                            className="absolute inset-0 h-full w-full object-contain p-0.5"
                            draggable={false}
                          />
                        </div>
                        <div
                          className={cn(
                            "px-1.5 py-1.5 text-[10px] font-bold text-center leading-tight",
                            isFloralBorder && !isDesignBorder
                              ? "text-[#F4CF74]"
                              : "text-slate-300"
                          )}
                        >
                          Outside Floral
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onFieldChange("borderStyle", "guilloche");
                          onFieldChange(
                            "customBorderUrl",
                            "/certificates/Design.svg"
                          );
                          // Design.svg has a thick lace — keep content clear of ornament
                          const curT = activeData.paddingTop ?? 0;
                          const curB = activeData.paddingBottom ?? 0;
                          const curL = activeData.paddingLeft ?? 0;
                          const curR = activeData.paddingRight ?? 0;
                          if (curT < 110) onFieldChange("paddingTop", 110);
                          if (curB < 116) onFieldChange("paddingBottom", 116);
                          if (curL < 110) onFieldChange("paddingLeft", 110);
                          if (curR < 110) onFieldChange("paddingRight", 110);
                        }}
                        className={cn(
                          "rounded-lg overflow-hidden text-left transition border",
                          isDesignBorder
                            ? "border-[#C4A35A] bg-[#C4A35A]/15 ring-1 ring-[#C4A35A]/50"
                            : "border-white/10 bg-white/5 hover:border-white/25"
                        )}
                      >
                        <div className="relative h-16 w-full bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/certificates/Design.svg"
                            alt="Design border"
                            className="absolute inset-0 h-full w-full object-contain p-0.5"
                            draggable={false}
                          />
                        </div>
                        <div
                          className={cn(
                            "px-1.5 py-1.5 text-[10px] font-bold text-center leading-tight",
                            isDesignBorder ? "text-[#F4CF74]" : "text-slate-300"
                          )}
                        >
                          Design Border
                        </div>
                      </button>
                    </div>
                  );
                })()
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onFieldChange("borderStyle", "guilloche");
                      onFieldChange("customBorderUrl", undefined);
                    }}
                    className={cn(
                      "rounded-lg p-2 text-[10.5px] font-bold transition border text-center",
                      (!activeData.borderStyle || activeData.borderStyle === "guilloche") && !activeData.customBorderUrl
                        ? "border-[#1E4A85] bg-[#1E4A85] text-white shadow-sm ring-1 ring-white/30"
                        : "border-white/10 bg-white/5 text-slate-300 hover:text-white"
                    )}
                  >
                    Security Blue (res.jpeg)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onFieldChange("borderStyle", "ornate");
                      onFieldChange("customBorderUrl", undefined);
                    }}
                    className={cn(
                      "rounded-lg p-2 text-[10.5px] font-bold transition border text-center",
                      activeData.borderStyle === "ornate" && !activeData.customBorderUrl
                        ? "border-[#C4A35A] bg-[#C4A35A] text-slate-950 shadow-sm ring-1 ring-white/30"
                        : "border-white/10 bg-white/5 text-slate-300 hover:text-white"
                    )}
                  >
                    Ornate Gold (cert.jpeg)
                  </button>
                </div>
              )}
              {isMarksheetV2 && (
                <p className="mt-1.5 text-[10px] text-slate-400 leading-snug">
                  Design Border uses <span className="font-mono text-slate-300">/certificates/Design.svg</span> (A4 frame). You can still upload a custom frame below.
                </p>
              )}
            </div>

            {/* Custom Border Image Upload */}
            <ImageUploaderWithSizer
              category="custom-border"
              label="Upload Custom Outer Border Frame"
              description="A4 portrait border with transparent or white interior (ratio ~1:1.41)."
              currentValue={activeData.customBorderUrl}
              defaultPreview={
                isMarksheetV2
                  ? activeData.customBorderUrl?.includes("Design.svg")
                    ? "/certificates/Design.svg"
                    : "/border/ONLY_OUTSIDE_FLORAL_BORDER.svg"
                  : "/cert/res-border-pristine.png"
              }
              onUpload={(val) => onFieldChange("customBorderUrl", val)}
              onResetAsset={() =>
                onFieldChange(
                  "customBorderUrl",
                  isMarksheetV2
                    ? "/border/ONLY_OUTSIDE_FLORAL_BORDER.svg"
                    : undefined
                )
              }
            />
          </DropdownSection>
        )}

        {/* ================= SECTION 8: CANDIDATE PARTICULARS ================= */}
        {shouldShowSection("candidate", ["name", "father", "mother", "course", "roll", "enrollment", "serial", "barcode"]) && (
          <DropdownSection
            id="candidate"
            title="8. Candidate & Course Particulars"
            subtitle="Student name, parents, course title, numbers & dates"
            icon={<FileText className="h-4 w-4" />}
            isOpen={openSections.candidate}
            onToggle={() => toggleSection("candidate")}
            accent="blue"
          >
            {/* Particulars Font Size Slider (Marksheet) */}
            {isMarksheet && (
              <SizeSliderControl
                label="Candidate Text Font Size"
                value={currentCandidateFont}
                defaultValue={defaultCandidateFont}
                min={11}
                max={22}
                step={0.5}
                unit="px"
                quickPresets={[
                  { label: "Compact (12px)", value: 12 },
                  { label: "Default (13px)", value: 13 },
                  { label: "Medium (15px)", value: 15 },
                  { label: "Large (17px)", value: 17 },
                  { label: "Hero (19px)", value: 19 },
                ]}
                onChange={(val) => onFieldChange("candidateFontSize", val)}
                onReset={() => onFieldChange("candidateFontSize", undefined)}
                colorTheme="blue"
              />
            )}

            {/* Student Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Candidate / Student Full Name
              </label>
              <input
                type="text"
                value={activeData.studentName}
                onChange={(e) => onFieldChange("studentName", e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A]"
              />
            </div>

            {/* Father & Mother Name */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Father's Name
                </label>
                <input
                  type="text"
                  value={activeData.fatherName || ""}
                  onChange={(e) => {
                    onFieldChange("fatherName", e.target.value);
                    onFieldChange("parentName", `${e.target.value} and ${activeData.motherName || ""}`);
                  }}
                  className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Mother's Name
                </label>
                <input
                  type="text"
                  value={activeData.motherName || ""}
                  onChange={(e) => {
                    onFieldChange("motherName", e.target.value);
                    onFieldChange("parentName", `${activeData.fatherName || ""} and ${e.target.value}`);
                  }}
                  className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A]"
                />
              </div>
            </div>

            {/* Course Title */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Course / Program Title
              </label>
              <input
                type="text"
                value={activeData.courseName}
                onChange={(e) => onFieldChange("courseName", e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A]"
              />
            </div>

            {/* Training Duration & Session */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  value={activeData.duration || "1 Year"}
                  onChange={(e) => onFieldChange("duration", e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Issue Date
                </label>
                <input
                  type="text"
                  value={activeData.issueDate}
                  onChange={(e) => onFieldChange("issueDate", e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A]"
                />
              </div>
            </div>

            {/* Numbers: Sr No, Certificate/Marksheet No, Registration No */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-300 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={activeData.serialNumber}
                  onChange={(e) => onFieldChange("serialNumber", e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2 py-1.5 text-[11px] text-white outline-none focus:border-[#C4A35A]"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-300 mb-1">
                  Document No.
                </label>
                <input
                  type="text"
                  value={activeData.certificateNumber}
                  onChange={(e) => onFieldChange("certificateNumber", e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2 py-1.5 text-[11px] text-white outline-none focus:border-[#C4A35A]"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-300 mb-1">
                  Enrollment No.
                </label>
                <input
                  type="text"
                  value={activeData.registrationNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    onFieldChange("registrationNumber", val);
                    onFieldChange("barcodeNumber", val);
                    const autoWords = convertNumberToDigitWords(val);
                    onFieldChange("barcodeTextWords", autoWords);
                  }}
                  className="w-full rounded-lg border border-amber-400/30 bg-slate-950/80 px-2 py-1.5 text-[11px] font-mono text-amber-300 outline-none focus:border-[#C4A35A]"
                />
              </div>
            </div>

            {/* Live Interactive Enrollment Barcode & Dynamic Words Card */}
            <div className="rounded-xl border border-white/10 bg-[#06101E] p-3 shadow-inner space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <BarcodeIcon className="h-3.5 w-3.5 text-amber-400" />
                  <span>Dynamic Barcode &amp; Digit Words</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const val = activeData.registrationNumber || activeData.barcodeNumber || "4739846";
                    const autoWords = convertNumberToDigitWords(val);
                    onFieldChange("barcodeNumber", val);
                    onFieldChange("barcodeTextWords", autoWords);
                  }}
                  className="flex items-center gap-1 rounded bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 text-[9.5px] font-bold text-amber-300 border border-amber-500/30 transition"
                  title="Auto-generate words from enrollment number"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  <span>Re-Sync Words</span>
                </button>
              </div>

              {/* White Background Barcode Representation Card */}
              <div className="rounded-lg bg-white p-3 border border-slate-300 shadow-sm flex flex-col items-center justify-center">
                <EnrollmentBarcode
                  enrollmentNo={activeData.registrationNumber || activeData.barcodeNumber || "4739846"}
                  words={activeData.barcodeTextWords}
                  color="#000000"
                  showLabel={true}
                  showWords={true}
                  barcodeHeight={42}
                />
              </div>

              {/* Manual Digits & Custom Words Overrides (Collapsible or compact) */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    Barcode Digits (Sync)
                  </label>
                  <input
                    type="text"
                    value={activeData.barcodeNumber || activeData.registrationNumber || "4739846"}
                    onChange={(e) => {
                      const val = e.target.value;
                      onFieldChange("barcodeNumber", val);
                      onFieldChange("barcodeTextWords", convertNumberToDigitWords(val));
                    }}
                    className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2 py-1.5 text-xs font-mono text-white outline-none focus:border-[#C4A35A]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                    Words Override (Optional)
                  </label>
                  <input
                    type="text"
                    value={activeData.barcodeTextWords || ""}
                    onChange={(e) => onFieldChange("barcodeTextWords", e.target.value)}
                    placeholder="FOUR SEVEN THREE..."
                    className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A]"
                  />
                </div>
              </div>
              <p className="text-[9.5px] text-slate-400 leading-tight">
                Whatever number is dynamic or entered in Enrollment No. will automatically render the authentic barcode and spelled-out words in real time.
              </p>
            </div>

            {/* Place of Issue & Result Status */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-300 mb-1">
                  Place of Issue
                </label>
                <input
                  type="text"
                  value={activeData.place || "Gandhinagar, Gujarat"}
                  onChange={(e) => onFieldChange("place", e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A]"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-300 mb-1">
                  Result Status
                </label>
                <input
                  type="text"
                  value={activeData.status || "PASS"}
                  onChange={(e) => onFieldChange("status", e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A]"
                />
              </div>
            </div>
          </DropdownSection>
        )}

        {/* ================= SECTION 9: MARKS TABLE (MARKSHEET ONLY) ================= */}
        {isMarksheet && shouldShowSection("marks", ["marks", "subject", "percentage", "grade", "score"]) && (
          <DropdownSection
            id="marks"
            title="9. Subjects & Marks Table"
            subtitle={`${activeData.subjects?.length || 0} subjects • ${activeData.marksPercent}% overall`}
            icon={<FileText className="h-4 w-4" />}
            isOpen={openSections.marks}
            onToggle={() => toggleSection("marks")}
            badge={`${activeData.marksPercent}%`}
            accent="emerald"
          >
            {/* Overall Percentage and Grade Display Banner */}
            <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Overall Result:
                </span>
                <p className="text-sm font-extrabold text-emerald-400">
                  {activeData.status || "PASS"} • {activeData.marksPercent}% (Grade {activeData.grade})
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSubject}
                className="flex items-center gap-1 rounded-lg bg-[#C4A35A] px-2.5 py-1.5 text-[10.5px] font-bold text-slate-950 hover:bg-[#d8b566] transition shadow-sm"
              >
                <Plus className="h-3 w-3" />
                <span>Add Subject</span>
              </button>
            </div>

            {/* Table Font Size Slider */}
            <SizeSliderControl
              label="Table Font Size (Codes, Names & Scores)"
              value={currentTableFont}
              defaultValue={defaultTableFont}
              min={10}
              max={20}
              step={0.5}
              unit="px"
              quickPresets={[
                { label: "Compact (11px)", value: 11 },
                { label: "Default (12px)", value: 12 },
                { label: "Medium (14px)", value: 14 },
                { label: "Large (16px)", value: 16 },
                { label: "Bold (18px)", value: 18 },
              ]}
              onChange={(val) => onFieldChange("tableFontSize", val)}
              onReset={() => onFieldChange("tableFontSize", undefined)}
              colorTheme="emerald"
            />

            {/* Subject Rows List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(activeData.subjects || []).map((sub, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/10 bg-black/30 p-2.5 space-y-1.5 hover:border-white/20 transition"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] font-bold text-[#C4A35A] shrink-0">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={sub.code || `SUB-0${idx + 1}`}
                      onChange={(e) => handleSubjectChange(idx, "code", e.target.value)}
                      placeholder="Code"
                      title="Subject Code (e.g. SUB-01)"
                      className="w-20 shrink-0 rounded-md border border-white/10 bg-slate-950/80 px-2 py-1 text-[11px] font-mono text-amber-300 outline-none focus:border-[#C4A35A]"
                    />
                    <input
                      type="text"
                      value={sub.name}
                      onChange={(e) => handleSubjectChange(idx, "name", e.target.value)}
                      placeholder="Subject Name"
                      className="flex-1 rounded-md border border-white/10 bg-slate-950/80 px-2 py-1 text-[11px] text-white outline-none focus:border-[#C4A35A]"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(idx)}
                      disabled={(activeData.subjects?.length || 0) <= 1}
                      className="rounded p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30 transition"
                      title="Remove Subject"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div>
                      <label className="text-slate-400 text-[9.5px]">Max Marks</label>
                      <input
                        type="number"
                        value={sub.totalMax}
                        onChange={(e) => handleSubjectChange(idx, "totalMax", Number(e.target.value))}
                        className="w-full rounded border border-white/10 bg-slate-950/80 px-1.5 py-0.5 text-center text-[10.5px] text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[9.5px]">Obtained</label>
                      <input
                        type="number"
                        value={sub.totalObtained}
                        onChange={(e) => handleSubjectChange(idx, "totalObtained", Number(e.target.value))}
                        className="w-full rounded border border-white/10 bg-slate-950/80 px-1.5 py-0.5 text-center text-[10.5px] text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 text-[9.5px]">Percentage</label>
                      <div className="rounded border border-emerald-500/30 bg-emerald-500/10 py-0.5 text-center font-bold text-[10px] text-emerald-300">
                        {sub.grade || `${Math.round((sub.totalObtained / sub.totalMax) * 100)}%`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grade System Box Configuration (A+, A, B, C, D) */}
            <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#C4A35A]" />
                    <span>Grade System Box (Legend Criteria)</span>
                  </span>
                  <p className="text-[9.5px] text-slate-400">
                    Official 5-tier grading criteria displayed on the bottom-left of the marksheet
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onFieldChange("gradeSystem", defaultGradeSystem)}
                  className="text-[10px] text-slate-400 hover:text-white underline"
                  title="Reset to default official criteria"
                >
                  Reset Defaults
                </button>
              </div>

              <SizeSliderControl
                label="Grade System Font Size"
                value={activeData.gradeSystemFontSize || 9.5}
                defaultValue={9.5}
                min={7}
                max={16}
                step={0.5}
                unit="px"
                colorTheme="gold"
                quickPresets={[
                  { label: "Small", value: 8 },
                  { label: "Standard", value: 9.5 },
                  { label: "Large", value: 12 },
                  { label: "XL", value: 14 },
                ]}
                onChange={(val) => onFieldChange("gradeSystemFontSize", val)}
                onReset={() => onFieldChange("gradeSystemFontSize", undefined)}
              />
              <SizeSliderControl
                label="RESULT Box Font Size"
                value={activeData.resultFontSize || 13}
                defaultValue={13}
                min={10}
                max={20}
                step={0.5}
                unit="px"
                colorTheme="emerald"
                quickPresets={[
                  { label: "Small", value: 11 },
                  { label: "Standard", value: 13 },
                  { label: "Large", value: 16 },
                  { label: "XL", value: 18 },
                ]}
                onChange={(val) => onFieldChange("resultFontSize", val)}
                onReset={() => onFieldChange("resultFontSize", undefined)}
              />

              <div className="space-y-1.5">
                {(activeData.gradeSystem || defaultGradeSystem).map((item, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[48px_1fr_1fr] items-center gap-2 rounded-lg border border-white/5 bg-white/5 px-2.5 py-1.5"
                  >
                    <div>
                      <input
                        type="text"
                        value={item.grade}
                        onChange={(e) => handleGradeSystemChange(idx, "grade", e.target.value)}
                        className="w-full rounded border border-white/15 bg-slate-950/90 px-1.5 py-1 text-center text-xs font-black text-amber-300 outline-none focus:border-[#C4A35A]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => handleGradeSystemChange(idx, "label", e.target.value)}
                        placeholder="Label (e.g. Excellent)"
                        className="w-full rounded border border-white/15 bg-slate-950/90 px-2 py-1 text-[11px] font-medium text-white outline-none focus:border-[#C4A35A]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={item.range}
                        onChange={(e) => handleGradeSystemChange(idx, "range", e.target.value)}
                        placeholder="Range (e.g. 85% & Above)"
                        className="w-full rounded border border-white/15 bg-slate-950/90 px-2 py-1 text-[11px] font-medium text-white outline-none focus:border-[#C4A35A]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DropdownSection>
        )}

        {/* ================= SECTION 10: CENTER (ATC) & LEGAL DETAILS ================= */}
        {shouldShowSection("center", ["atc", "center", "franchise", "office", "website", "legal", "order"]) && (
          <DropdownSection
            id="center"
            title="10. Training Center & Legal Info"
            subtitle="ATC name, address, office location & verification portal"
            icon={<Building2 className="h-4 w-4" />}
            isOpen={openSections.center}
            onToggle={() => toggleSection("center")}
          >
            {/* Font sizes for ATC / legal / office block */}
            <SizeSliderControl
              label="ATC Details Font Size"
              value={activeData.atcFontSize || (isMarksheetV2 ? 9 : 10)}
              defaultValue={isMarksheetV2 ? 9 : 10}
              min={7}
              max={16}
              step={0.5}
              unit="px"
              colorTheme="blue"
              quickPresets={[
                { label: "Small", value: 8 },
                { label: "Standard", value: isMarksheetV2 ? 9 : 10 },
                { label: "Large", value: 12 },
                { label: "XL", value: 14 },
              ]}
              onChange={(val) => onFieldChange("atcFontSize", val)}
              onReset={() => onFieldChange("atcFontSize", undefined)}
            />
            <SizeSliderControl
              label="Govt / Legal Text Font Size"
              value={activeData.govOrderFontSize || 8}
              defaultValue={8}
              min={6}
              max={14}
              step={0.5}
              unit="px"
              colorTheme="blue"
              quickPresets={[
                { label: "Small", value: 7 },
                { label: "Standard", value: 8 },
                { label: "Large", value: 10 },
                { label: "XL", value: 12 },
              ]}
              onChange={(val) => onFieldChange("govOrderFontSize", val)}
              onReset={() => onFieldChange("govOrderFontSize", undefined)}
            />
            <SizeSliderControl
              label="Registered Office Font Size"
              value={activeData.registeredOfficeFontSize || 7.5}
              defaultValue={7.5}
              min={6}
              max={13}
              step={0.5}
              unit="px"
              colorTheme="blue"
              quickPresets={[
                { label: "Small", value: 7 },
                { label: "Standard", value: 7.5 },
                { label: "Large", value: 9 },
                { label: "XL", value: 11 },
              ]}
              onChange={(val) => onFieldChange("registeredOfficeFontSize", val)}
              onReset={() => onFieldChange("registeredOfficeFontSize", undefined)}
            />
            <SizeSliderControl
              label="Signature Label Font Size"
              value={activeData.signLabelFontSize || 10.5}
              defaultValue={10.5}
              min={8}
              max={16}
              step={0.5}
              unit="px"
              colorTheme="emerald"
              quickPresets={[
                { label: "Small", value: 9 },
                { label: "Standard", value: 10.5 },
                { label: "Large", value: 12 },
                { label: "XL", value: 14 },
              ]}
              onChange={(val) => onFieldChange("signLabelFontSize", val)}
              onReset={() => onFieldChange("signLabelFontSize", undefined)}
            />

            {/* ATC Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Authorized Training Centre (ATC) Name
              </label>
              <input
                type="text"
                value={activeData.atcName}
                onChange={(e) => {
                  onFieldChange("atcName", e.target.value);
                  onFieldChange("trainingCentreName", e.target.value);
                }}
                className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A]"
              />
            </div>

            {/* ATC Code */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                ATC Center Code
              </label>
              <input
                type="text"
                value={activeData.atcCode}
                onChange={(e) => onFieldChange("atcCode", e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A]"
              />
            </div>

            {/* ATC Address */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                ATC Physical Address
              </label>
              <textarea
                rows={2}
                value={activeData.franchiseAddress}
                onChange={(e) => onFieldChange("franchiseAddress", e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A] resize-none"
              />
            </div>

            {/* Registered Office */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Council Registered Office Address
              </label>
              <textarea
                rows={2}
                value={activeData.registeredOffice || ""}
                onChange={(e) => onFieldChange("registeredOffice", e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A] resize-none"
              />
            </div>

            {/* Verification Website & Email */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-300 mb-1">
                  Verification Website
                </label>
                <input
                  type="text"
                  value={activeData.verificationWebsite || "www.iveskillcouncil.edu.in"}
                  onChange={(e) => onFieldChange("verificationWebsite", e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A]"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-300 mb-1">
                  Verification Email
                </label>
                <input
                  type="text"
                  value={activeData.verificationEmail || "official.iveskillcouncil@gmail.com"}
                  onChange={(e) => onFieldChange("verificationEmail", e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2 py-1.5 text-xs text-white outline-none focus:border-[#C4A35A]"
                />
              </div>
            </div>

            {/* Govt Order / Legal Gazette Text */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Govt. Order / Legal Accreditation Text
              </label>
              <textarea
                rows={3}
                value={activeData.govOrderText || ""}
                onChange={(e) => onFieldChange("govOrderText", e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-slate-950/80 px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#C4A35A] resize-none"
              />
            </div>
          </DropdownSection>
        )}
      </div>

      {/* Sticky Bottom Save / Status Bar */}
      <div className="shrink-0 border-t border-white/10 bg-[#06101E] px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center gap-1.5 text-[10.5px]">
          {isSaving ? (
            <span className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving to server...</span>
            </span>
          ) : lastSavedAt ? (
            <span className="flex items-center gap-1 text-emerald-400 font-semibold" title={`Last saved: ${lastSavedAt}`}>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span>Saved to server ✓</span>
            </span>
          ) : (
            <span className="text-slate-400 text-[10.5px]">All changes auto-save</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
              setTimeout(() => window.print(), 60);
            }}
            className="flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-500/15 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-500/25 transition"
            title="Print directly to standard A4 paper (Zero margins, 100% full fit)"
          >
            <Printer className="h-3 w-3 text-amber-300" />
            <span>Print A4</span>
          </button>
          <button
            type="button"
            onClick={onResetData}
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
            title={`Reset only "${currentTypeConfig.title}" to factory defaults`}
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
          {onSave && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onSave()}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#D9A74A] to-[#B88728] px-3.5 py-1.5 text-[11px] font-black text-slate-950 shadow-md hover:brightness-110 active:scale-95 transition disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>Save Changes</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
