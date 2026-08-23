import { INDIAN_STATES } from "@/lib/i18n/state-languages";

/** Common aliases from IP APIs, pincode lookup, geocoders */
const STATE_ALIASES: Record<string, string> = {
  maharashtra: "Maharashtra",
  mh: "Maharashtra",
  gujarat: "Gujarat",
  gj: "Gujarat",
  rajasthan: "Rajasthan",
  rj: "Rajasthan",
  "madhya pradesh": "Madhya Pradesh",
  mp: "Madhya Pradesh",
  "uttar pradesh": "Uttar Pradesh",
  up: "Uttar Pradesh",
  bihar: "Bihar",
  br: "Bihar",
  haryana: "Haryana",
  hr: "Haryana",
  delhi: "Delhi",
  "nct of delhi": "Delhi",
  "new delhi": "Delhi",
  chhattisgarh: "Chhattisgarh",
  cg: "Chhattisgarh",
  jharkhand: "Jharkhand",
  jh: "Jharkhand",
  uttarakhand: "Uttarakhand",
  uk: "Uttarakhand",
  "himachal pradesh": "Himachal Pradesh",
  hp: "Himachal Pradesh",
  punjab: "Punjab",
  pb: "Punjab",
  karnataka: "Karnataka",
  ka: "Karnataka",
  "tamil nadu": "Tamil Nadu",
  tn: "Tamil Nadu",
  kerala: "Kerala",
  kl: "Kerala",
  "andhra pradesh": "Andhra Pradesh",
  ap: "Andhra Pradesh",
  telangana: "Telangana",
  ts: "Telangana",
  "west bengal": "West Bengal",
  wb: "West Bengal",
  odisha: "Odisha",
  orissa: "Odisha",
  or: "Odisha",
  goa: "Goa",
  ga: "Goa",
};

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Map any raw state/region string to a canonical INDIAN_STATES entry, or null */
export function resolveIndianStateName(raw: string | null | undefined): string | null {
  const key = normalizeKey(raw ?? "");
  if (!key) return null;

  if (STATE_ALIASES[key]) return STATE_ALIASES[key];

  const fromList = INDIAN_STATES.find((s) => normalizeKey(s) === key);
  if (fromList) return fromList;

  for (const [alias, canonical] of Object.entries(STATE_ALIASES)) {
    if (key.includes(alias) || alias.includes(key)) return canonical;
  }

  for (const state of INDIAN_STATES) {
    const stateKey = normalizeKey(state);
    if (key.includes(stateKey) || stateKey.includes(key)) return state;
  }

  return null;
}
