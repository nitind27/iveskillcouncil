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

interface StatsSectionProps {
  config: UserPanelConfig;
}

export default function StatsSection({ config }: StatsSectionProps) {
  const stats = config.stats || [];

  if (stats.length === 0) return null;

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-visible panel-perspective bg-[var(--up-bg)]">
      <div className="max-w-7xl mx-auto -mt-40 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {stats.map((stat: StatItem, i: number) => {
            const Icon = ICON_MAP[stat.iconKey] || FiBook;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  type: "spring",
                  stiffness: 80,
                  damping: 18,
                  delay: i * 0.08,
                }}
                className="group relative panel-3d"
              >
                <div className={`absolute -inset-1 bg-gradient-to-br ${stat.colorClass} rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition duration-500`} />
                <motion.div
                  whileHover={{ y: -12, scale: 1.03, rotateX: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative h-full flex flex-col items-center justify-center p-8 bg-[var(--up-bg-card)] rounded-[2rem] shadow-lg border border-[var(--up-border)] group-hover:border-[var(--up-border-strong)] transition-all duration-500"
                >
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 blur-2xl opacity-40 rounded-2xl bg-gradient-to-br ${stat.colorClass} scale-150 group-hover:opacity-60 transition duration-500`} />
                    <motion.div
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 12 }}
                      className={`relative inline-flex p-4 rounded-2xl bg-gradient-to-br ${stat.colorClass} shadow-lg ring-1 ring-black/5`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </motion.div>
                  </div>
                  <div className="space-y-1 text-center">
                    <h3 className="text-3xl md:text-4xl font-black text-[var(--up-text)] tracking-tight">
                      <AnimatedCounter value={stat.value} duration={2} />
                    </h3>
                    <p className="text-xs font-bold text-[var(--up-text-muted)] uppercase tracking-[0.15em] py-1">
                      {stat.label}
                    </p>
                  </div>
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-[var(--up-border)] rounded-full group-hover:w-20 group-hover:bg-[var(--up-accent)]/50 transition-all duration-500" />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}