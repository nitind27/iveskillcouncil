"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  FiTag, FiArrowRight, FiCheck, FiGift, FiUsers, FiClock, FiCalendar, FiPercent, FiCopy, FiCheckCircle,
} from "react-icons/fi";
import OfferModal from "./OfferModal";
import OfferApplyFormModal from "./OfferApplyFormModal";
import type { OfferItem, UserPanelConfig } from "@/config/userpanel.config";
import { cn } from "@/lib/utils";
import Reveal from "./ui/Reveal";
import { EASE_OUT, VIEWPORT } from "./ui/motion";

interface OffersSectionProps {
  config: UserPanelConfig;
}

function offerIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("refer")) return FiUsers;
  if (t.includes("early") || t.includes("bird")) return FiClock;
  return FiGift;
}

function offerCouponCode(offer: OfferItem): string {
  const t = offer.title.toLowerCase();
  if (t.includes("summer")) return `SUMMER${offer.discount}`;
  if (t.includes("refer")) return `REFER${offer.discount}`;
  if (t.includes("early") || t.includes("bird")) return `EARLY${offer.discount}`;
  return `OFFER${offer.discount}`;
}

function offerPerks(offer: OfferItem): string[] {
  const t = offer.title.toLowerCase();
  if (t.includes("refer")) {
    return ["Share referral code with a friend", "Get instant discount on next enrolment", "Instant online redemption & tracking"];
  }
  if (t.includes("early") || t.includes("bird")) {
    return ["Guaranteed seat in upcoming priority batch", "Tuition fee locked at discounted rate", "Early bird study materials & orientation"];
  }
  if (t.includes("summer")) {
    return ["Applicable across all vocational programs", "Instant fee concession at checkout", "Includes verified certificate on completion"];
  }
  return ["Valid on select vocational certificates", "Easy online application process", "Limited-period institutional grant"];
}

/** Parses an admin-entered expiry; returns null for empty, invalid or past dates. */
function parseExpiry(value?: string): number | null {
  if (!value?.trim()) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) && ts > Date.now() ? ts : null;
}

const THEMES = [
  { badge: "Seasonal Special", tile: "bg-gradient-to-br from-ive-saffron to-ive-saffron-dark", text: "text-ive-saffron-dark", soft: "bg-ive-saffron/10", button: "bg-ive-saffron hover:bg-ive-saffron-dark", glow: "hover:border-ive-saffron/50 hover:shadow-[0_30px_60px_-30px_rgba(255,133,0,0.55)]" },
  { badge: "Student Referral", tile: "bg-gradient-to-br from-ive-emerald to-[#0F7D5A]", text: "text-ive-emerald", soft: "bg-ive-emerald/10", button: "bg-ive-emerald hover:bg-[#0F7D5A]", glow: "hover:border-ive-emerald/50 hover:shadow-[0_30px_60px_-30px_rgba(21,154,112,0.5)]" },
  { badge: "Priority Booking", tile: "bg-gradient-to-br from-ive-royal to-ive-navy", text: "text-ive-royal", soft: "bg-ive-royal/10", button: "bg-ive-royal hover:bg-ive-navy", glow: "hover:border-ive-royal/50 hover:shadow-[0_30px_60px_-30px_rgba(18,78,150,0.5)]" },
];

function Countdown({ target }: { target: number }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (now === null) return null;
  const diff = Math.max(0, target - now);
  const parts = [
    { label: "Days", value: Math.floor(diff / 86_400_000) },
    { label: "Hrs", value: Math.floor(diff / 3_600_000) % 24 },
    { label: "Min", value: Math.floor(diff / 60_000) % 60 },
    { label: "Sec", value: Math.floor(diff / 1000) % 60 },
  ];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ive-line bg-white px-4 py-3 shadow-sm" role="timer" aria-label="Time left for the nearest offer">
      <span className="text-xs font-bold uppercase leading-tight tracking-wider text-ive-slate">
        Offer
        <br />
        ends in
      </span>
      <div className="flex gap-1.5">
        {parts.map((p) => (
          <span key={p.label} className="flex w-12 flex-col items-center rounded-lg bg-ive-navy py-1.5 text-white">
            <span className="font-mono text-base font-bold leading-none tabular-nums">{String(p.value).padStart(2, "0")}</span>
            <span className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-white/60">{p.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function OfferCard({ offer, index, onClaim }: { offer: OfferItem; index: number; onClaim: () => void }) {
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const theme = THEMES[index % THEMES.length];
  const Icon = offerIcon(offer.title);
  const perks = offerPerks(offer);
  const code = offerCouponCode(offer);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: reduce ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.6, delay: reduce ? 0 : index * 0.08, ease: EASE_OUT }}
      whileHover={reduce ? undefined : { y: -6, scale: 1.015 }}
      className={cn(
        "group flex h-full flex-col rounded-[1.5rem] border border-ive-line bg-white p-5 shadow-[var(--up-card-shadow)] transition-[box-shadow,border-color] duration-500 sm:p-6",
        theme.glow
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("flex h-[88px] w-[88px] flex-shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow-lg", theme.tile)}>
          <span className="text-[2rem] font-extrabold leading-none">{offer.discount}%</span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85">Off</span>
        </div>
        <div className="min-w-0 pt-1">
          <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]", theme.text)}>
            <Icon className="h-3.5 w-3.5" />
            {theme.badge}
          </span>
          <h3 className="mt-1 text-lg font-extrabold leading-tight text-ive-navy">{offer.title}</h3>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ive-slate">{offer.description}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl border border-dashed border-ive-line bg-ive-mist px-3.5 py-2">
        <span className="flex items-center gap-2">
          <FiPercent className={cn("h-4 w-4", theme.text)} />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-ive-ink">{code}</span>
        </span>
        <button
          type="button"
          onClick={handleCopyCode}
          aria-label={`Copy coupon code ${code}`}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-ive-royal transition-colors hover:bg-white"
        >
          {copied ? (
            <>
              <FiCheckCircle className="h-3.5 w-3.5 text-ive-emerald" />
              <span className="font-bold text-ive-emerald" aria-live="polite">Copied!</span>
            </>
          ) : (
            <>
              <FiCopy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      <div className="relative -mx-5 my-5 sm:-mx-6" aria-hidden>
        <div className="border-t-2 border-dashed border-ive-line" />
        <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-ive-line bg-ive-mist" />
        <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-ive-line bg-ive-mist" />
      </div>

      <ul className="space-y-2.5">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2.5 text-sm leading-snug text-ive-ink">
            <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", theme.soft, theme.text)}>
              <FiCheck className="h-3 w-3 stroke-[3]" />
            </span>
            {perk}
          </li>
        ))}
      </ul>

      {offer.validUntil?.trim() && (
        <p className="mt-5 flex items-center gap-1.5 text-xs font-medium text-ive-slate">
          <FiCalendar className={cn("h-3.5 w-3.5", theme.text)} />
          Valid until: {offer.validUntil}
        </p>
      )}

      <div className="mt-auto pt-6">
        <button
          type="button"
          onClick={onClaim}
          className={cn(
            "up-sheen flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors duration-300 active:scale-[0.98]",
            theme.button
          )}
        >
          Claim Offer
          <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.article>
  );
}

const TRUST_ITEMS = [
  { label: "Instant Fee Concession", color: "text-ive-royal" },
  { label: "Verified Govt. Aligned Certification", color: "text-ive-emerald" },
  { label: "National Franchise Network", color: "text-ive-saffron" },
];

export default function OffersSection({ config }: OffersSectionProps) {
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [applyFormOffer, setApplyFormOffer] = useState<OfferItem | null>(null);
  const { offers } = config;
  const items = useMemo(() => offers?.items || [], [offers?.items]);
  const nearestExpiry = useMemo(() => {
    const dates = items.map((o) => parseExpiry(o.validUntil)).filter((d): d is number => d !== null);
    return dates.length ? Math.min(...dates) : null;
  }, [items]);

  if (items.length === 0) return null;

  return (
    <>
      <section id="offers" className="relative overflow-hidden bg-ive-mist px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="up-dot-pattern pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60 [mask-image:linear-gradient(#000,transparent)]" aria-hidden />
        <div className="relative mx-auto max-w-7xl">
          <Reveal className="mb-10 grid items-end gap-6 sm:mb-12 lg:grid-cols-[1fr_auto_1fr]">
            <span className="hidden lg:block" />
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ive-saffron-dark shadow-sm">
                <FiTag className="h-3.5 w-3.5" />
                Exclusive Student Privileges
              </span>
              <h2 className="mt-4 text-[1.9rem] font-extrabold tracking-tight text-ive-navy sm:text-4xl lg:text-[2.6rem]">
                {offers.sectionTitle || "Current Offers"}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base text-ive-slate">
                Take advantage of limited-time fee concessions, referral rewards, and early enrolment perks.
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">{nearestExpiry !== null && <Countdown target={nearestExpiry} />}</div>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((offer, index) => (
              <OfferCard key={offer.id} offer={offer} index={index} onClaim={() => setSelectedOffer(offer)} />
            ))}
          </div>

          <Reveal className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-ive-line bg-white px-6 py-4 text-xs font-semibold text-ive-ink shadow-sm sm:text-sm">
            {TRUST_ITEMS.map((item) => (
              <span key={item.label} className="flex items-center gap-2">
                <FiCheckCircle className={cn("h-4 w-4 flex-shrink-0", item.color)} />
                {item.label}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      <OfferModal
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onApplyNow={(offer) => {
          setSelectedOffer(null);
          setApplyFormOffer(offer);
        }}
      />

      <OfferApplyFormModal open={!!applyFormOffer} onClose={() => setApplyFormOffer(null)} offer={applyFormOffer} />
    </>
  );
}
