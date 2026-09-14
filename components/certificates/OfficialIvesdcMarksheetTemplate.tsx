"use client";

import React, { useEffect, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import type { CertificateDemoData, MarksheetSubject } from "./demo/types";
import EnrollmentBarcode from "./EnrollmentBarcode";
import CertificateQRCode from "./CertificateQRCode";

interface Props {
  data: CertificateDemoData;
  className?: string;
  printId?: string;
  borderStyle?: "ornate" | "guilloche";
}

const sans: CSSProperties = {
  fontFamily: "Arial, Helvetica, -apple-system, BlinkMacSystemFont, sans-serif",
};
const serif: CSSProperties = {
  fontFamily: "Georgia, 'Times New Roman', Times, serif",
};
const cursive: CSSProperties = {
  fontFamily: "'Brush Script MT', 'Great Vibes', 'Dancing Script', 'Alex Brush', cursive, serif",
};

export default function OfficialIvesdcMarksheetTemplate({
  data,
  className = "",
  printId = "official-ivesdc-marksheet",
  borderStyle,
}: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  // Default to guilloche security blue border (from res.jpeg)
  const activeBorder = borderStyle || data.borderStyle || "guilloche";
  const borderSrc =
    data.customBorderUrl ||
    (activeBorder === "ornate" ? "/cert/cert-border-pristine.png?v=clean" : "/cert/res-border-pristine.png?v=clean");

  const defaultSubjects: MarksheetSubject[] = [
    { code: "SUB-01", name: "Fundamentals of Computer", maxTheory: 100, marksTheory: 86, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 86, grade: "86%" },
    { code: "SUB-02", name: "Operating System (Windows)", maxTheory: 100, marksTheory: 82, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 82, grade: "82%" },
    { code: "SUB-03", name: "MS Word", maxTheory: 100, marksTheory: 88, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 88, grade: "88%" },
    { code: "SUB-04", name: "MS Excel", maxTheory: 100, marksTheory: 90, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 90, grade: "90%" },
    { code: "SUB-05", name: "MS PowerPoint", maxTheory: 100, marksTheory: 85, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 85, grade: "85%" },
    { code: "SUB-06", name: "Internet & Email", maxTheory: 100, marksTheory: 80, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 80, grade: "80%" },
    { code: "SUB-07", name: "Digital Financial Literacy", maxTheory: 100, marksTheory: 78, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 78, grade: "78%" },
    { code: "SUB-08", name: "Practical / Project Work", maxTheory: 100, marksTheory: 92, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 92, grade: "92%" },
  ];

  const subjects = data.subjects && data.subjects.length > 0 ? data.subjects : defaultSubjects;
  const totalMax = subjects.reduce((sum, s) => sum + s.totalMax, 0);
  const totalObtained = subjects.reduce((sum, s) => sum + s.totalObtained, 0);
  const calcPercent = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(2) : "85.13";
  const displayPercent = data.marksPercent ? Number(data.marksPercent).toFixed(2) : calcPercent;

  useEffect(() => {
    let cancelled = false;
    const verifyPayload = `IVESDC STATEMENT OF MARKS VERIFICATION
Marksheet No: ${data.certificateNumber || data.serialNumber || "IVESDC/MS/2025/000123"}
Enrollment No: ${data.registrationNumber || "4739846"}
Candidate: ${data.studentName}
Course: ${data.courseName}
Total Marks: ${totalObtained}/${totalMax} (${displayPercent}%)
Result: ${data.status || "PASS"} (Grade ${data.grade || "A+"})
Date of Issue: ${data.issueDate}
Verify Online: https://${data.verificationWebsite || "www.iveskillcouncil.edu.in"}/verify`;

    QRCode.toDataURL(verifyPayload, {
      width: 140,
      margin: 1,
      color: { dark: "#0E2A54", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setQrUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [
    data.certificateNumber,
    data.serialNumber,
    data.registrationNumber,
    data.studentName,
    data.courseName,
    data.issueDate,
    data.verificationWebsite,
    totalObtained,
    totalMax,
    displayPercent,
    data.status,
    data.grade,
  ]);

  const fatherName = data.fatherName || data.parentName?.split(" and ")[0]?.split("&")[0]?.trim() || "Panditbhai Prajapati";
  const motherName = data.motherName || data.parentName?.split(" and ")[1]?.split("&")[1]?.trim() || "Latkanben Prajapati";
  const currentBannerH = data.bannerHeight || 54;
  const currentBannerW = data.bannerWidth || Math.round(currentBannerH * (609 / 85));

  // Dynamic Typography & Content Font Scaling
  const fontScale = (data.innerFontScale || 100) / 100;
  const baseCandidateFont = data.candidateFontSize || 13;
  const candidateFont = Math.round(baseCandidateFont * fontScale);
  const candidateLabelWidth = Math.max(175, Math.round(185 * (candidateFont / 13)));
  const candidateRowGap = Math.max(3, Math.round(5 * fontScale));

  const baseTableFont = data.tableFontSize || 12;
  const tableFont = Math.round(baseTableFont * fontScale);
  const tableHeaderFont = Math.max(9.5, Math.round(tableFont * 0.96));
  const tableSubHeaderFont = Math.max(8.5, Math.round(tableFont * 0.84));
  const tableTotalFont = Math.round(tableFont * 1.08);
  const tablePaddingY = tableFont >= 15 ? "py-2" : tableFont >= 13 ? "py-1.5" : "py-1";

  const boxFont = Math.max(10, Math.round(11 * fontScale));
  const passFont = Math.round(28 * fontScale);
  const pctFont = Math.round(15 * fontScale);
  const gradeFont = Math.round(18 * fontScale);

  const footerFont = Math.max(9, Math.round(10 * fontScale));
  const footerSubFont = Math.max(8, Math.round(9.5 * fontScale));

  return (
    <div
      id={printId}
      className={`certificate-sheet relative mx-auto select-none overflow-hidden bg-white shadow-2xl ${className}`}
      style={{
        width: 1054,
        height: 1492,
        minWidth: 1054,
        minHeight: 1492,
        maxWidth: 1054,
        maxHeight: 1492,
        ...sans,
      }}
    >
      {/* 1. Authentic Pristine Border Image (from res.jpeg or custom uploaded border) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={borderSrc}
        alt="Marksheet Border"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill"
        draggable={false}
      />

      {/* 2. Background Security Watermark (Disabled by default, only shown if explicitly enabled) */}
      {Boolean(data.watermarkType && data.watermarkType !== "none" && typeof data.watermarkOpacity === "number" && data.watermarkOpacity > 0) && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
          style={{ opacity: data.watermarkOpacity !== undefined ? data.watermarkOpacity : 0.04 }}
        >
          {data.watermarkType === "crest" ? (
            <svg width="580" height="580" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="85" stroke={data.watermarkColor || "#0E2A54"} strokeWidth="6" strokeDasharray="8 6" />
              <circle cx="100" cy="100" r="70" stroke={data.watermarkColor || "#0E2A54"} strokeWidth="2" />
              <path d="M100 45 L150 72 L100 99 L50 72 Z" fill={data.watermarkColor || "#0E2A54"} />
              <path
                d="M65 82 V120 C65 138 100 152 100 152 C100 152 135 138 135 120 V82"
                fill="none"
                stroke={data.watermarkColor || "#0E2A54"}
                strokeWidth="5"
              />
              <text
                x="100"
                y="175"
                textAnchor="middle"
                fill={data.watermarkColor || "#0E2A54"}
                fontSize="12"
                fontWeight="bold"
                letterSpacing="2"
              >
                IVESDC
              </text>
            </svg>
          ) : (
            <svg width="1054" height="1492" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
              <defs>
                <pattern id="ivesdc-seal-pattern" width="140" height="140" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
                  <g transform="translate(35, 35)">
                    <circle cx="35" cy="35" r="28" stroke={data.watermarkColor || "#0E2A54"} strokeWidth="1.5" fill="none" strokeDasharray="4 2" />
                    <circle cx="35" cy="35" r="23" stroke={data.watermarkColor || "#0E2A54"} strokeWidth="0.8" fill="none" />
                    <path d="M35 18 L48 27 L35 36 L22 27 Z" fill={data.watermarkColor || "#0E2A54"} />
                    <path d="M26 31 V44 C26 50 35 55 35 55 C35 55 44 50 44 44 V31" fill="none" stroke={data.watermarkColor || "#0E2A54"} strokeWidth="1.5" />
                    <text x="35" y="47" textAnchor="middle" fill={data.watermarkColor || "#0E2A54"} fontSize="5.5" fontWeight="bold" letterSpacing="0.8">
                      IVESDC
                    </text>
                  </g>
                </pattern>
              </defs>
              <rect x="50" y="50" width="954" height="1392" fill="url(#ivesdc-seal-pattern)" />
            </svg>
          )}
        </div>
      )}

      {/* 3. Main Marksheet Workspace */}
      <div
        className="relative z-[2] flex h-full flex-col justify-between"
        style={{
          paddingTop: data.paddingTop !== undefined ? data.paddingTop : 48,
          paddingBottom: data.paddingBottom !== undefined ? data.paddingBottom : 42,
          paddingLeft: data.paddingLeft !== undefined ? data.paddingLeft : 56,
          paddingRight: data.paddingRight !== undefined ? data.paddingRight : 56,
        }}
      >
        {/* ================= HEADER SECTION (Y: 50 to 365) ================= */}
        <div className="shrink-0" style={{ marginBottom: data.headerSpacing !== undefined ? data.headerSpacing : 2 }}>
          {/* Top Row: Sr. No. at top right */}
          <div className="flex items-center justify-end pr-2 pt-0.5">
            <span className="text-[12.5px] font-bold text-[#0E2A54]" style={sans}>
              Sr. No.: <span className="font-extrabold text-[#0E2A54]">{data.serialNumber || "IVESDC/MS/2025/000123"}</span>
            </span>
          </div>

          {/* Institution Header Block */}
          <div className="mt-0.5 flex items-center justify-between px-1">
            {/* Left: Institute Logo */}
            <div className="shrink-0 flex items-center justify-start" style={{ width: data.logoWidth || 195 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.logoUrl || "/cert/ivesdc-logo.png?v=clean"}
                alt="Institute Logo"
                style={{ height: data.logoHeight || 92 }}
                className="w-auto max-w-full object-contain"
                draggable={false}
              />
            </div>

            {/* Center: Title & Accreditations */}
            <div className="flex-1 px-2 text-center">
              <h1
                className="font-black uppercase tracking-[0.01em] text-[#0E2A54] leading-[1.12]"
                style={{
                  ...sans,
                  fontSize: data.titleFontSize ? `${data.titleFontSize}px` : "20.5px",
                }}
              >
                <div>INSTITUTE OF VOCATIONAL EDUCATION</div>
                <div>AND SKILL DEVELOPMENT COUNCIL</div>
              </h1>

              {/* Golden Tagline Ribbon (with swallowtail ends) */}
              <div className="my-1.5 flex items-center justify-center">
                <div className="relative inline-flex items-center justify-center bg-gradient-to-r from-[#D9A74A] via-[#F3D27E] to-[#D9A74A] px-8 py-1 shadow-sm">
                  <div
                    className="absolute -left-2.5 top-0 bottom-0 w-3 bg-[#D9A74A]"
                    style={{ clipPath: "polygon(100% 0, 100% 100%, 0 50%)" }}
                  />
                  <div
                    className="absolute -right-2.5 top-0 bottom-0 w-3 bg-[#D9A74A]"
                    style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
                  />
                  <span className="text-[11.5px] font-extrabold uppercase tracking-wide text-black">
                    {data.tagline || "Building a Skilled and Self-Reliant Nation"}
                  </span>
                </div>
              </div>

              {/* Accreditation Text (3 lines, bold navy blue) */}
              <div className="space-y-0.5 text-[9.5px] font-bold leading-tight text-[#0E2A54]">
                <p>{data.accreditationLine1 || "An Autonomous Body Registered under Section 8 of the Companies Act, 2013"}</p>
                <p>{data.accreditationLine2 || "Ministry of Corporate Affairs, Government of India"}</p>
                <p className="font-extrabold">
                  {data.accreditationLine3 || "ISO 9001:2015 & ISO 21001:2018 Certified Organization"}
                </p>
              </div>
            </div>

            {/* Right: Certified ISO Seal */}
            <div className="flex shrink-0 items-center justify-end" style={{ width: data.logoWidth || 195 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.isoSealUrl || "/cert/iso-seal.png"}
                alt="ISO Certified Seal"
                style={{
                  height: data.isoSealSize || 92,
                  width: data.isoSealSize || 92,
                }}
                className="object-contain drop-shadow-sm"
                draggable={false}
              />
            </div>
          </div>

          {/* Thin Dark Blue Divider Line */}
          <div className="my-1.5 w-full border-b border-[#0E2A54]" />

          {/* Government & Partner Logos Row */}
          <div className="px-1 flex items-center justify-between w-full min-h-[46px]">
            {data.partnerLogos && data.partnerLogos.length > 0 ? (
              data.partnerLogos.map((logo, idx) => (
                <div key={logo.id || idx} className="flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.url}
                    alt={logo.name || `Partner Logo ${idx + 1}`}
                    style={{
                      height: logo.height || data.partnerLogosHeight || 46,
                      maxHeight: 65,
                    }}
                    className="w-auto object-contain max-w-full"
                    draggable={false}
                  />
                </div>
              ))
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={data.partnerLogosUrl || "/cert/partner-logos.png"}
                alt="Government & Partner Logos"
                style={{ height: data.partnerLogosHeight || 46 }}
                className="w-full object-contain"
                draggable={false}
              />
            )}
          </div>

          {/* Thin Dark Blue Divider Line below Partner Logos */}
          <div className="mt-1.5 w-full border-b border-[#0E2A54]" />
        </div>

        {/* ================= TITLE & METADATA SECTION ================= */}
        <div className="shrink-0 px-2 pt-1.5 pb-1">
          {/* Statement of Marks Title Cartouche Banner */}
          <div className="flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.customBannerUrl || "/cert/res-statement-banner.png?v=authentic"}
              alt="STATEMENT OF MARKS"
              style={{
                height: currentBannerH,
                width: currentBannerW,
                maxWidth: "100%",
              }}
              className="object-contain drop-shadow-sm select-none"
              draggable={false}
            />
          </div>
        </div>

        {/* ================= CANDIDATE DETAILS & ENROLLMENT BARCODE ================= */}
        <div className="shrink-0 px-2 pt-1.5 pb-1">
          <div className="flex items-start justify-between gap-6">
            {/* Left: Marksheet No. + Student particulars with aligned colons */}
            <div
              className="flex-1 leading-tight"
              style={{
                ...sans,
                fontSize: `${candidateFont}px`,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: `${candidateRowGap}px` }}>
                <div style={{ display: "grid", gridTemplateColumns: `${candidateLabelWidth}px 1fr`, alignItems: "baseline" }}>
                  <span className="font-bold text-[#111827]">Marksheet No.</span>
                  <span className="font-bold text-[#0E2A54]">
                    : &nbsp;{data.certificateNumber || data.serialNumber || "IVESDC/MS/2025/000123"}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `${candidateLabelWidth}px 1fr`, alignItems: "baseline" }}>
                  <span className="font-bold text-[#111827]">Name of Student</span>
                  <span className="font-bold text-[#0E2A54]">: &nbsp;{data.studentName}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `${candidateLabelWidth}px 1fr`, alignItems: "baseline" }}>
                  <span className="font-bold text-[#111827]">D/S/O (Father Name)</span>
                  <span className="font-bold text-[#0E2A54]">: &nbsp;{fatherName}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `${candidateLabelWidth}px 1fr`, alignItems: "baseline" }}>
                  <span className="font-bold text-[#111827]">D/S/O (Mother Name)</span>
                  <span className="font-bold text-[#0E2A54]">: &nbsp;{motherName}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `${candidateLabelWidth}px 1fr`, alignItems: "baseline" }}>
                  <span className="font-bold text-[#111827]">Course Completed</span>
                  <span className="font-bold text-[#0E2A54]">: &nbsp;{data.courseName}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `${candidateLabelWidth}px 1fr`, alignItems: "baseline" }}>
                  <span className="font-bold text-[#111827]">Training Duration</span>
                  <span className="font-bold text-[#0E2A54]">: &nbsp;{data.duration || "03 Months"}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: `${candidateLabelWidth}px 1fr`, alignItems: "baseline" }}>
                  <span className="font-bold text-[#111827]">Date of Issue</span>
                  <span className="font-bold text-[#0E2A54]">: &nbsp;{data.issueDate}</span>
                </div>
              </div>
            </div>

            {/* Right: Dynamic Enrollment Barcode with Number on top & Digit Words on bottom */}
            <div className="shrink-0 pt-0">
              <EnrollmentBarcode
                enrollmentNo={data.registrationNumber || data.barcodeNumber || "4739846"}
                words={data.barcodeTextWords}
                color="#000000"
                showLabel={true}
                showWords={true}
                barcodeHeight={46}
              />
            </div>
          </div>
        </div>

        {/* ================= MARKS TABLE ================= */}
        <div className="my-0.5 px-2">
          <table
            className="w-full border-collapse border-2 border-[#0E2A54]"
            style={{
              ...sans,
              fontSize: `${tableFont}px`,
            }}
          >
            <thead>
              <tr className="bg-[#0E2A54] text-white" style={{ fontSize: `${tableHeaderFont}px` }}>
                <th
                  rowSpan={2}
                  className={`border border-[#0E2A54] px-1.5 ${tablePaddingY} text-center font-bold`}
                  style={{ width: "7%" }}
                >
                  SR. NO.
                </th>
                <th
                  rowSpan={2}
                  className={`border border-[#0E2A54] px-2 ${tablePaddingY} text-center font-bold`}
                  style={{ width: "13%" }}
                >
                  SUBJECT CODE
                </th>
                <th
                  rowSpan={2}
                  className={`border border-[#0E2A54] px-3 ${tablePaddingY} text-center font-bold`}
                  style={{ width: "35%" }}
                >
                  SUBJECTS
                </th>
                <th
                  colSpan={2}
                  className="border border-[#0E2A54] px-2 py-0.5 text-center font-bold"
                  style={{ width: "30%" }}
                >
                  MARKS
                </th>
                <th
                  rowSpan={2}
                  className={`border border-[#0E2A54] px-2 ${tablePaddingY} text-center font-bold`}
                  style={{ width: "15%" }}
                >
                  PERCENTAGE (%)
                </th>
              </tr>
              <tr className="bg-[#0E2A54] text-white" style={{ fontSize: `${tableSubHeaderFont}px` }}>
                <th className="border border-[#0E2A54] px-2 py-0.5 text-center font-bold" style={{ width: "15%" }}>
                  MAXIMUM MARKS
                </th>
                <th className="border border-[#0E2A54] px-2 py-0.5 text-center font-bold" style={{ width: "15%" }}>
                  OBTAINED MARKS
                </th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub, idx) => {
                const subPct = sub.totalMax > 0 ? ((sub.totalObtained / sub.totalMax) * 100).toFixed(0) : "0";
                return (
                  <tr key={sub.code || idx} className="bg-white">
                    <td className={`border border-[#0E2A54] px-1.5 ${tablePaddingY} text-center font-bold text-[#111827]`}>
                      {idx + 1}
                    </td>
                    <td className={`border border-[#0E2A54] px-2 ${tablePaddingY} text-center font-bold text-[#0E2A54] font-mono`}>
                      {sub.code || `SUB-0${idx + 1}`}
                    </td>
                    <td className={`border border-[#0E2A54] px-3 ${tablePaddingY} font-bold text-[#111827]`}>
                      {sub.name}
                    </td>
                    <td className={`border border-[#0E2A54] px-2 ${tablePaddingY} text-center font-bold text-[#111827]`}>
                      {sub.totalMax}
                    </td>
                    <td className={`border border-[#0E2A54] px-2 ${tablePaddingY} text-center font-bold text-[#111827]`}>
                      {sub.totalObtained}
                    </td>
                    <td className={`border border-[#0E2A54] px-2 ${tablePaddingY} text-center font-bold text-[#111827]`}>
                      {subPct}%
                    </td>
                  </tr>
                );
              })}

              {/* Total Row (pure white background, bold black text) */}
              <tr
                className="border-t-2 border-[#0E2A54] bg-white font-black text-[#111827]"
                style={{ fontSize: `${tableTotalFont}px` }}
              >
                <td colSpan={3} className={`border border-[#0E2A54] px-4 ${tablePaddingY} text-center uppercase tracking-widest`}>
                  TOTAL
                </td>
                <td className={`border border-[#0E2A54] px-2 ${tablePaddingY} text-center font-black`}>
                  {totalMax}
                </td>
                <td className={`border border-[#0E2A54] px-2 ${tablePaddingY} text-center font-black`}>
                  {totalObtained}
                </td>
                <td className={`border border-[#0E2A54] px-2 ${tablePaddingY} text-center font-black`}>
                  {displayPercent}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ================= 3 BOX CARDS ROW (Y: 1025 to 1215) ================= */}
        <div className="shrink-0 px-2 pt-2">
          <div className="flex items-start justify-between gap-4">
            {/* Box 1: GRADE SYSTEM */}
            <div className="relative w-[310px] rounded-2xl border-2 border-[#0E2A54] bg-white pt-4.5 pb-3 px-4.5 shadow-sm">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-[#0E2A54] bg-[#0E2A54] px-6 py-0.5 text-center text-[11px] font-black uppercase tracking-wider text-white shadow-sm whitespace-nowrap">
                GRADE SYSTEM
              </div>
              <div className="space-y-1.5 font-bold leading-normal text-[#0E2A54]" style={{ ...sans, fontSize: `${boxFont}px` }}>
                {(data.gradeSystem && data.gradeSystem.length > 0 ? data.gradeSystem : [
                  { grade: "A+", label: "Excellent", range: "85% & Above" },
                  { grade: "A", label: "Very Good", range: "70% to 84%" },
                  { grade: "B", label: "Good", range: "55% to 69%" },
                  { grade: "C", label: "Average", range: "40% to 54%" },
                  { grade: "D", label: "Below Average", range: "Below 40%" },
                ]).map((item, idx) => (
                  <div key={idx} className="grid grid-cols-[28px_14px_1fr] items-baseline">
                    <span className="font-black text-[#0E2A54]">{item.grade}</span>
                    <span className="font-bold text-[#0E2A54] text-center">:</span>
                    <span className="font-bold text-[#0E2A54] whitespace-nowrap">
                      {item.label} ({item.range})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 2: RESULT */}
            <div className="relative w-[235px] rounded-2xl border-2 border-[#0E2A54] bg-white pt-4 pb-2.5 px-3 text-center shadow-sm">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-[#0E2A54] bg-[#0E2A54] px-6 py-0.5 text-center text-[11px] font-black uppercase tracking-wider text-white shadow-sm whitespace-nowrap">
                RESULT
              </div>
              <div className="flex flex-col items-center justify-center space-y-0.5">
                <span
                  className="font-black tracking-widest text-[#107C41] leading-none my-0.5"
                  style={{ fontSize: `${passFont}px` }}
                >
                  {data.status || "PASS"}
                </span>
                <div className="w-full mt-1 rounded-full bg-[#0E2A54] py-0.5 text-center text-[8.5px] font-black uppercase tracking-wider text-white">
                  OVERALL PERCENTAGE
                </div>
                <span
                  className="font-black text-[#107C41] my-0.5"
                  style={{ fontSize: `${pctFont}px` }}
                >
                  {displayPercent}%
                </span>
                <div className="w-full rounded-full bg-[#0E2A54] py-0.5 text-center text-[8.5px] font-black uppercase tracking-wider text-white">
                  GRADE
                </div>
                <span
                  className="font-black text-[#107C41] my-0.5"
                  style={{ fontSize: `${gradeFont}px` }}
                >
                  {data.grade || "A+"}
                </span>
              </div>
            </div>

            {/* Box 3: Student Photo & Signature */}
            <div className="flex w-[185px] flex-col items-center">
              <div
                className="relative overflow-hidden rounded-xl border-2 border-[#0E2A54] bg-white p-0.5 shadow-sm"
                style={{
                  width: data.photoWidth || 138,
                  height: data.photoHeight || 152,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.photoUrl || "/cert/sample-student-photo.png"}
                  alt="Student Photo"
                  className="h-full w-full object-cover rounded-lg"
                />
              </div>

              {/* Student Signature Block */}
              <div className="mt-1 flex flex-col items-center w-full">
                {data.studentSignatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.studentSignatureUrl}
                    alt="Student Signature"
                    style={{ height: data.studentSigHeight || 36 }}
                    className="w-auto object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/cert/sample-student-sig.png"
                    alt="Student Signature"
                    style={{ height: data.studentSigHeight || 36 }}
                    className="w-auto object-contain"
                  />
                )}
                <div className="w-[140px] border-t border-[#0E2A54] pt-0.5 text-center mt-0.5">
                  <span className="text-[10px] font-bold text-[#0E2A54] uppercase tracking-wider">
                    Student Signature
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= FOOTER / SIGNATURES / ATC SECTION (Y: 1220 to 1430) ================= */}
        <div className="shrink-0 px-2 pt-2 pb-1">
          <div className="grid grid-cols-[290px_1fr_355px] items-start gap-3">
            {/* Left: ATC Details */}
            <div className="leading-snug text-[#0E2A54]" style={{ ...sans, fontSize: `${footerFont}px` }}>
              <p className="font-bold">
                Authorised Training Centre (ATC) Name :
              </p>
              <p className="font-black mt-0.5" style={{ fontSize: `${footerFont + 1}px` }}>
                {data.atcName || "IVESDC Authorized Training Centre"}
              </p>
              <p className="font-bold mt-0.5">
                ATC Code : <span className="font-mono">{data.atcCode || "IVESDC/ATC/2025/001"}</span>
              </p>
              <p className="font-bold mt-0.5">
                ATC Address :
              </p>
              <p className="font-medium" style={{ fontSize: `${footerSubFont}px` }}>
                {data.franchiseAddress || "Songadh, Tal. Songadh, Dist. Tapi, Gujarat - 394670"}
              </p>
            </div>

            {/* Center: Stamp, Director Signature & Registered Office */}
            <div className="flex flex-col items-center text-center">
              <div className="relative flex items-center justify-center">
                {/* Official Stamp */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.stampUrl || "/cert/stamp-blue.png?v=clean"}
                  alt="Official Stamp"
                  style={{
                    height: data.stampSize || 82,
                    width: data.stampSize || 82,
                  }}
                  className="object-contain"
                  draggable={false}
                />
                {/* Director Signature on top */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.directorSignatureUrl || "/cert/sig-director.png"}
                    alt="Director Signature"
                    style={{ height: data.directorSigHeight || 44 }}
                    className="w-auto object-contain"
                    draggable={false}
                  />
                </div>
              </div>
              <div className="w-[140px] border-t border-[#0E2A54] pt-0.5 text-center mt-0.5">
                <span className="text-[10px] font-bold text-[#0E2A54]">
                  {data.directorTitle || "Director Signature"}
                </span>
              </div>
              <div className="mt-1 rounded bg-[#0E2A54] px-4 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-white">
                REGISTERED OFFICE
              </div>
              <p className="mt-0.5 max-w-[270px] text-[8px] font-semibold leading-tight text-[#0E2A54]">
                {data.registeredOffice || "F-107, Dev Krishna Residency, Gunsada, Sub. Dist. Ukai, Dist. Tapi, Gujarat - 394680"}
              </p>
            </div>

            {/* Right: QR Code + Legal Order Text with proper spacing & framed card */}
            <div className="flex items-start justify-end gap-4 pt-0.5">
              {/* QR Code in Framed Card with generous quiet-zone and clear text */}
              <div className="shrink-0">
                <CertificateQRCode
                  docType="marksheet"
                  enrollmentNo={data.registrationNumber || "4739846"}
                  certificateNo={data.certificateNumber || data.serialNumber || "IVESDC/MS/2025/000123"}
                  studentName={data.studentName}
                  verificationWebsite={data.verificationWebsite || "www.iveskillcouncil.edu.in"}
                  size={data.qrCodeSize || 80}
                  color="#000000"
                  mode="marksheet"
                  captionLine1="Scan QR Code to Verify"
                  captionLine2="This Marksheet"
                  showEnrollmentTag={false}
                />
              </div>

              {/* Gov Order Legal Text with generous left margin & readable line height */}
              <div className="text-left text-[8.5px] leading-snug text-[#0E2A54] font-semibold space-y-0.5 pt-2 pl-0.5" style={sans}>
                <p>Under the General Adm Vahiwat Dept.</p>
                <p>Govt. of Gujarat Certificate According to</p>
                <p>Letter No. CRR - 10 - 2007 - 120520</p>
                <p>G.P. New Sachivalaya Gandhinagar</p>
                <p>Date : 13-8-2008</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= BOTTOM SOLID BLUE BAR (Only rendered if border does NOT already have it) ================= */}
        {activeBorder !== "guilloche" && (
          <div className="shrink-0 -mx-3 mt-1 flex h-[24px] items-center justify-center bg-[#0E2A54] px-4">
            <span className="text-[10px] font-bold tracking-wide text-white" style={sans}>
              Verify this Marksheet by Scan QR Code or Log on: {data.verificationWebsite || "www.iveskillcouncil.edu.in"} | Mail: {data.verificationEmail || "official.iveskillcouncil@gmail.com"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
