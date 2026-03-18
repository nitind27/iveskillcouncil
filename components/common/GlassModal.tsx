"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

export interface GlassModalProps {
  /** When false, modal closes with exit animation. */
  open: boolean;
  onClose: () => void;
  /** Modal title (optional). */
  title?: string;
  /** Size of the content box. */
  size?: "sm" | "md" | "lg" | "xl";
  /** Show close button in header. */
  showCloseButton?: boolean;
  /** Clicking backdrop closes modal. */
  closeOnOverlayClick?: boolean;
  /** Press Escape to close. */
  closeOnEscape?: boolean;
  /** Extra class for the content box. */
  contentClassName?: string;
  /** Extra class for the overlay wrapper. */
  overlayClassName?: string;
  children: React.ReactNode;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function GlassModal({
  open,
  onClose,
  title,
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  contentClassName,
  overlayClassName,
  children,
}: GlassModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, closeOnEscape, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) onClose();
  };

  const modalContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="glass-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn("fixed inset-0 z-[9999] flex items-center justify-center p-4", overlayClassName)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? "glass-modal-title" : undefined}
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 backdrop-blur-md bg-black/70"
            aria-hidden="true"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "relative w-full max-h-[90vh] overflow-y-auto rounded-3xl panel-glass border border-white/10 shadow-2xl",
              sizeClasses[size],
              contentClassName
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 md:p-8">
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between mb-6">
                  {title && (
                    <h2 id="glass-modal-title" className="text-xl font-bold text-white">
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors ml-auto"
                      aria-label="Close"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return null;
}
