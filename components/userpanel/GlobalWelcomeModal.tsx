"use client";

import { useEffect, useState, useCallback } from "react";
import type { WelcomePopupConfig } from "@/config/userpanel.config";
import WelcomePopupModal from "./WelcomePopupModal";

const SESSION_KEY = "userpanel_welcome_popup_shown";

interface GlobalWelcomeModalProps {
  config: WelcomePopupConfig | null;
}

export default function GlobalWelcomeModal({ config }: GlobalWelcomeModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const shouldShow = Boolean(
    config?.enabled &&
      config?.imageUrl &&
      typeof window !== "undefined" &&
      !sessionStorage.getItem(SESSION_KEY)
  );

  const close = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !shouldShow) return;
    const t = setTimeout(() => setOpen(true), 400);
    return () => clearTimeout(t);
  }, [mounted, shouldShow]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, close]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted || typeof window === "undefined" || !shouldShow || !config?.imageUrl) {
    return null;
  }

  return (
    <WelcomePopupModal
      open={open}
      onClose={close}
      imageUrl={config.imageUrl}
      size={config.size ?? "lg"}
    />
  );
}
