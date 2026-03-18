"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

type ModalSize = "sm" | "md" | "lg" | "xl";

/** Max width cap so superadmin can limit how large the modal can get; modal still fits image inside this. */
const sizeMaxWidth: Record<ModalSize, string> = {
  sm: "max-w-[min(90vw,28rem)]",
  md: "max-w-[min(90vw,32rem)]",
  lg: "max-w-[min(90vw,42rem)]",
  xl: "max-w-[min(90vw,56rem)]",
};

export interface WelcomePopupModalProps {
  open: boolean;
  imageUrl: string;
  size?: ModalSize;
  onClose: () => void;
  /** Extra classes (optional) */
  className?: string;
}

export default function WelcomePopupModal({
  open,
  imageUrl,
  size = "lg",
  onClose,
  className,
}: WelcomePopupModalProps) {
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">("loading");

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
          aria-label="Welcome"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal card: width = image content, no extra space */}
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
              "relative w-fit max-h-[90vh] flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900/95 ring-1 ring-white/5 min-w-[min(90vw,18rem)]",
              sizeMaxWidth[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-2 rounded-xl bg-black/40 hover:bg-white/15 text-white/80 hover:text-white transition-colors backdrop-blur-sm"
              aria-label="Close"
            >
              <FiX className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Image: natural size, modal width = image width (capped by max-w and viewport) */}
            <div className="relative flex items-center justify-center bg-slate-800/50 p-0 min-h-[160px]">
              {imgState === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
                </div>
              )}

              {imgState === "error" && (
                <div className="px-6 py-10 text-center">
                  <p className="text-sm font-medium text-white">Image failed to load</p>
                  <p className="mt-1 text-xs text-white/60 break-all">{imageUrl}</p>
                </div>
              )}

              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: imgState === "loaded" ? 1 : 0 }}
                transition={{ delay: 0.12, duration: 0.35 }}
                src={imageUrl}
                alt="Welcome"
                className="block max-w-full max-h-[85vh] w-auto h-auto object-contain"
                loading="eager"
                onLoad={() => setImgState("loaded")}
                onError={() => setImgState("error")}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}

