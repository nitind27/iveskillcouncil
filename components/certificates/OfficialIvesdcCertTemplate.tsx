"use client";

/**
 * Certificate of Completion — same navy / gold / parchment system as Result Form 3,
 * laid out as a certificate (not a marks table).
 */
import React, { useId, type CSSProperties } from "react";
import { Cinzel, Cormorant_Garamond, Libre_Baskerville, Montserrat, Source_Sans_3 } from "next/font/google";
import type { CertificateDemoData } from "./demo/types";
import CertificateQRCode from "./CertificateQRCode";
import EnrollmentBarcode from "./EnrollmentBarcode";

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

const fontScript = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

interface Props {
  data: CertificateDemoData;
  className?: string;
  printId?: string;
  borderStyle?: "ornate" | "guilloche";
}

const A4_W = 1054;
const A4_H = 1492;
const FRAME_SAFE = 56;

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
  logoBlue: "#2050A0",
  paper: "#FCF9F2",
  paperWarm: "#F4EEE4",
  rule: "rgba(11,31,58,0.16)",
  ruleSoft: "rgba(11,31,58,0.10)",
} as const;

function CertFrame() {
  const gradientId = `certGold${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
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
    <svg className="pointer-events-none absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden>
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

/** Thin gold rule under the student name. */
function NameFlourish() {
  return (
    <svg width="380" height="12" viewBox="0 0 380 12" fill="none" aria-hidden>
      <line x1="10" y1="6" x2="168" y2="6" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="212" y1="6" x2="370" y2="6" stroke={C.gold} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="10" cy="6" r="1.8" fill={C.goldSoft} />
      <circle cx="370" cy="6" r="1.8" fill={C.goldSoft} />
      <g transform="translate(190 6)">
        <rect x="-5" y="-5" width="10" height="10" fill={C.gold} transform="rotate(45)" />
        <rect x="-2.2" y="-2.2" width="4.4" height="4.4" fill={C.goldPale} transform="rotate(45)" />
      </g>
      <circle cx="178" cy="6" r="1.5" fill={C.gold} />
      <circle cx="202" cy="6" r="1.5" fill={C.gold} />
    </svg>
  );
}

/** Centered title rule — gold hairlines, logo-blue diamond, end dots. */
function CertificateFlourish() {
  return (
    <svg width="540" height="34" viewBox="0 0 540 34" fill="none" aria-hidden>
      <line x1="18" y1="17" x2="236" y2="17" stroke={C.gold} strokeWidth="1.7" strokeLinecap="round" />
      <line x1="304" y1="17" x2="522" y2="17" stroke={C.gold} strokeWidth="1.7" strokeLinecap="round" />
      <line x1="46" y1="23" x2="220" y2="23" stroke={C.goldSoft} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="320" y1="23" x2="494" y2="23" stroke={C.goldSoft} strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="18" cy="17" r="3.4" fill={C.logoBlue} />
      <circle cx="522" cy="17" r="3.4" fill={C.logoBlue} />
      <g transform="translate(270 17)">
        <rect x="-9" y="-9" width="18" height="18" fill={C.logoBlue} transform="rotate(45)" />
        <rect x="-4.5" y="-4.5" width="9" height="9" fill={C.goldPale} transform="rotate(45)" />
      </g>
    </svg>
  );
}

function framePad(value: number | undefined, fallback: number) {
  const n = value ?? fallback;
  if (n >= 90) return fallback;
  return Math.max(FRAME_SAFE, n);
}

const sans: CSSProperties = {
  fontFamily: `${fontBody.style.fontFamily}, 'Source Sans 3', 'Segoe UI', sans-serif`,
};

export default function OfficialIvesdcCertTemplate({
  data,
  className = "",
  printId = "official-ivesdc-cert",
}: Props) {
  const padT = framePad(data.paddingTop, 58);
  const padB = framePad(data.paddingBottom, 64);
  const padL = framePad(data.paddingLeft, 58);
  const padR = framePad(data.paddingRight, 58);
  const contentW = A4_W - padL - padR;

  const fontScale = (data.innerFontScale || 100) / 100;
  const bodyFs = Math.round((data.certBodyFontSize || 17) * fontScale);
  const photoW = data.photoWidth && data.photoWidth > 100 ? data.photoWidth : 122;
  const photoH = data.photoHeight && data.photoHeight > 120 ? data.photoHeight : 148;
  const stampSz = Math.min(136, Math.max(120, data.stampSize || 120));
  const logoW = data.logoWidth && data.logoWidth > 450 ? Math.min(680, data.logoWidth) : 420;
  const sigH = data.directorSigHeight || 36;
  /** 2.2 inch round sticker, applied by hand. */
  const stickerPx = Math.round(2.2 * 25.4 * (A4_W / 210));
  /** Separate 23×23 mm hologram, same A4 scale as the sheet. */
  const holoPx = Math.round(23 * (A4_W / 210));

  const fatherName = data.fatherName || data.parentName?.split(" and ")[0]?.split("&")[0]?.trim() || "";
  const motherName = data.motherName || data.parentName?.split(" and ")[1]?.split("&")[0]?.trim() || "";

  const certNo = data.certificateNumber || data.serialNumber || "IVESDC/CERT/2025/000123";
  const enrollNo = data.registrationNumber || "4739846";

  const verifySite = data.verificationWebsite || "www.iveskillcouncil.edu.in";
  const tagline = data.tagline || "Building a Skilled and Self-Reliant Nation";
  const accred1 = data.accreditationLine1 || "An Autonomous Body Registered under Section 8 of the Companies Act, 2013,";
  const accred2 = data.accreditationLine2 || "Ministry of Corporate Affairs, Government of India";
  const accred3 = data.accreditationLine3 || "ISO 21001:2018 & ISO 9001:2015 Certified Organization";
  const registeredOffice =
    data.registeredOffice ||
    "F-107, Dev Krishna Residency, Gunsada, Sub. Dist. Ukai, Dist. Tapi, Gujarat – 394680";
  const govOrder =
    data.govOrderText ||
    "Under The General Administration Department Govt. of Gujarat vide it's Resolution GR\nNo. CRR/12/2007/120320/G5, Dt : 13-8-2008 by Sachivalay Gandhinagar";
  const prose: CSSProperties = {
    fontFamily: `${fontSerif.style.fontFamily}, Georgia, serif`,
    color: C.ink,
    fontSize: `${Math.max(15, bodyFs)}px`,
    lineHeight: 1.45,
  };

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
        boxShadow: "0 12px 36px rgba(11, 31, 58, 0.16)",
        ...sans,
      }}
      data-paper="A4-portrait-certificate"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 55% at 50% 40%, rgba(255,252,245,0.55) 0%, transparent 70%), linear-gradient(165deg, ${C.paper} 0%, ${C.paperWarm} 48%, ${C.paper} 100%)`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute z-[1] overflow-hidden"
        style={{ top: 30, right: 30, bottom: 30, left: 30 }}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/certificates/3bg.png"
          alt=""
          draggable={false}
          className="h-full w-full object-cover"
          style={{ opacity: 0.1 }}
        />
      </div>
      <div
        className="pointer-events-none absolute z-[1] flex justify-center"
        style={{ left: 0, right: 0, top: 600 }}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={data.logoUrl || "/logo/IVESDC%20LOGO-01.png"}
          alt=""
          draggable={false}
          className="object-contain"
          style={{ width: 460, height: "auto", opacity: 0.06, filter: "grayscale(0.35)" }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 z-[1]">
        <CertFrame />
      </div>

      <div
        className="relative z-[2] flex h-full min-h-0 flex-col overflow-hidden"
        style={{ paddingTop: padT, paddingBottom: padB, paddingLeft: padL, paddingRight: padR, boxSizing: "border-box" }}
      >
        <header className="flex shrink-0 flex-col items-center text-center" style={{ maxWidth: contentW }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.logoUrl || "/logo/IVESDC%20LOGO-01.png"}
            alt="IVESDC"
            style={{ width: logoW, height: "auto", maxWidth: "100%" }}
            className="object-contain"
            draggable={false}
          />
          <h2
            lang="hi"
            className="font-devanagari mt-1 flex w-full flex-nowrap items-center justify-center font-bold"
            style={{
              color: C.navy,
              fontFamily: "var(--font-devanagari), 'Noto Sans Devanagari', sans-serif",
              fontSize: "32px",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "0",
              whiteSpace: "nowrap",
            }}
          >
            व्यावसायिक शिक्षा एवं कौशल विकास परिषद्
          </h2>
          <div className="mt-1 px-10 py-2" style={{ background: `linear-gradient(180deg, ${C.orangeHi}, ${C.orange} 45%, ${C.orangeLo})`, clipPath: "polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%)" }}>
            <p className={`${fontInstitution.className} font-extrabold leading-none text-white`} style={{ fontSize: "17px", letterSpacing: "0.015em" }}>{tagline}</p>
          </div>
          <div className={`${fontSerif.className} mt-1 w-full space-y-0.5 font-bold leading-snug`} style={{ color: C.ink, fontSize: "15px" }}>
            <p>{accred1}</p>
            <p>{accred2}{accred3 ? ` · ${accred3}` : ""}</p>
          </div>
          <div className="mt-1 w-full shrink-0">
            <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${C.goldBright} 18%, ${C.gold} 50%, ${C.goldBright} 82%, transparent)` }} />
            <div
              className="flex w-full items-center justify-center"
              style={{
                minHeight: 38,
                marginTop: 4,
                padding: "8px 26px",
                background: `linear-gradient(180deg, #F6B25C 0%, ${C.orange} 46%, ${C.orangeLo} 100%)`,
                clipPath: "polygon(16px 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 16px 100%, 0 50%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.42)",
              }}
            >
              <p
                className={`${fontInstitution.className} text-center font-bold leading-none text-white`}
                style={{
                  fontSize: "13px",
                  letterSpacing: "0.012em",
                  whiteSpace: "nowrap",
                  textShadow: "0 1px 1px rgba(90, 32, 0, 0.28)",
                }}
              >
                IVESDC Which Provides vocational Education &amp; Skill Development Training of NSQF aligned Courses by MSDE, Govt. of India
              </p>
            </div>
            <div style={{ height: 2, marginTop: 4, background: `linear-gradient(90deg, transparent, ${C.goldBright} 18%, ${C.gold} 50%, ${C.goldBright} 82%, transparent)` }} />
          </div>
        </header>

        <div className="cert-title-block mt-2 flex w-full shrink-0 flex-col items-center text-center">
          <h1
            className={`${fontDisplay.className} w-full font-bold uppercase leading-none`}
            style={{
              color: C.navy,
              fontSize: "54px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textAlign: "center",
              paddingLeft: "0.2em",
              lineHeight: 1,
              textShadow: `0 1px 0 #fff, 0 2px 0 ${C.goldSoft}`,
            }}
          >
            Certificate
          </h1>
          <div className="mt-2 flex items-center justify-center">
            <CertificateFlourish />
          </div>
        </div>

        <section
          className="mt-2 grid w-full shrink-0 items-start"
          style={{ gridTemplateColumns: "158px minmax(0, 1fr) 176px" }}
        >
          <aside className="flex shrink-0 flex-col items-center justify-self-start self-start">
            <div style={{ width: photoW, height: photoH, border: `1.5px solid ${C.navy}`, outline: `2px solid ${C.goldSoft}`, outlineOffset: 3, overflow: "hidden", background: C.paperWarm }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.photoUrl || "/cert/sample-student-photo.png"} alt={data.studentName} className="h-full w-full object-cover" draggable={false} />
            </div>
            <p className={`${fontDisplay.className} mt-1.5 text-center font-bold`} style={{ color: C.navy, fontSize: "12px", maxWidth: photoW + 8 }}>
              {data.studentName || "—"}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.studentSignatureUrl || "/cert/sample-student-sig.png"}
              alt="Student signature"
              draggable={false}
              className="object-contain"
              style={{ height: 36, maxWidth: photoW, mixBlendMode: "multiply", background: "transparent" }}
            />
            <p className={`${fontBody.className} font-bold uppercase`} style={{ color: C.navy, fontSize: "9px", letterSpacing: "0.08em" }}>
              Student Signature
            </p>
            <div className="mt-1.5">
              <EnrollmentBarcode
                enrollmentNo={enrollNo}
                showLabel
                showWords
                label="Enrollment No. :"
                barcodeHeight={26}
                containerWidth={150}
                color={C.navy}
                align="center"
              />
            </div>
          </aside>

          <div className={`${fontScript.className} flex min-w-0 flex-col items-center justify-self-center self-center text-center italic`} style={{ maxWidth: 580 }}>
            <p style={{ color: C.navyMid, fontSize: "32px", fontWeight: 600, lineHeight: 1.1, marginBottom: 8 }}>
              This is to Certify that,
            </p>
            <p style={{ color: C.navy, fontSize: "48px", fontWeight: 700, lineHeight: 1.02, textShadow: `0 1px 0 ${C.goldPale}` }}>
              {data.studentName || "—"}
            </p>
            <div style={{ marginTop: 2, marginBottom: 6 }}>
              <NameFlourish />
            </div>
            {(
              [
                <>D/S/O : <span style={{ fontWeight: 700, color: C.navy }}>{fatherName || "—"}</span></>,
                <>D/S/O : <span style={{ fontWeight: 700, color: C.navy }}>{motherName || "—"}</span></>,
                <>has Successfully Completed the</>,
                <>
                  Course of{" "}
                  <span style={{ fontWeight: 700, color: C.navy, fontSize: "28px" }}>
                    {data.courseName || "—"}
                  </span>
                </>,
                <>
                  and Obtained the Grade{" "}
                  <span style={{ fontWeight: 700, color: C.navy }}>{data.grade || "—"}</span>
                  {" "}( {data.marksPercent ?? "—"} Marks)
                </>,
                <>
                  Training Period : <span style={{ fontWeight: 700, color: C.navy }}>{data.trainingStart || "—"}</span>
                  {" "}To{" "}
                  <span style={{ fontWeight: 700, color: C.navy }}>{data.trainingEnd || "—"}</span>
                </>,
                <>Date of Issue : <span style={{ fontWeight: 700, color: C.navy }}>{data.issueDate || "—"}</span></>,
              ] as React.ReactNode[]
            ).map((line, i) => (
              <p key={i} style={{ color: C.ink, fontSize: "26px", fontWeight: 600, lineHeight: 1.2, textAlign: "center", margin: "3px 0" }}>
                {line}
              </p>
            ))}
          </div>

          <aside className="flex shrink-0 flex-col items-center justify-self-end self-start" style={{ width: 148 }}>
            <div
              className="flex shrink-0 flex-col items-center justify-center text-center"
              title="Paste physical hologram here — 23mm × 23mm"
              style={{
                width: holoPx,
                height: holoPx,
                minWidth: holoPx,
                minHeight: holoPx,
                boxSizing: "border-box",
                border: `1.25px dashed ${C.gold}`,
                borderRadius: 2,
                background: "transparent",
                color: C.navyMid,
              }}
            >
              <span className={`${fontBody.className} font-black uppercase leading-tight`} style={{ fontSize: "8px", letterSpacing: "0.06em" }}>
                Hologram
              </span>
              <span className={`${fontBody.className} mt-0.5 font-bold leading-none`} style={{ fontSize: "9px" }}>
                23×23 mm
              </span>
            </div>
            <div
              className="mt-2 flex items-center justify-center"
              style={{
                padding: 6,
                background: "#fff",
                border: `1.5px solid ${C.navy}`,
                outline: `2px solid ${C.goldSoft}`,
                outlineOffset: 3,
              }}
            >
              <CertificateQRCode
                docType="certificate"
                enrollmentNo={enrollNo}
                certificateNo={certNo}
                studentName={data.studentName}
                verificationWebsite={verifySite}
                size={120}
                color="#000000"
                mode="flat"
                captionLine1=""
                captionLine2=""
                showEnrollmentTag={false}
              />
            </div>
            <div
              className="mt-3 inline-flex items-center justify-center gap-1.5"
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                background: `linear-gradient(180deg, ${C.navyMid} 0%, ${C.navy} 100%)`,
                border: `1px solid ${C.goldSoft}`,
                whiteSpace: "nowrap",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M3 8V4a1 1 0 0 1 1-1h4M16 3h4a1 1 0 0 1 1 1v4M21 16v4a1 1 0 0 1-1 1h-4M8 21H4a1 1 0 0 1-1-1v-4"
                  stroke={C.goldBright}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <path d="M7 12h10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
              <span
                className={`${fontBody.className} font-black uppercase text-white`}
                style={{ fontSize: "9.5px", letterSpacing: "0.08em", lineHeight: 1 }}
              >
                Scan to Verify
              </span>
            </div>
            <p
              className={`${fontBody.className} mt-1 text-center font-semibold`}
              style={{ color: C.navyMid, fontSize: "8.5px", lineHeight: 1.25, whiteSpace: "nowrap" }}
            >
              Authentic IVESDC Certificate
            </p>
          </aside>
        </section>

        <footer className="mt-auto flex shrink-0 flex-col" style={{ maxWidth: contentW, paddingTop: 0, marginTop: 0 }}>
          <div className="mb-1 flex items-end justify-between gap-6 px-1">
            <div className="flex shrink-0 flex-col items-center">
              <div className="relative" style={{ width: stampSz, height: stampSz }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.stampUrl || "/certificates/stamp.png"}
                  alt="Official stamp"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-contain"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.directorSignatureUrl || "/certificates/signature.png"}
                  alt="Signature"
                  draggable={false}
                  className="absolute object-contain"
                  style={{ left: "8%", right: "8%", top: "20%", height: Math.max(sigH, Math.round(stampSz * 0.5)), width: "84%" }}
                />
              </div>
              <div style={{ width: 168, height: 2, marginTop: 6, background: C.navy }} />
              <p
                className={`${fontDisplay.className} mt-1.5 text-center font-bold uppercase`}
                style={{ color: C.navy, fontSize: "8px", letterSpacing: "0.05em", lineHeight: 1.25, whiteSpace: "nowrap" }}
              >
                Managing Director Signature
              </p>
              <p
                className={`${fontDisplay.className} mt-1 text-center uppercase`}
                style={{
                  color: C.navyDeep,
                  fontSize: "17px",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  lineHeight: 1,
                  padding: "4px 12px 3px",
                  background: `linear-gradient(180deg, ${C.goldBright} 0%, ${C.goldSoft} 100%)`,
                  borderRadius: 3,
                  boxShadow: `0 1px 0 ${C.gold}`,
                }}
              >
                IVESDC
              </p>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-2 text-center">
              <div className="mb-1.5 flex items-center justify-center" aria-hidden>
                <span style={{ width: 62, height: 1.25, background: `linear-gradient(90deg, transparent, ${C.goldSoft} 40%, ${C.gold})` }} />
                <span
                  style={{
                    width: 6,
                    height: 6,
                    margin: "0 7px",
                    background: `linear-gradient(135deg, ${C.goldBright}, ${C.gold})`,
                    transform: "rotate(45deg)",
                    flexShrink: 0,
                  }}
                />
                <span style={{ width: 62, height: 1.25, background: `linear-gradient(90deg, ${C.gold}, ${C.goldSoft} 60%, transparent)` }} />
              </div>
              <div className={`${fontBody.className} font-bold`} style={{ color: C.navy, fontSize: "12px", lineHeight: 1.45 }}>
                {govOrder.split("\n").filter(Boolean).map((line, i) => (
                  <p key={i} style={{ whiteSpace: "nowrap" }}>
                    {line}
                  </p>
                ))}
              </div>
              <div className="mt-2">
                <EnrollmentBarcode
                  enrollmentNo={data.barcodeNumber || enrollNo}
                  words={data.barcodeTextWords}
                  showLabel={true}
                  showWords={true}
                  label={`Document Serial : ${certNo}`}
                  barcodeHeight={24}
                  containerWidth={280}
                  color={C.navy}
                  align="center"
                />
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-center" style={{ width: 220 }}>
              <div
                className="relative flex w-full items-end justify-center"
                style={{ height: data.atcStampUrl ? 96 : Math.max(48, data.authorizedSigHeight || 48) }}
              >
                {data.atcStampUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.atcStampUrl}
                    alt="ATC stamp"
                    draggable={false}
                    className="pointer-events-none absolute object-contain"
                    style={{ width: 92, height: 92, left: "50%", bottom: 2, transform: "translateX(-50%)", opacity: 0.9 }}
                  />
                ) : null}
                {data.atcSignatureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.atcSignatureUrl}
                    alt="ATC signature"
                    draggable={false}
                    className="relative z-[1] object-contain object-bottom"
                    style={{ height: Math.max(40, data.authorizedSigHeight || 44), maxWidth: 190 }}
                  />
                ) : null}
              </div>
              <div style={{ width: 176, borderTop: `1.5px solid ${C.navy}` }} />
              <p
                className={`${fontDisplay.className} mt-1 text-center font-bold uppercase`}
                style={{ color: C.navy, fontSize: "9px", letterSpacing: "0.06em" }}
              >
                ATC Authorised Signatory
              </p>
              {data.atcSignatoryName ? (
                <p
                  className={`${fontBody.className} max-w-[200px] truncate text-center font-semibold leading-tight`}
                  style={{ color: C.navyMid, fontSize: "9.5px" }}
                >
                  {data.atcSignatoryName}
                </p>
              ) : null}
              <p
                className={`${fontBody.className} max-w-[200px] text-center font-bold leading-tight`}
                style={{ color: C.navyMid, fontSize: "11px" }}
              >
                {data.atcName || "Authorized Training Centre"}
              </p>
            </div>

          </div>

          <div className="flex w-full items-end gap-4">
            <div className="flex min-w-0 flex-1 flex-col">
              <div
                className={`${fontBody.className} flex flex-col gap-0.5 px-3 py-1.5`}
                style={{
                  marginBottom: 16,
                  border: `1px solid ${C.rule}`,
                  borderLeft: `3px solid ${C.gold}`,
                  background: `linear-gradient(90deg, rgba(243,230,192,0.5) 0%, ${C.paperWarm} 45%, transparent 100%)`,
                  fontSize: "11px",
                  color: C.navy,
                  lineHeight: 1.3,
                }}
              >
                <p className="min-w-0 truncate font-bold">
                  <span style={{ color: C.muted, fontWeight: 600 }}>Authorised Training Centre (ATC) Name :</span>{" "}
                  {data.atcName || data.trainingCentreName || "—"}
                </p>
                <p className="min-w-0 truncate font-bold">
                  <span style={{ color: C.muted, fontWeight: 600 }}>ATC.Code :</span>{" "}
                  <span className="tabular-nums">{data.atcCode || "—"}</span>
                </p>
                <p className="min-w-0 truncate font-bold">
                  <span style={{ color: C.muted, fontWeight: 600 }}>ATC Address :</span>{" "}
                  {data.franchiseAddress || data.trainingCentre || "—"}
                </p>
              </div>
              <div
                className="relative w-full"
                style={{
                  border: `2.5px solid ${C.gold}`,
                  borderRadius: 14,
                  background: `linear-gradient(180deg, #FFFDF8 0%, ${C.paperWarm} 100%)`,
                  boxShadow: `inset 0 0 0 1px ${C.navy}, 0 1px 0 rgba(255,255,255,0.7)`,
                  padding: "14px 8px 6px",
                }}
              >
                <div
                  className="absolute left-1/2 flex items-center justify-center"
                  style={{
                    top: 0,
                    transform: "translate(-50%, -52%)",
                    minWidth: 156,
                    height: 20,
                    padding: "0 18px",
                    background: `linear-gradient(180deg, ${C.navyMid} 0%, ${C.navy} 55%, ${C.navyDeep} 100%)`,
                    clipPath:
                      "polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)",
                    boxShadow: `0 1px 0 ${C.goldBright}`,
                  }}
                >
                  <span
                    className={`${fontDisplay.className} font-bold text-white`}
                    style={{ fontSize: "10px", letterSpacing: "0.04em", lineHeight: 1 }}
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
                  style={{ height: 96 }}
                />
                <div
                  className={`${fontBody.className} mt-1 flex items-center justify-center font-bold text-white`}
                  style={{
                    minHeight: 18,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: `linear-gradient(180deg, ${C.navyMid} 0%, ${C.navy} 100%)`,
                    border: `1px solid ${C.gold}`,
                    fontSize: "8.5px",
                    letterSpacing: "0.01em",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                  }}
                >
                  GRADE SYSTEM - A+: Excellent (85% & Above) | A : Very Good (70% to 84%) | B: Good (55% to 69%) | C: Average (40% to 54%)
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <p className="text-left" style={{ ...prose, fontSize: "12px", color: C.navyMid, lineHeight: 1.35 }}>
                  This certificate can be verified by scanning the QR Code or visiting {verifySite}
                </p>
                <p className="mt-1 flex items-baseline gap-2 text-left">
                  <span
                    className={`${fontBody.className} shrink-0 font-black uppercase`}
                    style={{
                      color: C.navy,
                      fontSize: "10px",
                      letterSpacing: "0.06em",
                      background: C.goldPale,
                      padding: "3px 7px",
                      lineHeight: 1.2,
                    }}
                  >
                    Registered Office
                  </span>
                  <span className={`${fontBody.className} font-bold leading-snug`} style={{ color: C.navy, fontSize: "12px" }}>
                    {registeredOffice}
                  </span>
                </p>
              </div>
            </div>
            <div
              className="shrink-0"
              aria-hidden
              style={{
                width: stickerPx,
                height: stickerPx,
                minWidth: stickerPx,
                minHeight: stickerPx,
              }}
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
