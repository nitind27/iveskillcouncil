/** Regional locale codes supported by the app */
export type RegionalLocale =
  | "hi"
  | "mr"
  | "gu"
  | "kn"
  | "ta"
  | "te"
  | "bn"
  | "ml"
  | "pa"
  | "or";

export type UiLocale = "en" | RegionalLocale;

export interface StateLanguageOption {
  state: string;
  locale: RegionalLocale;
  nativeName: string;
  englishName: string;
}

/** Indian states / UTs → regional UI language */
export const STATE_TO_LOCALE: Record<string, RegionalLocale> = {
  maharashtra: "mr",
  gujarat: "gu",
  rajasthan: "hi",
  "madhya pradesh": "hi",
  "uttar pradesh": "hi",
  bihar: "hi",
  haryana: "hi",
  delhi: "hi",
  chhattisgarh: "hi",
  jharkhand: "hi",
  uttarakhand: "hi",
  "himachal pradesh": "hi",
  punjab: "pa",
  karnataka: "kn",
  "tamil nadu": "ta",
  kerala: "ml",
  "andhra pradesh": "te",
  telangana: "te",
  "west bengal": "bn",
  odisha: "or",
  goa: "mr",
};

export const LOCALE_META: Record<
  RegionalLocale,
  { nativeName: string; englishName: string; fontClass: string }
> = {
  hi: { nativeName: "हिन्दी", englishName: "Hindi", fontClass: "font-devanagari" },
  mr: { nativeName: "मराठी", englishName: "Marathi", fontClass: "font-devanagari" },
  gu: { nativeName: "ગુજરાતી", englishName: "Gujarati", fontClass: "font-gujarati" },
  kn: { nativeName: "ಕನ್ನಡ", englishName: "Kannada", fontClass: "font-kannada" },
  ta: { nativeName: "தமிழ்", englishName: "Tamil", fontClass: "font-tamil" },
  te: { nativeName: "తెలుగు", englishName: "Telugu", fontClass: "font-telugu" },
  bn: { nativeName: "বাংলা", englishName: "Bengali", fontClass: "font-bengali" },
  ml: { nativeName: "മലയാളം", englishName: "Malayalam", fontClass: "font-malayalam" },
  pa: { nativeName: "ਪੰਜਾਬੀ", englishName: "Punjabi", fontClass: "font-gurmukhi" },
  or: { nativeName: "ଓଡ଼ିଆ", englishName: "Odia", fontClass: "font-oriya" },
};

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export function normalizeStateName(state: string | null | undefined): string {
  return (state ?? "").trim().toLowerCase();
}

export function getRegionalLocaleForState(state: string | null | undefined): RegionalLocale {
  const key = normalizeStateName(state);
  if (key && STATE_TO_LOCALE[key]) return STATE_TO_LOCALE[key];
  // partial match e.g. "MH" or "Maharashtra, India"
  for (const [name, locale] of Object.entries(STATE_TO_LOCALE)) {
    if (key.includes(name) || name.includes(key)) return locale;
  }
  return "hi";
}

export function getStateLanguageOption(state: string | null | undefined): StateLanguageOption {
  const normalized = normalizeStateName(state) || "maharashtra";
  const displayState =
    INDIAN_STATES.find((s) => normalizeStateName(s) === normalized) ??
    (state?.trim() || "Maharashtra");
  const locale = getRegionalLocaleForState(displayState);
  const meta = LOCALE_META[locale];
  return {
    state: displayState,
    locale,
    nativeName: meta.nativeName,
    englishName: meta.englishName,
  };
}
