"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useLogoConfig } from "@/hooks/useLogoConfig";

interface PageLoaderProps {
  /** Text shown below the animation. Defaults to "Loading..." */
  text?: string;
  /** Kept for existing call sites. Both variants use the same logo loader. */
  variant?: "userpanel" | "admin";
}

function LogoLoader({ compact = false }: { compact?: boolean }) {
  const { logoUrl, siteName } = useLogoConfig();
  const reduce = useReducedMotion();
  const size = compact ? "h-36 w-36" : "h-48 w-48";

  return (
    <div className={`relative flex items-center justify-center ${size}`}>
      <span aria-hidden className="absolute inset-0 rounded-full border border-[#E3E9F2]" />
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#FF8500] border-r-[#124E96]"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
      />
      <span className="relative flex h-[62%] w-[74%] items-center justify-center">
        {logoUrl ? (
          <img src={logoUrl} alt={siteName || "IVESDC"} className="max-h-full max-w-full object-contain" draggable={false} />
        ) : (
          <span className="text-sm font-extrabold tracking-wide text-[#061B36]">{siteName || "IVESDC"}</span>
        )}
      </span>
    </div>
  );
}

/**
 * Full-screen loader with the institute logo.
 */
export default function PageLoader({ text = "Loading..." }: PageLoaderProps) {
  const reduce = useReducedMotion();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F8FE_100%)]">
      <LogoLoader />
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-semibold tracking-wide text-[#061B36]">{text}</p>
        <span className="relative h-[3px] w-28 overflow-hidden rounded-full bg-[#E3E9F2]" aria-hidden>
          <motion.span
            className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-[#FF8500] via-[#124E96] to-[#159A70]"
            animate={reduce ? { x: "40%" } : { x: ["-100%", "220%"] }}
            transition={{ duration: 1.15, repeat: reduce ? 0 : Infinity, ease: "easeInOut" }}
          />
        </span>
      </div>
    </div>
  );
}

/** Inline mini loader — for buttons and small slots. */
export function MiniLoader({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <motion.span
        aria-hidden
        className="h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
      />
    </span>
  );
}

/** Section loader — for part of a page, not the full screen. */
export function SectionLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <LogoLoader compact />
      <p className="text-sm font-medium text-[#5B6B82]">{text}</p>
    </div>
  );
}
