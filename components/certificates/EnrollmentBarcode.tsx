"use client";

import React, { useMemo, type CSSProperties } from "react";

const sans: CSSProperties = {
  fontFamily: "Arial, Helvetica, -apple-system, BlinkMacSystemFont, sans-serif",
};

export const DIGIT_WORDS_MAP: Record<string, string> = {
  "0": "ZERO",
  "1": "ONE",
  "2": "TWO",
  "3": "THREE",
  "4": "FOUR",
  "5": "FIVE",
  "6": "SIX",
  "7": "SEVEN",
  "8": "EIGHT",
  "9": "NINE",
};

/** Convert any numeric string into uppercase English digit words (e.g. "4739846" -> "FOUR  SEVEN  THREE  NINE  EIGHT  FOUR  SIX") */
export function convertNumberToDigitWords(numStr: string | number | undefined | null): string {
  if (numStr === undefined || numStr === null) return "";
  const str = String(numStr).trim();
  if (!str) return "";

  const words: string[] = [];
  for (const ch of str) {
    if (DIGIT_WORDS_MAP[ch]) {
      words.push(DIGIT_WORDS_MAP[ch]);
    } else if (/[a-zA-Z]/.test(ch)) {
      words.push(ch.toUpperCase());
    } else if (ch === "-" || ch === "/" || ch === ".") {
      words.push(ch);
    }
  }
  return words.join("   ");
}

/** Returns an array of word tokens for flexible flex layout */
export function getDigitWordsArray(
  numStr: string | number | undefined | null,
  customWords?: string
): string[] {
  if (customWords && customWords.trim()) {
    return customWords.trim().split(/\s+/);
  }
  const str = String(numStr || "4739846").trim();
  const words: string[] = [];
  for (const ch of str) {
    if (DIGIT_WORDS_MAP[ch]) {
      words.push(DIGIT_WORDS_MAP[ch]);
    } else if (/[a-zA-Z]/.test(ch)) {
      words.push(ch.toUpperCase());
    } else if (ch === "-" || ch === "/" || ch === ".") {
      words.push(ch);
    }
  }
  return words.length > 0 ? words : ["FOUR", "SEVEN", "THREE", "NINE", "EIGHT", "FOUR", "SIX"];
}

// -------------------------------------------------------------
// STANDARD CODE 128 (ISO/IEC 15417) SYMBOL ENCODING PATTERNS
// -------------------------------------------------------------
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

interface BarSegment {
  width: number;
  isBlack: boolean;
}

function generateCode128Bars(text: string): BarSegment[] {
  const clean = String(text || "4739846").trim();
  const codes = [104]; // START_B
  let check = 104;

  for (let i = 0; i < clean.length; i++) {
    const val = clean.charCodeAt(i) - 32;
    const clamped = Math.max(0, Math.min(105, val));
    codes.push(clamped);
    check += clamped * (i + 1);
  }

  codes.push(check % 103);
  codes.push(106); // STOP

  const pattern = codes.map((c) => CODE128_PATTERNS[c] || "111111").join("");
  const bars: BarSegment[] = [];
  let isBar = true;

  for (let i = 0; i < pattern.length; i++) {
    const w = Number(pattern[i]) || 1;
    bars.push({ width: w, isBlack: isBar });
    isBar = !isBar;
  }

  return bars;
}

export interface EnrollmentBarcodeProps {
  /** The dynamic enrollment number (e.g. "4739846") */
  enrollmentNo: string | number | undefined | null;
  /** Optional custom words representation override. If omitted, automatically generated from enrollmentNo */
  words?: string;
  /** Whether to show the top "Enrollment No. : {number}" label (default: true) */
  showLabel?: boolean;
  /** Custom label prefix (default: "Enrollment No. :") */
  label?: string;
  /** Height of the barcode bars in px (default: 46) */
  barcodeHeight?: number;
  /** Color of bars and text (default: "#000000") */
  color?: string;
  /** Whether to show spelled-out words underneath (default: true) */
  showWords?: boolean;
  /** Additional CSS class names */
  className?: string;
  /** Inline style overrides */
  style?: CSSProperties;
  /** Alignment (default: "center") */
  align?: "center" | "left" | "right";
  /** Optional container width in px (default: 265) */
  containerWidth?: number;
}

/**
 * High-definition, authentic Enrollment Barcode Component matching the official certificate/marksheet specification:
 * - Top: "Enrollment No. : {dynamic_number}" with clean bottom margin
 * - Middle: Razor-sharp Code 128 vector barcode with crispEdges (never blurry)
 * - Bottom: Generously spaced spelled-out uppercase digit words (e.g. "FOUR  SEVEN  THREE  NINE  EIGHT  FOUR  SIX")
 * - Guaranteed ample padding so words NEVER touch or crowd the barcode bars
 */
export default function EnrollmentBarcode({
  enrollmentNo,
  words,
  showLabel = true,
  label = "Enrollment No. :",
  barcodeHeight = 46,
  color = "#000000",
  showWords = true,
  className = "",
  style,
  align = "center",
  containerWidth = 265,
}: EnrollmentBarcodeProps) {
  const cleanNumber = String(enrollmentNo || "4739846").trim();

  // Generate standard Code 128 bars
  const bars = useMemo(() => generateCode128Bars(cleanNumber), [cleanNumber]);

  // Compute digit words
  const wordsArray = useMemo(
    () => getDigitWordsArray(cleanNumber, words),
    [cleanNumber, words]
  );

  // SVG dimensions
  const totalModules = useMemo(
    () => bars.reduce((sum, b) => sum + b.width, 0),
    [bars]
  );

  // Module width scaled to fit target width with 10px quiet zone margins
  const targetBarWidth = Math.max(220, containerWidth - 24);
  const moduleWidth = totalModules > 0 ? targetBarWidth / totalModules : 2.15;
  const svgWidth = Math.round(totalModules * moduleWidth);

  let curX = 0;
  const barElements = bars.map((b, idx) => {
    const x = curX;
    const w = b.width * moduleWidth;
    curX += w;
    if (!b.isBlack) return null;
    return (
      <rect
        key={idx}
        x={Math.round(x * 10) / 10}
        y={0}
        width={Math.max(1, Math.round(w * 10) / 10)}
        height={barcodeHeight}
        fill={color}
      />
    );
  });

  const alignClass =
    align === "left"
      ? "items-start text-left"
      : align === "right"
      ? "items-end text-right"
      : "items-center text-center";

  return (
    <div
      className={`inline-flex flex-col select-none ${alignClass} ${className}`}
      style={{
        width: containerWidth,
        ...style,
      }}
    >
      {/* 1. Top Header: "Enrollment No. : 4739846" with generous bottom margin */}
      {showLabel && (
        <div className="mb-2 text-[13px] font-bold leading-tight" style={sans}>
          <span style={{ color }}>{label} </span>
          <span className="font-extrabold tracking-wide" style={{ color }}>
            {cleanNumber}
          </span>
        </div>
      )}

      {/* 2. Middle: Dynamic Code 128 Barcode with crispEdges rendering */}
      <div className="w-full flex items-center justify-center px-1">
        <svg
          width={svgWidth}
          height={barcodeHeight}
          viewBox={`0 0 ${svgWidth} ${barcodeHeight}`}
          shapeRendering="crispEdges"
          className="overflow-visible block"
        >
          {barElements}
        </svg>
      </div>

      {/* 3. Bottom: Spelled-out digit words with generous vertical gap (mt-2.5) and clear word spacing */}
      {showWords && wordsArray.length > 0 && (
        <div
          className="mt-2.5 flex items-center justify-between w-full px-1 text-[8.5px] font-black uppercase tracking-wider select-none"
          style={{
            ...sans,
            color,
          }}
        >
          {wordsArray.map((w, idx) => (
            <span key={idx} className="shrink-0 px-0.5">
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
