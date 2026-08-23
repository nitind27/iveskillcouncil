"use client";

import { ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useLanguage,
  INDIAN_STATES,
  getStateLanguageOption,
} from "@/contexts/LanguageContext";
import type { UiLocale } from "@/lib/i18n/state-languages";

interface LanguageSwitcherProps {
  variant?: "admin" | "userpanel";
  className?: string;
}

export function LanguageSwitcher({ variant = "admin", className }: LanguageSwitcherProps) {
  const {
    locale,
    userState,
    stateDetecting,
    stateSource,
    regionalLabel,
    regionalLocale,
    setLocale,
    setUserState,
    t,
  } = useLanguage();
  const stateOption = getStateLanguageOption(userState);
  const compact = variant === "admin";

  const selectLocale = (next: UiLocale) => {
    if (next === "en") setLocale("en");
    else setLocale(regionalLocale);
  };

  return (
    <div className={cn("relative flex items-center gap-1", className)}>
      {!compact && <Globe className="h-4 w-4 shrink-0 text-[#1E4A85]" />}

      <div
        className={cn(
          "flex overflow-hidden rounded-xl border border-slate-200/90 text-[11px] font-semibold shadow-sm dark:border-white/10",
          compact && "h-9"
        )}
      >
        <button
          type="button"
          onClick={() => selectLocale("en")}
          className={cn(
            "px-2.5 transition",
            compact ? "h-full px-2.5" : "px-2.5 py-1.5",
            locale === "en"
              ? "bg-[#1E4A85] text-white"
              : "bg-white text-[#1E4A85] hover:bg-slate-50 dark:bg-white/5 dark:text-[#E8D5A3] dark:hover:bg-white/10"
          )}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => selectLocale(regionalLocale)}
          title={`${stateOption.state} — ${stateOption.englishName}`}
          className={cn(
            "max-w-[4.5rem] truncate transition",
            compact ? "h-full px-2" : "px-2.5 py-1.5",
            locale === regionalLocale
              ? "bg-[#1E4A85] text-white"
              : "bg-white text-[#1E4A85] hover:bg-slate-50 dark:bg-white/5 dark:text-[#E8D5A3] dark:hover:bg-white/10"
          )}
        >
          {regionalLabel}
        </button>
      </div>

      <div className="relative group">
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-0.5 rounded-xl text-[10px] font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10",
            compact ? "h-9 px-1.5" : "px-1.5 py-1.5"
          )}
          title={
            stateDetecting
              ? t("lang.detectingState", "Detecting your state…")
              : stateSource === "franchise"
                ? t("lang.stateFromFranchise", "State from your franchise")
                : stateSource === "manual"
                  ? t("lang.selectState")
                  : t("lang.stateAutoDetected", "State auto-detected")
          }
        >
          <Globe className={cn("shrink-0 text-[#1E4A85]/70", compact ? "h-3.5 w-3.5" : "hidden")} />
          <span className={cn("truncate", compact ? "max-w-[56px] hidden xl:inline" : "max-w-[88px]")}>
            {stateDetecting ? "…" : stateOption.state}
          </span>
          <ChevronDown className="h-3 w-3" />
        </button>
        <div className="invisible absolute right-0 top-full z-[200] mt-1 max-h-56 w-44 overflow-y-auto rounded-xl border border-border bg-popover py-1 text-popover-foreground opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
          {INDIAN_STATES.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => setUserState(state)}
              className={cn(
                "block w-full px-3 py-2 text-left text-xs hover:bg-muted",
                userState === state && "bg-[#1E4A85]/10 font-semibold text-[#1E4A85]"
              )}
            >
              {state}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
