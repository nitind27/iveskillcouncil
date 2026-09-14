"use client";

import React, { type CSSProperties } from "react";
import type { CertificateDemoData, MarksheetSubject } from "./demo/types";
import EnrollmentBarcode from "./EnrollmentBarcode";

interface Props {
  data: CertificateDemoData;
  className?: string;
  printId?: string;
}

/** Official Result-2 ink — user-specified #001a1a for all inner dark UI */
const INK = "#001a1a";
const TITLE_BLUE = "#1A3673"; // institute title stays royal blue (header brand)
const TABLE_HEAD = "#001a1a";
const TABLE_SUB = "#003030";
const RIBBON = "#F58220";
/** Inner content frame — same #001a1a as blank-form dark lines */
const FRAME = "#001a1a";

const sans: CSSProperties = {
  fontFamily: "Arial, Helvetica, -apple-system, BlinkMacSystemFont, sans-serif",
};
const serif: CSSProperties = {
  fontFamily: "Georgia, 'Times New Roman', Times, serif",
};

/** Statement of Marks (Result) — Layout 2: floral outside + inner frame (blank-form match) */
export default function OfficialIvesdcMarksheetTemplateV2({
  data,
  className = "",
  printId = "official-ivesdc-marksheet-v2",
}: Props) {
  const fontScale = (data.innerFontScale || 100) / 100;
  const baseCandidateFont = data.candidateFontSize || 13;
  const candidateFont = Math.round(baseCandidateFont * fontScale * 10) / 10;
  const baseTableFont = data.tableFontSize || 12;
  const tableFont = Math.round(baseTableFont * fontScale * 10) / 10;
  const tableHeaderFont = Math.max(9.5, Math.round(tableFont * 0.95));
  const tableSubHeaderFont = Math.max(8.5, Math.round(tableFont * 0.82));
  const boxFont = Math.max(9.5, Math.round(10.5 * fontScale));
  const footerFont = Math.max(9, Math.round(10 * fontScale));

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

  const gradeSystem =
    data.gradeSystem && data.gradeSystem.length > 0
      ? data.gradeSystem.filter((g) => g.grade !== "D").slice(0, 4)
      : [
          { grade: "A+", label: "Excellent", range: "85% & Above" },
          { grade: "A", label: "Very Good", range: "70% to 84%" },
          { grade: "B", label: "Good", range: "55% to 69%" },
          { grade: "C", label: "Average", range: "40% to 54%" },
        ];

  // Floral ornament clears at ~67px on all sides (measured from ONLY_OUTSIDE_FLORAL_BORDER).
  // Keep inner frame flush against that inner edge (touch, no white gap).
  const FLORAL_INSET = 67;
  const floralPad = (saved?: number) => {
    if (saved === undefined) return FLORAL_INSET;
    // Older roomy defaults (100–132) left a visible gap — snap to touch
    if (saved >= 95) return FLORAL_INSET;
    return saved;
  };
  const padT = floralPad(data.paddingTop);
  const padB = floralPad(data.paddingBottom);
  const padL = floralPad(data.paddingLeft);
  const padR = floralPad(data.paddingRight);
  const headerGap = data.headerSpacing ?? 6;
  const contentGap = data.contentSpacing ?? 8;

  const stampPx = Math.min(data.stampSize || 70, 78);
  const directorSigPx = Math.min(data.directorSigHeight || 38, 44);

  const marksheetNo = data.certificateNumber || data.serialNumber || "IVESDC/MS/2025/000123";
  const enrollmentNo = data.registrationNumber || data.rollNumber || "4739846";
  const trainingPeriod =
    data.duration ||
    (data.trainingStart && data.trainingEnd
      ? `${data.trainingStart} to ${data.trainingEnd}`
      : "03 Months");

  const DEFAULT_V2_BORDER = "/border/ONLY_OUTSIDE_FLORAL_BORDER.svg";
  const borderSrc =
    data.customBorderUrl &&
    !data.customBorderUrl.includes("marksheet-v2-border") &&
    !data.customBorderUrl.includes("certificate_decorative_border") &&
    !data.customBorderUrl.includes("certificate_border_last_image")
      ? data.customBorderUrl
      : DEFAULT_V2_BORDER;
  const logoSrc = data.logoUrl || "/cert/ivesdc-logo.png?v=clean";

  const instituteFull =
    data.instituteName ||
    "INSTITUTE OF VOCATIONAL EDUCATION AND SKILL DEVELOPMENT COUNCIL";
  const andIdx = instituteFull.toUpperCase().indexOf(" AND ");
  const titleLines =
    andIdx > 0
      ? [instituteFull.slice(0, andIdx), instituteFull.slice(andIdx + 1)]
      : [instituteFull];

  const FieldRow = ({
    label,
    value,
  }: {
    label: string;
    value?: string;
  }) => (
    <div
      className="grid items-baseline"
      style={{
        ...sans,
        fontSize: `${candidateFont}px`,
        gridTemplateColumns: `${Math.round(210 * (candidateFont / 13))}px 10px 1fr`,
        gap: "2px 0",
        marginBottom: Math.max(5, Math.round(6.5 * fontScale)),
        lineHeight: 1.3,
      }}
    >
      <span className="font-bold" style={{ color: INK }}>
        {label}
      </span>
      <span className="font-bold" style={{ color: INK }}>
        :
      </span>
      <span className="font-semibold pl-0.5" style={{ color: INK }}>
        {value || ""}
      </span>
    </div>
  );

  return (
    <div
      id={printId}
      className={`certificate-sheet relative mx-auto select-none overflow-hidden bg-white shadow-2xl ${className}`}
      style={{
        width: 1454,
        height: 2048,
        minWidth: 1454,
        minHeight: 2048,
      }}
    >
      {/* Outside-only floral SVG border */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={borderSrc}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-fill"
        draggable={false}
      />

      {/* Outer padding = floral inset so INNER FRAME touches outside border */}
      <div
        className="relative z-10 box-border h-full w-full"
        style={{
          paddingTop: padT,
          paddingBottom: padB,
          paddingLeft: padL,
          paddingRight: padR,
        }}
      >
        {/* ===== INNER FRAME — flush against floral inner edge ===== */}
        <div
          className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white"
          style={{
            border: `2.5px solid ${FRAME}`,
            outline: `1.5px solid ${FRAME}`,
            outlineOffset: -5,
            padding: "16px 18px 14px",
          }}
        >
          {/* ================= HEADER (official blank UI — editable) ================= */}
          <div className="shrink-0" style={{ marginBottom: headerGap }}>
            <div className="flex items-start gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoSrc}
                alt="IVESDC"
                className="object-contain shrink-0"
                style={{
                  height: data.logoHeight || 86,
                  width: data.logoWidth || 175,
                  marginTop: 2,
                }}
                draggable={false}
              />

              <div className="flex-1 min-w-0 text-center pt-1">
                <h1
                  className="font-black uppercase leading-[1.12] tracking-[0.01em]"
                  style={{
                    ...sans,
                    color: TITLE_BLUE,
                    fontSize: `${data.titleFontSize || 22}px`,
                  }}
                >
                  {titleLines.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </h1>

                {/* Orange swallowtail ribbon */}
                <div className="mx-auto mt-2.5 flex justify-center">
                  <div
                    className="relative inline-flex items-center justify-center px-9 py-[5px] text-center text-white font-bold shadow-sm"
                    style={{
                      ...sans,
                      fontSize: "12.5px",
                      letterSpacing: "0.02em",
                      background: `linear-gradient(180deg, #F78B2D 0%, ${RIBBON} 55%, #D14E00 100%)`,
                      clipPath:
                        "polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)",
                      minWidth: 400,
                    }}
                  >
                    {data.tagline || "Building a Skilled and Self-Reliant Nation"}
                  </div>
                </div>

                {/* 3-line accreditation — Live Editor editable */}
                <div
                  className="mt-2 mx-auto max-w-[880px] space-y-[2px] text-[9.5px] font-semibold leading-snug"
                  style={{ ...sans, color: INK }}
                >
                  <p>
                    {data.accreditationLine1 ||
                      "An Autonomous Body Registered under Section 8 of the Companies Act, 2013,"}
                  </p>
                  <p>
                    {data.accreditationLine2 ||
                      "Ministry of Corporate Affairs, Government of India, ISO 21001:2018 & ISO 9001:2015 Certified Organization"}
                  </p>
                  <p>
                    Verify this Certificate by Scan QR Code or Log on:{" "}
                    {data.verificationWebsite || "www.iveskillcouncil.edu.in"}, Mail:
                    {data.verificationEmail || "official.iveskillcouncil@gmail.com"}
                  </p>
                </div>
              </div>
            </div>

            {/* Dark NSQF bar */}
            <div
              className="mt-3 w-full px-2 py-[6px] text-center text-[10px] font-semibold leading-tight text-white"
              style={{ ...sans, backgroundColor: TABLE_HEAD }}
            >
              IVESDC Which Provides vocational Education &amp; Skill Development Training of NSQF
              aligned Courses by MSDE, Govt. of India
            </div>
          </div>

          {/* ================= TITLE BADGE + IDS ================= */}
          <div className="shrink-0 mt-3 mb-3">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="text-[13px] font-bold" style={{ ...serif, color: INK }}>
                Marksheet No.{" "}
                <span className="font-semibold tracking-wide" style={sans}>
                  {marksheetNo}
                </span>
              </div>

              <div className="flex justify-center px-1">
                {data.customBannerUrl &&
                !data.customBannerUrl.includes("res-statement-banner") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.customBannerUrl}
                    alt="STATEMENT OF MARKS"
                    style={{
                      height: data.bannerHeight || 48,
                      width: data.bannerWidth || 340,
                      maxWidth: "100%",
                    }}
                    className="object-contain select-none drop-shadow-sm"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="relative flex items-center justify-center px-9 py-2 text-white"
                    style={{
                      ...serif,
                      backgroundColor: INK,
                      borderRadius: 8,
                      border: "1.5px solid #C9A84C",
                      boxShadow: "inset 0 0 0 1px rgba(201,168,76,0.35)",
                      minWidth: 300,
                      height: data.bannerHeight || 48,
                    }}
                  >
                    <span
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-[#C9A84C] text-[13px] leading-none"
                      aria-hidden
                    >
                      ❦
                    </span>
                    <span className="text-[14px] font-black uppercase tracking-[0.14em]">
                      Statement of Marks
                    </span>
                    <span
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#C9A84C] text-[13px] leading-none"
                      aria-hidden
                    >
                      ❦
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right text-[13px] font-bold" style={{ ...serif, color: INK }}>
                Enrollment No. :{" "}
                <span className="font-semibold tracking-wide" style={sans}>
                  {enrollmentNo}
                </span>
              </div>
            </div>
          </div>

          {/* ================= STUDENT BOX + PHOTO ================= */}
          <div
            className="shrink-0 flex items-stretch gap-0"
            style={{
              marginBottom: contentGap + 4,
              border: `1.5px solid ${FRAME}`,
            }}
          >
            <div className="flex-1 min-w-0 px-3 py-2.5">
              <FieldRow label="Name of Student" value={data.studentName} />
              <FieldRow label="D/S/O (Father Name)" value={data.fatherName} />
              <FieldRow label="D/S/O (Mother Name)" value={data.motherName} />
              <FieldRow
                label="Student Registration No."
                value={data.registrationNumber || enrollmentNo}
              />
              <FieldRow label="Course Completed" value={data.courseName} />
              <FieldRow label="Training Period" value={trainingPeriod} />
              <FieldRow label="Date of Issue" value={data.issueDate} />
            </div>

            {/* Photo + small barcode box under photo (blank-form) */}
            <div
              className="shrink-0 flex flex-col border-l"
              style={{ borderColor: FRAME, width: (data.photoWidth || 128) + 16 }}
            >
              <div
                className="overflow-hidden bg-white"
                style={{
                  width: data.photoWidth || 128,
                  height: data.photoHeight || 158,
                  margin: "8px 8px 4px",
                  border: `1.5px solid ${FRAME}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.photoUrl || "/cert/sample-student-photo.png"}
                  alt="Student"
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
              <div
                className="mx-2 mb-2 flex flex-1 items-center justify-center overflow-hidden bg-white"
                style={{
                  minHeight: 48,
                  border: `1.5px solid ${FRAME}`,
                }}
              >
                <EnrollmentBarcode
                  enrollmentNo={enrollmentNo}
                  words={data.barcodeTextWords}
                  showLabel={false}
                  barcodeHeight={Math.round(28 * fontScale)}
                  color={INK}
                  showWords={false}
                  align="center"
                  containerWidth={(data.photoWidth || 128) - 8}
                />
              </div>
            </div>
          </div>

          {/* ================= MARKS TABLE ================= */}
          <div className="shrink-0" style={{ marginBottom: contentGap + 4 }}>
            <table
              className="w-full border-collapse"
              style={{
                ...sans,
                fontSize: `${tableFont}px`,
                border: `2px solid ${TABLE_HEAD}`,
              }}
            >
              <thead>
                <tr className="text-white" style={{ backgroundColor: TABLE_HEAD }}>
                  <th
                    rowSpan={2}
                    className="border px-1 py-1.5 align-middle font-black uppercase tracking-wide"
                    style={{ width: 56, fontSize: `${tableHeaderFont}px`, borderColor: TABLE_HEAD }}
                  >
                    SR NO.
                  </th>
                  <th
                    rowSpan={2}
                    className="border px-1 py-1.5 align-middle font-black uppercase tracking-wide"
                    style={{ width: 100, fontSize: `${tableHeaderFont}px`, borderColor: TABLE_HEAD }}
                  >
                    SUBJECT CODE
                  </th>
                  <th
                    rowSpan={2}
                    className="border px-2 py-1.5 align-middle font-black uppercase tracking-wide"
                    style={{ fontSize: `${tableHeaderFont}px`, borderColor: TABLE_HEAD }}
                  >
                    SUBJECTS
                  </th>
                  <th
                    colSpan={2}
                    className="border px-1 py-1 text-center font-black uppercase tracking-wide"
                    style={{ fontSize: `${tableHeaderFont}px`, borderColor: TABLE_HEAD }}
                  >
                    MARKS
                  </th>
                  <th
                    rowSpan={2}
                    className="border px-1 py-1.5 align-middle font-black uppercase tracking-wide"
                    style={{ width: 120, fontSize: `${tableHeaderFont}px`, borderColor: TABLE_HEAD }}
                  >
                    PERCENTAGE (%)
                  </th>
                </tr>
                <tr className="text-white" style={{ backgroundColor: TABLE_SUB }}>
                  <th
                    className="border px-1 py-1 text-center font-bold uppercase"
                    style={{ width: 110, fontSize: `${tableSubHeaderFont}px`, borderColor: TABLE_HEAD }}
                  >
                    MAXIMUM MARKS
                  </th>
                  <th
                    className="border px-1 py-1 text-center font-bold uppercase"
                    style={{ width: 110, fontSize: `${tableSubHeaderFont}px`, borderColor: TABLE_HEAD }}
                  >
                    OBTAINED MARKS
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub, idx) => {
                  const pct =
                    sub.totalMax > 0
                      ? Math.round((sub.totalObtained / sub.totalMax) * 100)
                      : 0;
                  return (
                    <tr key={idx} className="bg-white">
                      <td
                        className="border px-1 py-1.5 text-center font-semibold"
                        style={{ color: INK, borderColor: TABLE_HEAD }}
                      >
                        {idx + 1}
                      </td>
                      <td
                        className="border px-1 py-1.5 text-center font-semibold"
                        style={{ color: INK, borderColor: TABLE_HEAD }}
                      >
                        {sub.code || `SUB-${String(idx + 1).padStart(2, "0")}`}
                      </td>
                      <td
                        className="border px-2 py-1.5 text-left font-medium"
                        style={{ color: INK, borderColor: TABLE_HEAD }}
                      >
                        {sub.name}
                      </td>
                      <td
                        className="border px-1 py-1.5 text-center font-semibold"
                        style={{ color: INK, borderColor: TABLE_HEAD }}
                      >
                        {sub.totalMax}
                      </td>
                      <td
                        className="border px-1 py-1.5 text-center font-semibold"
                        style={{ color: INK, borderColor: TABLE_HEAD }}
                      >
                        {sub.totalObtained}
                      </td>
                      <td
                        className="border px-1 py-1.5 text-center font-semibold"
                        style={{ color: INK, borderColor: TABLE_HEAD }}
                      >
                        {sub.grade || `${pct}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ================= FOOTER — blank-form layout ================= */}
          <div className="mt-auto shrink-0 flex flex-col" style={{ gap: 10 }}>
            <div className="flex items-start justify-between gap-6">
              {/* Left: Grade System + ATC */}
              <div className="flex-1 min-w-0 max-w-[480px]">
                <div className="relative mb-3 w-[260px]">
                  <div
                    className="absolute -top-2.5 left-3 z-10 rounded px-3 py-0.5 text-[9px] font-black uppercase tracking-wide text-white"
                    style={{ backgroundColor: TABLE_HEAD }}
                  >
                    GRADE SYSTEM
                  </div>
                  <div
                    className="rounded border bg-white px-3 pt-3.5 pb-2"
                    style={{ ...sans, fontSize: `${boxFont}px`, borderColor: FRAME }}
                  >
                    {gradeSystem.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[30px_12px_1fr] items-baseline leading-snug"
                        style={{ color: INK }}
                      >
                        <span className="font-black">{item.grade}</span>
                        <span className="font-bold">:</span>
                        <span className="font-semibold">
                          {item.label} ({item.range})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1" style={{ ...sans, fontSize: `${footerFont}px` }}>
                  <p className="font-bold leading-snug" style={{ color: INK }}>
                    Authorised Training Centre (ATC) Name :{" "}
                    <span className="font-semibold">{data.atcName || data.trainingCentreName}</span>
                  </p>
                  <p className="font-bold leading-snug" style={{ color: INK }}>
                    ATC Code : <span className="font-semibold">{data.atcCode}</span>
                  </p>
                  <p className="font-bold leading-snug" style={{ color: INK }}>
                    ATC Address :{" "}
                    <span className="font-semibold">
                      {data.franchiseAddress || data.trainingCentre}
                    </span>
                  </p>
                </div>
              </div>

              {/* Right: RESULT strip + gov text */}
              <div className="flex w-[340px] shrink-0 flex-col items-end gap-2">
                <div className="flex w-full items-stretch">
                  <div
                    className="flex items-center justify-center px-4 py-2 text-[13px] font-black uppercase tracking-[0.14em] text-white"
                    style={{ backgroundColor: TABLE_HEAD, minWidth: 100 }}
                  >
                    RESULT
                  </div>
                  <div
                    className="flex flex-1 items-center justify-center gap-2 border border-l-0 px-3 py-2"
                    style={{ borderColor: TABLE_HEAD }}
                  >
                    <span
                      className="font-black tracking-wider text-[#107C41] leading-none"
                      style={{ fontSize: `${Math.round(18 * fontScale)}px` }}
                    >
                      {data.status || "PASS"}
                    </span>
                    <span
                      className="font-black leading-none"
                      style={{ color: INK, fontSize: `${Math.round(15 * fontScale)}px` }}
                    >
                      {data.grade || "A+"} · {displayPercent}%
                    </span>
                  </div>
                </div>

                <p
                  className="w-full text-right text-[8px] font-semibold leading-snug"
                  style={{ ...sans, color: INK }}
                >
                  {(
                    data.govOrderText ||
                    "Under The General Adm. Vahivat Dept. Govt. of Gujarat Certificate According to Letter No. CRR - 10 - 2007 - 120320. G.P. New Sachivalaya Gandhinagar date: 13-8-2008"
                  )
                    .split("\n")
                    .map((line, i) => (
                      <span key={i} className="block">
                        {line}
                      </span>
                    ))}
                </p>
              </div>
            </div>

            {/* Signatures row */}
            <div className="flex items-end justify-between gap-4 pt-2">
              <div className="flex w-[220px] flex-col items-center">
                <div className="mb-0.5 h-10 w-full" />
                <div
                  className="w-full border-t pt-0.5 text-center"
                  style={{ borderColor: FRAME }}
                >
                  <span className="text-[11px] font-bold" style={{ ...sans, color: INK }}>
                    Examination Coordinator
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center px-2">
                <div
                  className="mb-1 inline-block rounded px-3 py-0.5 text-[9px] font-black uppercase tracking-wide text-white"
                  style={{ backgroundColor: TABLE_HEAD }}
                >
                  REGISTERED OFFICE
                </div>
                <p
                  className="max-w-[340px] text-center text-[8.5px] font-semibold leading-snug"
                  style={{ ...sans, color: INK }}
                >
                  {data.registeredOffice ||
                    "F-107, Dev Krishna Residency, Gunsada, Sub. Dist. Ukai, Dist. Tapi, Gujarat - 394680"}
                </p>
              </div>

              <div className="flex w-[220px] flex-col items-center">
                <div
                  className="relative mb-0.5 flex items-end justify-center"
                  style={{ height: Math.max(stampPx, directorSigPx) + 6, width: 130 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.stampUrl || "/cert/stamp-blue.png?v=clean"}
                    alt="Official Stamp"
                    style={{ height: stampPx, width: stampPx }}
                    className="object-contain opacity-90"
                    draggable={false}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={data.directorSignatureUrl || "/cert/sig-director.png"}
                      alt="Director Signature"
                      style={{ height: directorSigPx }}
                      className="w-auto object-contain"
                      draggable={false}
                    />
                  </div>
                </div>
                <div
                  className="w-full border-t pt-0.5 text-center"
                  style={{ borderColor: FRAME }}
                >
                  <span className="text-[11px] font-bold" style={{ ...sans, color: INK }}>
                    {data.directorTitle || "Director Signature"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
