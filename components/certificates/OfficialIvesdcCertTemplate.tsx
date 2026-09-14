"use client";

import React, { useEffect, useState, type CSSProperties } from "react";
import QRCode from "qrcode";
import type { CertificateDemoData } from "./demo/types";
import EnrollmentBarcode from "./EnrollmentBarcode";
import CertificateQRCode from "./CertificateQRCode";

interface Props {
  data: CertificateDemoData;
  className?: string;
  printId?: string;
  borderStyle?: "ornate" | "guilloche";
}

const sans: CSSProperties = { fontFamily: "Arial, Helvetica, -apple-system, BlinkMacSystemFont, sans-serif" };
const serif: CSSProperties = { fontFamily: "Georgia, 'Times New Roman', Times, serif" };
const cursive: CSSProperties = {
  fontFamily: "'Brush Script MT', 'Great Vibes', 'Dancing Script', 'Alex Brush', 'Playfair Display', cursive, serif",
};

export default function OfficialIvesdcCertTemplate({
  data,
  className = "",
  printId = "official-ivesdc-cert",
  borderStyle,
}: Props) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const activeBorder = borderStyle || data.borderStyle || "ornate";
  const borderSrc =
    data.customBorderUrl ||
    (activeBorder === "guilloche"
      ? "/cert/res-border-pristine.png?v=clean"
      : "/cert/cert-border-pristine.png?v=clean");

  useEffect(() => {
    let cancelled = false;
    const verifyPayload = `IVESDC CERTIFICATE VERIFICATION
Certificate No: ${data.certificateNumber || data.serialNumber || "IVESDC/CERT/2025/000123"}
Enrollment No: ${data.registrationNumber || "4739846"}
Candidate: ${data.studentName}
Course: ${data.courseName}
Duration: ${data.trainingStart} to ${data.trainingEnd}
Issue Date: ${data.issueDate}
Verify Online: https://${data.verificationWebsite || "www.iveskillcouncil.edu.in"}/verify`;

    QRCode.toDataURL(verifyPayload, {
      width: 130,
      margin: 1,
      color: { dark: "#0F2A4A", light: "#FFFFFF" },
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
    data.trainingStart,
    data.trainingEnd,
    data.issueDate,
    data.verificationWebsite,
  ]);

  const fatherName = data.fatherName || data.parentName?.split(" and ")[0]?.split("&")[0]?.trim() || "Demo Father Name";
  const motherName = data.motherName || data.parentName?.split(" and ")[1]?.split("&")[1]?.trim() || "Demo Mother Name";

  // Dynamic Typography & Content Font Scaling
  const fontScale = (data.innerFontScale || 100) / 100;
  const baseCertBodyFont = data.certBodyFontSize || 15.5;
  const bodyFont = baseCertBodyFont * fontScale;
  const studentNameSize = Math.round((data.studentNameFontSize || 44) * fontScale);

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
      {/* 1. Authentic Pristine Border Image (from cert.jpeg / res.jpeg) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={borderSrc}
        alt="Certificate Border"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-fill"
        draggable={false}
      />

      {/* 2. Background Security Watermark (Disabled by default, only shown if explicitly enabled) */}
      {Boolean(data.watermarkType && data.watermarkType !== "none" && typeof data.watermarkOpacity === "number" && data.watermarkOpacity > 0) && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
          style={{ opacity: data.watermarkOpacity !== undefined ? data.watermarkOpacity : 0.04 }}
        >
          {data.watermarkType === "tiled-grid" ? (
            <svg width="1054" height="1492" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
              <defs>
                <pattern id="ivesdc-seal-cert-pattern" width="140" height="140" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
                  <g transform="translate(35, 35)">
                    <circle cx="35" cy="35" r="28" stroke={data.watermarkColor || "#1E4A85"} strokeWidth="1.5" fill="none" strokeDasharray="4 2" />
                    <circle cx="35" cy="35" r="23" stroke={data.watermarkColor || "#1E4A85"} strokeWidth="0.8" fill="none" />
                    <path d="M35 18 L48 27 L35 36 L22 27 Z" fill={data.watermarkColor || "#1E4A85"} />
                    <path d="M26 31 V44 C26 50 35 55 35 55 C35 55 44 50 44 44 V31" fill="none" stroke={data.watermarkColor || "#1E4A85"} strokeWidth="1.5" />
                    <text x="35" y="47" textAnchor="middle" fill={data.watermarkColor || "#1E4A85"} fontSize="5.5" fontWeight="bold" letterSpacing="0.8">
                      IVESDC
                    </text>
                  </g>
                </pattern>
              </defs>
              <rect x="56" y="65" width="942" height="1362" fill="url(#ivesdc-seal-cert-pattern)" />
            </svg>
          ) : (
            <svg width="560" height="560" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="85" stroke={data.watermarkColor || "#1E4A85"} strokeWidth="6" strokeDasharray="8 6" />
              <circle cx="100" cy="100" r="70" stroke={data.watermarkColor || "#1E4A85"} strokeWidth="2" />
              <path
                d="M100 45 L150 72 L100 99 L50 72 Z"
                fill={data.watermarkColor || "#1E4A85"}
              />
              <path
                d="M65 82 V120 C65 138 100 152 100 152 C100 152 135 138 135 120 V82"
                fill="none"
                stroke={data.watermarkColor || "#1E4A85"}
                strokeWidth="5"
              />
              <path d="M145 74 V130" stroke={data.watermarkColor || "#1E4A85"} strokeWidth="3" />
              <circle cx="145" cy="133" r="4" fill={data.watermarkColor || "#1E4A85"} />
              <text
                x="100"
                y="175"
                textAnchor="middle"
                fill={data.watermarkColor || "#1E4A85"}
                fontSize="12"
                fontWeight="bold"
                letterSpacing="2"
              >
                IVESDC
              </text>
            </svg>
          )}
        </div>
      )}

      {/* 3. Main Certificate Workspace */}
      <div
        className="relative z-[2] flex h-full flex-col justify-between"
        style={{
          paddingTop: data.paddingTop !== undefined ? data.paddingTop : 66,
          paddingBottom: data.paddingBottom !== undefined ? data.paddingBottom : 68,
          paddingLeft: data.paddingLeft !== undefined ? data.paddingLeft : 58,
          paddingRight: data.paddingRight !== undefined ? data.paddingRight : 58,
        }}
      >
        {/* ================= HEADER SECTION ================= */}
        <div className="shrink-0" style={{ marginBottom: data.headerSpacing !== undefined ? data.headerSpacing : 4 }}>
          {/* Top Row: Sr. No. at top right */}
          <div className="flex items-center justify-end pr-2 pt-1">
            <span className="text-[12px] font-bold text-slate-900" style={sans}>
              Sr. No.: <span className="font-semibold">{data.serialNumber || "IVESDC/CERT/2025/000123"}</span>
            </span>
          </div>

          {/* Institution Header Block */}
          <div className="mt-1 flex items-center justify-between px-2">
            {/* Left: IVESDC Logo */}
            <div className="shrink-0 flex items-center justify-start" style={{ width: data.logoWidth || 180 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.logoUrl || "/cert/ivesdc-logo.png?v=clean"}
                alt="IVESDC Logo"
                style={{ height: data.logoHeight || 84 }}
                className="w-auto max-w-full object-contain"
                draggable={false}
              />
            </div>

            {/* Center: Title & Accreditations */}
            <div className="flex-1 px-3 text-center">
              <h1
                className="font-black uppercase tracking-[0.02em] text-[#0F2A4A]"
                style={{
                  ...sans,
                  fontSize: data.titleFontSize ? `${data.titleFontSize}px` : "20px",
                }}
              >
                {data.instituteName || "INSTITUTE OF VOCATIONAL EDUCATION AND SKILL DEVELOPMENT COUNCIL"}
              </h1>

              {/* Golden Tagline Ribbon */}
              <div className="my-1.5 flex items-center justify-center">
                <div className="relative inline-flex items-center justify-center bg-gradient-to-r from-[#DDA743] via-[#F4CF74] to-[#DDA743] px-7 py-1 shadow-sm">
                  {/* Ribbon swallowtails */}
                  <div
                    className="absolute -left-2.5 top-0 bottom-0 w-3 bg-[#DDA743]"
                    style={{ clipPath: "polygon(100% 0, 100% 100%, 0 50%)" }}
                  />
                  <div
                    className="absolute -right-2.5 top-0 bottom-0 w-3 bg-[#DDA743]"
                    style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
                  />
                  <span className="text-[12.5px] font-extrabold uppercase tracking-wide text-slate-950">
                    {data.tagline || "Building a Skilled and Self-Reliant Nation"}
                  </span>
                </div>
              </div>

              {/* Accreditation Text */}
              <div className="space-y-0.5 text-[9.5px] font-bold leading-tight text-slate-900">
                <p>{data.accreditationLine1 || "An Autonomous Body Registered under Section 8 of the Companies Act, 2013"}</p>
                <p>{data.accreditationLine2 || "Ministry of Corporate Affairs, Government of India"}</p>
                <p className="font-extrabold text-[#1E4A85]">
                  {data.accreditationLine3 || "ISO 9001:2015 & ISO 21001:2018 Certified Organization"}
                </p>
              </div>
            </div>

            {/* Right: Certified ISO Seal */}
            <div className="flex shrink-0 items-center justify-end" style={{ width: data.logoWidth || 180 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.isoSealUrl || "/cert/iso-seal.png"}
                alt="ISO 9001:2015 Certified"
                style={{
                  height: data.isoSealSize || 84,
                  width: data.isoSealSize || 84,
                }}
                className="object-contain drop-shadow-sm"
                draggable={false}
              />
            </div>
          </div>

          {/* Thin Gold Line with Center Diamond */}
          <div className="relative my-2 flex items-center justify-center">
            <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-[#C4A35A] to-transparent" />
            <div className="absolute h-2 w-2 rotate-45 bg-[#C4A35A]" />
          </div>

          {/* Government / Partner Logos Row */}
          <div className="px-2 flex items-center justify-between w-full min-h-[44px]">
            {data.partnerLogos && data.partnerLogos.length > 0 ? (
              data.partnerLogos.map((logo, idx) => (
                <div key={logo.id || idx} className="flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.url}
                    alt={logo.name || `Partner Logo ${idx + 1}`}
                    style={{
                      height: logo.height || data.partnerLogosHeight || 44,
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
                style={{ height: data.partnerLogosHeight || 44 }}
                className="w-full object-contain"
                draggable={false}
              />
            )}
          </div>
        </div>

        {/* ================= CERTIFICATE BODY ================= */}
        <div className="my-auto flex flex-col items-center px-6 text-center">
          {/* Certificate Title */}
          <div className="relative flex items-center justify-center gap-4">
            <div className="flex items-center gap-1 text-[#C4A35A]">
              <div className="h-px w-14 bg-[#C4A35A]" />
              <span className="text-xs">✦</span>
            </div>
            <h2
              className="text-[34px] font-extrabold uppercase tracking-[0.14em] text-[#0F2A4A]"
              style={{ ...serif, textShadow: "0 1px 1px rgba(0,0,0,0.06)" }}
            >
              CERTIFICATE OF COMPLETION
            </h2>
            <div className="flex items-center gap-1 text-[#C4A35A]">
              <span className="text-xs">✦</span>
              <div className="h-px w-14 bg-[#C4A35A]" />
            </div>
          </div>

          {/* Subtitle */}
          <p
            className="mt-3 font-medium tracking-wide text-slate-800"
            style={{ ...sans, fontSize: `${Math.round(bodyFont * 0.9)}px` }}
          >
            This is to certify that
          </p>

          {/* Student Name in Signature / Cursive Script */}
          <div className="mt-1 w-full max-w-[760px] pb-1">
            <p
              className="font-bold text-[#163A6B]"
              style={{
                ...cursive,
                fontSize: `${studentNameSize}px`,
                letterSpacing: "0.02em",
                textShadow: "0 1px 2px rgba(22,58,107,0.12)",
              }}
            >
              {data.studentName}
            </p>
            {/* Underline */}
            <div className="mx-auto h-[1.5px] w-3/4 bg-gradient-to-r from-transparent via-[#C4A35A] to-transparent" />
          </div>

          {/* Parentage */}
          <p
            className="mt-3 text-slate-800"
            style={{ ...sans, fontSize: `${Math.round(bodyFont)}px` }}
          >
            Son/Daughter of{" "}
            <strong className="font-extrabold text-[#0F2A4A]">{fatherName}</strong>
            {" and "}
            <strong className="font-extrabold text-[#0F2A4A]">{motherName}</strong>
          </p>

          {/* Course Details */}
          <p
            className="mt-2 text-slate-800"
            style={{ ...sans, fontSize: `${Math.round(bodyFont)}px` }}
          >
            has successfully completed the{" "}
            <strong
              className="font-extrabold text-[#163A6B]"
              style={{ fontSize: `${Math.round(bodyFont * 1.1)}px` }}
            >
              {data.courseName}
            </strong>
          </p>

          {/* Duration */}
          <p
            className="mt-2 text-slate-800"
            style={{ ...sans, fontSize: `${Math.round(bodyFont * 0.96)}px` }}
          >
            conducted by this Institute from{" "}
            <strong className="font-bold text-slate-900">
              {data.trainingStart} to {data.trainingEnd}.
            </strong>
          </p>

          {/* Recognition Statement */}
          <p
            className="mt-3 max-w-[820px] leading-relaxed text-slate-700"
            style={{ ...sans, fontSize: `${Math.round(bodyFont * 0.88)}px` }}
          >
            He/She has acquired the necessary skills and knowledge and is awarded this certificate in
            recognition of his/her achievement.
          </p>
        </div>

        {/* ================= AUTHENTICATION & SIGNATURES ================= */}
        <div className="shrink-0 px-4">
          <div className="grid grid-cols-3 items-end gap-2 pb-2">
            {/* Column 1: Enrollment details + Director Signature */}
            <div className="space-y-4">
              <div
                className="space-y-1 text-slate-900"
                style={{ ...sans, fontSize: `${Math.round(12 * fontScale)}px` }}
              >
                {data.showEnrollmentBarcode ? (
                  <div className="pb-1">
                    <EnrollmentBarcode
                      enrollmentNo={data.registrationNumber || data.barcodeNumber || "4739846"}
                      words={data.barcodeTextWords}
                      color="#000000"
                      showLabel={true}
                      showWords={true}
                      barcodeHeight={36}
                      align="left"
                    />
                  </div>
                ) : (
                  <p>
                    <span className="font-semibold text-slate-600">Enrollment No. :</span>{" "}
                    <strong className="font-mono font-extrabold text-[#0F2A4A]">
                      {data.registrationNumber || "4739846"}
                    </strong>
                  </p>
                )}
                <p>
                  <span className="font-semibold text-slate-600">Date of Issue :</span>{" "}
                  <strong className="font-bold">{data.issueDate}</strong>
                </p>
                <p>
                  <span className="font-semibold text-slate-600">Place :</span>{" "}
                  <strong className="font-bold">{data.place || "Gandhinagar, Gujarat"}</strong>
                </p>
              </div>

              {/* Director Signature */}
              <div className="pt-2">
                <div className="flex h-[52px] items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.directorSignatureUrl || "/cert/sig-director.png"}
                    alt="Director Signature"
                    style={{ height: data.directorSigHeight || 48 }}
                    className="w-auto object-contain"
                    draggable={false}
                  />
                </div>
                <div className="w-[170px] border-t border-slate-700 pt-1">
                  <p className="text-[12px] font-extrabold tracking-wide text-slate-900" style={sans}>
                    {data.directorTitle || "Director"}
                  </p>
                </div>
              </div>
            </div>

            {/* Column 2: Gold Medal Seal + Blue Stamp */}
            <div className="flex flex-col items-center justify-end">
              <div className="relative flex items-center justify-center">
                {/* Gold Seal with Laurel and Ribbons */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.goldMedalUrl || "/cert/seal-gold-medal.png"}
                  alt="Official Gold Seal"
                  style={{ height: data.goldMedalSize || 125 }}
                  className="w-auto object-contain drop-shadow-md"
                  draggable={false}
                />
              </div>

              {/* Circular Blue Stamp */}
              <div className="-mt-7">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.stampUrl || "/cert/stamp-blue.png"}
                  alt="Official Stamp"
                  style={{
                    height: data.stampSize || 84,
                    width: data.stampSize || 84,
                  }}
                  className="object-contain opacity-95"
                  draggable={false}
                />
              </div>
            </div>

            {/* Column 3: Student Photo & Signature + Authorized Signatory */}
            <div className="flex flex-col items-end space-y-4">
              {/* Student Photo with Frame */}
              <div className="flex flex-col items-center">
                <div
                  className="relative overflow-hidden rounded-[2px] border-2 border-[#1E4A85] bg-slate-100 p-0.5 shadow-sm"
                  style={{
                    width: data.photoWidth || 72,
                    height: data.photoHeight || 86,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.photoUrl || "/cert/sample-student-photo.png"}
                    alt={data.studentName}
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Student Signature Line */}
                <div className="mt-1 text-center">
                  {data.studentSignatureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={data.studentSignatureUrl}
                      alt="Student Signature"
                      style={{ height: data.studentSigHeight || 28 }}
                      className="w-auto object-contain"
                    />
                  ) : (
                    <p className="text-[12px] font-semibold text-slate-800" style={cursive}>
                      {data.studentName}
                    </p>
                  )}
                  <p className="border-t border-slate-400 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                    Student Signature
                  </p>
                </div>
              </div>

              {/* Authorized Signatory */}
              <div className="pt-2 text-right">
                <div className="flex h-[52px] items-center justify-end">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/cert/sig-authorized.png"
                    alt="Authorized Signatory"
                    style={{ height: data.authorizedSigHeight || 48 }}
                    className="w-auto object-contain"
                    draggable={false}
                  />
                </div>
                <div className="w-[170px] border-t border-slate-700 pt-1 text-right">
                  <p className="text-[12px] font-extrabold tracking-wide text-slate-900" style={sans}>
                    Authorized Signatory
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Box with QR Code on Right with generous padding & quiet zone */}
          <div className="mb-1 flex items-center justify-between rounded-lg border border-[#1E4A85]/60 bg-white/95 px-4 py-2 shadow-sm gap-4">
            {/* Left: Verification Website & Accredited Training Centre */}
            <div className="flex-1 space-y-1">
              <div className="text-[11px] leading-snug text-slate-800" style={sans}>
                <p className="font-semibold">
                  This certificate can be verified by scanning the QR Code or visiting
                </p>
                <p className="font-extrabold text-[#1E4A85] tracking-wide text-[11.5px]">
                  https://{data.verificationWebsite || "www.iveskillcouncil.edu.in"}/verify
                </p>
              </div>
              <div className="text-[10px] text-slate-600 pt-0.5" style={sans}>
                <span className="font-bold text-slate-900">{data.trainingCentreName || data.atcName}</span>
                {data.franchiseAddress && (
                  <span className="text-slate-500 text-[9.5px]"> — {data.franchiseAddress}</span>
                )}
              </div>
            </div>

            {/* Right: Crystal Clear High-Definition QR Code with quiet-zone padding & border */}
            <div className="shrink-0 flex items-center">
              <CertificateQRCode
                docType="certificate"
                enrollmentNo={data.registrationNumber || "4739846"}
                certificateNo={data.certificateNumber || data.serialNumber || "IVESDC/CERT/2025/00123"}
                studentName={data.studentName}
                verificationWebsite={data.verificationWebsite || "www.iveskillcouncil.edu.in"}
                size={data.qrCodeSize || 56}
                color="#000000"
                mode="card"
                captionLine1="Scan to Verify"
                captionLine2={`Enr: ${data.registrationNumber || "4739846"}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
