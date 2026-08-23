"use client";

import { motion } from "framer-motion";
import { FiBook, FiCalendar, FiTag } from "react-icons/fi";
import { FaGraduationCap, FaStore } from "react-icons/fa";
import AnimatedCounter from "./AnimatedCounter";
import type { StatItem, UserPanelConfig } from "@/config/userpanel.config";

const ICON_MAP = {
  courses: FiBook,
  enrollments: FaGraduationCap,
  branches: FaStore,
  events: FiCalendar,
  offers: FiTag,
} as const;

const CARD_COLORS = [
  { gradient: "from-[#1E4A85] to-[#163A6B]", ring: "group-hover:ring-[#1E4A85]/20" },
  { gradient: "from-[#2D5DA8] to-[#1E4A85]", ring: "group-hover:ring-[#2D5DA8]/20" },
  { gradient: "from-[#C4A35A] to-[#A88B48]", ring: "group-hover:ring-[#C4A35A]/25" },
  { gradient: "from-[#1E4A85] to-[#0F2744]", ring: "group-hover:ring-[#1E4A85]/20" },
  { gradient: "from-[#C4A35A] to-[#8C7340]", ring: "group-hover:ring-[#C4A35A]/25" },
];

interface StatsSectionProps {
  config: UserPanelConfig;
}

export default function StatsSection({ config }: StatsSectionProps) {
  const stats = config.stats || [];
  if (stats.length === 0) return null;

  return (
    <section className="relative z-10 bg-[#F8FAFC] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
          {stats.map((stat: StatItem, i: number) => {
            const Icon = ICON_MAP[stat.iconKey] || FiBook;
            const color = CARD_COLORS[i % CARD_COLORS.length];
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
                className="group"
              >
                <div
                  className={`relative flex h-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white px-3 py-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ring-1 ring-transparent transition-all duration-300 group-hover:shadow-[0_16px_40px_rgba(45,93,168,0.12)] ${color.ring}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${color.gradient}`} />
                  <motion.div
                    whileHover={{ scale: 1.08, rotate: -4 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                    className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${color.gradient} shadow-md`}
                  >
                    <Icon className="h-[18px] w-[18px] text-white" />
                  </motion.div>
                  <div className="text-center">
                    <div className="text-[1.75rem] font-black leading-none tabular-nums tracking-tight text-[#1A1A1A]">
                      <AnimatedCounter value={stat.value} duration={1.5} />
                    </div>
                    <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7280]">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
