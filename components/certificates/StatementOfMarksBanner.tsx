"use client";

import { useId } from "react";
import { Cinzel } from "next/font/google";

const plaqueFont = Cinzel({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  display: "swap",
});

/**
 * STATEMENT OF MARKS plaque — pure SVG/CSS (no image).
 * Navy fill · metallic gold double border · pointed ends · crest ornaments · Cinzel type.
 */
export default function StatementOfMarksBanner({
  width = 460,
  height = 72,
  className = "",
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const fontFamily = plaqueFont.style.fontFamily;

  /* Capsule with inward crescent bites on left/right */
  const outer =
    "M 58 10 H 702 C 724 10 742 20 742 34 C 726 38 726 46 742 50 C 742 64 724 74 702 74 H 58 C 36 74 18 64 18 50 C 34 46 34 38 18 34 C 18 20 36 10 58 10 Z";
  const mid =
    "M 60 13.5 H 700 C 720 13.5 736 22 736 34 C 722 37.5 722 46.5 736 50 C 736 62 720 70.5 700 70.5 H 60 C 40 70.5 24 62 24 50 C 38 46.5 38 37.5 24 34 C 24 22 40 13.5 60 13.5 Z";
  const inner =
    "M 64 17 H 696 C 714 17 728 24.5 728 34 C 716 37 716 47 728 50 C 728 59.5 714 67 696 67 H 64 C 46 67 32 59.5 32 50 C 44 47 44 37 32 34 C 32 24.5 46 17 64 17 Z";

  /* Small fleur / crest for top & bottom center */
  const crest = (cx: number, cy: number, flip = false) => {
    const s = flip ? -1 : 1;
    return (
      <g transform={`translate(${cx} ${cy}) scale(1 ${s})`}>
        <path
          d="M0 0 C -2 -6 -8 -8 -10 -4 C -6 -6 -2 -4 0 0 C 2 -4 6 -6 10 -4 C 8 -8 2 -6 0 0 Z"
          fill={`url(#${uid}-gold)`}
        />
        <path
          d="M0 0 L0 7 M-5 3 L5 3"
          stroke={`url(#${uid}-gold)`}
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="0" cy="-1" r="1.6" fill="#F8EBB8" />
      </g>
    );
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 760 84"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label="STATEMENT OF MARKS"
      style={{ display: "block", maxWidth: "100%" }}
    >
      <defs>
        <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8EBB8" />
          <stop offset="28%" stopColor="#E8C86A" />
          <stop offset="52%" stopColor="#B88728" />
          <stop offset="78%" stopColor="#E0BF5A" />
          <stop offset="100%" stopColor="#C9A227" />
        </linearGradient>
        <linearGradient id={`${uid}-gold-text`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFF1C2" />
          <stop offset="35%" stopColor="#F0D078" />
          <stop offset="70%" stopColor="#C9A227" />
          <stop offset="100%" stopColor="#A67C1A" />
        </linearGradient>
        <linearGradient id={`${uid}-navy`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#163A72" />
          <stop offset="35%" stopColor="#0C2250" />
          <stop offset="70%" stopColor="#071530" />
          <stop offset="100%" stopColor="#030C1E" />
        </linearGradient>
        <radialGradient id={`${uid}-shine`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#3A6BB5" stopOpacity="0.45" />
          <stop offset="55%" stopColor="#0C2250" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.15" />
        </radialGradient>
        <filter id={`${uid}-shadow`} x="-6%" y="-28%" width="112%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodColor="#000" floodOpacity="0.35" />
        </filter>
        <filter id={`${uid}-glow`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer gold rim */}
      <path
        filter={`url(#${uid}-shadow)`}
        fill={`url(#${uid}-navy)`}
        stroke={`url(#${uid}-gold)`}
        strokeWidth="3.8"
        strokeLinejoin="round"
        d={outer}
      />

      {/* Mid gold ring */}
      <path
        fill="none"
        stroke={`url(#${uid}-gold)`}
        strokeOpacity="0.85"
        strokeWidth="1.4"
        strokeLinejoin="round"
        d={mid}
      />

      {/* Inner thin ring */}
      <path
        fill="none"
        stroke="#E8CB72"
        strokeOpacity="0.7"
        strokeWidth="0.9"
        strokeLinejoin="round"
        d={inner}
      />

      {/* Glass shine over navy */}
      <path fill={`url(#${uid}-shine)`} d={inner} opacity="0.9" />

      {/* End diamond accents */}
      <g fill={`url(#${uid}-gold)`} opacity="0.95">
        <path d="M28 42 L34 36 L40 42 L34 48 Z" />
        <path d="M720 42 L726 36 L732 42 L726 48 Z" />
      </g>

      {/* Top & bottom crests */}
      {crest(380, 8, false)}
      {crest(380, 76, true)}

      {/* Corner sparkles */}
      <g fill="#FFF8E0" opacity="0.85">
        <circle cx="90" cy="28" r="1.1" />
        <circle cx="670" cy="28" r="1.1" />
        <circle cx="110" cy="56" r="0.8" />
        <circle cx="650" cy="56" r="0.8" />
        <circle cx="380" cy="26" r="0.9" />
      </g>

      {/* Title: STATEMENT — OF — MARKS (centered phrase) */}
      <g filter={`url(#${uid}-glow)`} className={plaqueFont.className}>
        <text
          x="380"
          y="49"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={`url(#${uid}-gold-text)`}
          fontFamily={fontFamily}
          fontSize="21"
          fontWeight="900"
          letterSpacing="2.8"
        >
          <tspan>STATEMENT</tspan>
          <tspan dx="10" fontSize="11" fontWeight="700" letterSpacing="1.6">
            OF
          </tspan>
          <tspan dx="10" fontSize="21" fontWeight="900" letterSpacing="2.8">
            MARKS
          </tspan>
        </text>
        {/* Hairlines flanking OF */}
        <line x1="318" y1="42" x2="334" y2="42" stroke={`url(#${uid}-gold)`} strokeWidth="1" />
        <line x1="318" y1="52" x2="334" y2="52" stroke={`url(#${uid}-gold)`} strokeWidth="1" />
        <line x1="426" y1="42" x2="442" y2="42" stroke={`url(#${uid}-gold)`} strokeWidth="1" />
        <line x1="426" y1="52" x2="442" y2="52" stroke={`url(#${uid}-gold)`} strokeWidth="1" />
      </g>
    </svg>
  );
}

export function isDefaultStatementBanner(url?: string | null): boolean {
  if (!url) return true;
  const u = url.toLowerCase();
  return (
    u.includes("statement.png") ||
    u.includes("statement_of_marks_exact_design") ||
    u.includes("statement-of-marks-banner") ||
    u.includes("res-statement-banner") ||
    u.includes("statement-banner-source")
  );
}
