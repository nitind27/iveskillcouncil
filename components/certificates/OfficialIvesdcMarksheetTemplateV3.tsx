"use client";

/**
 * Result Form 3 — Board-style professional Statement of Marks
 * Institutional header (logo + title + orange ribbon) · particulars · marks table · seals
 */
import React, { useId, type CSSProperties } from "react";
import { Cinzel, Libre_Baskerville, Montserrat, Source_Sans_3 } from "next/font/google";
import type { CertificateDemoData, MarksheetSubject } from "./demo/types";
import { DEFAULT_PARTNER_LOGOS, performanceLabelFromPercent } from "./demo/types";
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
/** Content must clear border lines (inner @24) + corner ornaments (~40) */
const FRAME_SAFE = 48;

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

/**
 * Clean premium certificate border —
 * navy + gold double frame, simple corners & mid jewels (no clutter).
 */
function Result3CertificateBorder() {
  const uid = useId().replace(/:/g, "");
  const W = A4_W;
  const H = A4_H;

  const outer = 12; // navy
  const gold = 18; // gold
  const inner = 24; // fine navy hairline

  const goldStroke = `url(#${uid}-gold)`;
  const navyStroke = `url(#${uid}-navy)`;

  const corner = (x: number, y: number, sx: number, sy: number) => (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <path
        d="M0 0 H36 M0 0 V36"
        fill="none"
        stroke={goldStroke}
        strokeWidth="2.4"
        strokeLinecap="square"
      />
      <path
        d="M5 5 H28 M5 5 V28"
        fill="none"
        stroke={goldStroke}
        strokeWidth="1"
        strokeOpacity="0.75"
      />
      <rect
        x="0"
        y="0"
        width="8"
        height="8"
        fill={goldStroke}
        transform="rotate(45 4 4)"
      />
      <rect
        x="2"
        y="2"
        width="4"
        height="4"
        fill="#FFF8E0"
        transform="rotate(45 4 4)"
      />
    </g>
  );

  const midJewel = (cx: number, cy: number, horizontal: boolean) => (
    <g transform={`translate(${cx} ${cy})`}>
      <rect
        x="-5"
        y="-5"
        width="10"
        height="10"
        fill={goldStroke}
        transform="rotate(45)"
      />
      <rect
        x="-2.5"
        y="-2.5"
        width="5"
        height="5"
        fill="#FFF8E0"
        transform="rotate(45)"
      />
      {horizontal ? (
        <>
          <line x1="-18" y1="0" x2="-7" y2="0" stroke={goldStroke} strokeWidth="1.2" />
          <line x1="7" y1="0" x2="18" y2="0" stroke={goldStroke} strokeWidth="1.2" />
        </>
      ) : (
        <>
          <line x1="0" y1="-18" x2="0" y2="-7" stroke={goldStroke} strokeWidth="1.2" />
          <line x1="0" y1="7" x2="0" y2="18" stroke={goldStroke} strokeWidth="1.2" />
        </>
      )}
    </g>
  );

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
        <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5E6B0" />
          <stop offset="40%" stopColor="#C9A84C" />
          <stop offset="70%" stopColor="#A07F2C" />
          <stop offset="100%" stopColor="#D4B65A" />
        </linearGradient>
        <linearGradient id={`${uid}-navy`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#163A5C" />
          <stop offset="100%" stopColor="#0B1F3A" />
        </linearGradient>
      </defs>

      {/* 1 — Outer navy */}
      <rect
        x={outer}
        y={outer}
        width={W - outer * 2}
        height={H - outer * 2}
        stroke={navyStroke}
        strokeWidth="2.5"
      />

      {/* 2 — Gold frame */}
      <rect
        x={gold}
        y={gold}
        width={W - gold * 2}
        height={H - gold * 2}
        stroke={goldStroke}
        strokeWidth="2.2"
      />

      {/* 3 — Inner navy hairline */}
      <rect
        x={inner}
        y={inner}
        width={W - inner * 2}
        height={H - inner * 2}
        stroke={navyStroke}
        strokeWidth="0.9"
        strokeOpacity="0.55"
      />

      {/* Corners */}
      {corner(outer + 4, outer + 4, 1, 1)}
      {corner(W - outer - 4, outer + 4, -1, 1)}
      {corner(outer + 4, H - outer - 4, 1, -1)}
      {corner(W - outer - 4, H - outer - 4, -1, -1)}

      {/* Mid-edge jewels */}
      {midJewel(W / 2, gold, true)}
      {midJewel(W / 2, H - gold, true)}
      {midJewel(gold, H / 2, false)}
      {midJewel(W - gold, H / 2, false)}
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
  const padT = Math.max(FRAME_SAFE, data.paddingTop ?? 50);
  const padB = Math.max(FRAME_SAFE, data.paddingBottom ?? 50, 68);
  const padL = Math.max(FRAME_SAFE, data.paddingLeft ?? 52);
  const padR = Math.max(FRAME_SAFE, data.paddingRight ?? 52);
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
  const rowH = Math.max(24, Math.round(26 * fontScale));
  const headerTitleFs = Math.max(17.5, Math.round((data.titleFontSize || 19) * fontScale * 10) / 10);
  const headerSubFs = Math.max(11.5, Math.round(headerTitleFs * 0.72));
  const headerAccredFs = Math.max(9.5, Math.round(10.5 * fontScale * 10) / 10);
  const marksHeadingFs = Math.max(18, Math.round(22 * fontScale));
  const secGap = 8; /* vertical rhythm between major blocks */
  const partnerH = Math.min(56, Math.max(28, data.partnerLogosHeight || 46));
  const partners =
    data.partnerLogos && data.partnerLogos.length > 0
      ? data.partnerLogos
      : DEFAULT_PARTNER_LOGOS;

  const watermarkType = data.watermarkType ?? "crest";
  const showWatermark = watermarkType !== "none";
  const watermarkOpacity = Math.min(
    0.45,
    Math.max(0.14, data.watermarkOpacity ?? 0.22)
  );
  const bgShadowSrc = data.backgroundPatternUrl || "/certificates/bgcert.png";
  /* Transparent logo watermark (no white/black box) */
  const watermarkLogoSrc = "/certificates/logowithoutbg.png";

  const enrollNo = data.registrationNumber || data.barcodeNumber || "4739846";
  const certNo = data.certificateNumber || data.serialNumber || "IVESDC/MS/2025/000123";
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
  const verifyLine = `Verify this Certificate by Scan QR Code or Log on: ${verifySite}, Mail.${verifyEmail}`;
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
            opacity: 0.42,
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
          style={{
            maxWidth: contentW,
            boxShadow: C.panelInset,
          }}
        >
          {/* Gold + navy double rules */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${C.goldPale}, ${GOLD_SOFT}, ${GOLD}, ${GOLD_SOFT}, ${C.goldPale})` }} />
          <div style={{ height: 1.5, background: HEADER_BLUE }} />

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
                className={`${fontDisplay.className} font-black uppercase`}
                style={{
                  color: C.navy,
                  fontSize: `${headerTitleFs}px`,
                  lineHeight: 1.18,
                  letterSpacing: "0.06em",
                  textShadow: "0 1px 0 rgba(255,255,255,0.65)",
                }}
              >
                INSTITUTE OF VOCATIONAL EDUCATION
                <br />
                AND SKILL DEVELOPMENT COUNCIL
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
                className={`${fontBody.className} mt-2 space-y-[2px] font-semibold leading-snug`}
                style={{ color: C.ink, fontSize: `${headerAccredFs}px` }}
              >
                <p>{accred1}</p>
                <p>{accred2}</p>
                {accred3 ? <p>{accred3}</p> : null}
              </div>

              <p
                className={`${fontBody.className} mt-1.5 font-bold leading-snug`}
                style={{
                  color: C.navyMid,
                  fontSize: `${Math.max(8.5, headerAccredFs - 0.5)}px`,
                  letterSpacing: "0.01em",
                }}
              >
                {verifyLine}
              </p>
            </div>
          </div>

          <div style={{ height: 1.5, background: HEADER_BLUE }} />
          <div style={{ height: 3, background: `linear-gradient(90deg, ${C.goldPale}, ${GOLD_SOFT}, ${GOLD}, ${GOLD_SOFT}, ${C.goldPale})` }} />
        </header>

        {/* ===== STATEMENT OF MARKS — pure text ===== */}
        <div className="flex shrink-0 flex-col items-center" style={{ maxWidth: contentW, marginTop: secGap + 2 }}>
          <h1
            className={`${fontDisplay.className} text-center font-black uppercase`}
            style={{
              color: C.navy,
              fontSize: `${marksHeadingFs + 2}px`,
              letterSpacing: "0.26em",
              lineHeight: 1.12,
              textShadow: "0 1px 0 rgba(255,255,255,0.7)",
            }}
          >
            Statement of Marks
          </h1>

          {/* Ornamental gold rule */}
          <div className="mt-2 flex items-center gap-2.5" style={{ width: Math.min(380, contentW * 0.48) }}>
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
            className={`${fontSerif.className} mt-1.5 text-center font-bold italic`}
            style={{ color: C.gold, fontSize: "11.5px", letterSpacing: "0.16em" }}
          >
            Academic Record · Examination Result
          </p>

          <div
            className={`${fontBody.className} mt-3 grid w-full overflow-hidden`}
            style={{
              gridTemplateColumns: "1.15fr 1fr 0.95fr",
              ...panelShell,
              borderTop: `2.5px solid ${C.gold}`,
            }}
          >
            {[
              { label: "Marksheet No.", value: certNo },
              { label: "Enrollment No.", value: enrollNo },
              { label: "Date of Issue", value: data.issueDate || "—" },
            ].map((cell, i) => (
              <div
                key={cell.label}
                className="flex flex-col px-2.5 py-2"
                style={{
                  borderRight: i < 2 ? `1px solid ${C.rule}` : undefined,
                  background: i === 1 ? C.navyWash : undefined,
                }}
              >
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
              <div className="mt-2 w-full">
                <EnrollmentBarcode
                  enrollmentNo={enrollNo}
                  words={data.barcodeTextWords}
                  showLabel={true}
                  showWords={false}
                  label="Enroll."
                  barcodeHeight={28}
                  containerWidth={Math.max(110, photoW + 4)}
                  color="#000"
                  align="center"
                />
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
                    className={`${fontBody.className} px-1.5 py-[8px] font-bold uppercase`}
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
                  className="flex flex-col items-center justify-center px-2 py-3"
                  style={{
                    borderRight: i < 2 ? `1px solid ${C.rule}` : undefined,
                    background:
                      i === 1
                        ? `linear-gradient(180deg, rgba(243,230,192,0.55) 0%, ${C.rowAWash} 100%)`
                        : C.rowAWash,
                  }}
                >
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
          style={{ maxWidth: contentW, paddingTop: 6 }}
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
            className={`${fontBody.className} mb-1 grid gap-x-3 px-2.5 py-1.5`}
            style={{
              gridTemplateColumns: "1.35fr 0.85fr",
              border: `1px solid ${C.rule}`,
              borderLeft: `3px solid ${C.gold}`,
              background: `linear-gradient(90deg, rgba(243,230,192,0.35) 0%, ${C.paperWarm} 40%)`,
              fontSize: "8.5px",
              color: C.ink,
              boxShadow: C.panelInset,
            }}
          >
            <p className="font-bold leading-snug">
              <span style={{ color: C.muted }}>ATC :</span>{" "}
              {data.atcName || data.trainingCentreName || "—"}
            </p>
            <p className="font-bold leading-snug">
              <span style={{ color: C.muted }}>Code :</span> {data.atcCode || "—"}
            </p>
            <p className="col-span-2 font-semibold leading-snug" style={{ color: C.muted, fontSize: "8px" }}>
              {data.franchiseAddress || data.trainingCentre || ""}
            </p>
          </div>

          {/* ===== Signatures + seals (balanced 3-col) ===== */}
          <div
            className="grid items-end gap-3"
            style={{ gridTemplateColumns: "1fr 1.2fr 0.95fr" }}
          >
            {/* Examination Coordinator */}
            <div className="flex min-w-0 flex-col items-center px-1">
              <div style={{ height: Math.max(52, Math.round(stampPx * 0.55)) }} aria-hidden />
              <div
                className="w-full max-w-[200px] border-t"
                style={{ borderColor: C.navy, borderTopWidth: 1.25 }}
              />
              <p
                className={`${fontDisplay.className} mt-1 text-center font-bold uppercase leading-tight tracking-[0.06em]`}
                style={{ color: C.navy, fontSize: "7.5px" }}
              >
                Examination Coordinator
              </p>
            </div>

            {/* Authorised Signatory — stamp + signature */}
            <div className="flex min-w-0 flex-col items-center px-1">
              <div
                className="relative flex w-full items-end justify-center"
                style={{ height: stampPx, maxWidth: 240 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stampSrc}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute select-none object-contain"
                  style={{
                    width: stampPx,
                    height: stampPx,
                    left: "50%",
                    bottom: 0,
                    transform: "translateX(-48%)",
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
                  className="relative z-[2] object-contain object-bottom"
                  style={{
                    height: Math.max(sigH, Math.round(stampPx * 0.4)),
                    maxWidth: "70%",
                    marginBottom: 2,
                    marginLeft: "14%",
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

            {/* Hologram + QR — right column */}
            <div className="flex items-end justify-end gap-2.5 pb-0.5">
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
                size={Math.min(qrPx, 52)}
                color="#000000"
                mode="marksheet"
                captionLine1="Scan to Verify"
                captionLine2="Official Marksheet"
                showEnrollmentTag={false}
              />
            </div>
          </div>

          {/* Office + barcode — one compact band */}
          <div
            className="mt-1 grid items-center gap-3 px-2 py-1"
            style={{
              gridTemplateColumns: "1.1fr 1.2fr",
              background: `linear-gradient(90deg, ${C.paperWarm} 0%, rgba(251,247,239,0.9) 100%)`,
              borderTop: `1px solid ${C.rule}`,
              borderBottom: `1px solid ${C.rule}`,
            }}
          >
            <div className="min-w-0">
              <span
                className={`${fontDisplay.className} inline-block px-1.5 py-[2px] font-bold uppercase tracking-[0.12em] text-white`}
                style={{ background: C.navy, fontSize: "6.5px" }}
              >
                Registered Office
              </span>
              <p
                className={`${fontBody.className} mt-1 font-semibold leading-snug`}
                style={{ color: C.ink, fontSize: "7.5px" }}
              >
                {data.registeredOffice ||
                  "F-107, Dev Krishna Residency, Gunsada, Sub. Dist. Ukai, Dist. Tapi, Gujarat – 394680"}
              </p>
            </div>
            <div className="flex justify-end">
              <EnrollmentBarcode
                enrollmentNo={data.barcodeNumber || enrollNo}
                words={data.barcodeTextWords}
                showLabel={true}
                showWords={true}
                label={`Document Serial : ${certNo}`}
                barcodeHeight={22}
                containerWidth={Math.min(300, contentW * 0.42)}
                color="#000"
                align="right"
              />
            </div>
          </div>

          {/* Gujarat GAD resolution — compact inline flex */}
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

          {/* Partner logos — full-width clean strip */}
          <div className="mt-1 shrink-0">
            <div
              className="flex items-center justify-center gap-1.5 py-[3px]"
              style={{
                background: C.sectionBand,
                borderBottom: `1px solid ${C.ruleSoft}`,
              }}
            >
              <span
                className="h-px w-8"
                style={{ background: `linear-gradient(90deg, transparent, ${C.gold})` }}
                aria-hidden
              />
              <span
                className={`${fontDisplay.className} font-bold uppercase tracking-[0.18em]`}
                style={{ color: C.navy, fontSize: "6.5px" }}
              >
                Empanelled with
              </span>
              <span
                className="h-px w-8"
                style={{ background: `linear-gradient(90deg, ${C.gold}, transparent)` }}
                aria-hidden
              />
            </div>
            <div
              className="flex w-full items-center justify-center px-1"
              style={{
                gap: 32,
                paddingTop: 3,
                paddingBottom: 4,
                background: `linear-gradient(180deg, #F6F0E6 0%, #FAF6EE 100%)`,
              }}
            >
              {partners.slice(0, 8).map((logo, idx) => (
                <div
                  key={logo.id || idx}
                  className="flex shrink-0 items-center justify-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.url}
                    alt={logo.name || `Partner ${idx + 1}`}
                    style={{
                      height: partnerH,
                      maxHeight: partnerH,
                      width: "auto",
                      maxWidth: Math.round(partnerH * 2.15),
                      mixBlendMode: "multiply",
                    }}
                    className="object-contain object-center"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Verify bar — gold plaque + navy seal strip */}
          <div className="mt-0 shrink-0 overflow-hidden">
            <div
              style={{
                height: 2.5,
                background: `linear-gradient(90deg, ${C.goldPale}, ${C.goldBright}, ${C.gold}, ${C.goldBright}, ${C.goldPale})`,
              }}
            />
            <div
              className="relative flex items-stretch"
              style={{
                minHeight: 36,
                background: `
                  linear-gradient(180deg, rgba(226,199,106,0.22) 0%, transparent 32%),
                  repeating-linear-gradient(90deg, transparent 0 18px, rgba(226,199,106,0.06) 18px 19px),
                  linear-gradient(90deg, ${C.navyDeep} 0%, ${C.navy} 42%, #102848 100%)
                `,
              }}
            >
              <div
                className="relative flex shrink-0 items-center"
                style={{
                  background: `linear-gradient(180deg, ${C.goldBright} 0%, ${C.gold} 46%, #8C6A22 100%)`,
                  padding: "0 18px 0 12px",
                  clipPath: "polygon(0 0, calc(100% - 11px) 0, 100% 50%, calc(100% - 11px) 100%, 0 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,248,224,0.55)",
                }}
              >
                <span
                  className={`${fontDisplay.className} font-black uppercase`}
                  style={{ color: C.navyDeep, fontSize: "8px", letterSpacing: "0.22em" }}
                >
                  Verify
                </span>
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-2.5 px-3">
                <span
                  className="inline-block shrink-0 rotate-45"
                  style={{ width: 5, height: 5, background: C.goldBright, boxShadow: `0 0 0 1px ${C.goldPale}` }}
                  aria-hidden
                />
                <span
                  className={`${fontBody.className} min-w-0 truncate font-bold leading-none text-white`}
                  style={{ fontSize: "8.5px", letterSpacing: "0.02em" }}
                >
                  {verifySite}
                </span>
                <span
                  className="inline-block h-3.5 w-px shrink-0"
                  style={{ background: "rgba(226,199,106,0.55)" }}
                  aria-hidden
                />
                <span
                  className="inline-block shrink-0 rotate-45"
                  style={{ width: 5, height: 5, background: C.goldBright }}
                  aria-hidden
                />
                <span
                  className={`${fontBody.className} min-w-0 truncate font-semibold leading-none`}
                  style={{ color: C.goldPale, fontSize: "8px" }}
                >
                  {verifyEmail}
                </span>
              </div>

              <div
                className="flex shrink-0 items-center gap-2 px-3"
                style={{
                  borderLeft: "1px solid rgba(226,199,106,0.5)",
                  background: "linear-gradient(90deg, rgba(160,127,44,0.16), transparent 70%)",
                }}
              >
                <span
                  className={`${fontDisplay.className} font-black uppercase`}
                  style={{ color: C.goldBright, fontSize: "8.5px", letterSpacing: "0.18em" }}
                >
                  IVESDC
                </span>
                <span
                  className="h-px w-4 shrink-0"
                  style={{ background: `linear-gradient(90deg, ${C.goldBright}, transparent)` }}
                  aria-hidden
                />
                <span
                  className={`${fontBody.className} font-bold uppercase`}
                  style={{
                    color: C.navyDeep,
                    fontSize: "6.5px",
                    letterSpacing: "0.12em",
                    background: `linear-gradient(180deg, ${C.goldPale} 0%, ${C.goldSoft} 100%)`,
                    padding: "3px 7px",
                    border: `1px solid ${C.goldBright}`,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45)",
                  }}
                >
                  Official Document
                </span>
              </div>
            </div>
            <div style={{ height: 1.5, background: C.navyDeep }} />
            <div
              style={{
                height: 2,
                background: `linear-gradient(90deg, ${C.gold}, ${C.goldBright}, ${C.gold})`,
              }}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
