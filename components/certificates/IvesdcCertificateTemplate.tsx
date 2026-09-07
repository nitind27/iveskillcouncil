"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import QRCode from "qrcode";
import type { CertificateDisplayData } from "@/lib/certificate-display";
import {
  CERT_IMAGE,
  CERT_STATIC,
  buildAchievementText,
  buildCertificateQrPayload,
} from "./certificate-layout";

export type CertificateFieldKey = keyof Omit<
  CertificateDisplayData,
  "id" | "status" | "isDraft" | "displayOverrides" | "gradeLabel"
>;

interface Props {
  data: CertificateDisplayData;
  className?: string;
  editable?: boolean;
  printId?: string;
  onFieldChange?: (field: CertificateFieldKey, value: string | number | null) => void;
}

const sans: CSSProperties = { fontFamily: "Arial, Helvetica, sans-serif" };
const serif: CSSProperties = { fontFamily: "Georgia, 'Times New Roman', Times, serif" };

function FieldLine({
  label,
  value,
  field,
  editable,
  onFieldChange,
  className = "",
}: {
  label: string;
  value: string;
  field?: CertificateFieldKey;
  editable?: boolean;
  onFieldChange?: Props["onFieldChange"];
  className?: string;
}) {
  return (
    <div className={`flex w-full min-w-0 items-end gap-1 ${className}`}>
      <span className="shrink-0 pb-0.5 text-[10px] font-bold text-[#1a2b4a]" style={sans}>
        {label}
      </span>
      {editable && field && onFieldChange ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onFieldChange(field, e.target.value)}
          className="min-w-0 flex-1 border-0 border-b border-[#1a2b4a] bg-transparent pb-0.5 text-[10.5px] font-semibold text-[#0f1f3d] outline-none"
          style={sans}
        />
      ) : (
        <span
          className="min-w-0 flex-1 border-b border-[#1a2b4a] pb-0.5 text-[10.5px] font-semibold text-[#0f1f3d]"
          style={sans}
        >
          {value || "\u00A0"}
        </span>
      )}
    </div>
  );
}

function InlineValue({
  value,
  field,
  editable,
  onFieldChange,
  width = 78,
}: {
  value: string;
  field?: CertificateFieldKey;
  editable?: boolean;
  onFieldChange?: Props["onFieldChange"];
  width?: number;
}) {
  if (editable && field && onFieldChange) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onFieldChange(field, e.target.value)}
        className="border-0 border-b border-[#1a2b4a] bg-transparent text-center text-[10.5px] font-semibold outline-none"
        style={{ ...sans, width }}
      />
    );
  }
  return (
    <span
      className="inline-block border-b border-[#1a2b4a] px-1 pb-0.5 text-center text-[10.5px] font-semibold"
      style={{ ...sans, minWidth: width }}
    >
      {value || "\u00A0"}
    </span>
  );
}

function CapIcon() {
  return (
    <svg width="20" height="16" viewBox="0 0 22 18" aria-hidden className="shrink-0">
      <path d="M11 1 L21 6 L11 11 L1 6 Z" fill="#1a2b4a" />
      <path
        d="M4 7.5 V12.5 C4 14.5 11 16 11 16 C11 16 18 14.5 18 12.5 V7.5"
        fill="none"
        stroke="#8B6914"
        strokeWidth="1.2"
      />
      <rect x="9.5" y="0.2" width="3" height="2.2" rx="0.3" fill="#1a2b4a" />
      <circle cx="19.5" cy="6.2" r="1.1" fill="#C41E3A" />
    </svg>
  );
}

function Section({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

export default function IvesdcCertificateTemplate({
  data,
  className = "",
  editable = false,
  printId = "ivesdc-certificate",
  onFieldChange,
}: Props) {
  const { width: W, height: H, src, logoSrc } = CERT_IMAGE;
  const achievement = buildAchievementText(data.courseName, data.grade, data.marksPercent);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(buildCertificateQrPayload(data), {
      width: 160,
      margin: 1,
      color: { dark: "#0F2A4A", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [
    data.certificateNumber,
    data.studentName,
    data.courseName,
    data.grade,
    data.marksPercent,
    data.issueDate,
    data.atcName,
  ]);

  return (
    <div
      id={printId}
      className={`certificate-sheet relative mx-auto overflow-hidden bg-white shadow-xl ${className}`}
      style={{ width: W, height: H }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={W}
        height={H}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill"
        draggable={false}
      />

      <div
        className="absolute z-[1] box-border overflow-hidden"
        style={{
          top: 48,
          left: 48,
          right: 48,
          bottom: 40,
          ...serif,
          color: "#0f1f3d",
        }}
      >
        <div className="flex h-full flex-col">
          {/* ===== HEADER ===== */}
          <Section className="shrink-0 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt="IVESDC"
              className="mx-auto h-[44px] w-auto object-contain"
              draggable={false}
            />
            <h1
              className="mt-1 text-[12px] font-black leading-[1.15] tracking-[0.02em] text-[#1E4A85]"
              style={sans}
            >
              {CERT_STATIC.orgName}
            </h1>
            <div className="mx-auto mt-1 max-w-[96%] space-y-px text-[7px] leading-[1.25] text-[#1a2b4a]" style={sans}>
              {CERT_STATIC.accreditation.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </Section>

          {/* ===== TITLE ===== */}
          <Section className="mt-2.5 mb-2 flex shrink-0 items-center justify-center gap-2.5">
            <CapIcon />
            <h2 className="text-[24px] font-black tracking-[0.12em] text-black">CERTIFICATE</h2>
            <CapIcon />
          </Section>

          {/* ===== FORM FIELDS ===== */}
          <Section className="shrink-0 space-y-[7px]">
            <div className="flex gap-6">
              <FieldLine
                label="Sr. No.:"
                value={data.serialNumber}
                field="serialNumber"
                editable={editable}
                onFieldChange={onFieldChange}
                className="flex-1"
              />
              <FieldLine
                label="Certificate No.:"
                value={data.certificateNumber}
                field="certificateNumber"
                editable={editable}
                onFieldChange={onFieldChange}
                className="flex-[1.2]"
              />
            </div>

            <FieldLine
              label="ATC Code:"
              value={data.atcCode}
              field="atcCode"
              editable={editable}
              onFieldChange={onFieldChange}
            />
            <FieldLine
              label="Authorised Training Centre (ATC) Name:"
              value={data.atcName}
              field="atcName"
              editable={editable}
              onFieldChange={onFieldChange}
            />

            <p className="pt-1 text-[10.5px] font-bold" style={sans}>
              This is to certify that:
            </p>

            <FieldLine
              label="Name:"
              value={data.studentName}
              field="studentName"
              editable={editable}
              onFieldChange={onFieldChange}
            />
            <FieldLine
              label="D/S/O:"
              value={data.parentName}
              field="parentName"
              editable={editable}
              onFieldChange={onFieldChange}
            />
            <FieldLine
              label="Student Registration No.:"
              value={data.registrationNumber}
              field="registrationNumber"
              editable={editable}
              onFieldChange={onFieldChange}
            />
          </Section>

          {/* ===== ACHIEVEMENT ===== */}
          <Section className="my-2.5 shrink-0 px-1 text-center text-[10px] font-semibold leading-snug" style={sans}>
            {editable && onFieldChange ? (
              <span>
                Has successfully completed the Course on{" "}
                <input
                  type="text"
                  value={data.courseName}
                  onChange={(e) => onFieldChange("courseName", e.target.value)}
                  className="mx-0.5 inline-block min-w-[100px] border-0 border-b border-[#1a2b4a] bg-transparent text-center font-bold outline-none"
                />{" "}
                and obtained Grade{" "}
                <input
                  type="text"
                  value={data.grade}
                  onChange={(e) => onFieldChange("grade", e.target.value)}
                  className="mx-0.5 inline-block w-8 border-0 border-b border-[#1a2b4a] bg-transparent text-center outline-none"
                />{" "}
                (
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={data.marksPercent ?? ""}
                  onChange={(e) =>
                    onFieldChange(
                      "marksPercent",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  className="inline-block w-8 border-0 border-b border-[#1a2b4a] bg-transparent text-center outline-none"
                />
                % Marks).
              </span>
            ) : (
              achievement
            )}
          </Section>

          {/* ===== TRAINING + QR (side by side like original) ===== */}
          <Section className="shrink-0">
            <div className="flex gap-4">
              <div className="min-w-0 flex-1 space-y-[7px]">
                <div className="flex flex-wrap items-end gap-x-1.5 gap-y-1" style={sans}>
                  <span className="text-[10px] font-bold">Training Period:</span>
                  <InlineValue
                    value={data.trainingStart}
                    field="trainingStart"
                    editable={editable}
                    onFieldChange={onFieldChange}
                  />
                  <span className="text-[10px] font-bold">to</span>
                  <InlineValue
                    value={data.trainingEnd}
                    field="trainingEnd"
                    editable={editable}
                    onFieldChange={onFieldChange}
                  />
                </div>

                <div className="flex flex-wrap items-end gap-x-1.5" style={sans}>
                  <span className="text-[10px] font-bold">Date of Issue:</span>
                  <InlineValue
                    value={data.issueDate}
                    field="issueDate"
                    editable={editable}
                    onFieldChange={onFieldChange}
                    width={96}
                  />
                </div>

                <FieldLine
                  label="Training Centre:"
                  value={data.trainingCentre}
                  field="trainingCentre"
                  editable={editable}
                  onFieldChange={onFieldChange}
                />
                <FieldLine
                  label="Training Centre Name:"
                  value={data.trainingCentreName}
                  field="trainingCentreName"
                  editable={editable}
                  onFieldChange={onFieldChange}
                />
              </div>

              {/* QR column — original right side */}
              <div className="flex w-[96px] shrink-0 flex-col items-center">
                <div className="flex h-[88px] w-[88px] items-center justify-center border border-[#1a2b4a] bg-white p-1">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrDataUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[8px] text-slate-400" style={sans}>
                      QR Code
                    </span>
                  )}
                </div>
                <p className="mt-1 text-center text-[6.5px] font-semibold leading-tight text-[#1a2b4a]" style={sans}>
                  Scan QR Code
                  <br />
                  For Verification
                </p>
              </div>
            </div>
          </Section>

          {/* ===== OFFICE ADDRESS (full width) ===== */}
          <Section className="mt-3 shrink-0">
            <p className="text-[7px] leading-[1.35] text-[#334155]" style={sans}>
              {CERT_STATIC.officeAddress}
            </p>
          </Section>

          {/* ===== SIGNATORY + STAMP ===== */}
          <Section className="mt-3 flex shrink-0 items-end justify-between gap-4">
            <p className="pb-1 text-[9px] font-bold uppercase tracking-wide text-[#1a2b4a]" style={sans}>
              {CERT_STATIC.signatory}
            </p>
            <div className="flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#1a2b4a]">
              <span className="text-[9px] font-semibold text-[#64748b]" style={sans}>
                Stamp
              </span>
            </div>
          </Section>

          {/* spacer pushes footer down without crushing middle */}
          <div className="min-h-[8px] flex-1" />

          {/* ===== FOOTER ===== */}
          <footer className="shrink-0 text-center" style={sans}>
            <div className="mb-1.5 flex items-center gap-2">
              <div className="h-px flex-1 bg-[#1E4A85]/45" />
              <p className="text-[7.5px] font-bold uppercase tracking-wider text-[#1E4A85]">
                {CERT_STATIC.affiliationsTitle}
              </p>
              <div className="h-px flex-1 bg-[#1E4A85]/45" />
            </div>

            <div className="mb-1.5 flex flex-wrap items-center justify-center gap-x-2.5 text-[7px] font-semibold text-[#334155]">
              <span>Make in India</span>
              <span>·</span>
              <span>Skill India</span>
              <span>·</span>
              <span>Ministry of Corporate Affairs</span>
              <span>·</span>
              <span>MSME</span>
              <span>·</span>
              <span>IAF</span>
              <span>·</span>
              <span>QRO</span>
            </div>

            <p className="text-[7px] text-[#1a2b4a]">{CERT_STATIC.contact}</p>
            <p className="mt-0.5 text-[6.5px] leading-snug text-[#475569]">{CERT_STATIC.gradeSystem}</p>
            <p className="mt-1 text-[6px] text-[#64748b]">{CERT_STATIC.registeredOffice}</p>
          </footer>
        </div>
      </div>

      {data.isDraft && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <p
            className="select-none font-black uppercase text-red-500/18"
            style={{ transform: "rotate(-22deg)", fontSize: 72, letterSpacing: "0.2em" }}
          >
            Draft
          </p>
        </div>
      )}

      <style jsx global>{`
        @media print {
          @page {
            size: ${W}px ${H}px;
            margin: 0;
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          #ivesdc-certificate,
          #ivesdc-certificate *,
          [id^="ivesdc-cert-"],
          [id^="ivesdc-cert-"] * {
            visibility: visible !important;
          }
          #ivesdc-certificate,
          [id^="ivesdc-cert-"] {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${W}px !important;
            height: ${H}px !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
