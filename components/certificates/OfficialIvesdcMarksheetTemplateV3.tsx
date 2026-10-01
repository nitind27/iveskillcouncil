"use client";

/**
 * Result Form 3 — Board-style professional Statement of Marks
 * Institutional header (logo + title + orange ribbon) · particulars · marks table · seals
 */
import React, { useId, type CSSProperties } from "react";
import { Cinzel, Libre_Baskerville, Montserrat, Source_Sans_3 } from "next/font/google";
import type { CertificateDemoData, MarksheetSubject } from "./demo/types";
import { performanceLabelFromPercent } from "./demo/types";
import EnrollmentBarcode from "./EnrollmentBarcode";
import CertificateQRCode from "./CertificateQRCode";

/**
 * Typography roles (certificate):
 * - fontInstitution → institute name (Montserrat)
 * - fontSerif → tagline / italic accents (Libre Baskerville)
 * - fontBody → labels, body, table text (Source Sans 3)
 * - fontDisplay → titles, section rails, key figures (Cinzel)
 */
const fontInstitution = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

const fontSerif = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const fontBody = Source_Sans_3({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const fontDisplay = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  display: "swap",
});

interface Props {
  data: CertificateDemoData;
  className?: string;
  printId?: string;
}

const A4_W = 1054;
const A4_H = 1492;
/** Content must clear the gold frame, inner hairline (27) and corner brackets (to 33). */
const FRAME_SAFE = 38;

/**
 * Official Result-3 palette — one source of truth
 * Navy / Gold / Parchment (no random whites)
 */
const C = {
  navy: "#0B1F3A",
  navyMid: "#163A5C",
  navyDeep: "#071426",
  ink: "#1C2430",
  muted: "#5A6573",
  gold: "#A07F2C",
  goldSoft: "#C9A84C",
  goldBright: "#E2C76A",
  goldPale: "#F3E6C0",
  orange: "#E07818",
  orangeHi: "#F0A04A",
  orangeLo: "#C45E0E",
  paper: "#FCF9F2",
  paperWarm: "#F4EEE4",
  panel: "#F7F3EB",
  panelWash: "rgba(250, 246, 238, 0.68)",
  rowA: "#FBF8F2",
  rowAWash: "rgba(252, 249, 243, 0.62)",
  rowB: "#EBE4D8",
  rowBWash: "rgba(236, 228, 214, 0.68)",
  tableHead: "#E8DFD0",
  tableHeadText: "#0B1F3A",
  sectionBand: "linear-gradient(180deg, #F6F0E6 0%, #E9E0D0 100%)",
  sectionBandText: "#0B1F3A",
  aggregate: "linear-gradient(90deg, rgba(232,223,200,0.88) 0%, rgba(243,230,192,0.9) 50%, rgba(226,232,242,0.85) 100%)",
  white: "#FFFFFF",
  rule: "rgba(11,31,58,0.16)",
  ruleSoft: "rgba(11,31,58,0.10)",
  navyWash: "rgba(11,31,58,0.045)",
  navyWashStrong: "rgba(11,31,58,0.075)",
  panelEdge: "1.25px solid #0B1F3A",
  panelInset: "inset 0 0 0 1px rgba(160,127,44,0.35)",
} as const;

/* Shorthand aliases used across JSX */
const NAVY = C.navyDeep;
const NAVY_MID = C.navyMid;
const HEADER_BLUE = C.navy;
const RIBBON_ORANGE = C.orange;
const GOLD = C.gold;
const GOLD_SOFT = C.goldSoft;
const GOLD_BRIGHT = C.goldBright;
const INK = C.ink;
const MUTED = C.muted;
const PAPER = C.paper;
const RULE = C.rule;

/** Same gold frame as Certificate of Completion. */
function Result3CertificateBorder() {
  const gradientId = `r3Gold${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const W = A4_W;
  const H = A4_H;
  const inset = 16;
  const stroke = 6;
  const hair = 27;
  const arm = 54;
  const corners: Array<[number, number, number, number]> = [
    [hair, hair, 1, 1],
    [W - hair, hair, -1, 1],
    [hair, H - hair, 1, -1],
    [W - hair, H - hair, -1, -1],
  ];

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.gold} />
          <stop offset="0.25" stopColor={C.goldSoft} />
          <stop offset="0.5" stopColor={C.gold} />
          <stop offset="0.75" stopColor={C.goldSoft} />
          <stop offset="1" stopColor={C.gold} />
        </linearGradient>
      </defs>
      <rect
        x={inset}
        y={inset}
        width={W - inset * 2}
        height={H - inset * 2}
        stroke={`url(#${gradientId})`}
        strokeWidth={stroke}
      />
      <rect
        x={hair}
        y={hair}
        width={W - hair * 2}
        height={H - hair * 2}
        stroke={C.goldSoft}
        strokeWidth={1}
        opacity={0.85}
      />
      {corners.map(([x, y, sx, sy], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
          <path d={`M0 ${arm} L0 0 L${arm} 0`} stroke={C.gold} strokeWidth={2.4} strokeLinecap="square" />
          <path d={`M5 ${arm - 14} L5 5 L${arm - 14} 5`} stroke={C.goldSoft} strokeWidth={1} />
          <rect x={-4.5} y={-4.5} width={9} height={9} fill={C.gold} transform="rotate(45)" />
          <rect x={-2} y={-2} width={4} height={4} fill={C.goldPale} transform="rotate(45)" />
          <circle cx={arm + 5} cy={0} r={1.8} fill={C.gold} />
          <circle cx={0} cy={arm + 5} r={1.8} fill={C.gold} />
        </g>
      ))}
    </svg>
  );
}

const sans: CSSProperties = {
  fontFamily: `${fontBody.style.fontFamily}, 'Source Sans 3', 'Segoe UI', sans-serif`,
};

const DEFAULT_SUBJECTS: MarksheetSubject[] = [
  { code: "DCA-101", name: "Fundamentals of Computer", maxTheory: 100, marksTheory: 88, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 88, grade: "Excellent" },
  { code: "DCA-102", name: "Operating System (Windows)", maxTheory: 100, marksTheory: 84, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 84, grade: "Very Good" },
  { code: "DCA-103", name: "MS Word – Document Processing", maxTheory: 100, marksTheory: 91, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 91, grade: "Excellent" },
  { code: "DCA-104", name: "MS Excel – Spreadsheet & Analysis", maxTheory: 100, marksTheory: 89, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 89, grade: "Excellent" },
  { code: "DCA-105", name: "MS PowerPoint – Presentation Skills", maxTheory: 100, marksTheory: 87, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 87, grade: "Excellent" },
  { code: "DCA-106", name: "Internet, Email & Digital Tools", maxTheory: 100, marksTheory: 82, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 82, grade: "Very Good" },
  { code: "DCA-107", name: "Digital Financial Literacy", maxTheory: 100, marksTheory: 79, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 79, grade: "Very Good" },
  { code: "DCA-108", name: "Practical / Project Work", maxTheory: 100, marksTheory: 90, maxPractical: 0, marksPractical: 0, totalMax: 100, totalObtained: 90, grade: "Excellent" },
];

const DEFAULT_GRADE = [
  { grade: "A+", label: "Excellent", range: "85% & Above" },
  { grade: "A", label: "Very Good", range: "70% – 84%" },
  { grade: "B", label: "Good", range: "55% – 69%" },
  { grade: "C", label: "Average", range: "40% – 54%" },
];

function ParticularField({
  label,
  value,
  valueFs,
  wide,
  accent,
  noRight,
  noBottom,
}: {
  label: string;
  value: string;
  valueFs: number;
  wide?: boolean;
  accent?: boolean;
  noRight?: boolean;
  noBottom?: boolean;
}) {
  return (
    <div
      className="flex min-w-0 flex-col justify-center px-2.5 py-1.5"
      style={{
        gridColumn: wide ? "1 / -1" : undefined,
        borderBottom: noBottom ? undefined : `1px solid ${C.ruleSoft}`,
        borderRight: wide || noRight ? undefined : `1px solid ${C.ruleSoft}`,
        background: accent ? C.navyWash : undefined,
      }}
    >
      <span
        className={`${fontBody.className} font-bold uppercase`}
        style={{
          color: C.muted,
          fontSize: `${Math.max(7.5, valueFs - 3.5)}px`,
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </span>
      <span
        className={`${accent ? fontDisplay.className : fontBody.className} mt-0.5 font-bold leading-snug`}
        style={{
          color: accent ? C.navy : C.ink,
          fontSize: `${valueFs}px`,
          letterSpacing: accent ? "0.02em" : undefined,
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

/** Shared section header rail — cream band + gold accents */
function SectionRail({
  title,
  right,
  compact,
}: {
  title: string;
  right?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          height: 2,
          background: `linear-gradient(90deg, ${C.goldBright}, ${C.gold}, ${C.goldBright})`,
        }}
      />
      <div
        className="flex items-center justify-between gap-3 px-3"
        style={{
          background: C.sectionBand,
          borderBottom: `1px solid ${C.rule}`,
          paddingTop: compact ? 5 : 6,
          paddingBottom: compact ? 5 : 6,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block h-3.5 w-[3px] shrink-0 rounded-sm"
            style={{
              background: `linear-gradient(180deg, ${C.goldBright}, ${C.gold})`,
              boxShadow: `0 0 0 1px ${C.goldPale}`,
            }}
            aria-hidden
          />
          <span
            className={`${fontDisplay.className} font-bold uppercase tracking-[0.16em]`}
            style={{ fontSize: compact ? "9px" : "9.5px", color: C.sectionBandText }}
          >
            {title}
          </span>
        </div>
        {right}
      </div>
    </div>
  );
}

/** Shared panel shell */
const panelShell: CSSProperties = {
  border: C.panelEdge,
  background: C.panelWash,
  boxShadow: C.panelInset,
};

export default function OfficialIvesdcMarksheetTemplateV3({
  data,
  className = "",
  printId = "official-ivesdc-marksheet-v3",
}: Props) {
  const padT = Math.max(FRAME_SAFE, data.paddingTop ?? 40);
  const padB = Math.max(FRAME_SAFE, data.paddingBottom ?? 40);
  const padL = Math.max(FRAME_SAFE, data.paddingLeft ?? 40);
  const padR = Math.max(FRAME_SAFE, data.paddingRight ?? 40);
  const contentW = A4_W - padL - padR;

  const fontScale = (data.innerFontScale ?? 115) / 100;
  const fieldFs = Math.round((data.candidateFontSize || 11.5) * fontScale * 10) / 10;
  const tableFs = Math.round((data.tableFontSize || 11) * fontScale * 10) / 10;
  const headFs = Math.max(8, Math.round(tableFs * 0.82));
  const nameFs = Math.round((data.studentNameFontSize || 14) * fontScale);
  const logoH = Math.min(132, Math.max(108, data.logoHeight || 122));
  const logoMaxW = Math.min(268, Math.max(220, data.logoWidth || 248));
  const photoW = data.photoWidth || 90;
  const photoH = data.photoHeight || 108;
  const qrPx = Math.min(62, Math.max(48, data.qrCodeSize || 56));
  const sigH = data.directorSigHeight || 36;
  const stampPx = Math.min(96, Math.max(68, data.stampSize || 82));
  const coordSigH = data.authorizedSigHeight || data.studentSigHeight || 28;
  const HOLOGRAM_MM = 23; /* hologram guide 23mm × 23mm */
  const stampSrc = data.stampUrl || "/certificates/stamp.png";
  const directorSigSrc = data.directorSignatureUrl || "/certificates/signature.png";
  const rowH = Math.max(18, Math.round(17 * fontScale));
  const headerTitleFs = Math.max(17.5, Math.round((data.titleFontSize || 19) * fontScale * 10) / 10);
  const headerSubFs = Math.max(11.5, Math.round(headerTitleFs * 0.72));
  const marksHeadingFs = Math.max(18, Math.round(22 * fontScale));
  const secGap = 4; /* vertical rhythm between major blocks */

  const watermarkType = data.watermarkType ?? "crest";
  const showWatermark = watermarkType !== "none";
  const watermarkOpacity = Math.min(
    0.45,
    Math.max(0.14, data.watermarkOpacity ?? 0.22)
  );
  const bgShadowSrc = "/certificates/3bg.png";
  /* Transparent logo watermark (no white/black box) */
  const watermarkLogoSrc = "/certificates/logowithoutbg.png";

  const enrollNo = data.registrationNumber || data.barcodeNumber || "4739846";
  const certNo = data.certificateNumber || data.serialNumber || "00001";
  const verifySite = data.verificationWebsite || "www.iveskillcouncil.edu.in";
  const verifyEmail = data.verificationEmail || "official.iveskillcouncil@gmail.com";
  const tagline = data.tagline || "Building a Skilled and Self-Reliant Nation";
  const accred1 =
    data.accreditationLine1 ||
    "An Autonomous Body Registered under Section 8 of the Companies Act, 2013,";
  const accred2 =
    data.accreditationLine2 ||
    "Ministry of Corporate Affairs, Government of India, ISO 21001:2018 & ISO 9001:2015 Certified Organization";
  const accred3 = data.accreditationLine3 || "";
  const DEFAULT_GOV_ORDER =
    "Under The General Administration Department\nGovt. of Gujarat vide its Resolution\nGR No. CRR /10/2007/120320/G5, Dt :13-8-2008\nby Sachivalay Gandhinagar";
  const govOrderLines = (data.govOrderText || DEFAULT_GOV_ORDER)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const govFs = Math.max(8, Math.round(8.5 * fontScale * 10) / 10);

  const rawSubjects =
    data.subjects && data.subjects.length > 0 ? data.subjects.slice(0, 8) : [...DEFAULT_SUBJECTS];
  const subjects = [...rawSubjects];
  while (subjects.length < 6) {
    subjects.push({
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

  const hasMarks = subjects.some((s) => s.name && (s.totalObtained > 0 || s.marksTheory > 0));
  const totalMax = subjects.reduce((a, s) => a + (s.totalMax || s.maxTheory || 0), 0);
  const totalObt = subjects.reduce(
    (a, s) => a + (s.totalObtained || s.marksTheory || 0),
    0
  );
  const overallPctNum =
    totalMax > 0
      ? (totalObt / totalMax) * 100
      : typeof data.marksPercent === "number"
        ? data.marksPercent
        : 0;
  const displayPercent =
    typeof data.marksPercent === "number" && !Number.isNaN(data.marksPercent)
      ? data.marksPercent.toFixed(2)
      : overallPctNum > 0
        ? overallPctNum.toFixed(2)
        : "";

  const gradeSystem =
    data.gradeSystem && data.gradeSystem.length > 0 ? data.gradeSystem : DEFAULT_GRADE;

  /** Percentage → Excellent / Very Good / Good / Average (never show A+ / A / B) */
  const overallRemark =
    data.gradeLabel &&
    !/^[A-D]\+?$/i.test(data.gradeLabel.trim()) &&
    !data.gradeLabel.includes("%")
      ? data.gradeLabel
      : hasMarks && overallPctNum > 0
        ? performanceLabelFromPercent(overallPctNum, gradeSystem)
        : "";

  const father =
    data.fatherName || data.parentName?.split(" and ")[0]?.split("&")[0]?.trim() || "";
  const mother =
    data.motherName || data.parentName?.split(" and ")[1]?.split("&")[0]?.trim() || "";
  const session =
    data.trainingStart && data.trainingEnd
      ? `${data.trainingStart} – ${data.trainingEnd}`
      : data.trainingStart || data.trainingEnd || "";

  return (
    <div
      id={printId}
      className={`certificate-sheet relative mx-auto select-none overflow-hidden ${className}`}
      style={{
        width: A4_W,
        height: A4_H,
        minWidth: A4_W,
        minHeight: A4_H,
        maxWidth: A4_W,
        maxHeight: A4_H,
        backgroundColor: C.paper,
        boxShadow: "0 12px 36px rgba(11, 31, 58, 0.16), 0 2px 8px rgba(11, 31, 58, 0.08)",
        ...sans,
      }}
      data-paper="A4-portrait-result-3"
    >
      {/* Paper base + soft vignette */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 42%, rgba(255,252,245,0.55) 0%, transparent 70%),
            linear-gradient(165deg, ${C.paper} 0%, ${C.paperWarm} 42%, ${C.paper} 100%)
          `,
        }}
        aria-hidden
      />

      {/* BG shadow — embossed geometric paper (inside frame) */}
      {showWatermark && (
        <div
          className="pointer-events-none absolute z-[1] overflow-hidden"
          style={{
            top: padT,
            right: padR,
            bottom: padB,
            left: padL,
            opacity: 0.16,
          }}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bgShadowSrc}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
            style={{
              mixBlendMode: "multiply",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          />
        </div>
      )}

      {/* Soft wash — keeps text crisp over bg shadow */}
      {showWatermark && (
        <div
          className="pointer-events-none absolute z-[1]"
          style={{
            top: padT,
            right: padR,
            bottom: padB,
            left: padL,
            background:
              "linear-gradient(180deg, rgba(251,248,241,0.22) 0%, rgba(251,248,241,0.08) 42%, rgba(251,248,241,0.22) 100%)",
          }}
          aria-hidden
        />
      )}

      {/* Centered logo watermark — logowithoutbg.png + soft emboss shadow */}
      {showWatermark && (
        <div
          className="pointer-events-none absolute z-[1] flex items-center justify-center"
          style={{
            top: padT,
            right: padR,
            bottom: padB,
            left: padL,
          }}
          aria-hidden
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={watermarkLogoSrc}
            alt=""
            draggable={false}
            style={{
              width: Math.min(480, contentW * 0.68),
              height: "auto",
              maxHeight: "48%",
              objectFit: "contain",
              opacity: watermarkOpacity,
              filter:
                "drop-shadow(0 2px 3px rgba(11,31,58,0.18)) drop-shadow(0 8px 18px rgba(11,31,58,0.10))",
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          />
        </div>
      )}

      {/* Code-generated certificate border — behind content (no opaque center fill) */}
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <Result3CertificateBorder />
      </div>

      <div
        className="relative z-[2] flex h-full min-h-0 w-full flex-col overflow-hidden"
        style={{
          paddingTop: padT,
          paddingBottom: padB,
          paddingLeft: padL,
          paddingRight: padR,
          boxSizing: "border-box",
          maxWidth: A4_W,
        }}
      >
        {/* ===== INSTITUTIONAL HEADER ===== */}
        <header
          className="shrink-0 overflow-hidden"
          style={{ maxWidth: contentW }}
        >
          <div
            className="relative flex items-center gap-4 px-3 py-3.5"
            style={{
              background: `linear-gradient(180deg, rgba(250,246,238,0.92) 0%, rgba(243,237,227,0.78) 100%)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.logoUrl || "/logo/IVESDC%20LOGO-01.png"}
              alt="IVESDC"
              style={{
                height: logoH,
                width: "auto",
                maxWidth: logoMaxW,
                filter: "drop-shadow(0 2px 3px rgba(11,31,58,0.14))",
              }}
              className="relative z-[1] shrink-0 object-contain object-left"
              draggable={false}
            />

            <div className="relative z-[1] min-w-0 flex-1 text-center">
              <h2
                lang="hi"
                className="font-devanagari font-bold"
                style={{
                  color: C.navy,
                  fontFamily: "var(--font-devanagari), 'Noto Sans Devanagari', sans-serif",
                  fontSize: "26px",
                  fontWeight: 700,
                  lineHeight: 1.25,
                  letterSpacing: "0",
                  whiteSpace: "nowrap",
                  textShadow: "0 1px 0 rgba(255,255,255,0.65)",
                }}
              >
                व्यावसायिक शिक्षा एवं कौशल विकास परिषद्
              </h2>

              {/* Orange motto ribbon */}
              <div className="mx-auto mt-2 flex justify-center" style={{ maxWidth: "96%" }}>
                <div
                  className="relative px-9 py-[7px]"
                  style={{
                    background: `linear-gradient(180deg, ${C.orangeHi} 0%, ${C.orange} 42%, ${C.orangeLo} 100%)`,
                    clipPath:
                      "polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)",
                    boxShadow: "0 2px 5px rgba(180,70,10,0.3), inset 0 1px 0 rgba(255,255,255,0.3)",
                  }}
                >
                  <p
                    className={`${fontSerif.className} text-center font-bold italic leading-none tracking-[0.04em] text-white`}
                    style={{
                      fontSize: `${headerSubFs}px`,
                      textShadow: "0 1px 1px rgba(0,0,0,0.25)",
                    }}
                  >
                    {tagline}
                  </p>
                </div>
              </div>

              <div
                className={`${fontBody.className} mt-2 font-semibold`}
                style={{ color: C.ink, fontSize: "15px", lineHeight: 1.35 }}
              >
                <p style={{ whiteSpace: "nowrap" }}>{accred1}</p>
                <p style={{ whiteSpace: "nowrap" }}>
                  {accred2}
                  {accred3 ? ` · ${accred3}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div style={{ height: 1.5, background: HEADER_BLUE }} />
          <div style={{ height: 3, background: `linear-gradient(90deg, ${C.goldPale}, ${GOLD_SOFT}, ${GOLD}, ${GOLD_SOFT}, ${C.goldPale})` }} />
        </header>

        {/* ===== STATEMENT OF MARKS — pure text ===== */}
        <div className="flex shrink-0 flex-col items-center" style={{ maxWidth: contentW, marginTop: secGap }}>
          <h1
            className={`${fontDisplay.className} text-center font-black uppercase`}
            style={{
              color: C.navy,
              fontSize: `${marksHeadingFs + 2}px`,
              letterSpacing: "0.26em",
              lineHeight: 1.12,
              textShadow: `0 1px 0 #fff, 0 2px 0 ${C.goldSoft}`,
            }}
          >
            Statement of Marks
          </h1>

          {/* Ornamental gold rule */}
          <div className="mt-1 flex items-center gap-2.5" style={{ width: Math.min(380, contentW * 0.48) }}>
            <span
              className="h-px flex-1"
              style={{ background: `linear-gradient(90deg, transparent, ${C.goldSoft}, ${C.gold})` }}
            />
            <span
              className="inline-block shrink-0 rotate-45"
              style={{
                width: 7,
                height: 7,
                background: `linear-gradient(135deg, ${C.goldBright}, ${C.gold})`,
                boxShadow: `0 0 0 1.5px ${C.goldPale}`,
              }}
              aria-hidden
            />
            <span
              className="h-px flex-1"
              style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.goldSoft}, transparent)` }}
            />
          </div>

          <p
            className={`${fontSerif.className} mt-1 text-center font-bold italic`}
            style={{ color: C.gold, fontSize: "11.5px", letterSpacing: "0.16em" }}
          >
            Academic Record · Examination Result
          </p>

          <div
            className={`${fontBody.className} mt-1.5 grid w-full overflow-hidden`}
            style={{
              gridTemplateColumns: "1fr 1.4fr 0.8fr",
              ...panelShell,
              borderTop: `2.5px solid ${C.gold}`,
            }}
          >
            {[
              { label: "Enrollment No.", value: enrollNo },
              { label: "Marksheet No.", value: certNo },
              { label: "Date of Issue", value: data.issueDate || "—" },
            ].map((cell, i) => (
              <div
                key={cell.label}
                className={`flex flex-col justify-center px-2.5 py-1 ${i === 1 ? "items-center text-center" : ""}`}
                style={{
                  borderRight: i < 2 ? `1px solid ${C.rule}` : undefined,
                  background: i === 1 ? C.navyWash : undefined,
                }}
              >
                {i === 1 ? (
                  <EnrollmentBarcode
                    enrollmentNo={cell.value}
                    showLabel={true}
                    showWords={true}
                    label="Marksheet No. :"
                    barcodeHeight={24}
                    containerWidth={380}
                    color="#000"
                    align="center"
                  />
                ) : (
                  <>
                    <span
                      className="font-bold uppercase"
                      style={{ color: C.muted, fontSize: "7.5px", letterSpacing: "0.12em" }}
                    >
                      {cell.label}
                    </span>
                    <span
                      className={`${fontDisplay.className} mt-0.5 font-bold tabular-nums leading-tight`}
                      style={{ color: C.navy, fontSize: "11px" }}
                    >
                      {cell.value}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ===== CANDIDATE PARTICULARS ===== */}
        <section className="flex shrink-0 gap-2.5" style={{ maxWidth: contentW, marginTop: secGap }}>
          <div className="min-w-0 flex-1 overflow-hidden" style={panelShell}>
            <SectionRail title="Candidate Particulars" />

            <div
              className="grid"
              style={{
                gridTemplateColumns: "1fr 1fr",
                fontSize: `${fieldFs}px`,
              }}
            >
              <ParticularField label="Name" value={data.studentName} valueFs={nameFs} wide accent />
              <ParticularField label="Father" value={father} valueFs={fieldFs} />
              <ParticularField label="Mother" value={mother} valueFs={fieldFs} noRight />
              <ParticularField label="Course" value={data.courseName} valueFs={fieldFs} wide />
              <ParticularField label="Session" value={session} valueFs={fieldFs} noBottom />
              <ParticularField
                label="Centre"
                value={`${data.atcName || data.trainingCentreName || ""}${data.atcCode ? ` (${data.atcCode})` : ""}`}
                valueFs={Math.max(9.5, fieldFs - 0.5)}
                noRight
                noBottom
              />
            </div>
          </div>

          {/* Photo + barcode column */}
          <aside
            className="flex shrink-0 flex-col overflow-hidden"
            style={{
              width: Math.max(photoW + 16, 118),
              ...panelShell,
            }}
          >
            <SectionRail title="Photograph" compact />
            <div className="flex flex-1 flex-col items-center px-2 pb-2 pt-2.5">
              <div
                className="overflow-hidden"
                style={{
                  width: photoW,
                  height: photoH,
                  background: C.paperWarm,
                  border: `1px solid ${C.navyMid}`,
                  outline: `2.5px solid ${C.goldSoft}`,
                  outlineOffset: 2,
                  boxShadow: `0 2px 6px rgba(11,31,58,0.12), inset 0 0 0 1px ${C.goldPale}`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.photoUrl || "/cert/sample-student-photo.png"}
                  alt={data.studentName}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              </div>
              <div className="mt-2 flex w-full flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.studentSignatureUrl || "/cert/sample-student-sig.png"}
                  alt="Student signature"
                  draggable={false}
                  className="object-contain object-center"
                  style={{
                    height: data.studentSigHeight || 38,
                    maxWidth: photoW,
                    mixBlendMode: "multiply",
                    background: "transparent",
                  }}
                />
                <div
                  className="mt-0.5 w-full border-t"
                  style={{ borderColor: C.navy, maxWidth: photoW, borderTopWidth: 1.25 }}
                />
                <p
                  className={`${fontDisplay.className} mt-0.5 text-center font-bold uppercase leading-tight tracking-[0.06em]`}
                  style={{ color: C.navy, fontSize: "6.5px" }}
                >
                  Student Signature
                </p>
              </div>
            </div>
          </aside>
        </section>

        {/* ===== MARKS TABLE ===== */}
        <section
          className="shrink-0 overflow-hidden"
          style={{
            maxWidth: contentW,
            marginTop: secGap,
            ...sans,
            fontSize: `${tableFs}px`,
            ...panelShell,
          }}
        >
          <SectionRail
            title="Subject-wise Marks"
            right={
              <span
                className={`${fontBody.className} font-semibold uppercase tracking-[0.08em]`}
                style={{ fontSize: "7.5px", color: C.muted }}
              >
                Maximum marks per subject · 100 (unless stated)
              </span>
            }
          />

          <table
            className="w-full border-collapse"
            style={{ tableLayout: "fixed", background: "transparent" }}
          >
            <thead>
              <tr style={{ backgroundColor: C.tableHead, color: C.tableHeadText }}>
                {[
                  { label: "Sr.", w: 44, align: "center" as const },
                  { label: "Code", w: 72, align: "center" as const },
                  { label: "Subject / Paper", w: undefined, align: "left" as const },
                  { label: "Max.", w: 88, align: "center" as const },
                  { label: "Obtained", w: 96, align: "center" as const },
                  { label: "Remark", w: 118, align: "center" as const },
                ].map((col) => (
                  <th
                    key={col.label}
                    className={`${fontBody.className} px-1.5 py-[4px] font-bold uppercase`}
                    style={{
                      width: col.w,
                      fontSize: `${headFs}px`,
                      letterSpacing: "0.08em",
                      textAlign: col.align,
                      color: C.tableHeadText,
                      borderBottom: `2px solid ${C.gold}`,
                      borderRight: `1px solid ${C.ruleSoft}`,
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjects.map((sub, idx) => {
                const empty = !sub.name?.trim();
                const max = sub.totalMax || sub.maxTheory || 0;
                const obt = sub.totalObtained || sub.marksTheory || 0;
                const pct = !empty && max > 0 && hasMarks ? (obt / max) * 100 : 0;
                const isLetter = (v: string) => /^[A-D]\+?$/i.test(v.trim()) || v.includes("%");
                const remark =
                  empty || !hasMarks
                    ? ""
                    : sub.grade && !isLetter(String(sub.grade))
                      ? sub.grade
                      : performanceLabelFromPercent(pct, gradeSystem);
                const rowBg = idx % 2 === 0 ? C.rowAWash : C.rowBWash;
                return (
                  <tr
                    key={sub.code || idx}
                    style={{
                      height: rowH,
                      backgroundColor: rowBg,
                    }}
                  >
                    <td
                      className={`${fontBody.className} px-1 text-center font-bold align-middle tabular-nums`}
                      style={{ color: C.muted, borderBottom: `1px solid ${C.ruleSoft}` }}
                    >
                      {empty ? "" : String(idx + 1).padStart(2, "0")}
                    </td>
                    <td
                      className={`${fontBody.className} px-1 text-center font-bold align-middle tabular-nums`}
                      style={{
                        color: C.navy,
                        borderBottom: `1px solid ${C.ruleSoft}`,
                        fontSize: `${Math.max(9, tableFs - 1)}px`,
                      }}
                    >
                      {empty ? "" : sub.code || ""}
                    </td>
                    <td
                      className={`${fontBody.className} px-2.5 text-left font-semibold align-middle`}
                      style={{ color: C.ink, borderBottom: `1px solid ${C.ruleSoft}` }}
                    >
                      {sub.name || ""}
                    </td>
                    <td
                      className={`${fontBody.className} px-1 text-center font-semibold align-middle tabular-nums`}
                      style={{ color: C.muted, borderBottom: `1px solid ${C.ruleSoft}` }}
                    >
                      {empty || !hasMarks ? "" : max || ""}
                    </td>
                    <td
                      className={`${fontDisplay.className} px-1 text-center font-bold align-middle tabular-nums`}
                      style={{
                        color: C.navy,
                        borderBottom: `1px solid ${C.ruleSoft}`,
                        fontSize: `${tableFs + 1}px`,
                        background: idx % 2 === 0 ? C.navyWash : C.navyWashStrong,
                      }}
                    >
                      {empty || !hasMarks ? "" : obt || ""}
                    </td>
                    <td
                      className={`${fontBody.className} px-1.5 text-center font-bold align-middle`}
                      style={{
                        color: C.navy,
                        borderBottom: `1px solid ${C.ruleSoft}`,
                        fontSize: `${Math.max(9, tableFs - 0.5)}px`,
                      }}
                    >
                      {remark}
                    </td>
                  </tr>
                );
              })}

              {/* Aggregate */}
              <tr
                style={{
                  background: C.aggregate,
                  height: rowH + 6,
                }}
              >
                <td
                  colSpan={3}
                  className={`${fontDisplay.className} px-2.5 text-right font-bold uppercase align-middle tracking-[0.14em]`}
                  style={{
                    color: C.navy,
                    fontSize: `${headFs + 0.5}px`,
                    borderTop: `1.5px solid ${C.navy}`,
                  }}
                >
                  Aggregate
                </td>
                <td
                  className={`${fontDisplay.className} px-1 text-center font-bold align-middle tabular-nums`}
                  style={{
                    color: C.navy,
                    borderTop: `1.5px solid ${C.navy}`,
                    fontSize: `${tableFs + 1}px`,
                  }}
                >
                  {hasMarks ? totalMax : ""}
                </td>
                <td
                  className={`${fontDisplay.className} px-1 text-center font-bold align-middle tabular-nums`}
                  style={{
                    color: C.navy,
                    borderTop: `1.5px solid ${C.navy}`,
                    fontSize: `${tableFs + 2}px`,
                    background: C.navyWashStrong,
                  }}
                >
                  {hasMarks ? totalObt : ""}
                </td>
                <td
                  className={`${fontBody.className} px-1 text-center font-bold align-middle`}
                  style={{
                    color: C.navy,
                    borderTop: `1.5px solid ${C.navy}`,
                    fontSize: `${Math.max(9.5, tableFs)}px`,
                  }}
                >
                  {hasMarks ? overallRemark : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ===== RESULT SUMMARY + PERFORMANCE SCALE ===== */}
        <section
          className="grid shrink-0 gap-2.5"
          style={{ maxWidth: contentW, marginTop: secGap, gridTemplateColumns: "1.2fr 1fr" }}
        >
          {/* Result summary */}
          <div className="overflow-hidden" style={panelShell}>
            <SectionRail title="Result Summary" compact />
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
              {[
                {
                  label: "Percentage",
                  value: hasMarks && displayPercent ? `${displayPercent}%` : "—",
                  big: true,
                },
                {
                  label: "Remark",
                  value: hasMarks ? overallRemark || "—" : "—",
                  big: false,
                },
                {
                  label: "Result",
                  value: hasMarks ? data.status || "PASS" : "—",
                  big: true,
                },
              ].map((cell, i) => (
                <div
                  key={cell.label}
                  className="flex flex-col items-center justify-center px-2 py-1.5"
                  style={{
                    borderRight: i < 2 ? `1px solid ${C.rule}` : undefined,
                    background:
                      i === 1
                        ? `linear-gradient(180deg, rgba(243,230,192,0.55) 0%, ${C.rowAWash} 100%)`
                        : C.rowAWash,
                  }}
                >
                  {i === 2 && hasMarks ? (
                    <span
                      className={`${fontDisplay.className} text-center font-black uppercase leading-none`}
                      style={{
                        color: C.goldBright,
                        fontSize: "15px",
                        letterSpacing: "0.16em",
                        padding: "2px 14px 2px 16px",
                        borderRadius: 999,
                        background: `linear-gradient(180deg, ${C.navyMid} 0%, ${C.navy} 100%)`,
                        border: `1px solid ${C.gold}`,
                      }}
                    >
                      {cell.value}
                    </span>
                  ) : (
                    <span
                      className={`${fontDisplay.className} text-center font-bold leading-none`}
                      style={{
                        color: C.navy,
                        fontSize: cell.big ? "20px" : "14px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {cell.value}
                    </span>
                  )}
                  <span
                    className={`${fontBody.className} mt-2 font-bold uppercase`}
                    style={{ color: C.muted, fontSize: "8px", letterSpacing: "0.14em" }}
                  >
                    {cell.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance scale */}
          <div className="overflow-hidden" style={panelShell}>
            <SectionRail title="Performance Scale" compact />
            <div
              className="grid px-3 py-2.5"
              style={{ gridTemplateColumns: "1fr 1fr", gap: "4px 14px", background: C.rowAWash }}
            >
              {gradeSystem.map((g) => (
                <div key={g.grade + g.label} className="flex items-baseline gap-1.5 leading-snug">
                  <span
                    className={`${fontBody.className} shrink-0 font-bold`}
                    style={{ color: C.navy, fontSize: "10px" }}
                  >
                    {g.label}
                  </span>
                  <span
                    className={`${fontBody.className} font-semibold`}
                    style={{ color: C.muted, fontSize: "9px" }}
                  >
                    — {g.range}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== AUTHENTICATION ===== */}
        <footer
          className="mt-auto flex shrink-0 flex-col"
          style={{ maxWidth: contentW, paddingTop: 2 }}
        >
          <div
            className="mb-1 flex items-center gap-2"
            style={{ borderBottom: `1.5px solid ${C.navy}`, paddingBottom: 5 }}
          >
            <span
              className="inline-block h-3 w-[3px] shrink-0"
              style={{ background: `linear-gradient(180deg, ${C.goldBright}, ${C.gold})` }}
              aria-hidden
            />
            <span
              className={`${fontDisplay.className} font-bold uppercase tracking-[0.18em]`}
              style={{ color: C.navy, fontSize: "9.5px" }}
            >
              Authentication
            </span>
            <span
              className="ml-auto h-px flex-1 max-w-[120px]"
              style={{ background: `linear-gradient(90deg, ${C.goldSoft}, transparent)` }}
              aria-hidden
            />
          </div>

          {/* ATC strip */}
          <div
            className={`${fontBody.className} mb-1 grid gap-x-4 gap-y-1 px-3 py-1.5`}
            style={{
              gridTemplateColumns: "minmax(0, 1fr) auto",
              border: `1px solid ${C.rule}`,
              borderLeft: `3px solid ${C.gold}`,
              background: `linear-gradient(90deg, rgba(243,230,192,0.45) 0%, ${C.paperWarm} 40%)`,
              fontSize: "11px",
              color: C.navy,
              lineHeight: 1.3,
              boxShadow: C.panelInset,
            }}
          >
            <p className="min-w-0 truncate font-bold">
              <span style={{ color: C.muted, fontWeight: 600 }}>Authorised Training Centre (ATC) Name :</span>{" "}
              {data.atcName || data.trainingCentreName || "—"}
            </p>
            <p className="font-bold" style={{ whiteSpace: "nowrap" }}>
              <span style={{ color: C.muted, fontWeight: 600 }}>ATC.Code :</span>{" "}
              <span className="tabular-nums">{data.atcCode || "—"}</span>
            </p>
            <p className="col-span-2 min-w-0 truncate font-bold">
              <span style={{ color: C.muted, fontWeight: 600 }}>ATC Address :</span>{" "}
              {data.franchiseAddress || data.trainingCentre || "—"}
            </p>
          </div>

          {/* ===== Signatures + seals (balanced 3-col) ===== */}
          <div
            className="grid items-end gap-3"
            style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}
          >
            {/* Authorised Signatory — stamp + signature */}
            <div className="flex min-w-0 flex-col items-center px-1">
              <div
                className="relative mx-auto"
                style={{ width: stampPx, height: stampPx }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stampSrc}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute inset-0 select-none object-contain"
                  style={{
                    width: "100%",
                    height: "100%",
                    opacity: 0.9,
                    zIndex: 1,
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={directorSigSrc}
                  alt="Authorised Signatory"
                  draggable={false}
                  className="absolute z-[2] object-contain"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: Math.round(stampPx * 0.86),
                    height: "auto",
                    maxHeight: Math.max(sigH, Math.round(stampPx * 0.55)),
                  }}
                />
              </div>
              <div
                className="w-full max-w-[220px] border-t"
                style={{ borderColor: C.navy, borderTopWidth: 1.25 }}
              />
              <p
                className={`${fontDisplay.className} mt-1 text-center font-bold uppercase leading-tight tracking-[0.06em]`}
                style={{ color: C.navy, fontSize: "7.5px" }}
              >
                {data.directorTitle || "Authorised Signatory"}
              </p>
              <p
                className={`${fontBody.className} text-center font-semibold leading-tight`}
                style={{ color: C.muted, fontSize: "6px" }}
              >
                Controller of Examinations
              </p>
            </div>

            {/* ATC (franchise) authorised signatory — its own seal + signature */}
            <div className="flex min-w-0 flex-col items-center justify-end px-1">
              <div className="relative mx-auto flex items-end justify-center" style={{ width: "100%", height: stampPx }}>
                {data.atcStampUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.atcStampUrl}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute select-none object-contain"
                    style={{
                      width: stampPx,
                      height: stampPx,
                      left: "50%",
                      top: 0,
                      transform: "translateX(-50%)",
                      opacity: 0.9,
                      WebkitPrintColorAdjust: "exact",
                      printColorAdjust: "exact",
                    }}
                  />
                ) : null}
                {data.atcSignatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.atcSignatureUrl}
                    alt="ATC Authorised Signatory"
                    draggable={false}
                    className="relative z-[2] object-contain object-bottom"
                    style={{ maxWidth: Math.round(stampPx * 1.5), height: Math.max(coordSigH, Math.round(stampPx * 0.5)) }}
                  />
                ) : null}
              </div>
              <div
                className="w-full max-w-[220px] border-t"
                style={{ borderColor: C.navy, borderTopWidth: 1.25 }}
              />
              <p
                className={`${fontDisplay.className} mt-1 text-center font-bold uppercase leading-tight tracking-[0.06em]`}
                style={{ color: C.navy, fontSize: "7.5px" }}
              >
                ATC Authorised Signatory
              </p>
              <p
                className={`${fontBody.className} max-w-full truncate text-center font-semibold leading-tight`}
                style={{ color: C.muted, fontSize: "6px" }}
              >
                {data.atcSignatoryName || data.atcName || "Authorised Training Centre"}
              </p>
            </div>

            {/* Examination Coordinator */}
            <div className="flex min-w-0 flex-col items-center justify-end px-1">
              <div className="flex w-full items-end justify-center" style={{ height: stampPx }}>
                {data.examCoordinatorSignatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.examCoordinatorSignatureUrl}
                    alt="Examination Coordinator signature"
                    draggable={false}
                    className="object-contain object-bottom"
                    style={{ maxWidth: Math.round(stampPx * 1.5), height: Math.max(coordSigH, Math.round(stampPx * 0.5)) }}
                  />
                ) : null}
              </div>
              <div
                className="w-full max-w-[220px] border-t"
                style={{ borderColor: C.navy, borderTopWidth: 1.25 }}
              />
              <p
                className={`${fontDisplay.className} mt-1 text-center font-bold uppercase leading-tight tracking-[0.06em]`}
                style={{ color: C.navy, fontSize: "7.5px" }}
              >
                Examination Coordinator
              </p>
              <p
                className={`${fontBody.className} max-w-full truncate text-center font-semibold leading-tight`}
                style={{ color: data.examCoordinatorName ? C.muted : "transparent", fontSize: "6px" }}
              >
                {data.examCoordinatorName || "Examination Coordinator"}
              </p>
            </div>

            {/* Hologram + QR — right column */}
            <div className="flex items-start justify-end gap-2.5 pb-0.5">
              {data.showHologramGuide !== false ? (
                <div
                  className="flex flex-col items-center select-none"
                  style={{ width: `${HOLOGRAM_MM}mm` }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: `${HOLOGRAM_MM}mm`,
                      height: `${HOLOGRAM_MM}mm`,
                      border: `1.25px dashed ${C.gold}`,
                      boxSizing: "border-box",
                      background: `linear-gradient(145deg, ${C.goldPale}55, ${C.paperWarm})`,
                    }}
                    title="Hologram 23×23 mm"
                  >
                    <span
                      className={`${fontBody.className} text-center font-bold uppercase leading-tight`}
                      style={{ fontSize: "5.5px", color: C.muted }}
                    >
                      Hologram
                      <br />
                      23×23
                    </span>
                  </div>
                </div>
              ) : null}
              <CertificateQRCode
                docType="marksheet"
                enrollmentNo={enrollNo}
                certificateNo={certNo}
                studentName={data.studentName}
                verificationWebsite={verifySite}
                size={Math.max(84, qrPx)}
                color="#000000"
                mode="marksheet"
                captionLine1="Scan to Verify"
                captionLine2="Official Marksheet"
                showEnrollmentTag={false}
              />
            </div>
          </div>

          <div className="mt-1 flex items-end justify-between gap-4 px-1">
            <EnrollmentBarcode
              enrollmentNo={enrollNo}
              showLabel={true}
              showWords={true}
              label="Enrollment No. :"
              barcodeHeight={24}
              containerWidth={Math.min(300, Math.round(contentW * 0.34))}
              color="#000"
              align="left"
            />
            <EnrollmentBarcode
              enrollmentNo={data.barcodeNumber || enrollNo}
              words={data.barcodeTextWords}
              showLabel={true}
              showWords={true}
              label={`Document Serial : ${certNo}`}
              barcodeHeight={24}
              containerWidth={Math.min(300, Math.round(contentW * 0.34))}
              color="#000"
              align="right"
            />
          </div>

          {/* Gujarat GAD resolution */}
          <div
            className="mt-1 flex w-full flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 px-2 py-[4px]"
            style={{
              borderTop: `1px solid ${C.ruleSoft}`,
              background: `linear-gradient(90deg, transparent, rgba(243,230,192,0.35) 20%, rgba(243,230,192,0.35) 80%, transparent)`,
            }}
          >
            {govOrderLines.map((line, i) => (
              <span key={i} className="inline-flex items-center gap-x-1.5">
                {i > 0 ? (
                  <span
                    className="inline-block h-[3px] w-[3px] rotate-45 shrink-0"
                    style={{ background: C.gold }}
                    aria-hidden
                  />
                ) : null}
                <span
                  className={`${i === 2 ? fontDisplay.className : fontBody.className} font-bold leading-none`}
                  style={{
                    color: i === 2 ? C.navy : C.ink,
                    fontSize: `${Math.max(7, govFs - 0.5)}px`,
                    letterSpacing: "0.01em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {line}
                </span>
              </span>
            ))}
          </div>

          <div
            className="relative mt-2 w-full shrink-0"
            style={{
              border: `2.5px solid ${C.gold}`,
              borderRadius: 16,
              background: `linear-gradient(180deg, #FFFDF8 0%, ${C.paperWarm} 100%)`,
              boxShadow: `inset 0 0 0 1px ${C.navy}, 0 1px 0 rgba(255,255,255,0.7)`,
              padding: "14px 10px 6px",
            }}
          >
            <div
              className="absolute left-1/2 flex items-center justify-center"
              style={{
                top: 0,
                transform: "translate(-50%, -52%)",
                minWidth: 168,
                height: 22,
                padding: "0 22px",
                background: `linear-gradient(180deg, ${C.navyMid} 0%, ${C.navy} 55%, ${C.navyDeep} 100%)`,
                clipPath:
                  "polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)",
                boxShadow: `0 1px 0 ${C.goldBright}`,
              }}
            >
              <span
                className={`${fontDisplay.className} font-bold text-white`}
                style={{ fontSize: "11px", letterSpacing: "0.04em", lineHeight: 1 }}
              >
                Empanelled with
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/certificates/certificatebot.png"
              alt="Partner logos"
              draggable={false}
              className="block w-full object-cover object-center"
              style={{ height: 122 }}
            />
            <div
              className={`${fontBody.className} mt-1.5 flex items-center justify-center font-bold text-white`}
              style={{
                minHeight: 22,
                padding: "4px 12px",
                borderRadius: 999,
                background: `linear-gradient(180deg, ${C.navyMid} 0%, ${C.navy} 100%)`,
                border: `1px solid ${C.gold}`,
                fontSize: "12px",
                letterSpacing: "0.01em",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              GRADE SYSTEM - A+: Excellent (85% & Above) | A : Very Good (70% to 84%) | B: Good (55% to 69%) | C: Average (40% to 54%)
            </div>
          </div>

          <div className="mt-1.5 w-full shrink-0 text-center">
            <p
              className={`${fontBody.className} font-semibold`}
              style={{ color: C.navy, fontSize: "15px", lineHeight: 1.35, whiteSpace: "nowrap" }}
            >
              This certificate can be verified by scanning the QR Code or visiting {verifySite}
            </p>
            <p
              className={`${fontBody.className} mt-0.5 font-semibold`}
              style={{ color: C.navy, fontSize: "15px", lineHeight: 1.35, whiteSpace: "nowrap" }}
            >
              <span className="font-bold">Registered Office:</span>{" "}
              {data.registeredOffice ||
                "F-107, Dev Krishna Residency, Gunsada, Sub. Dist. Ukai, Dist. Tapi, Gujarat – 394680"}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
