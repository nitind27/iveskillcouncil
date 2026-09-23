"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FiTag,
  FiArrowRight,
  FiCheck,
  FiGift,
  FiUsers,
  FiClock,
  FiCalendar,
  FiPercent,
  FiCopy,
  FiCheckCircle,
} from "react-icons/fi";
import OfferModal from "./OfferModal";
import OfferApplyFormModal from "./OfferApplyFormModal";
import type { OfferItem, UserPanelConfig } from "@/config/userpanel.config";

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
    return [
      "Share referral code with a friend",
      "Get instant discount on next enrolment",
      "Instant online redemption & tracking",
    ];
  }
  if (t.includes("early") || t.includes("bird")) {
    return [
      "Guaranteed seat in upcoming priority batch",
      "Tuition fee locked at discounted rate",
      "Early bird study materials & orientation",
    ];
  }
  if (t.includes("summer")) {
    return [
      "Applicable across all vocational programs",
      "Instant fee concession at checkout",
      "Includes verified certificate on completion",
    ];
  }
  return [
    "Valid on select vocational certificates",
    "Easy online application process",
    "Limited-period institutional grant",
  ];
}

const THEMES = [
  {
    badge: "Seasonal Special",
    accent: "#FF7F0E",
    accentLight: "#FFF4EB",
    tagBg: "bg-[#FFF4EB] text-[#CC5500] border-[#FFD4A8]",
    buttonBg: "bg-[#FF7F0E] text-white hover:bg-[#E66A00]",
    discountBadge: "bg-[#003366] text-white",
    cardRing: "hover:border-[#FF7F0E]/60 hover:shadow-[0_16px_40px_rgba(255,127,14,0.18)]",
    featured: true,
  },
  {
    badge: "Student Referral",
    accent: "#28A745",
    accentLight: "#F0FFF4",
    tagBg: "bg-[#F0FFF4] text-[#1E7E34] border-[#A3D9B1]",
    buttonBg: "bg-[#28A745] text-white hover:bg-[#1E7E34]",
    discountBadge: "bg-[#28A745] text-white",
    cardRing: "hover:border-[#28A745]/50 hover:shadow-[0_16px_40px_rgba(40,167,69,0.15)]",
    featured: false,
  },
  {
    badge: "Priority Booking",
    accent: "#0056b3",
    accentLight: "#F0F7FF",
    tagBg: "bg-[#F0F7FF] text-[#003366] border-[#B3D1F0]",
    buttonBg: "bg-[#003366] text-white hover:bg-[#002244]",
    discountBadge: "bg-[#0056b3] text-white",
    cardRing: "hover:border-[#0056b3]/50 hover:shadow-[0_16px_40px_rgba(0,86,179,0.15)]",
    featured: false,
  },
];

function VoucherCard({
  offer,
  index,
  onClaim,
}: {
  offer: OfferItem;
  index: number;
  onClaim: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const theme = THEMES[index % THEMES.length];
  const Icon = offerIcon(offer.title);
  const perks = offerPerks(offer);
  const code = offerCouponCode(offer);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.article
      initial={{ opacity: 1, y: 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white transition-all duration-300 shadow-[0_4px_20px_rgba(15,23,42,0.05)] hover:-translate-y-1.5 ${theme.cardRing}`}
    >
      {/* Top Banner Accent Stripe */}
      <div
        className="h-2 w-full"
        style={{
          background: theme.featured
            ? "linear-gradient(90deg, #FF7F0E, #FFFFFF, #28A745)"
            : `linear-gradient(90deg, ${theme.accent}, #003366)`,
        }}
      />

      {/* Card Header & Content */}
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${theme.tagBg}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {theme.badge}
          </span>

          {theme.featured && (
            <span className="rounded-full bg-[#FF7F0E]/15 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#CC5500]">
              Featured
            </span>
          )}
        </div>

        {/* Discount Value Display */}
        <div className="mt-5 flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
            {offer.discount}%
          </span>
          <span className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#FF7F0E]">
            Discount
          </span>
        </div>

        {/* Offer Title & Description */}
        <h3 className="mt-2 text-xl font-extrabold text-slate-900 group-hover:text-[#003366] transition-colors">
          {offer.title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600 font-medium">
          {offer.description}
        </p>

        {/* Coupon Code Pill */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <FiPercent className="h-4 w-4 text-[#FF7F0E]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-700">
              {code}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-xs font-semibold text-[#003366] hover:text-[#002244] transition-colors"
          >
            {copied ? (
              <>
                <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <FiCopy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Dashed Ticket Divider with Notches */}
        <div className="relative -mx-6 sm:-mx-7 my-6">
          <div className="border-t-2 border-dashed border-slate-200" />
          <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-slate-200 bg-[#F8FAFC]" />
          <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border border-slate-200 bg-[#F8FAFC]" />
        </div>

        {/* Benefits Checklist */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            What you get:
          </p>
          <ul className="space-y-2">
            {perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-xs text-slate-700 font-medium leading-relaxed">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <FiCheck className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Valid Date or Guarantee */}
        <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <FiCalendar className="h-3.5 w-3.5 text-[#FF7F0E]" />
          <span>{offer.validUntil ? `Valid until: ${offer.validUntil}` : "Limited seats available this batch"}</span>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-2">
          <button
            type="button"
            onClick={onClaim}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold shadow-sm transition-all hover:shadow-md active:scale-[0.98] ${theme.buttonBg}`}
          >
            <span>Claim Offer</span>
            <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default function OffersSection({ config }: OffersSectionProps) {
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [applyFormOffer, setApplyFormOffer] = useState<OfferItem | null>(null);
  const { offers } = config;
  const items = offers?.items || [];

  if (items.length === 0) return null;

  return (
    <>
      <section
        id="offers"
        className="relative overflow-hidden bg-[#F8F9FA] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-y border-slate-200/80"
      >
        <div className="up-wave-decor" aria-hidden />
        <div className="relative z-[1] mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="mb-10 text-center sm:mb-14">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#FFD4A8] bg-[#FFF4EB] px-3.5 py-1 text-xs font-bold text-[#CC5500] shadow-sm">
              <FiTag className="h-3.5 w-3.5 text-[#FF7F0E]" />
              <span>Exclusive Student Privileges</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#003366] sm:text-4xl lg:text-5xl">
              {offers.sectionTitle || "Current Offers"}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:text-lg leading-relaxed">
              Take advantage of limited-time fee concessions, referral rewards, and early enrolment perks.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {items.map((offer, index) => (
              <VoucherCard
                key={offer.id}
                offer={offer}
                index={index}
                onClaim={() => setSelectedOffer(offer)}
              />
            ))}
          </div>

          {/* Bottom Trust Guarantee Strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm text-xs sm:text-sm text-slate-700">
            <span className="flex items-center gap-2 font-semibold">
              <FiCheckCircle className="h-4 w-4 text-[#003366]" />
              Instant Fee Concession
            </span>
            <span className="h-3 w-px bg-slate-300 hidden sm:block" />
            <span className="flex items-center gap-2 font-semibold">
              <FiCheckCircle className="h-4 w-4 text-emerald-600" />
              Verified Govt. Aligned Certification
            </span>
            <span className="h-3 w-px bg-slate-300 hidden sm:block" />
            <span className="flex items-center gap-2 font-semibold">
              <FiCheckCircle className="h-4 w-4 text-[#FF7F0E]" />
              National Franchise Network
            </span>
          </div>
        </div>
      </section>

      {/* Offer Details Modal */}
      <OfferModal
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onApplyNow={(offer) => {
          setSelectedOffer(null);
          setApplyFormOffer(offer);
        }}
      />

      {/* Offer Application Form Modal */}
      <OfferApplyFormModal
        open={!!applyFormOffer}
        onClose={() => setApplyFormOffer(null)}
        offer={applyFormOffer}
      />
    </>
  );
}
