"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FiBook, FiCalendar, FiTag } from "react-icons/fi";
import { FaGraduationCap, FaStore } from "react-icons/fa";
import AnimatedCounter from "./AnimatedCounter";
import type { StatItem, UserPanelConfig } from "@/config/userpanel.config";
import { EASE_OUT, VIEWPORT } from "./ui/motion";

const ICON_MAP = {
  courses: FiBook,
  enrollments: FaGraduationCap,
  branches: FaStore,
  events: FiCalendar,
  offers: FiTag,
} as const;

const TONES = [
  "bg-ive-navy text-white",
  "bg-ive-saffron text-white",
  "bg-ive-emerald text-white",
  "bg-ive-royal text-white",
  "bg-[#FFB15C] text-ive-navy",
];

interface StatsSectionProps {
  config: UserPanelConfig;
}

export default function StatsSection({ config }: StatsSectionProps) {
  const reduce = useReducedMotion();
  const stats = config.stats || [];
  if (stats.length === 0) return null;

  return (
    <section aria-label="Key statistics" className="relative z-10 bg-white px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-x-0 top-0 h-1/2 bg-[#E9F1FB]" aria-hidden />
      <ul className="relative mx-auto -mt-24 grid max-w-7xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:-mt-28 lg:grid-cols-5 lg:gap-5">
        {stats.map((stat: StatItem, i: number) => {
          const Icon = ICON_MAP[stat.iconKey] || FiBook;
          return (
            <motion.li
              key={stat.id}
              initial={{ opacity: 0, y: reduce ? 0 : 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={VIEWPORT}
              transition={{ duration: 0.6, delay: reduce ? 0 : i * 0.08, ease: EASE_OUT }}
              whileHover={reduce ? undefined : { y: -6, scale: 1.02 }}
              className={`group relative overflow-hidden rounded-2xl border border-white bg-white/90 p-5 text-center shadow-[0_24px_50px_-24px_rgba(6,27,54,0.35)] backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_30px_60px_-24px_rgba(6,27,54,0.45)] sm:p-6 ${
                stats.length % 2 === 1 && i === stats.length - 1 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <span className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-ive-saffron via-white to-ive-emerald transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
              <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110 ${TONES[i % TONES.length]}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="mt-4 text-3xl font-extrabold leading-none tracking-tight text-ive-navy tabular-nums sm:text-[2.1rem]">
                <AnimatedCounter value={stat.value} duration={1.6} />
              </div>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-ive-slate">{stat.label}</p>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
