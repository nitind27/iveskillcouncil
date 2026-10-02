"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  BarChart3,
  BookOpenCheck,
  Briefcase,
  Building2,
  ChevronRight,
  GraduationCap,
  MonitorCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TONES = {
  royal: "bg-ive-royal/10 text-ive-royal",
  emerald: "bg-ive-emerald/10 text-ive-emerald",
  saffron: "bg-ive-saffron/10 text-ive-saffron-dark",
} as const;

const FEATURES: { title: string; icon: LucideIcon; tone: keyof typeof TONES }[] = [
  { title: "Franchise & Branch Management", icon: Building2, tone: "royal" },
  { title: "Student Records & Tracking", icon: UsersRound, tone: "saffron" },
  { title: "Courses, Fees & Certificates", icon: BookOpenCheck, tone: "royal" },
  { title: "Career Placement Services", icon: Briefcase, tone: "emerald" },
  { title: "Online Exams & Certifications", icon: MonitorCheck, tone: "royal" },
  { title: "Reports & Analytics", icon: BarChart3, tone: "royal" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

type LoginBrandHeroProps = {
  logoUrl?: string | null;
  siteName: string;
  tagline?: string | null;
};

export function LoginBrandHero({ logoUrl, siteName, tagline }: LoginBrandHeroProps) {
  const reduce = useReducedMotion();
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.09 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="flex h-[4.25rem] items-center sm:h-20 lg:h-[var(--login-logo)]">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={siteName}
            className="h-full w-auto max-w-[min(20rem,62vw)] object-contain object-left drop-shadow-[0_8px_16px_rgba(6,27,54,0.14)] transition-[height] duration-300 ease-out"
          />
        ) : (
          <span className="flex h-full items-center gap-3">
            <span className="flex aspect-square h-full items-center justify-center rounded-2xl bg-ive-navy text-white">
              <GraduationCap className="h-1/2 w-1/2" />
            </span>
            <span className="text-xl font-extrabold text-ive-navy">{siteName}</span>
          </span>
        )}
      </motion.div>

      <motion.span variants={item} className="mt-[clamp(1rem,2.2vh,2rem)] block h-1 w-12 rounded-full bg-ive-saffron" aria-hidden />

      <motion.h1
        variants={item}
        className="mt-[clamp(0.7rem,1.5vh,1.15rem)] text-[2.05rem] font-extrabold leading-[1.08] tracking-tight text-ive-navy [font-family:var(--font-jakarta)] sm:text-[2.45rem] lg:text-[length:var(--login-title)]"
      >
        Quality Education
        <br />
        for a{" "}
        <span className="bg-gradient-to-r from-[#FF9A1F] via-ive-saffron to-[#E2560B] bg-clip-text text-transparent">
          Stronger India
        </span>
      </motion.h1>

      <motion.p variants={item} className="mt-[clamp(0.6rem,1.3vh,1rem)] max-w-md text-[15px] leading-relaxed text-ive-slate sm:text-base">
        {tagline || "Quality education for everyone. Courses, certifications, and franchise opportunities."}
      </motion.p>
    </motion.div>
  );
}

export function LoginFeatureGrid() {
  const reduce = useReducedMotion();
  const grid: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.07, delayChildren: reduce ? 0 : 0.4 } },
  };
  const card: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  };

  return (
    <motion.ul
      variants={grid}
      initial="hidden"
      animate="show"
      className="grid max-w-[min(40rem,100%)] grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:gap-[clamp(0.55rem,1.1vh,0.85rem)]"
    >
      {FEATURES.map(({ title, icon: Icon, tone }) => (
        <motion.li
          key={title}
          variants={card}
          whileHover={reduce ? undefined : { y: -3, transition: { duration: 0.22 } }}
          className="group flex items-center gap-3 rounded-2xl border border-white bg-white/85 py-[clamp(0.45rem,1vh,0.7rem)] pl-2.5 pr-3 shadow-[0_10px_28px_-16px_rgba(6,27,54,0.35)] ring-1 ring-[#DCE6F3]/80 backdrop-blur-md transition-[transform,box-shadow] duration-300 hover:shadow-[0_18px_36px_-18px_rgba(18,78,150,0.5)]"
        >
          <span className={cn("flex h-[clamp(2.25rem,4.4vh,2.75rem)] w-[clamp(2.25rem,4.4vh,2.75rem)] shrink-0 items-center justify-center rounded-xl", TONES[tone])}>
            <Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-ive-navy">{title}</span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#DCE6F3] bg-white text-ive-navy transition-colors duration-300 group-hover:border-ive-saffron/40 group-hover:bg-ive-saffron group-hover:text-white">
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </motion.li>
      ))}
    </motion.ul>
  );
}
