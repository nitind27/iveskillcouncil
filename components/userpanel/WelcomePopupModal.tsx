"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type {
  WelcomePopupImageFit,
  WelcomePopupSize,
} from "@/config/userpanel.config";

/** Max width cap for presets; custom uses customWidthPx. */
const sizeMaxWidthPx: Record<Exclude<WelcomePopupSize, "custom">, number> = {
  sm: 448, // 28rem
  md: 512, // 32rem
  lg: 672, // 42rem
  xl: 896, // 56rem
};

export interface WelcomePopupModalProps {
  open: boolean;
  imageUrl: string;
  size?: WelcomePopupSize;
  customWidthPx?: number;
  maxHeightVh?: number;
  imageFit?: WelcomePopupImageFit;
  altText?: string;
  title?: string;
  showTitle?: boolean;
  body?: string;
  showBody?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
  showCta?: boolean;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  backdropOpacity?: number;
  onClose: () => void;
  className?: string;
}

export default function WelcomePopupModal({
  open,
  imageUrl,
  size = "lg",
  customWidthPx = 720,
  maxHeightVh = 85,
  imageFit = "contain",
  altText = "Welcome",
  title = "",
  showTitle = false,
  body = "",
  showBody = false,
  ctaLabel = "",
  ctaHref = "/userpanel",
  showCta = false,
  showCloseButton = true,
  closeOnBackdrop = true,
  backdropOpacity = 80,
  onClose,
  className,
}: WelcomePopupModalProps) {
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">("loading");

  const maxWidthPx = useMemo(() => {
    if (size === "custom") {
      return Math.min(Math.max(customWidthPx || 720, 240), 1400);
    }
    return sizeMaxWidthPx[size] ?? sizeMaxWidthPx.lg;
  }, [size, customWidthPx]);

  const heightCap = Math.min(Math.max(maxHeightVh || 85, 40), 95);
  const hasTextBlock = (showTitle && Boolean(title?.trim())) || (showBody && Boolean(body?.trim()));
  const hasCta = showCta && Boolean(ctaLabel?.trim());
  const opacity = Math.min(Math.max(backdropOpacity ?? 80, 0), 100) / 100;

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setImgState("loading");
  }, [open, imageUrl]);

  if (typeof window === "undefined") return null;

  const fitClass =
    imageFit === "cover"
      ? "object-cover w-full h-full"
      : imageFit === "fill"
        ? "object-fill w-full h-full"
        : "object-contain w-auto h-auto max-w-full";

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="welcome-popup-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 md:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={title?.trim() || altText || "Welcome"}
          onClick={(e) => {
            if (closeOnBackdrop && e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 backdrop-blur-md"
            style={{ backgroundColor: `rgba(0,0,0,${opacity})` }}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 32,
              mass: 0.9,
            }}
            className={cn(
              "relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl ring-1 ring-white/5 sm:rounded-3xl",
              className
            )}
            style={{
              maxWidth: `min(92vw, ${maxWidthPx}px)`,
              maxHeight: `${heightCap}vh`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-2 top-2 z-10 rounded-xl bg-black/40 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-red-500 hover:text-white sm:right-3 sm:top-3"
                aria-label="Close"
              >
                <FiX className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            )}

            <div
              className="relative flex min-h-[120px] flex-1 items-center justify-center overflow-hidden bg-slate-800/50"
              style={{ maxHeight: hasTextBlock || hasCta ? `${heightCap - 18}vh` : `${heightCap}vh` }}
            >
              {imgState === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                </div>
              )}

              {imgState === "error" && (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-medium text-white">Image failed to load</p>
                  <p className="mt-1 break-all text-xs text-white/60">{imageUrl}</p>
                </div>
              )}

              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: imgState === "loaded" ? 1 : 0 }}
                transition={{ delay: 0.12, duration: 0.35 }}
                src={imageUrl}
                alt={altText || "Welcome"}
                className={cn("block", fitClass)}
                style={{
                  maxHeight: hasTextBlock || hasCta ? `${heightCap - 18}vh` : `${heightCap}vh`,
                }}
                loading="eager"
                onLoad={() => setImgState("loaded")}
                onError={() => setImgState("error")}
              />
            </div>

            {(hasTextBlock || hasCta) && (
              <div className="shrink-0 space-y-2 border-t border-white/10 bg-slate-950/90 px-4 py-3 sm:px-5 sm:py-4">
                {showTitle && title?.trim() && (
                  <h2 className="text-base font-bold text-white sm:text-lg">{title.trim()}</h2>
                )}
                {showBody && body?.trim() && (
                  <p className="text-sm leading-relaxed text-white/75 whitespace-pre-wrap">{body.trim()}</p>
                )}
                {hasCta && (
                  <div className="pt-1">
                    <Link
                      href={ctaHref?.trim() || "/userpanel"}
                      onClick={onClose}
                      className="inline-flex items-center justify-center rounded-xl bg-[#C4A35A] px-4 py-2 text-sm font-bold text-[#0B132B] transition hover:brightness-110"
                    >
                      {ctaLabel.trim()}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}
