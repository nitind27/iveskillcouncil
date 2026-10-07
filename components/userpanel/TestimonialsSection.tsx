"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FiStar, FiChevronLeft, FiChevronRight, FiMessageSquare } from "react-icons/fi";
import { FaQuoteLeft } from "react-icons/fa";
import { useUserPanelConfig } from "@/contexts/UserPanelConfigContext";
import type { TestimonialItem } from "@/config/userpanel.config";
import { cn } from "@/lib/utils";
import Reveal from "./ui/Reveal";
import FlagWave from "./ui/FlagWave";
import { EASE_OUT, VIEWPORT } from "./ui/motion";

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face";

function TestimonialCard({ item, index }: { item: TestimonialItem; index: number }) {
  const reduce = useReducedMotion();
  const [avatar, setAvatar] = useState(item.avatar || FALLBACK_AVATAR);
  const stars = Math.min(5, Math.max(1, item.rating || 5));

  return (
    <motion.figure
      data-card
      initial={{ opacity: 0, y: reduce ? 0 : 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.6, delay: reduce ? 0 : index * 0.1, ease: EASE_OUT }}
      className="group relative flex w-[88%] flex-shrink-0 snap-start flex-col rounded-[1.35rem] border border-ive-line bg-white p-5 shadow-[var(--up-card-shadow)] transition-all duration-500 hover:-translate-y-1.5 hover:border-ive-royal/25 hover:shadow-[var(--up-card-shadow-hover)] sm:w-[calc(50%-0.75rem)] sm:rounded-[1.5rem] sm:p-7 lg:w-[calc(50%-0.75rem)] xl:w-[calc(33.333%-1rem)]"
    >
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ive-saffron/10 text-ive-saffron transition-colors duration-300 group-hover:bg-ive-saffron group-hover:text-white">
          <FaQuoteLeft className="h-4 w-4" />
        </span>
        <span className="flex gap-0.5" aria-label={`${stars} out of 5 stars`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <FiStar key={i} className={cn("h-4 w-4", i < stars ? "fill-ive-saffron text-ive-saffron" : "text-ive-line")} />
          ))}
        </span>
      </div>
      <blockquote className="mt-5 flex-1 text-[15px] leading-relaxed text-ive-ink">&ldquo;{item.text}&rdquo;</blockquote>
      <figcaption className="mt-6 flex items-center gap-3.5 border-t border-ive-line pt-5">
        <span className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-ive-saffron/40 ring-offset-2">
          <img src={avatar} alt="" loading="lazy" decoding="async" onError={() => setAvatar(FALLBACK_AVATAR)} className="h-full w-full object-cover" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-bold text-ive-navy">{item.name}</span>
          <span className="block truncate text-sm font-medium text-ive-royal">{item.role}</span>
        </span>
      </figcaption>
    </motion.figure>
  );
}

export default function TestimonialsSection() {
  const config = useUserPanelConfig();
  const reduce = useReducedMotion();
  const { testimonials } = config;
  const items: TestimonialItem[] = testimonials?.items || [];
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows, items.length]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = trackRef.current;
    const card = el?.querySelector<HTMLElement>("[data-card]");
    if (!el || !card) return;
    el.scrollBy({ left: dir * (card.offsetWidth + 24), behavior: reduce ? "auto" : "smooth" });
  };

  if (items.length === 0) return null;

  const arrowClass =
    "flex h-11 w-11 items-center justify-center rounded-full border transition-all disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <section id="testimonials" className="relative isolate overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <FlagWave rotate={12} opacity={0.08} className="-right-44 top-4 w-[540px] sm:w-[700px] lg:-right-56 lg:w-[820px]" />
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-ive-royal/[0.06] blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-7xl">
        <Reveal className="mb-10 grid items-end gap-6 sm:mb-12 lg:grid-cols-[1fr_auto_1fr]">
          <span className="hidden lg:block" />
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-ive-royal/[0.07] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ive-royal">
              <FiMessageSquare className="h-3.5 w-3.5 text-ive-saffron" />
              Testimonials
            </span>
            <h2 className="mt-4 text-[1.65rem] font-extrabold tracking-tight text-ive-navy sm:text-4xl lg:text-[2.6rem]">
              {testimonials?.sectionTitle || "What Our Students Say"}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-ive-slate">Real outcomes from learners who trained with us.</p>
          </div>
          {(canPrev || canNext) && (
            <div className="flex justify-center gap-2 lg:justify-end">
              <button type="button" onClick={() => scrollByCard(-1)} disabled={!canPrev} aria-label="Previous testimonials" className={cn(arrowClass, "border-ive-line bg-white text-ive-navy hover:border-ive-navy")}>
                <FiChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => scrollByCard(1)} disabled={!canNext} aria-label="Next testimonials" className={cn(arrowClass, "border-ive-navy bg-ive-navy text-white hover:bg-ive-navy-2")}>
                <FiChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </Reveal>

        <div
          ref={trackRef}
          onScroll={updateArrows}
          className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-4 pt-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item, index) => (
            <TestimonialCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
