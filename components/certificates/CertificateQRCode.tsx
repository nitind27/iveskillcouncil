"use client";

import React, { useEffect, useState, useMemo, type CSSProperties } from "react";
import QRCode from "qrcode";

const sans: CSSProperties = {
  fontFamily: "Arial, Helvetica, -apple-system, BlinkMacSystemFont, sans-serif",
};

export interface CertificateQRCodeProps {
  /** Document type for verification link */
  docType?: "marksheet" | "certificate" | "diploma";
  /** Dynamic student enrollment number */
  enrollmentNo: string | number | undefined | null;
  /** Dynamic certificate or marksheet number */
  certificateNo?: string;
  /** Student full name */
  studentName?: string;
  /** Verification website domain without protocol (e.g. www.iveskillcouncil.edu.in) */
  verificationWebsite?: string;
  /** Size of the QR code square in px (default: 80 for marksheet, 58 for cert) */
  size?: number;
  /** Primary dark color of QR modules (default: "#000000" for maximum contrast & crispness) */
  color?: string;
  /** Background color (default: "#FFFFFF") */
  bgColor?: string;
  /** Optional custom verification URL payload override */
  customPayload?: string;
  /** Sub-caption line 1 (e.g. "Scan QR Code to Verify") */
  captionLine1?: string;
  /** Sub-caption line 2 (e.g. "This Marksheet") */
  captionLine2?: string;
  /** Whether to show dynamic enrollment number tag (default: false) */
  showEnrollmentTag?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Inline container styles */
  style?: CSSProperties;
  /** Layout mode:
   * - "marksheet": square framed QR box on top, centered text underneath outside the box (authentic to res.jpeg)
   * - "card": all-in-one framed card
   * - "flat": no outer frame
   */
  mode?: "marksheet" | "card" | "flat";
}

/**
 * Ultra-high-definition Vector SVG Certificate QR Code Component
 * - 100% Mathematical Vector SVG with crispEdges rendering (zero blur, razor-sharp on retina & print)
 * - Standard 2-module quiet-zone padding around QR matrix for immediate mobile camera scanning
 * - Authentic scannable verification URL embedding dynamic Enrollment No. and Document ID
 * - True-to-original framing with generous whitespace and clear typography
 */
export default function CertificateQRCode({
  docType = "marksheet",
  enrollmentNo,
  certificateNo,
  studentName,
  verificationWebsite = "www.iveskillcouncil.edu.in",
  size = 80,
  color = "#000000",
  bgColor = "#FFFFFF",
  customPayload,
  captionLine1 = "Scan QR Code to Verify",
  captionLine2 = "This Marksheet",
  showEnrollmentTag = false,
  className = "",
  style,
  mode = "marksheet",
}: CertificateQRCodeProps) {
  const [svgXml, setSvgXml] = useState<string | null>(null);

  const cleanEnr = String(enrollmentNo || "4739846").trim();
  const cleanCert = String(certificateNo || "").trim();
  const cleanWebsite = verificationWebsite.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  // Streamlined authentic verification URL (optimal 33-module QR matrix for instant phone scanning)
  const payload = useMemo(() => {
    if (customPayload) return customPayload;
    const typeCode = docType === "marksheet" ? "ms" : "cert";
    if (cleanCert && cleanEnr) {
      return `https://${cleanWebsite}/verify?type=${typeCode}&enr=${encodeURIComponent(cleanEnr)}&id=${encodeURIComponent(cleanCert)}`;
    }
    return `https://${cleanWebsite}/verify?type=${typeCode}&enr=${encodeURIComponent(cleanEnr)}`;
  }, [customPayload, docType, cleanCert, cleanEnr, cleanWebsite]);

  useEffect(() => {
    let cancelled = false;

    // Generate crisp vector SVG with width: 400 for high internal resolution and margin: 2 for standard quiet zone
    QRCode.toString(payload, {
      type: "svg",
      width: 400,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: color,
        light: bgColor,
      },
    })
      .then((svg) => {
        if (cancelled) return;
        setSvgXml(svg);
      })
      .catch((err) => {
        console.error("QRCode generation error:", err);
        if (!cancelled) setSvgXml(null);
      });

    return () => {
      cancelled = true;
    };
  }, [payload, color, bgColor]);

  // Marksheet layout: Square white card containing ONLY the QR code, with text positioned underneath
  if (mode === "marksheet") {
    return (
      <div
        className={`inline-flex flex-col items-center select-none ${className}`}
        style={style}
      >
        {/* Square framed QR box with clean border, subtle shadow and generous padding */}
        <div
          className="flex items-center justify-center rounded border border-[#0E2A54]/35 bg-white p-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
          style={{
            width: size + 12,
            height: size + 12,
          }}
        >
          {svgXml ? (
            <div
              className="h-full w-full flex items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>svg]:block overflow-hidden"
              dangerouslySetInnerHTML={{ __html: svgXml }}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-[9px] text-slate-400 font-mono"
            >
              QR Code
            </div>
          )}
        </div>

        {/* Clean, spacious instruction text positioned underneath the box */}
        {(captionLine1 || captionLine2) && (
          <div
            className="mt-1.5 flex flex-col items-center text-center leading-tight tracking-normal"
            style={{ ...sans, color: "#0E2A54" }}
          >
            {captionLine1 && (
              <span className="text-[8.5px] font-bold">
                {captionLine1}
              </span>
            )}
            {captionLine2 && (
              <span className="text-[8.5px] font-bold mt-0.5">
                {captionLine2}
              </span>
            )}
          </div>
        )}

        {/* Optional dynamic enrollment tag */}
        {showEnrollmentTag && cleanEnr && (
          <div
            className="mt-1 rounded bg-[#0E2A54]/10 border border-[#0E2A54]/20 px-1.5 py-0.5 text-[8px] font-mono font-bold"
            style={{ color: "#0E2A54" }}
          >
            Enr: {cleanEnr}
          </div>
        )}
      </div>
    );
  }

  // All-in-one Card layout (for customizer preview or certificate)
  return (
    <div
      className={`inline-flex flex-col items-center select-none ${
        mode === "card"
          ? "rounded-lg border border-[#1E4A85]/40 bg-white p-2 shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
          : ""
      } ${className}`}
      style={style}
    >
      <div
        className="flex items-center justify-center bg-white p-0.5 rounded"
        style={{
          width: size,
          height: size,
        }}
      >
        {svgXml ? (
          <div
            className="h-full w-full flex items-center justify-center [&>svg]:h-full [&>svg]:w-full [&>svg]:block overflow-hidden"
            dangerouslySetInnerHTML={{ __html: svgXml }}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-[9px] text-slate-400 font-mono"
            style={{ width: size, height: size }}
          >
            QR Code
          </div>
        )}
      </div>

      {(captionLine1 || captionLine2) && (
        <div
          className="mt-1.5 flex flex-col items-center text-center leading-tight px-1"
          style={{ ...sans, color }}
        >
          {captionLine1 && (
            <span className="text-[8.5px] font-extrabold uppercase tracking-wide">
              {captionLine1}
            </span>
          )}
          {captionLine2 && (
            <span className="text-[8px] font-bold opacity-90 mt-0.5">
              {captionLine2}
            </span>
          )}
        </div>
      )}

      {showEnrollmentTag && cleanEnr && (
        <div
          className="mt-1 rounded bg-[#0E2A54]/10 border border-[#0E2A54]/20 px-1.5 py-0.5 text-[7.5px] font-mono font-extrabold text-[#0E2A54]"
        >
          Enr: {cleanEnr}
        </div>
      )}
    </div>
  );
}
