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

// IVESDC brand colors per card
const CARD_COLORS = [
  { gradient: "from-[#2D5DA8] to-[#1E4A85]", glow: "rgba(45,93,168,0.25)", bar: "bg-[#2D5DA8]" },
  { gradient: "from-[#A8C63A] to-[#8FA92F]", glow: "rgba(168,198,58,0.25)", bar: "bg-[#A8C63A]" },
  { gradient: "from-[#F39C12] to-[#D68910]", glow: "rgba(243,156,18,0.25)", bar: "bg-[#F39C12]" },
  { gradient: "from-[#2D5DA8] to-[#A8C63A]", glow: "rgba(45,93,168,0.20)", bar: "bg-[#2D5DA8]" },
  { gradient: "from-[#F39C12] to-[#2D5DA8]", glow: "rgba(243,156,18,0.20)", bar: "bg-[#F39C12]" },
];

interface StatsSectionProps {
  config: UserPanelConfig;
}

export default function StatsSection({ config }: StatsSectionProps) {
  const stats = config.stats || [];
  if (stats.length === 0) return null;

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 bg-[var(--up-bg)]">
      <div className="max-w-7xl mx-auto -mt-20 relative z-20 pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat: StatItem, i: number) => {
            const Icon = ICON_MAP[stat.iconKey] || FiBook;
            const color = CARD_COLORS[i % CARD_COLORS.length];
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 90, damping: 16, delay: i * 0.07 }}
                whileHover={{ y: -8, scale: 1.04 }}
                className="group relative"
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                  style={{ background: `radial-gradient(circle, ${color.glow}, transparent 70%)` }}
                />
                <div className="relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-[var(--up-bg-card)] border border-[var(--up-border)] group-hover:border-transparent shadow-sm group-hover:shadow-xl transition-all duration-400 overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color.gradient} rounded-t-2xl`} />
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color.gradient} flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-[var(--up-text)] tabular-nums">
                      <AnimatedCounter value={stat.value} duration={2} />
                    </div>
                    <div className="text-xs font-semibold text-[var(--up-text-muted)] uppercase tracking-widest mt-1">
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
