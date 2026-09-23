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

/** Convert any numeric string into uppercase English digit words */
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
  const codes = [104];
  let check = 104;

  for (let i = 0; i < clean.length; i++) {
    const val = clean.charCodeAt(i) - 32;
    const clamped = Math.max(0, Math.min(105, val));
    codes.push(clamped);
    check += clamped * (i + 1);
  }

  codes.push(check % 103);
  codes.push(106);

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
  enrollmentNo: string | number | undefined | null;
  words?: string;
  showLabel?: boolean;
  label?: string;
  barcodeHeight?: number;
  color?: string;
  showWords?: boolean;
  className?: string;
  style?: CSSProperties;
  align?: "center" | "left" | "right";
  /** Outer width in px — bars/label/words always fit inside */
  containerWidth?: number;
}

/**
 * Dynamic Code 128 enrollment barcode — regenerates from enrollmentNo.
 * Label, bars and digit-words always fit inside containerWidth (no truncate / no overflow).
 */
export default function EnrollmentBarcode({
  enrollmentNo,
  words,
  showLabel = true,
  label = "Enrollment No. :",
  barcodeHeight = 40,
  color = "#000000",
  showWords = true,
  className = "",
  style,
  align = "center",
  containerWidth = 220,
}: EnrollmentBarcodeProps) {
  const cleanNumber = String(enrollmentNo ?? "").trim() || "0";
  const bars = useMemo(() => generateCode128Bars(cleanNumber), [cleanNumber]);
  const wordsArray = useMemo(
    () => getDigitWordsArray(cleanNumber, words),
    [cleanNumber, words]
  );
  const totalModules = useMemo(
    () => bars.reduce((sum, b) => sum + b.width, 0),
    [bars]
  );

  const boxW = Math.max(120, containerWidth);
  const barAreaW = Math.max(96, boxW - 12);
  const moduleWidth = totalModules > 0 ? barAreaW / totalModules : 1.4;
  const svgWidth = Math.max(1, Math.round(totalModules * moduleWidth));
  const barH = Math.max(24, Math.min(56, barcodeHeight));

  // Full label always visible — scale font to fit one line (never "4739…")
  const labelText = `${label} ${cleanNumber}`;
  const labelFontPx = Math.max(
    8,
    Math.min(12.5, Math.floor((boxW - 4) / Math.max(labelText.length * 0.58, 1)))
  );

  // Digit words on ONE line — scale font so they never wrap awkwardly
  const wordsJoinedLen = wordsArray.join(" ").length || 1;
  const wordFontPx = Math.max(
    5.5,
    Math.min(8.5, Math.floor((boxW - 6) / Math.max(wordsJoinedLen * 0.62, 1)))
  );

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
        width={Math.max(0.7, Math.round(w * 10) / 10)}
        height={barH}
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
      className={`inline-flex flex-col select-none overflow-hidden ${alignClass} ${className}`}
      style={{
        width: boxW,
        maxWidth: "100%",
        boxSizing: "border-box",
        ...style,
      }}
      data-enrollment={cleanNumber}
    >
      {showLabel && (
        <div
          className="mb-1 w-full text-center font-bold leading-tight"
          style={{
            ...sans,
            color,
            fontSize: `${labelFontPx}px`,
            whiteSpace: "nowrap",
          }}
        >
          <span>{label} </span>
          <span className="font-extrabold tracking-wide">{cleanNumber}</span>
        </div>
      )}

      <div className="flex w-full items-center justify-center overflow-hidden">
        <svg
          width={barAreaW}
          height={barH}
          viewBox={`0 0 ${svgWidth} ${barH}`}
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
          className="block"
          style={{ width: barAreaW, maxWidth: "100%", height: barH }}
          aria-label={`Barcode for enrollment ${cleanNumber}`}
        >
          {barElements}
        </svg>
      </div>

      {showWords && wordsArray.length > 0 && (
        <div
          className="mt-1 w-full text-center font-black uppercase select-none"
          style={{
            ...sans,
            color,
            fontSize: `${wordFontPx}px`,
            letterSpacing: "0.04em",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {wordsArray.join("  ")}
        </div>
      )}
    </div>
  );
}
