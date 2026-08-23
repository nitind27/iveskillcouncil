"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { autoDetectIndianState } from "@/lib/i18n/detect-state-client";
import { translate } from "@/lib/i18n/messages";
import { resolveIndianStateName } from "@/lib/i18n/resolve-state";
import {
  getRegionalLocaleForState,
  getStateLanguageOption,
  INDIAN_STATES,
  LOCALE_META,
  type RegionalLocale,
  type UiLocale,
} from "@/lib/i18n/state-languages";

const LOCALE_KEY = "ivesdc_locale";
const STATE_KEY = "ivesdc_state";
const STATE_MANUAL_KEY = "ivesdc_state_manual";
const STATE_SOURCE_KEY = "ivesdc_state_source";

export type StateSource = "franchise" | "ip" | "geolocation" | "stored" | "manual" | "default";

interface LanguageContextValue {
  locale: UiLocale;
  userState: string;
  stateSource: StateSource;
  stateDetecting: boolean;
  regionalLocale: RegionalLocale;
  regionalLabel: string;
  setLocale: (locale: UiLocale) => void;
  setUserState: (state: string) => void;
  t: (key: string, fallback?: string) => string;
  fontClass: string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function readStoredLocale(): UiLocale | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(LOCALE_KEY);
  if (
    v === "en" ||
    v === "hi" ||
    v === "mr" ||
    v === "gu" ||
    v === "kn" ||
    v === "ta" ||
    v === "te" ||
    v === "bn" ||
    v === "ml" ||
    v === "pa" ||
    v === "or"
  ) {
    return v;
  }
  return null;
}

function readStoredState(): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STATE_KEY);
  return resolveIndianStateName(raw) ?? null;
}

function isManualState(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STATE_MANUAL_KEY) === "true";
}

function persistState(state: string, source: StateSource, manual: boolean) {
  localStorage.setItem(STATE_KEY, state);
  localStorage.setItem(STATE_SOURCE_KEY, source);
  if (manual) localStorage.setItem(STATE_MANUAL_KEY, "true");
  else localStorage.removeItem(STATE_MANUAL_KEY);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState<UiLocale>("en");
  const [userState, setUserStateInternal] = useState<string>("Maharashtra");
  const [stateSource, setStateSource] = useState<StateSource>("default");
  const [stateDetecting, setStateDetecting] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const detectStarted = useRef(false);
  const franchiseStateRef = useRef<string | null>(null);

  useEffect(() => {
    franchiseStateRef.current = resolveIndianStateName(user?.franchise?.state);
  }, [user?.franchise?.state]);

  const applyState = useCallback(
    (state: string, source: StateSource, manual: boolean) => {
      const resolved = resolveIndianStateName(state) ?? "Maharashtra";
      setUserStateInternal(resolved);
      setStateSource(source);
      persistState(resolved, source, manual);
    },
    []
  );

  // Franchise state always wins when user is logged in with a franchise
  useEffect(() => {
    const franchiseState = user?.franchise?.state;
    const resolved = resolveIndianStateName(franchiseState);
    if (resolved) {
      applyState(resolved, "franchise", false);
      setStateDetecting(false);
    }
  }, [user?.franchise?.state, applyState]);

  // Hydrate locale + auto-detect state for guests / users without franchise state
  useEffect(() => {
    if (detectStarted.current) return;
    detectStarted.current = true;

    const storedLocale = readStoredLocale();
    if (storedLocale) setLocaleState(storedLocale);

    const franchiseState = resolveIndianStateName(user?.franchise?.state);
    if (franchiseState) {
      applyState(franchiseState, "franchise", false);
      setStateDetecting(false);
      setHydrated(true);
      return;
    }

    if (isManualState()) {
      const stored = readStoredState();
      if (stored) {
        applyState(stored, "manual", true);
        setStateDetecting(false);
        setHydrated(true);
        return;
      }
    }

    const cached = readStoredState();
    const cachedSource = (localStorage.getItem(STATE_SOURCE_KEY) as StateSource | null) ?? "stored";
    if (cached && cachedSource !== "default") {
      applyState(cached, cachedSource, false);
      setStateDetecting(false);
      setHydrated(true);
      return;
    }

    let cancelled = false;

    (async () => {
      const detected = await autoDetectIndianState({ tryGeolocation: true });
      if (cancelled) return;

      const franchiseNow = franchiseStateRef.current;
      if (franchiseNow) {
        applyState(franchiseNow, "franchise", false);
        setStateDetecting(false);
        setHydrated(true);
        return;
      }

      if (isManualState()) {
        const stored = readStoredState();
        if (stored) applyState(stored, "manual", true);
        setStateDetecting(false);
        setHydrated(true);
        return;
      }

      if (detected) {
        applyState(detected.state, detected.source, false);
      } else if (cached) {
        applyState(cached, "stored", false);
      } else {
        applyState("Maharashtra", "default", false);
      }

      setStateDetecting(false);
      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.franchise?.state, applyState]);

  const regionalLocale = useMemo(
    () => getRegionalLocaleForState(userState),
    [userState]
  );

  const regionalLabel = LOCALE_META[regionalLocale].nativeName;

  const fontClass =
    locale === "en"
      ? "font-sans"
      : LOCALE_META[locale as RegionalLocale]?.fontClass ?? "font-devanagari";

  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.lang = locale === "en" ? "en" : locale;
    root.classList.remove(
      "lang-en",
      "lang-hi",
      "lang-mr",
      "lang-gu",
      "lang-kn",
      "lang-ta",
      "lang-te",
      "lang-bn",
      "lang-ml",
      "lang-pa",
      "lang-or",
      "font-sans",
      "font-devanagari",
      "font-gujarati",
      "font-kannada",
      "font-tamil",
      "font-telugu",
      "font-bengali",
      "font-malayalam",
      "font-gurmukhi",
      "font-oriya"
    );
    root.classList.add(`lang-${locale}`, fontClass);
  }, [locale, fontClass, hydrated]);

  const setLocale = useCallback((next: UiLocale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_KEY, next);
  }, []);

  const setUserState = useCallback(
    (state: string) => {
      const resolved = resolveIndianStateName(state) ?? state.trim();
      applyState(resolved, "manual", true);
      const regional = getRegionalLocaleForState(resolved);
      if (locale !== "en" && locale !== regional) {
        setLocaleState(regional);
        localStorage.setItem(LOCALE_KEY, regional);
      }
    },
    [locale, applyState]
  );

  const t = useCallback(
    (key: string, fallback?: string) => translate(locale, key, fallback),
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      userState,
      stateSource,
      stateDetecting,
      regionalLocale,
      regionalLabel,
      setLocale,
      setUserState,
      t,
      fontClass,
    }),
    [
      locale,
      userState,
      stateSource,
      stateDetecting,
      regionalLocale,
      regionalLabel,
      setLocale,
      setUserState,
      t,
      fontClass,
    ]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

/** Menu / section label helper */
export function useMenuLabel(id: string, englishFallback: string) {
  const { t } = useLanguage();
  return t(`menu.${id}`, englishFallback);
}

export function useSectionLabel(sectionId: string, englishFallback: string) {
  const { t } = useLanguage();
  return t(`sections.${sectionId}`, englishFallback);
}

export { INDIAN_STATES, getStateLanguageOption };
