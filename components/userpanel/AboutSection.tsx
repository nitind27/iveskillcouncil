"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiArrowRight, FiCheckCircle, FiAward, FiUsers } from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";

function aboutButtonHref(href: string): string {
  if (href.startsWith("#")) return `/userpanel${href}`;
  return href;
}

interface AboutSectionProps {
  config: UserPanelConfig;
}

export default function AboutSection({ config }: AboutSectionProps) {
  const { about } = config;

  // Animation variants for staggered children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  return (
    <section id="about" className="relative py-24 px-4 overflow-hidden bg-[var(--up-bg-muted)] panel-perspective">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--up-accent)]/[0.06] blur-[120px] rounded-full -z-10 animate-float-slow" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-[var(--up-accent)]/[0.05] blur-[100px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid lg:grid-cols-12 gap-12 items-start"
        >
          <div className="lg:col-span-5 space-y-6 panel-3d">
            <motion.div
              variants={itemVariants}
              className="relative group"
              whileHover="visible"
            >
              <div className="absolute -inset-1 bg-[var(--up-accent)]/20 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition duration-700" />
              <motion.div
                whileHover={{ rotateY: -8, rotateX: 5 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="relative aspect-square rounded-2xl overflow-hidden border border-[var(--up-border)] shadow-xl panel-3d"
              >
                <img
                  src={about.image}
                  alt={about.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <motion.div whileHover={{ y: -4 }} className="p-5 rounded-2xl bg-[var(--up-bg-card)] border border-[var(--up-border)]">
                <FiUsers className="text-[var(--up-accent)] mb-2 text-xl" />
                <div className="text-2xl font-bold text-[var(--up-text)]">10k+</div>
                <div className="text-xs text-[var(--up-text-muted)] uppercase tracking-widest">Happy Users</div>
              </motion.div>
              <motion.div whileHover={{ y: -4 }} className="p-5 rounded-2xl bg-[var(--up-bg-card)] border border-[var(--up-border)]">
                <FiAward className="text-purple-600 mb-2 text-xl" />
                <div className="text-2xl font-bold text-[var(--up-text)]">15+</div>
                <div className="text-xs text-[var(--up-text-muted)] uppercase tracking-widest">Global Awards</div>
              </motion.div>
            </motion.div>
          </div>

          <div className="lg:col-span-7 lg:pl-8">
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--up-accent)]/10 border border-[var(--up-accent)]/20 text-[var(--up-accent)] text-xs font-bold uppercase tracking-widest mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--up-accent)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--up-accent)]"></span>
                </span>
                Our Story
              </span>
              
              <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--up-text)] mb-6 leading-tight">
                {about.title}
              </h2>
              
              <p className="text-[var(--up-text-muted)] leading-relaxed mb-8 text-lg">
                {about.description}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {[
                  "Innovative Solutions",
                  "24/7 Expert Support",
                  "Security First Mindset",
                  "Scalable Infrastructure"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-[var(--up-text-muted)]">
                    <FiCheckCircle className="text-[var(--up-accent)] flex-shrink-0" />
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href={aboutButtonHref(about.buttonHref)}>
                  <motion.span
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px -12px rgba(29, 78, 216, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--up-accent)] font-bold text-white shadow-lg border border-[var(--up-border-strong)] transition-all"
                  >
                    {about.buttonLabel}
                    <FiArrowRight className="w-5 h-5" />
                  </motion.span>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-4 rounded-full bg-[var(--up-bg-card)] border border-[var(--up-border)] text-[var(--up-text)] font-medium hover:border-[var(--up-border-strong)] transition-all"
                >
                  View Roadmap
                </motion.button>
              </div>
            </motion.div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}