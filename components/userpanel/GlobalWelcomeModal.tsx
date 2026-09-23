"use client";

import { useEffect, useState, useCallback } from "react";
import type { WelcomePopupConfig } from "@/config/userpanel.config";
import WelcomePopupModal from "./WelcomePopupModal";

const SESSION_KEY = "userpanel_welcome_popup_shown";
const EVER_KEY = "userpanel_welcome_popup_shown_ever";

function hasBeenShown(frequency: WelcomePopupConfig["frequency"]): boolean {
  try {
    if (frequency === "every_visit") return false;
    if (frequency === "once_ever") return Boolean(localStorage.getItem(EVER_KEY));
    return Boolean(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return false;
  }
}

function markShown(frequency: WelcomePopupConfig["frequency"]) {
  try {
    if (frequency === "every_visit") return;
    if (frequency === "once_ever") {
      localStorage.setItem(EVER_KEY, "1");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // ignore
  }
}

interface GlobalWelcomeModalProps {
  config: WelcomePopupConfig | null;
}

export default function GlobalWelcomeModal({ config }: GlobalWelcomeModalProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  /** Prevents re-open on same page after close (esp. every_visit). */
  const [dismissedThisMount, setDismissedThisMount] = useState(false);

  const frequency = config?.frequency ?? "once_per_session";
  const delayMs = Math.min(Math.max(config?.delayMs ?? 400, 0), 10000);
  const canShow =
    Boolean(config?.enabled && config?.imageUrl) &&
    !dismissedThisMount &&
    (typeof window === "undefined" ? false : !hasBeenShown(frequency));

  const close = useCallback(() => {
    setOpen(false);
    setDismissedThisMount(true);
    markShown(frequency);
  }, [frequency]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !canShow) return;
    const t = setTimeout(() => setOpen(true), delayMs);
    return () => clearTimeout(t);
  }, [mounted, canShow, delayMs]);

  if (!mounted || typeof window === "undefined" || !canShow || !config?.imageUrl) {
    return null;
  }

  return (
    <WelcomePopupModal
      open={open}
      onClose={close}
      imageUrl={config.imageUrl}
      size={config.size ?? "lg"}
      customWidthPx={config.customWidthPx}
      maxHeightVh={config.maxHeightVh}
      imageFit={config.imageFit}
      altText={config.altText}
      title={config.title}
      showTitle={config.showTitle}
      body={config.body}
      showBody={config.showBody}
      ctaLabel={config.ctaLabel}
      ctaHref={config.ctaHref}
      showCta={config.showCta}
      showCloseButton={config.showCloseButton !== false}
      closeOnBackdrop={config.closeOnBackdrop !== false}
      backdropOpacity={config.backdropOpacity}
    />
  );
}
