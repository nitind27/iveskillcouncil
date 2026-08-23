"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiStar } from "react-icons/fi";
import { FaQuoteLeft } from "react-icons/fa";
import { useUserPanelConfig } from "@/contexts/UserPanelConfigContext";
import type { TestimonialItem } from "@/config/userpanel.config";

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face";

function TestimonialCard({
  item,
  index,
  featured,
  onSelect,
}: {
  item: TestimonialItem;
  index: number;
  featured: boolean;
  onSelect: () => void;
}) {
  const [avatar, setAvatar] = useState(item.avatar || FALLBACK_AVATAR);
  const stars = Math.min(5, Math.max(1, item.rating || 5));

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onClick={onSelect}
      className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border bg-white p-7 transition-all duration-500 md:p-8 ${
        featured
          ? "border-[#1E4A85]/25 shadow-[0_24px_50px_rgba(30,74,133,0.14)] -translate-y-1.5"
          : "border-[#E5E7EB] shadow-[0_10px_28px_rgba(15,23,42,0.05)] hover:-translate-y-1 hover:border-[#1E4A85]/20 hover:shadow-[0_18px_40px_rgba(30,74,133,0.1)]"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#163A6B] via-[#1E4A85] to-[#C4A35A] transition-opacity duration-500 ${
          featured ? "opacity-100" : "opacity-40 group-hover:opacity-100"
        }`}
      />

      <FaQuoteLeft
        className={`mb-5 h-9 w-9 transition-colors duration-500 ${
          featured ? "text-[#C4A35A]" : "text-[#1E4A85]/15 group-hover:text-[#C4A35A]/70"
        }`}
      />

      <div className="mb-4 flex gap-1">
        {Array.from({ length: stars }).map((_, i) => (
          <motion.span
            key={`${item.id}-star-${i}`}
            initial={{ scale: 0, rotate: -18 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.05, type: "spring", stiffness: 380, damping: 16 }}
          >
            <FiStar className="h-4 w-4 fill-[#C4A35A] text-[#C4A35A]" />
          </motion.span>
        ))}
      </div>

      <p className="mb-8 flex-1 text-[15px] leading-relaxed text-[#334155] md:text-base">
        &ldquo;{item.text}&rdquo;
      </p>

      <div className="mt-auto flex items-center gap-3.5 border-t border-[#EEF2F7] pt-5">
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-[#C4A35A]/35 ring-offset-2 ring-offset-white">
          <img
            src={avatar}
            alt={item.name}
            className="h-full w-full object-cover"
            onError={() => setAvatar(FALLBACK_AVATAR)}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold text-[#0F172A]">{item.name}</p>
          <p className="truncate text-sm font-medium text-[#1E4A85]">{item.role}</p>
        </div>
      </div>
    </motion.article>
  );
}

export default function TestimonialsSection() {
  const config = useUserPanelConfig();
  const { testimonials } = config;
  const items: TestimonialItem[] = testimonials?.items || [];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [items.length, paused]);

  if (items.length === 0) return null;

  return (
    <section id="testimonials" className="relative overflow-hidden bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-[#1E4A85]/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-4 h-64 w-64 rounded-full bg-[#C4A35A]/[0.08] blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#1E4A85]/15 bg-[#1E4A85]/8 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E4A85]">
            Testimonials
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0F172A] md:text-4xl">
            {testimonials?.sectionTitle || "What Our Students Say"}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-[#64748B]">
            Real outcomes from learners who trained with us.
          </p>
        </motion.div>

        <div
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {items.map((item, index) => (
            <TestimonialCard
              key={item.id}
              item={item}
              index={index}
              featured={index === active}
              onSelect={() => setActive(index)}
            />
          ))}
        </div>

        {items.length > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show ${item.name}`}
                onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === active ? "w-8 bg-[#1E4A85]" : "w-2 bg-[#E5E7EB] hover:bg-[#1E4A85]/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
