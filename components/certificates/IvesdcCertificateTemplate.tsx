"use client";

import type { CertificateDisplayData } from "@/lib/certificate-display";
import {
  CERT_IMAGE,
  FORM_PANEL,
  buildAchievementText,
  pct,
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

function Line({
  label,
  value,
  wide,
  field,
  editable,
  onFieldChange,
}: {
  label: string;
  value: string;
  wide?: boolean;
  field?: CertificateFieldKey;
  editable?: boolean;
  onFieldChange?: Props["onFieldChange"];
}) {
  return (
    <div className={`flex items-baseline gap-1 ${wide ? "w-full" : ""}`}>
      <span className="shrink-0 font-semibold text-[#1a2744]">{label}</span>
      {editable && field && onFieldChange ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onFieldChange(field, e.target.value)}
          className="min-w-0 flex-1 border-0 border-b border-[#1a2744] bg-transparent px-0.5 pb-0.5 text-[11px] font-medium text-[#1a2744] outline-none focus:border-[#C4A35A]"
        />
      ) : (
        <span className="min-w-0 flex-1 border-b border-[#1a2744] px-0.5 pb-0.5 text-[11px] font-medium text-[#1a2744]">
          {value || "\u00A0"}
        </span>
      )}
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
  const { width: W, height: H, src } = CERT_IMAGE;
  const achievement = buildAchievementText(data.courseName, data.grade, data.marksPercent);

  const panelStyle = {
    top: pct(FORM_PANEL.top, H),
    left: pct(FORM_PANEL.left, W),
    width: pct(FORM_PANEL.width, W),
    height: pct(FORM_PANEL.height, H),
  };

  return (
    <div
      id={printId}
      className={`certificate-sheet relative mx-auto overflow-hidden bg-white shadow-xl ${className}`}
      style={{ width: W, height: H }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="IVESDC Certificate"
        width={W}
        height={H}
        className="absolute inset-0 h-full w-full select-none object-fill"
        draggable={false}
      />

      {/* Form body — covers sample text on template, renders dynamic data */}
      <div
        className="absolute z-[1] overflow-hidden bg-white px-3 py-2"
        style={{
          ...panelStyle,
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: 11,
          lineHeight: 1.45,
          color: "#1a2744",
        }}
      >
        {/* Row 1 */}
        <div className="mb-1.5 flex justify-between gap-3">
          <Line
            label="Sr. No.:"
            value={data.serialNumber}
            field="serialNumber"
            editable={editable}
            onFieldChange={onFieldChange}
          />
          <Line
            label="Certificate No.:"
            value={data.certificateNumber}
            field="certificateNumber"
            editable={editable}
            onFieldChange={onFieldChange}
          />
        </div>

        {/* Row 2 */}
        <div className="mb-1">
          <Line
            label="ATC Code:"
            value={data.atcCode}
            wide
            field="atcCode"
            editable={editable}
            onFieldChange={onFieldChange}
          />
        </div>

        {/* Row 3 */}
        <div className="mb-1.5">
          <Line
            label="Authorised Training Centre (ATC) Name:"
            value={data.atcName}
            wide
            field="atcName"
            editable={editable}
            onFieldChange={onFieldChange}
          />
        </div>

        <p className="mb-1 font-semibold">This is to certify that:</p>

        {/* Student details */}
        <div className="mb-1 space-y-1">
          <Line
            label="Name:"
            value={data.studentName}
            wide
            field="studentName"
            editable={editable}
            onFieldChange={onFieldChange}
          />
          <Line
            label="D/S/O:"
            value={data.parentName}
            wide
            field="parentName"
            editable={editable}
            onFieldChange={onFieldChange}
          />
          <Line
            label="Student Registration No.:"
            value={data.registrationNumber}
            wide
            field="registrationNumber"
            editable={editable}
            onFieldChange={onFieldChange}
          />
        </div>

        {/* Achievement */}
        <p className="my-2 text-center text-[10.5px] font-medium leading-snug">
          {editable && onFieldChange ? (
            <span className="block space-y-1">
              <span>Has successfully completed the Course on </span>
              <input
                type="text"
                value={data.courseName}
                onChange={(e) => onFieldChange("courseName", e.target.value)}
                className="mx-1 inline-block min-w-[120px] border-0 border-b border-[#1a2744] bg-transparent text-center font-semibold outline-none"
              />
              <span> and obtained Grade </span>
              <input
                type="text"
                value={data.grade}
                onChange={(e) => onFieldChange("grade", e.target.value)}
                className="mx-0.5 inline-block w-10 border-0 border-b border-[#1a2744] bg-transparent text-center outline-none"
              />
              <span> (</span>
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
                className="inline-block w-10 border-0 border-b border-[#1a2744] bg-transparent text-center outline-none"
              />
              <span>% Marks).</span>
            </span>
          ) : (
            achievement
          )}
        </p>

        {/* Dates row */}
        <div className="mb-1 flex flex-wrap items-baseline gap-x-1 gap-y-1">
          <span className="shrink-0 font-semibold">Training Period:</span>
          {editable && onFieldChange ? (
            <>
              <input
                type="text"
                value={data.trainingStart}
                onChange={(e) => onFieldChange("trainingStart", e.target.value)}
                className="w-[72px] border-0 border-b border-[#1a2744] bg-transparent text-center text-[11px] outline-none"
              />
              <span className="font-semibold">to</span>
              <input
                type="text"
                value={data.trainingEnd}
                onChange={(e) => onFieldChange("trainingEnd", e.target.value)}
                className="w-[72px] border-0 border-b border-[#1a2744] bg-transparent text-center text-[11px] outline-none"
              />
            </>
          ) : (
            <span className="border-b border-[#1a2744] px-1 pb-0.5 text-[11px]">
              {data.trainingStart} to {data.trainingEnd}
            </span>
          )}
          <span className="ml-auto shrink-0 font-semibold">Date of Issue:</span>
          {editable && onFieldChange ? (
            <input
              type="text"
              value={data.issueDate}
              onChange={(e) => onFieldChange("issueDate", e.target.value)}
              className="w-[88px] border-0 border-b border-[#1a2744] bg-transparent text-[11px] outline-none"
            />
          ) : (
            <span className="border-b border-[#1a2744] px-1 pb-0.5 text-[11px]">
              {data.issueDate}
            </span>
          )}
        </div>

        {/* Centre rows */}
        <div className="space-y-1">
          <Line
            label="Training Centre:"
            value={data.trainingCentre}
            wide
            field="trainingCentre"
            editable={editable}
            onFieldChange={onFieldChange}
          />
          <Line
            label="Training Centre Name:"
            value={data.trainingCentreName}
            wide
            field="trainingCentreName"
            editable={editable}
            onFieldChange={onFieldChange}
          />
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
            size: 724px 1024px;
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
            width: 724px !important;
            height: 1024px !important;
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
