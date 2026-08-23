"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { FiTag, FiArrowRight, FiCheck, FiGift, FiUsers, FiClock, FiChevronLeft, FiChevronRight } from "react-icons/fi";
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

function offerPerks(offer: OfferItem): string[] {
  const t = offer.title.toLowerCase();
  if (t.includes("refer")) {
    return ["Share with a friend", "Discount on next enrolment", "Simple online claim"];
  }
  if (t.includes("early") || t.includes("bird")) {
    return ["Priority batch seat", "Fee locked in advance", "Book 2 months ahead"];
  }
  if (t.includes("summer")) {
    return ["Valid on all courses", "Instant confirmation", "Limited seats only"];
  }
  return ["Valid on selected programmes", "Easy online apply", "Limited-period benefit"];
}

function OfferTiltCard({
  offer,
  index,
  featured,
  onClaim,
}: {
  offer: OfferItem;
  index: number;
  featured: boolean;
  onClaim: () => void;
}) {
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [14, -14]), { stiffness: 220, damping: 18 });
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-18, 18]), { stiffness: 220, damping: 18 });
  const glareX = useTransform(px, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(py, [-0.5, 0.5], ["0%", "100%"]);
  const glareBg = useTransform(
    [glareX, glareY],
    ([x, y]) => `radial-gradient(420px circle at ${x} ${y}, rgba(196,163,90,0.28), transparent 55%)`
  );
  const Icon = offerIcon(offer.title);
  const perks = offerPerks(offer);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="relative h-full"
    >
      <div
        className={`relative flex h-full min-h-[430px] flex-col overflow-visible rounded-[1.6rem] border p-6 ${
          featured
            ? "border-[#D4B05C]/40 bg-gradient-to-br from-[#1E4A85]/90 via-[#102A4C] to-[#0B1F38] shadow-[0_30px_70px_rgba(0,0,0,0.45),0_0_28px_rgba(196,163,90,0.16)]"
            : "border-[#C4A35A]/18 bg-gradient-to-br from-white/10 via-[#163A6B]/80 to-[#0B1F38] shadow-[0_24px_50px_rgba(0,0,0,0.35)]"
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.6rem] opacity-70 mix-blend-screen"
          style={{ background: glareBg }}
        />

        <div className="relative mb-5 flex items-start justify-between" style={{ transform: "translateZ(28px)" }}>
          <span className="text-[11px] font-bold tracking-[0.22em] text-[#D4B05C]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A35A]/35 bg-[#C4A35A]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#D4B05C]">
            <Icon className="h-3 w-3" />
            Limited
          </span>
        </div>

        <div className="relative mb-6 flex justify-center" style={{ transform: "translateZ(48px)" }}>
          <div className="offer-coin-halo pointer-events-none absolute h-28 w-28 rounded-full bg-[#C4A35A]/40 blur-2xl" />
          <div className="offer-coin relative flex h-[108px] w-[108px] flex-col items-center justify-center rounded-full">
            <span className="text-[2rem] font-black leading-none text-[#1A1408]">{offer.discount}%</span>
            <span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#1A1408]/75">Off</span>
          </div>
        </div>

        <h3 className="relative text-center text-xl font-extrabold text-white" style={{ transform: "translateZ(32px)" }}>
          {offer.title}
        </h3>
        <p className="relative mt-2 text-center text-sm leading-relaxed text-white/65" style={{ transform: "translateZ(24px)" }}>
          {offer.description}
        </p>

        <ul className="relative mt-5 space-y-2" style={{ transform: "translateZ(26px)" }}>
          {perks.map((perk) => (
            <li key={perk} className="flex items-start gap-2 text-[13px] text-white/80">
              <FiCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#D4B05C]" />
              {perk}
            </li>
          ))}
        </ul>

        <div className="relative mt-auto pt-6" style={{ transform: "translateZ(40px)" }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClaim();
            }}
            className="offer-btn-glow inline-flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-extrabold"
          >
            Claim Offer
            <FiArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function OffersSection({ config }: OffersSectionProps) {
  const [selectedOffer, setSelectedOffer] = useState<OfferItem | null>(null);
  const [applyFormOffer, setApplyFormOffer] = useState<OfferItem | null>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const { offers } = config;
  const items = offers?.items || [];

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const id = window.setInterval(() => {
      if (!window.matchMedia("(min-width: 1024px)").matches) return;
      setActive((i) => (i + 1) % items.length);
    }, 4200);
    return () => window.clearInterval(id);
  }, [items.length, paused]);

  if (items.length === 0) return null;

  const goPrev = () => setActive((i) => (i === 0 ? items.length - 1 : i - 1));
  const goNext = () => setActive((i) => (i === items.length - 1 ? 0 : i + 1));

  return (
    <>
      <section id="offers" className="relative overflow-hidden bg-[#070F1C] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-10%,rgba(196,163,90,0.22),transparent_58%)]" />
        <div className="offer-orb pointer-events-none absolute left-[8%] top-16 h-40 w-40 rounded-full bg-[#C4A35A]/18 blur-3xl" />
        <div className="offer-orb offer-orb-delay pointer-events-none absolute bottom-10 right-[10%] h-52 w-52 rounded-full bg-[#1E4A85]/50 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#C4A35A] to-transparent" />

        <div className="relative mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center lg:mb-6"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C4A35A]/35 bg-[#C4A35A]/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#D4B05C]">
              <FiTag className="h-3.5 w-3.5" />
              Exclusive deals
            </span>
            <h2 className="hero-title-glow text-3xl font-extrabold tracking-tight md:text-5xl">
              {offers.sectionTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-white/65">
              Move across the cards — a 3D showcase of limited enrolment benefits.
            </p>
          </motion.div>

          <div
              className="relative mx-auto hidden h-[560px] max-w-6xl lg:block"
              style={{ perspective: 1600 }}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="pointer-events-none absolute bottom-6 left-1/2 h-24 w-[70%] -translate-x-1/2 rounded-[100%] bg-[#C4A35A]/20 blur-3xl" />

              {items.map((offer, index) => {
                const raw = index - active;
                const half = Math.floor(items.length / 2);
                let offset = raw;
                if (offset > half) offset -= items.length;
                if (offset < -half) offset += items.length;
                const abs = Math.abs(offset);
                const hidden = abs > 1 && items.length > 3;

                return (
                  <motion.div
                    key={offer.id}
                    className="absolute top-8 w-[340px] cursor-pointer"
                    style={{ left: "50%", transformStyle: "preserve-3d" }}
                    animate={{
                      x: `calc(-50% + ${offset * 250}px)`,
                      z: abs === 0 ? 120 : -90,
                      rotateY: offset * -32,
                      scale: abs === 0 ? 1.04 : 0.86,
                      opacity: hidden ? 0 : abs === 0 ? 1 : 0.72,
                      y: abs === 0 ? 0 : 28,
                      zIndex: hidden ? 0 : 20 - abs,
                    }}
                    transition={{ type: "spring", stiffness: 160, damping: 22 }}
                    onClick={() => {
                      if (abs !== 0) setActive(index);
                    }}
                  >
                    <OfferTiltCard
                      offer={offer}
                      index={index}
                      featured={abs === 0}
                      onClaim={() => setSelectedOffer(offer)}
                    />
                  </motion.div>
                );
              })}

              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous offer"
                    className="absolute left-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#C4A35A]/40 bg-[#0B1F38]/80 text-[#D4B05C] shadow-[0_0_16px_rgba(196,163,90,0.25)] backdrop-blur-md transition hover:bg-[#C4A35A] hover:text-[#1A1408]"
                  >
                    <FiChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next offer"
                    className="absolute right-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[#C4A35A]/40 bg-[#0B1F38]/80 text-[#D4B05C] shadow-[0_0_16px_rgba(196,163,90,0.25)] backdrop-blur-md transition hover:bg-[#C4A35A] hover:text-[#1A1408]"
                  >
                    <FiChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:hidden">
              {items.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  style={{ perspective: 1200 }}
                >
                  <OfferTiltCard
                    offer={offer}
                    index={index}
                    featured={index === 0}
                    onClaim={() => setSelectedOffer(offer)}
                  />
                </motion.div>
              ))}
            </div>

            {items.length > 1 && (
            <div className="mt-2 hidden justify-center gap-2 lg:flex">
              {items.map((offer, i) => (
                <button
                  key={offer.id}
                  type="button"
                  aria-label={`Show ${offer.title}`}
                  onClick={() => setActive(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === active ? "w-8 bg-[#C4A35A] shadow-[0_0_10px_rgba(196,163,90,0.55)]" : "w-2 bg-white/20 hover:bg-[#C4A35A]/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <OfferModal
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onApplyNow={(offer) => { setSelectedOffer(null); setApplyFormOffer(offer); }}
      />
      <OfferApplyFormModal
        open={!!applyFormOffer}
        onClose={() => setApplyFormOffer(null)}
        offer={applyFormOffer}
      />
    </>
  );
}
