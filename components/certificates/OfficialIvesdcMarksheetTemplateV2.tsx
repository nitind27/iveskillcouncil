"use client";

import React, { type CSSProperties } from "react";
import type { CertificateDemoData, MarksheetSubject } from "./demo/types";
import EnrollmentBarcode from "./EnrollmentBarcode";
import CertificateQRCode from "./CertificateQRCode";

interface Props {
  data: CertificateDemoData;
  className?: string;
  printId?: string;
}

/** Result Form 2 — matches uploaded blank Statement of Marks form */
const INK = "#1A1A1A";
const TITLE_BLUE = "#1A3673";
const TABLE_HEAD = "#4A4A4A";
const TABLE_SUB = "#5A5A5A";
const FRAME = "#6B6B6B";

const sans: CSSProperties = {
  fontFamily: "Arial, Helvetica, -apple-system, BlinkMacSystemFont, sans-serif",
};
const serif: CSSProperties = {
  fontFamily: "Georgia, 'Times New Roman', Times, serif",
};

/**
 * Statement of Marks — Result Form 2
 * Pixel-faithful to the official blank form:
 * floral outside border, geometric watermark, compact table rows,
 * photo + Code 128 barcode under photo, editable logo/fonts via Live Editor.
 */
export default function OfficialIvesdcMarksheetTemplateV2({
  data,
  className = "",
  printId = "official-ivesdc-marksheet-v2",
}: Props) {
  // A4 portrait canvas (same as Official Cert — reliable print fit)
  const A4_W = 1054;
  const A4_H = 1492;

  const borderUrl = data.customBorderUrl || "";
  const isDesignBorder =
    borderUrl.includes("Design.svg") || borderUrl.includes("DESIGN_BORDER");

  /**
   * Design.svg / floral frames have thick ornaments.
   * Content + watermark use the same safe inset so nothing sits on the lace.
   */
  const BORDER_SAFE = isDesignBorder ? 110 : 72;
  const defaultPad = isDesignBorder ? 110 : 72;
  const padT = Math.max(BORDER_SAFE, data.paddingTop ?? defaultPad);
  const padB = Math.max(BORDER_SAFE + (isDesignBorder ? 6 : 0), data.paddingBottom ?? defaultPad);
  const padL = Math.max(BORDER_SAFE, data.paddingLeft ?? defaultPad);
  const padR = Math.max(BORDER_SAFE, data.paddingRight ?? defaultPad);
  const contentW = Math.max(280, A4_W - padL - padR);
  const contentH = Math.max(400, A4_H - padT - padB);
  const headerGap = data.headerSpacing ?? 4;
  const blockGap = data.contentSpacing ?? 6;
  const colW = Math.floor(contentW / 3);

  const fontScale = (data.innerFontScale || 100) / 100;
  const candidateFont = Math.round((data.candidateFontSize || 12) * fontScale * 10) / 10;
  const tableFont = Math.round((data.tableFontSize || 10.5) * fontScale * 10) / 10;
  const tableHeaderFont = Math.max(8.5, Math.round(tableFont * 0.95));
  const tableSubHeaderFont = Math.max(7.5, Math.round(tableFont * 0.78));
  const footerFont = Math.max(8, Math.round((data.atcFontSize || 9) * fontScale));
  const govFont = Math.max(7, Math.round((data.govOrderFontSize || 8) * fontScale * 10) / 10);
  const officeFont = Math.max(6.5, Math.round((data.registeredOfficeFontSize || 7.5) * fontScale * 10) / 10);
  const signLabelFont = Math.max(8, Math.round((data.signLabelFontSize || 10.5) * fontScale * 10) / 10);
  const gradeSysFont = Math.max(8, Math.round((data.gradeSystemFontSize || 9.5) * fontScale * 10) / 10);
  const resultValFont = Math.max(10, Math.round((data.resultFontSize || 13) * fontScale * 10) / 10);
  const gradeColW = Math.max(22, Math.round(gradeSysFont * 2.3));
  const gradeBoxW = Math.min(
    Math.round(contentW * 0.52),
    Math.max(240, Math.round(gradeSysFont * 26))
  );

  /** Fixed IVESDC header SVG — height live-editable, capped so footer stays inside border */
  const headerSrc =
    data.customHeaderUrl || "/certificates/IVESDC_header.svg";
  const headerMax = isDesignBorder ? 168 : 220;
  const headerH = Math.max(80, Math.min(headerMax, data.headerHeight || 128));

  const photoW = Math.max(50, Math.min(Math.round(contentW * 0.22), data.photoWidth || 108));
  const photoH = Math.max(60, Math.min(Math.round(contentH * 0.2), data.photoHeight || 132));
  /**
   * Photo column must be wide enough for full "Enrollment No. : {digits}" + barcode
   * (never truncate enrollment; never spill past Design border).
   */
  const photoColW = Math.min(
    Math.round(contentW * 0.34),
    Math.max(photoW + 36, 230)
  );
  const barcodeColW = Math.max(140, photoColW - 18);
  /** Barcode height independent of QR slider */
  const barcodeH = Math.max(30, Math.min(46, Math.round(barcodeColW * 0.16)));

  /** QR / stamp capped to column budget so they never clip into the lace border */
  const qrMax = Math.min(isDesignBorder ? 92 : 130, Math.round(colW * 0.55));
  const qrPx = Math.max(40, Math.min(qrMax, data.qrCodeSize || 72));

  const stampMax = Math.min(isDesignBorder ? 100 : 150, colW - 24);
  const stampPx = Math.max(40, Math.min(stampMax, data.stampSize || 84));
  const directorSigPx = Math.max(
    18,
    Math.min(Math.round(stampPx * 0.55), data.directorSigHeight || 34)
  );

  const bannerH = Math.max(28, Math.min(72, data.bannerHeight || 42));
  const bannerW = Math.min(
    Math.round(contentW * 0.4),
    Math.max(150, data.bannerWidth || Math.round(bannerH * (640 / 72)))
  );
  const bannerSrc =
    data.customBannerUrl || "/cert/statement-of-marks-banner.svg";
  const verifyWebsite = data.verificationWebsite || "www.iveskillcouncil.edu.in";
  const nsqfFont = Math.max(8.2, Math.round(8.8 * fontScale * 10) / 10);
  const rowH = Math.max(22, Math.round(28 * fontScale));
  /** Verify column = QR + hologram; keep under ~42% of content width */
  const verifyColW = Math.min(
    Math.round(contentW * 0.42),
    Math.max(qrPx + 96, 190)
  );
  const resultBoxW = Math.min(268, Math.round(contentW * 0.34));

  const defaultSubjects: MarksheetSubject[] = [
    { code: "SUB-01", name: "Fundamentals of Computer", maxTheory: 100, marksTheory: 0, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 0, grade: "" },
    { code: "SUB-02", name: "Operating System (Windows)", maxTheory: 100, marksTheory: 0, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 0, grade: "" },
    { code: "SUB-03", name: "MS Word", maxTheory: 100, marksTheory: 0, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 0, grade: "" },
    { code: "SUB-04", name: "MS Excel", maxTheory: 100, marksTheory: 0, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 0, grade: "" },
    { code: "SUB-05", name: "MS PowerPoint", maxTheory: 100, marksTheory: 0, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 0, grade: "" },
    { code: "SUB-06", name: "Internet & Email", maxTheory: 100, marksTheory: 0, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 0, grade: "" },
    { code: "SUB-07", name: "Digital Financial Literacy", maxTheory: 100, marksTheory: 0, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 0, grade: "" },
    { code: "SUB-08", name: "Practical / Project Work", maxTheory: 100, marksTheory: 0, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 0, grade: "" },
  ];

  const subjects =
    data.subjects && data.subjects.length > 0 ? data.subjects : defaultSubjects;
  /** Prefer live subject rows; pad to at least 5 blank lines for form look */
  const displaySubjects = [...subjects].slice(0, 8);
  while (displaySubjects.length < 5) {
    displaySubjects.push({
      code: "",
      name: "",
      maxTheory: 0,
      marksTheory: 0,
      maxPractical: 0,
      marksPractical: 0,
      totalMax: 0,
      totalObtained: 0,
      grade: "",
    });
  }

  const totalMax = displaySubjects.reduce((s, r) => s + (Number(r.totalMax) || 0), 0);
  const totalGot = displaySubjects.reduce((s, r) => s + (Number(r.totalObtained) || 0), 0);
  const hasMarks = totalGot > 0 || (data.marksPercent != null && Number(data.marksPercent) > 0);
  const displayPercent =
    data.marksPercent != null && Number(data.marksPercent) > 0
      ? Number(data.marksPercent).toFixed(2)
      : totalMax > 0 && totalGot > 0
        ? ((totalGot / totalMax) * 100).toFixed(2)
        : "";

  const gradeSystem =
    data.gradeSystem && data.gradeSystem.length > 0
      ? data.gradeSystem.filter((g) => g.grade !== "D").slice(0, 4)
      : [
          { grade: "A+", label: "Excellent", range: "85% & Above" },
          { grade: "A", label: "Very Good", range: "70% to 84%" },
          { grade: "B", label: "Good", range: "55% to 69%" },
          { grade: "C", label: "Average", range: "40% to 54%" },
        ];

  const marksheetNo = data.certificateNumber || data.serialNumber || "";
  const enrollmentNo = data.registrationNumber || data.rollNumber || "";
  const barcodeValue =
    data.barcodeNumber ||
    data.registrationNumber ||
    data.rollNumber ||
    enrollmentNo ||
    "";
  const trainingPeriod =
    data.duration ||
    (data.trainingStart && data.trainingEnd
      ? `${data.trainingStart} to ${data.trainingEnd}`
      : "");

  const activeBorder = data.borderStyle || "guilloche";
  const borderSrc =
    data.customBorderUrl ||
    (activeBorder === "ornate"
      ? "/cert/cert-border-pristine.png?v=clean"
      : "/border/ONLY_OUTSIDE_FLORAL_BORDER.svg");
  const watermarkType = data.watermarkType ?? "shadow-flower";
  const watermarkOpacity =
    data.watermarkOpacity !== undefined ? data.watermarkOpacity : 0.55;
  const bgPatternSrc =
    data.backgroundPatternUrl || "/certificates/bgcert.png";

  const FieldRow = ({
    label,
    value,
    last,
  }: {
    label: string;
    value?: string;
    last?: boolean;
  }) => (
    <div
      className="grid items-baseline"
      style={{
        ...sans,
        fontSize: `${candidateFont}px`,
        gridTemplateColumns: `${Math.round(188 * (candidateFont / 12))}px 8px 1fr`,
        marginBottom: last ? 0 : Math.max(3, Math.round(4.5 * fontScale)),
        lineHeight: 1.25,
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
        width: A4_W,
        height: A4_H,
        minWidth: A4_W,
        minHeight: A4_H,
        maxWidth: A4_W,
        maxHeight: A4_H,
        ...sans,
      }}
      data-paper="A4-portrait-170gsm"
    >
      {/* Authentic floral / custom border (outer frame) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={borderSrc}
        alt="Marksheet Border"
        className="pointer-events-none absolute inset-0 z-[2] h-full w-full object-fill"
        draggable={false}
      />

      {/* Shadow flower geometric background (bgcert) — inside floral frame */}
      {watermarkType !== "none" && (
        <div
          className="pointer-events-none absolute z-[1] overflow-hidden"
          style={{
            top: padT,
            right: padR,
            bottom: padB,
            left: padL,
            opacity: watermarkOpacity,
          }}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgPatternSrc}
            alt=""
            className="h-full w-full object-cover"
            style={{
              // PNG already has soft embossed shadow — keep natural look
              mixBlendMode: "multiply",
            }}
            draggable={false}
          />
        </div>
      )}

      {/* Soft white wash so text stays crisp over pattern */}
      {watermarkType !== "none" && (
        <div
          className="pointer-events-none absolute z-[1]"
          style={{
            top: padT,
            right: padR,
            bottom: padB,
            left: padL,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.22) 100%)",
          }}
          aria-hidden
        />
      )}

      {/* Content — same safe inset as watermark (inside border ornament) */}
      <div
        className="relative z-[3] flex h-full min-h-0 flex-col overflow-hidden"
        style={{
          paddingTop: padT,
          paddingBottom: padB,
          paddingLeft: padL,
          paddingRight: padR,
          boxSizing: "border-box",
        }}
      >
        {/* ===== FIXED HEADER: IVESDC_header.svg (height live-editable) ===== */}
        <div className="shrink-0" style={{ marginBottom: headerGap }}>
          <div className="flex w-full items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={headerSrc}
              alt="Institute of Vocational Education and Skill Development Council"
              className="block select-none object-contain object-center"
              style={{
                width: "100%",
                maxWidth: contentW,
                height: headerH,
                maxHeight: headerH,
              }}
              draggable={false}
            />
          </div>

          {/* Full-width NSQF bar */}
          <div
            className="w-full px-2 py-[5px] text-center leading-tight text-white"
            style={{
              ...sans,
              marginTop: Math.max(4, Math.round(headerGap * 0.75)),
              backgroundColor: "#555555",
              fontSize: `${nsqfFont}px`,
              fontWeight: 600,
            }}
          >
            IVESDC Which Provides vocational Education &amp; Skill Development Training of NSQF
            aligned Courses by MSDE, Govt. of India
          </div>
        </div>

        {/* ===== TITLE ROW ===== */}
        <div className="shrink-0" style={{ marginTop: blockGap, marginBottom: blockGap }}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div
              className="font-bold"
              style={{ ...serif, color: INK, fontSize: `${Math.max(9, candidateFont - 1)}px` }}
            >
              Marksheet No. :{" "}
              <span className="font-semibold tracking-wide" style={sans}>
                {marksheetNo}
              </span>
            </div>

            {/* Authentic ornate STATEMENT OF MARKS cartouche (SVG / custom upload) */}
            <div className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerSrc}
                alt="STATEMENT OF MARKS"
                style={{
                  height: bannerH,
                  width: bannerW,
                  maxWidth: "100%",
                }}
                className="object-contain select-none drop-shadow-sm"
                draggable={false}
              />
            </div>

            <div
              className="text-right font-bold"
              style={{ ...serif, color: INK, fontSize: `${Math.max(9, candidateFont - 1)}px` }}
            >
              Enrollment No. :{" "}
              <span className="font-semibold tracking-wide" style={sans}>
                {enrollmentNo}
              </span>
            </div>
          </div>
        </div>

        {/* ===== STUDENT BOX ===== */}
        <div
          className="flex shrink-0 items-stretch overflow-hidden"
          style={{
            marginBottom: blockGap,
            border: `1.2px solid ${FRAME}`,
            borderRadius: 8,
            background: "rgba(236,236,236,0.55)",
            maxWidth: contentW,
          }}
        >
          <div className="min-w-0 flex-1 overflow-hidden px-3 py-2">
            <FieldRow label="Name of Student" value={data.studentName} />
            <FieldRow label="D/S/O (Father Name)" value={data.fatherName} />
            <FieldRow label="D/S/O (Mother Name)" value={data.motherName} />
            <FieldRow
              label="Student Registration No."
              value={data.registrationNumber || enrollmentNo}
            />
            <FieldRow label="Course Completed" value={data.courseName} />
            <FieldRow label="Training Period" value={trainingPeriod} />
            <FieldRow label="Date of Issue" value={data.issueDate} last />
          </div>

          {/* Photo + barcode — locked to photoColW (never wider than student box) */}
          <div
            className="flex shrink-0 flex-col items-center justify-start gap-1.5 overflow-hidden px-2 py-2"
            style={{
              width: photoColW,
              maxWidth: photoColW,
              boxSizing: "border-box",
            }}
          >
            <div
              className="overflow-hidden bg-white"
              style={{
                width: Math.min(photoW, photoColW - 16),
                height: photoH,
                maxWidth: "100%",
                border: `1.2px solid ${FRAME}`,
                borderRadius: 3,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.photoUrl || "/nophoto.jpeg"}
                alt="Student"
                className="h-full w-full object-cover"
                draggable={false}
              />
            </div>
            <EnrollmentBarcode
              key={`enr-bc-${barcodeValue}`}
              enrollmentNo={barcodeValue}
              words={data.barcodeTextWords}
              showLabel={true}
              showWords={true}
              label="Enrollment No. :"
              barcodeHeight={barcodeH}
              containerWidth={barcodeColW}
              color={INK}
              className="max-w-full"
            />
          </div>
        </div>

        {/* ===== MARKS TABLE — compact fixed rows (NOT stretched) ===== */}
        <div className="shrink-0" style={{ ...sans, fontSize: `${tableFont}px`, marginBottom: blockGap }}>
          <table
            className="w-full border-collapse"
            style={{ border: `1.4px solid ${TABLE_HEAD}`, tableLayout: "fixed" }}
          >
            <thead>
              <tr className="text-white" style={{ backgroundColor: TABLE_HEAD }}>
                <th
                  rowSpan={2}
                  className="border px-0.5 py-0.5 align-middle font-black uppercase"
                  style={{
                    width: 52,
                    fontSize: `${tableHeaderFont}px`,
                    borderColor: TABLE_HEAD,
                    height: Math.round(rowH * 0.85),
                  }}
                >
                  SR NO.
                </th>
                <th
                  rowSpan={2}
                  className="border px-1.5 py-0.5 align-middle font-black uppercase"
                  style={{ fontSize: `${tableHeaderFont}px`, borderColor: TABLE_HEAD }}
                >
                  SUBJECTS
                </th>
                <th
                  colSpan={2}
                  className="border px-0.5 py-0.5 text-center font-black uppercase"
                  style={{ fontSize: `${tableHeaderFont}px`, borderColor: TABLE_HEAD }}
                >
                  MARKS
                </th>
                <th
                  rowSpan={2}
                  className="border px-0.5 py-0.5 align-middle font-black uppercase"
                  style={{
                    width: 100,
                    fontSize: `${tableHeaderFont}px`,
                    borderColor: TABLE_HEAD,
                  }}
                >
                  PERCENTAGE (%)
                </th>
              </tr>
              <tr className="text-white" style={{ backgroundColor: TABLE_SUB }}>
                <th
                  className="border px-0.5 py-0.5 text-center font-bold uppercase"
                  style={{
                    width: 108,
                    fontSize: `${tableSubHeaderFont}px`,
                    borderColor: TABLE_HEAD,
                  }}
                >
                  MAXIMUM MARKS
                </th>
                <th
                  className="border px-0.5 py-0.5 text-center font-bold uppercase"
                  style={{
                    width: 108,
                    fontSize: `${tableSubHeaderFont}px`,
                    borderColor: TABLE_HEAD,
                  }}
                >
                  OBTAINED MARKS
                </th>
              </tr>
            </thead>
            <tbody>
              {displaySubjects.map((sub, idx) => {
                const empty = !sub.name;
                const pct =
                  !empty && sub.totalMax > 0 && hasMarks
                    ? Math.round((sub.totalObtained / sub.totalMax) * 100)
                    : "";
                return (
                  <tr key={idx} className="bg-white" style={{ height: rowH }}>
                    <td
                      className="border px-0.5 text-center font-semibold align-middle"
                      style={{
                        color: INK,
                        borderColor: TABLE_HEAD,
                        height: rowH,
                        lineHeight: 1,
                      }}
                    >
                      {empty ? "" : idx + 1}
                    </td>
                    <td
                      className="border px-1.5 text-left font-medium align-middle"
                      style={{ color: INK, borderColor: TABLE_HEAD, lineHeight: 1.15 }}
                    >
                      {sub.name || ""}
                    </td>
                    <td
                      className="border px-0.5 text-center font-semibold align-middle"
                      style={{ color: INK, borderColor: TABLE_HEAD }}
                    >
                      {empty || !hasMarks ? "" : sub.totalMax || ""}
                    </td>
                    <td
                      className="border px-0.5 text-center font-semibold align-middle"
                      style={{ color: INK, borderColor: TABLE_HEAD }}
                    >
                      {empty || !hasMarks ? "" : sub.totalObtained || ""}
                    </td>
                    <td
                      className="border px-0.5 text-center font-semibold align-middle"
                      style={{ color: INK, borderColor: TABLE_HEAD }}
                    >
                      {empty || !hasMarks ? "" : sub.grade || (pct !== "" ? `${pct}%` : "")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* No mid-page stretch — blank form packs table → grade → footer tightly */}
        <div className="shrink-0" style={{ height: Math.max(6, blockGap) }} />

        {/* ===== GRADE + RESULT (same row as blank form) ===== */}
        <div
          className="flex shrink-0 items-start justify-between gap-4"
          style={{ marginBottom: blockGap }}
        >
          <div className="relative" style={{ width: gradeBoxW }}>
            <div
              className="absolute -top-[9px] left-1/2 z-10 -translate-x-1/2 rounded px-2.5 py-[2px] font-black uppercase tracking-[0.06em] text-white whitespace-nowrap"
              style={{
                backgroundColor: TABLE_HEAD,
                fontSize: `${Math.max(7, Math.round(gradeSysFont * 0.85))}px`,
              }}
            >
              GRADE SYSTEM
            </div>
            <div
              className="rounded-[7px] border bg-white/65 px-2.5 pt-3 pb-1.5"
              style={{
                ...sans,
                fontSize: `${gradeSysFont}px`,
                borderColor: "#6E6E6E",
                borderWidth: 1.25,
                color: TITLE_BLUE,
              }}
            >
              {gradeSystem.map((item, idx) => (
                <div
                  key={idx}
                  className="grid items-baseline leading-[1.35]"
                  style={{
                    gridTemplateColumns: `${gradeColW}px 10px 1fr`,
                  }}
                >
                  <span className="font-black">{item.grade}</span>
                  <span className="font-bold text-center">:</span>
                  <span className="font-bold whitespace-nowrap">
                    {item.label} ({item.range})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex shrink-0 items-stretch overflow-hidden rounded-[6px]"
            style={{ width: resultBoxW }}
          >
            <div
              className="flex items-center justify-center px-3 font-black uppercase tracking-[0.14em] text-white"
              style={{
                backgroundColor: TABLE_HEAD,
                minWidth: 86,
                fontSize: `${Math.max(9, Math.round(resultValFont * 0.85))}px`,
              }}
            >
              RESULT
            </div>
            <div
              className="flex flex-1 items-center justify-center border border-l-0 bg-white/90 px-2"
              style={{ borderColor: "#7A7A7A", minHeight: Math.max(34, resultValFont + 18) }}
            >
              {hasMarks ? (
                <span
                  className="font-black tracking-wide"
                  style={{ color: TITLE_BLUE, fontSize: `${resultValFont}px` }}
                >
                  {data.status || "PASS"}
                  {data.grade ? `  ${data.grade}` : ""}
                  {displayPercent ? `  ${displayPercent}%` : ""}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* ===== ATC + GOV TEXT + VERIFY QR (QR under RESULT / gov block) ===== */}
        <div
          className="flex shrink-0 items-start justify-between gap-3 overflow-hidden"
          style={{ marginBottom: blockGap, maxWidth: contentW }}
        >
          <div
            className="min-w-0 flex-1 space-y-[3px] overflow-hidden pr-1"
            style={{ ...sans, fontSize: `${footerFont}px`, color: TITLE_BLUE }}
          >
            <p className="font-bold leading-snug">
              Authorised Training Centre (ATC) Name :{" "}
              <span className="font-semibold">
                {data.atcName || data.trainingCentreName || ""}
              </span>
            </p>
            <p className="font-bold leading-snug">
              ATC.Code : <span className="font-semibold">{data.atcCode || ""}</span>
            </p>
            <p className="font-bold leading-snug">
              ATC Address :{" "}
              <span className="font-semibold">
                {data.franchiseAddress || data.trainingCentre || ""}
              </span>
            </p>
          </div>

          <div
            className="flex shrink-0 flex-col items-center overflow-hidden"
            style={{ width: verifyColW, maxWidth: verifyColW }}
          >
            {/* Dynamic QR (auto from enrollment) + manual hologram guide only (no upload) */}
            <div className="mb-1.5 flex w-full items-start justify-center gap-2.5 overflow-hidden">
              <CertificateQRCode
                key={`qr-${barcodeValue}-${data.certificateNumber || ""}-${qrPx}`}
                docType="marksheet"
                enrollmentNo={barcodeValue}
                certificateNo={data.certificateNumber || data.serialNumber || ""}
                studentName={data.studentName}
                verificationWebsite={verifyWebsite}
                size={qrPx}
                color="#000000"
                mode="marksheet"
                captionLine1="Scan QR Code to Verify"
                captionLine2="This Marksheet"
                showEnrollmentTag={false}
              />

              {/* Physical hologram — dash box only; sticker applied manually after print */}
              {data.showHologramGuide !== false && (
                <div
                  className="flex shrink-0 flex-col items-center select-none"
                  style={{ width: "23mm" }}
                >
                  <div
                    className="relative flex items-center justify-center bg-white"
                    style={{
                      width: "23mm",
                      height: "23mm",
                      minWidth: "23mm",
                      minHeight: "23mm",
                      border: `1.25px dashed #8A8A8A`,
                      borderRadius: 2,
                      boxSizing: "border-box",
                    }}
                    title="Paste physical hologram here — 23mm × 23mm (manual)"
                  >
                    <div
                      className="flex h-full w-full flex-col items-center justify-center px-0.5 text-center"
                      style={{ ...sans, color: "#7A7A7A" }}
                    >
                      <span
                        className="font-black uppercase leading-tight tracking-wide"
                        style={{ fontSize: "5.5pt" }}
                      >
                        Hologram
                      </span>
                      <span
                        className="mt-0.5 font-bold tabular-nums leading-none"
                        style={{ fontSize: "5pt" }}
                      >
                        23×23 mm
                      </span>
                      <span
                        className="mt-0.5 font-semibold leading-tight"
                        style={{ fontSize: "4.5pt" }}
                      >
                        Manual sticker
                      </span>
                    </div>
                  </div>
                  <span
                    className="mt-1.5 flex min-h-[22px] items-start justify-center text-center font-bold leading-tight"
                    style={{ ...sans, color: TITLE_BLUE, fontSize: "5.5pt" }}
                  >
                    Security Hologram
                  </span>
                </div>
              )}
            </div>

            <div
              className="w-full text-center font-bold leading-[1.35]"
              style={{ ...sans, color: TITLE_BLUE, fontSize: `${govFont}px` }}
            >
              {(
                data.govOrderText ||
                "Under The General Adm Vahivat Dept.\nGovt. of Gujarat Certificate According to\nLetter No. CRR - 10 - 2007 - 120320.\nG.P. New Sachivalaya Gandhinagar\ndate: 13-8-2008"
              )
                .split("\n")
                .map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
            </div>
          </div>
        </div>

        {/* ===== SIGNATURES / STAMP / REGISTERED OFFICE — 3 equal cols inside safe area ===== */}
        <div
          className="mt-auto grid shrink-0 grid-cols-3 items-end gap-2 overflow-hidden"
          style={{
            width: "100%",
            maxWidth: contentW,
            paddingTop: Math.max(4, blockGap),
            boxSizing: "border-box",
          }}
        >
          {/* Examination Coordinator */}
          <div className="flex min-w-0 flex-col items-center overflow-hidden px-0.5">
            <div
              className="mb-1 w-full"
              style={{ height: Math.max(28, Math.round(directorSigPx * 0.9)) }}
            />
            <div
              className="border-t-[1.5px]"
              style={{ borderColor: "#C4A35A", width: "78%" }}
            />
            <span
              className="mt-1 text-center font-bold leading-tight"
              style={{ ...sans, color: TITLE_BLUE, fontSize: `${signLabelFont}px` }}
            >
              Examination Coordinator
            </span>
          </div>

          {/* Registered Office */}
          <div className="mb-0.5 flex min-w-0 flex-col items-center overflow-hidden px-1">
            <div
              className="mb-1 inline-block rounded px-2.5 py-[3px] text-[7.5px] font-black uppercase tracking-[0.08em] text-white"
              style={{ backgroundColor: TABLE_HEAD }}
            >
              REGISTERED OFFICE
            </div>
            <p
              className="text-center font-bold leading-snug"
              style={{ ...sans, color: TITLE_BLUE, fontSize: `${officeFont}px` }}
            >
              {data.registeredOffice ||
                "F-107, Dev Krishna Residency, Gunsada, Sub. Dist. Ukai, Dist. Tapi, Gujarat - 394680"}
            </p>
          </div>

          {/* Director stamp + signature */}
          <div className="flex min-w-0 flex-col items-center overflow-hidden px-0.5">
            <div
              className="relative mb-1 flex items-end justify-center overflow-hidden"
              style={{
                height: Math.max(stampPx + 4, directorSigPx + 12, 48),
                width: "100%",
                maxWidth: stampPx + 12,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.stampUrl || "/cert/stamp-blue.png?v=clean"}
                alt="Director Stamp"
                style={{
                  height: stampPx,
                  width: stampPx,
                  maxWidth: "100%",
                  position: "absolute",
                  bottom: 2,
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
                className="object-contain opacity-95"
                draggable={false}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.directorSignatureUrl || "/cert/sig-director.png"}
                alt="Director Signature"
                style={{
                  height: directorSigPx,
                  maxWidth: Math.min(stampPx + 8, colW - 20),
                  position: "absolute",
                  bottom: Math.max(4, Math.round(stampPx * 0.08)),
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 2,
                }}
                className="w-auto object-contain"
                draggable={false}
              />
            </div>
            <div
              className="border-t-[1.5px]"
              style={{ borderColor: "#C4A35A", width: "78%" }}
            />
            <span
              className="mt-1 text-center font-bold leading-tight"
              style={{ ...sans, color: TITLE_BLUE, fontSize: `${signLabelFont}px` }}
            >
              {data.directorTitle || "Director Signature"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
