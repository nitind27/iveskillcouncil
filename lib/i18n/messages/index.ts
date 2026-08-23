import type { RegionalLocale, UiLocale } from "../state-languages";
import en from "./en.json";
import hi from "./hi.json";
import mr from "./mr.json";
import gu from "./gu.json";

export interface MessageTree {
  [key: string]: string | MessageTree;
}

const bundles: Record<UiLocale, MessageTree> = {
  en: en as MessageTree,
  hi: hi as MessageTree,
  mr: mr as MessageTree,
  gu: gu as MessageTree,
  // Until dedicated files exist, use Hindi for other regional locales
  kn: hi as MessageTree,
  ta: hi as MessageTree,
  te: hi as MessageTree,
  bn: hi as MessageTree,
  ml: hi as MessageTree,
  pa: hi as MessageTree,
  or: hi as MessageTree,
};

function getNested(obj: MessageTree | undefined, key: string): string | undefined {
  const parts = key.split(".");
  let cur: string | MessageTree | undefined = obj;
  for (const p of parts) {
    if (!cur || typeof cur === "string") return undefined;
    cur = cur[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function translate(locale: UiLocale, key: string, fallback?: string): string {
  const direct =
    getNested(bundles[locale], key) ??
    (locale !== "en" ? getNested(bundles.en, key) : undefined);
  if (direct) return direct;
  return fallback ?? key;
}

export function getMessages(locale: UiLocale): MessageTree {
  return bundles[locale] ?? bundles.en;
}

export { bundles };
