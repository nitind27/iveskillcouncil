"use client";

/**
 * Certificate of Completion — same navy / gold / parchment system as Result Form 3,
 * laid out as a certificate (not a marks table).
 */
import React, { useId, type CSSProperties } from "react";
import { Cinzel, Libre_Baskerville, Montserrat, Source_Sans_3 } from "next/font/google";
import type { CertificateDemoData } from "./demo/types";
import CertificateQRCode from "./CertificateQRCode";

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
  paper: "#FCF9F2",
  paperWarm: "#F4EEE4",
  rule: "rgba(11,31,58,0.16)",
  ruleSoft: "rgba(11,31,58,0.10)",
} as const;

function CertFrame() {
  const uid = useId().replace(/:/g, "");
  const W = A4_W;
  const H = A4_H;
  const outer = 12;
  const gold = 18;
  const inner = 24;
  const goldStroke = `url(#${uid}-gold)`;
  const navyStroke = `url(#${uid}-navy)`;

  const corner = (x: number, y: number, sx: number, sy: number) => (
    <g transform={`translate(${x} ${y}) scale(${sx} ${sy})`}>
      <path d="M0 0 H36 M0 0 V36" fill="none" stroke={goldStroke} strokeWidth="2.4" />
      <path d="M5 5 H28 M5 5 V28" fill="none" stroke={goldStroke} strokeWidth="1" strokeOpacity="0.75" />
      <rect x="0" y="0" width="8" height="8" fill={goldStroke} transform="rotate(45 4 4)" />
      <rect x="2" y="2" width="4" height="4" fill="#FFF8E0" transform="rotate(45 4 4)" />
    </g>
  );

  const midJewel = (cx: number, cy: number, horizontal: boolean) => (
    <g transform={`translate(${cx} ${cy})`}>
      <rect x="-5" y="-5" width="10" height="10" fill={goldStroke} transform="rotate(45)" />
      <rect x="-2.5" y="-2.5" width="5" height="5" fill="#FFF8E0" transform="rotate(45)" />
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
    <svg className="pointer-events-none absolute inset-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" aria-hidden>
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
      <rect x={outer} y={outer} width={W - outer * 2} height={H - outer * 2} stroke={navyStroke} strokeWidth="2.5" />
      <rect x={gold} y={gold} width={W - gold * 2} height={H - gold * 2} stroke={goldStroke} strokeWidth="2.2" />
      <rect x={inner} y={inner} width={W - inner * 2} height={H - inner * 2} stroke={navyStroke} strokeWidth="0.9" strokeOpacity="0.55" />
      {corner(outer + 4, outer + 4, 1, 1)}
      {corner(W - outer - 4, outer + 4, -1, 1)}
      {corner(outer + 4, H - outer - 4, 1, -1)}
      {corner(W - outer - 4, H - outer - 4, -1, -1)}
      {midJewel(W / 2, gold, true)}
      {midJewel(W / 2, H - gold, true)}
      {midJewel(gold, H / 2, false)}
      {midJewel(W - gold, H / 2, false)}
    </svg>
  );
}

/** Calligraphic underline — end spirals and a center infinity, matching the reference title. */
function CertificateFlourish() {
  const stroke = "#1A1A1A";
  return (
    <svg width="560" height="52" viewBox="0 0 720 64" fill="none" aria-hidden>
      <g stroke={stroke} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M86 34 C62 34 48 20 60 12 C72 4 92 12 86 24 C80 34 64 36 70 26 C74 18 86 20 82 28" />
        <path d="M80 32 H268" />
        <path d="M268 32 C268 10 332 4 360 32 C388 60 452 54 452 32 C452 10 388 4 360 32 C332 60 268 54 268 32" />
        <path d="M452 32 H640" />
        <path d="M634 34 C658 34 672 20 660 12 C648 4 628 12 634 24 C640 34 656 36 650 26 C646 18 634 20 638 28" />
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
  const photoW = data.photoWidth || 108;
  const photoH = data.photoHeight || 128;
  const stampSz = Math.min(96, Math.max(68, data.stampSize || 84));
  const logoH = Math.min(168, Math.max(130, data.logoHeight || 150));
  const logoMaxW = Math.min(340, Math.max(240, data.logoWidth || 300));
  const sigH = data.directorSigHeight || 36;

  const fatherName = data.fatherName || data.parentName?.split(" and ")[0]?.split("&")[0]?.trim() || "";
  const motherName = data.motherName || data.parentName?.split(" and ")[1]?.split("&")[0]?.trim() || "";
  const parentNames = [fatherName, motherName].filter(Boolean);
  const parentLine = parentNames.length > 1 ? parentNames.join(" and ") : parentNames[0] || "—";

  const certNo = data.certificateNumber || data.serialNumber || "IVESDC/CERT/2025/000123";
  const enrollNo = data.registrationNumber || "4739846";

  const verifySite = data.verificationWebsite || "www.iveskillcouncil.edu.in";
  const verifyEmail = data.verificationEmail || "official.iveskillcouncil@gmail.com";
  const tagline = data.tagline || "Building a Skilled and Self-Reliant Nation";
  const accred1 = data.accreditationLine1 || "An Autonomous Body Registered under Section 8 of the Companies Act, 2013,";
  const accred2 = data.accreditationLine2 || "Ministry of Corporate Affairs, Government of India";
  const accred3 = data.accreditationLine3 || "ISO 21001:2018 & ISO 9001:2015 Certified Organization";
  const registeredOffice =
    data.registeredOffice ||
    "F-107, Dev Krishna Residency, Gunsada, Sub. Dist. Ukai, Dist. Tapi, Gujarat – 394680";
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
      <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/certificates/logowithoutbg.png"
          alt=""
          draggable={false}
          style={{ width: 420, opacity: 0.16, objectFit: "contain" }}
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
            style={{ height: logoH, width: "auto", maxWidth: logoMaxW }}
            className="object-contain"
            draggable={false}
          />
          <h2
            lang="hi"
            className="font-devanagari mt-2 flex w-full flex-nowrap items-center justify-center font-bold"
            style={{
              color: C.navy,
              fontFamily: "var(--font-devanagari), 'Noto Sans Devanagari', sans-serif",
              fontSize: "26px",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "0",
              whiteSpace: "nowrap",
            }}
          >
            व्यावसायिक शिक्षा एवं कौशल विकास परिषद्
          </h2>
          <div className="mt-2.5 px-9 py-[7px]" style={{ background: `linear-gradient(180deg, ${C.orangeHi}, ${C.orange} 45%, ${C.orangeLo})`, clipPath: "polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%)" }}>
            <p className={`${fontInstitution.className} font-bold leading-none text-white`} style={{ fontSize: "14px", letterSpacing: "0.02em" }}>{tagline}</p>
          </div>
          <div className={`${fontSerif.className} mt-2 space-y-0.5 font-bold leading-snug`} style={{ color: C.ink, fontSize: "12.5px", maxWidth: 760 }}>
            <p>{accred1}</p>
            <p>{accred2}{accred3 ? ` · ${accred3}` : ""}</p>
          </div>
          <div
            className="mt-2.5 w-full shrink-0"
            style={{
              padding: "2px",
              background: `linear-gradient(90deg, ${C.goldPale}, ${C.goldBright}, ${C.gold}, ${C.goldBright}, ${C.goldPale})`,
            }}
          >
            <div
              className="flex w-full items-center justify-center"
              style={{
                minHeight: 32,
                padding: "6px 12px",
                background: `linear-gradient(180deg, ${C.orangeHi} 0%, ${C.orange} 46%, ${C.orangeLo} 100%)`,
                border: "1px solid rgba(110, 42, 6, 0.72)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
              }}
            >
              <p
                className={`${fontInstitution.className} w-full text-center font-semibold leading-none text-white`}
                style={{
                  fontSize: "12.5px",
                  letterSpacing: "0.01em",
                  whiteSpace: "nowrap",
                  textShadow: "0 1px 1px rgba(80, 28, 0, 0.35)",
                }}
              >
                IVESDC Which Provides vocational Education &amp; Skill Development Training of NSQF aligned Courses by MSDE, Govt. of India
              </p>
            </div>
          </div>
        </header>

        <div className="cert-title-block mt-3 flex w-full shrink-0 flex-col items-center text-center">
          <h1
            className="w-full font-bold uppercase leading-none"
            style={{
              fontFamily: `'Times New Roman', Times, ${fontSerif.style.fontFamily}, Georgia, serif`,
              color: "#1A1A1A",
              fontSize: "58px",
              fontWeight: 700,
              letterSpacing: "0.045em",
              textAlign: "center",
              paddingLeft: "0.045em",
              lineHeight: 0.95,
            }}
          >
            Certificate
          </h1>
          <div className="mt-0.5 flex items-center justify-center">
            <CertificateFlourish />
          </div>
          <p className={`${fontSerif.className} mt-2 font-bold italic`} style={{ color: C.navyMid, fontSize: "16px" }}>
            This is to certify that
          </p>
        </div>

        <section className="mt-2 flex w-full shrink-0 flex-col items-center text-center">
          <p className={`${fontDisplay.className} font-black uppercase`} style={{ color: C.navy, fontSize: "30px", letterSpacing: "0.04em", lineHeight: 1.15 }}>
            {data.studentName || "—"}
          </p>
          <p className="mt-2" style={{ ...prose, fontSize: "16px", maxWidth: 720 }}>
            Son/Daughter of <span className="font-bold" style={{ color: C.navy }}>{parentLine}</span>
          </p>
          <p className="mt-2" style={{ ...prose, fontSize: "16px", maxWidth: 760 }}>
            has successfully completed the{" "}
            <span className={`${fontDisplay.className} font-bold`} style={{ color: C.navy, fontSize: "20px" }}>
              {data.courseName || "—"}
            </span>
          </p>
          <p className="mt-1" style={{ ...prose, fontSize: "16px", maxWidth: 760 }}>
            conducted by this Institute from {data.trainingStart || "—"} to {data.trainingEnd || "—"}.
          </p>
          <p className="mt-2" style={{ ...prose, fontSize: "15px", maxWidth: 680, lineHeight: 1.45 }}>
            He/She has acquired the necessary skills and knowledge and is awarded this certificate in recognition of his/her achievement.
          </p>
        </section>

        <section className="mt-4 flex shrink-0 items-end justify-between" style={{ maxWidth: contentW }}>
          <div className="flex flex-col gap-1.5" style={{ minWidth: 280 }}>
            <p style={{ ...prose, fontSize: "15px" }}>
              <span className={`${fontBody.className} font-bold`} style={{ color: C.navy }}>Enrollment No.</span>
              <span style={{ color: C.gold }}> : </span>
              {enrollNo}
            </p>
            <p style={{ ...prose, fontSize: "15px" }}>
              <span className={`${fontBody.className} font-bold`} style={{ color: C.navy }}>Date of Issue</span>
              <span style={{ color: C.gold }}> : </span>
              {data.issueDate || "—"}
            </p>
            <p style={{ ...prose, fontSize: "15px" }}>
              <span className={`${fontBody.className} font-bold`} style={{ color: C.navy }}>Place</span>
              <span style={{ color: C.gold }}> : </span>
              {data.place || "—"}
            </p>
          </div>

          <aside className="flex shrink-0 flex-col items-center">
            <div style={{ width: photoW, height: photoH, border: `1.5px solid ${C.navy}`, outline: `2px solid ${C.goldSoft}`, outlineOffset: 3, overflow: "hidden", background: C.paperWarm }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.photoUrl || "/cert/sample-student-photo.png"} alt={data.studentName} className="h-full w-full object-cover" draggable={false} />
            </div>
            <p className={`${fontDisplay.className} mt-1.5 font-bold`} style={{ color: C.navy, fontSize: "13px" }}>
              {data.studentName || "—"}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.studentSignatureUrl || "/cert/sample-student-sig.png"}
              alt="Student signature"
              draggable={false}
              className="object-contain"
              style={{ height: 28, maxWidth: photoW }}
            />
            <p className={`${fontBody.className} font-bold uppercase`} style={{ color: C.navy, fontSize: "9px", letterSpacing: "0.08em" }}>
              Student Signature
            </p>
          </aside>
        </section>

        <footer className="mt-auto flex shrink-0 flex-col" style={{ maxWidth: contentW, paddingTop: 6 }}>
          <div className="flex items-end justify-between px-4">
            <div className="flex flex-col items-center">
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
                  style={{ left: "10%", right: "10%", top: "22%", height: Math.max(sigH, 40), width: "80%" }}
                />
              </div>
              <p className={`${fontDisplay.className} mt-1 text-center font-bold uppercase`} style={{ color: C.navy, fontSize: "9px", letterSpacing: "0.06em" }}>
                Director Signature
              </p>
              <p className={`${fontBody.className} text-center font-bold`} style={{ color: C.navyMid, fontSize: "11px" }}>
                Director
              </p>
            </div>

            <div className="flex flex-col items-center justify-end gap-1">
              <CertificateQRCode
                docType="certificate"
                enrollmentNo={enrollNo}
                certificateNo={certNo}
                studentName={data.studentName}
                verificationWebsite={verifySite}
                size={72}
                color="#000000"
                mode="flat"
                captionLine1=""
                captionLine2=""
                showEnrollmentTag={false}
              />
            </div>
          </div>

          <p className="mt-2 text-center" style={{ ...prose, fontSize: "12px", color: C.navyMid }}>
            This certificate can be verified by scanning the QR Code or visiting {verifySite}
          </p>
          <p className="mt-1 text-center" style={{ color: C.muted, fontSize: "11px" }}>
            Registered Office: {registeredOffice}
          </p>

          <div className="mt-2 shrink-0 overflow-hidden">
            <div style={{ height: 2.5, background: `linear-gradient(90deg, ${C.goldPale}, ${C.goldBright}, ${C.gold}, ${C.goldBright}, ${C.goldPale})` }} />
            <div
              className="flex items-stretch"
              style={{
                minHeight: 34,
                background: `linear-gradient(180deg, rgba(226,199,106,0.22) 0%, transparent 32%), linear-gradient(90deg, ${C.navyDeep}, ${C.navy} 42%, #102848)`,
              }}
            >
              <div
                className="flex shrink-0 items-center"
                style={{
                  background: `linear-gradient(180deg, ${C.goldBright}, ${C.gold} 46%, #8C6A22)`,
                  padding: "0 16px 0 12px",
                  clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)",
                }}
              >
                <span className={`${fontDisplay.className} font-black uppercase`} style={{ color: C.navyDeep, fontSize: "8px", letterSpacing: "0.2em" }}>
                  Verify
                </span>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2 px-3 text-white">
                <span className={`${fontBody.className} truncate font-bold`} style={{ fontSize: "8.5px" }}>{verifySite}</span>
                <span className="h-3 w-px shrink-0" style={{ background: "rgba(226,199,106,0.55)" }} />
                <span className={`${fontBody.className} truncate font-semibold`} style={{ color: C.goldPale, fontSize: "8px" }}>{verifyEmail}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2 px-3" style={{ borderLeft: "1px solid rgba(226,199,106,0.5)" }}>
                <span className={`${fontDisplay.className} font-black uppercase`} style={{ color: C.goldBright, fontSize: "8px", letterSpacing: "0.16em" }}>
                  IVESDC
                </span>
                <span className={`${fontBody.className} font-bold uppercase`} style={{ color: C.navyDeep, fontSize: "6.5px", letterSpacing: "0.1em", background: `linear-gradient(180deg, ${C.goldPale}, ${C.goldSoft})`, padding: "3px 6px" }}>
                  Official Certificate
                </span>
              </div>
            </div>
            <div style={{ height: 2, background: `linear-gradient(90deg, ${C.gold}, ${C.goldBright}, ${C.gold})` }} />
          </div>
        </footer>
      </div>
    </div>
  );
}
