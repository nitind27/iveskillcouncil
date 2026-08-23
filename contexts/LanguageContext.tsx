"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { translate } from "@/lib/i18n/messages";
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

interface LanguageContextValue {
  locale: UiLocale;
  userState: string;
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
  if (v === "en" || v === "hi" || v === "mr" || v === "gu" || v === "kn" || v === "ta" || v === "te" || v === "bn" || v === "ml" || v === "pa" || v === "or") {
    return v;
  }
  return null;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState<UiLocale>("en");
  const [userState, setUserStateInternal] = useState<string>("Maharashtra");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from storage + franchise state
  useEffect(() => {
    const storedState = localStorage.getItem(STATE_KEY);
    const franchiseState = user?.franchise?.state;
    const state = franchiseState || storedState || "Maharashtra";
    setUserStateInternal(state);
    const storedLocale = readStoredLocale();
    if (storedLocale) setLocaleState(storedLocale);
    setHydrated(true);
  }, [user?.franchise?.state]);

  const regionalLocale = useMemo(
    () => getRegionalLocaleForState(userState),
    [userState]
  );

  const regionalLabel = LOCALE_META[regionalLocale].nativeName;

  const fontClass =
    locale === "en" ? "font-sans" : LOCALE_META[locale as RegionalLocale]?.fontClass ?? "font-devanagari";

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

  const setUserState = useCallback((state: string) => {
    setUserStateInternal(state);
    localStorage.setItem(STATE_KEY, state);
    const regional = getRegionalLocaleForState(state);
    if (locale !== "en" && locale !== regional) {
      setLocaleState(regional);
      localStorage.setItem(LOCALE_KEY, regional);
    }
  }, [locale]);

  const t = useCallback(
    (key: string, fallback?: string) => translate(locale, key, fallback),
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      userState,
      regionalLocale,
      regionalLabel,
      setLocale,
      setUserState,
      t,
      fontClass,
    }),
    [locale, userState, regionalLocale, regionalLabel, setLocale, setUserState, t, fontClass]
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
