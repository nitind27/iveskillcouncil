"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmVariant = "danger" | "warning" | "default";

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
};

type ConfirmResult = { isConfirmed: boolean };

type PendingConfirm = ConfirmOptions & {
  resolve: (result: ConfirmResult) => void;
};

type Listener = (pending: PendingConfirm | null) => void;

const listeners = new Set<Listener>();
let pending: PendingConfirm | null = null;

function emit() {
  listeners.forEach((l) => l(pending));
}

export function subscribeConfirm(listener: Listener) {
  listeners.add(listener);
  listener(pending);
  return () => {
    listeners.delete(listener);
  };
}

/** Promise-based confirm used by showDeleteConfirm / showConfirm */
export function openConfirmDialog(
  options: ConfirmOptions
): Promise<ConfirmResult> {
  return new Promise((resolve) => {
    if (pending) {
      pending.resolve({ isConfirmed: false });
    }
    pending = { ...options, resolve };
    emit();
  });
}

function closeWith(result: ConfirmResult) {
  const current = pending;
  pending = null;
  emit();
  current?.resolve(result);
}

const variantStyles: Record<
  ConfirmVariant,
  {
    iconWrap: string;
    Icon: typeof Trash2;
    confirmBtn: string;
  }
> = {
  danger: {
    iconWrap: "bg-red-500/15 text-red-600",
    Icon: Trash2,
    confirmBtn: "bg-red-600 hover:bg-red-700 text-white",
  },
  warning: {
    iconWrap: "bg-amber-500/15 text-amber-700",
    Icon: AlertTriangle,
    confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  default: {
    iconWrap: "bg-[#1E4A85]/15 text-[#1E4A85]",
    Icon: AlertTriangle,
    confirmBtn: "bg-[#1E4A85] hover:bg-[#163A6B] text-white",
  },
};

/** Mount once in root layout — renders the confirm modal UI */
export function ConfirmDialogHost() {
  const [state, setState] = useState<PendingConfirm | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return subscribeConfirm(setState);
  }, []);

  const onCancel = useCallback(() => closeWith({ isConfirmed: false }), []);
  const onConfirm = useCallback(() => closeWith({ isConfirmed: true }), []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [state, onCancel]);

  if (!mounted) return null;

  const variant = state?.variant || "danger";
  const styles = variantStyles[variant];
  const Icon = styles.Icon;

  return createPortal(
    <AnimatePresence>
      {state && (
        <motion.div
          key="confirm-dialog"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0B132B]/55 backdrop-blur-sm"
            onClick={onCancel}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    styles.iconWrap
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <h2
                    id="confirm-dialog-title"
                    className="text-base font-bold text-slate-900"
                  >
                    {state.title}
                  </h2>
                  {state.message && (
                    <p
                      id="confirm-dialog-desc"
                      className="mt-1.5 text-sm leading-relaxed text-slate-600"
                    >
                      {state.message}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {state.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                autoFocus
                className={cn(
                  "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold shadow-sm transition",
                  styles.confirmBtn
                )}
              >
                {state.confirmLabel ||
                  (variant === "danger" ? "Delete" : "Confirm")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
