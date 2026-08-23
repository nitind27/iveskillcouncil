"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { GraduationCap, Check } from "lucide-react";

const FEATURES = [
  "Franchise & branch management",
  "Student records & tracking",
  "Courses, fees & certificates",
  "Career placement services",
  "Online exams & certifications",
  "Reports & analytics",
] as const;

type LoginBrandPanelProps = {
  logoUrl?: string | null;
  siteName: string;
  tagline?: string | null;
};

export default function LoginBrandPanel({
  logoUrl,
  siteName,
  tagline,
}: LoginBrandPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 80, damping: 24 });
  const sy = useSpring(my, { stiffness: 80, damping: 24 });
  const logoRotateY = useTransform(sx, [-0.5, 0.5], [14, -14]);
  const logoRotateX = useTransform(sy, [-0.5, 0.5], [-10, 10]);
  const glowX = useTransform(sx, [-0.5, 0.5], ["35%", "65%"]);
  const glowY = useTransform(sy, [-0.5, 0.5], ["30%", "55%"]);

  return (
    <div
      ref={panelRef}
      className="login-brand-panel relative flex flex-col justify-center overflow-hidden px-6 py-10 sm:px-10 lg:min-h-screen lg:px-12 lg:py-14 xl:px-16"
      onMouseMove={(e) => {
        if (!panelRef.current) return;
        const r = panelRef.current.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <div className="login-brand-glow pointer-events-none absolute inset-0" />
      <motion.div
        style={{ left: glowX, top: glowY }}
        className="pointer-events-none absolute h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1E4A85]/30 blur-3xl"
      />
      <div className="pointer-events-none absolute bottom-8 right-4 h-40 w-40 rounded-full bg-[#C4A35A]/12 blur-3xl" />

      <div className="relative z-10 w-full max-w-[560px] lg:max-w-none">
        {/* 3D logo entrance */}
        <motion.div
          initial={{ opacity: 0, y: 36, rotateX: 22, scale: 0.88 }}
          animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="login-brand-logo-scene mb-7 sm:mb-8"
        >
          <motion.div
            style={{
              rotateY: logoRotateY,
              rotateX: logoRotateX,
              transformStyle: "preserve-3d",
            }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            className="login-brand-logo-box inline-block origin-center"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={siteName}
                className="login-brand-logo h-auto w-full max-w-[240px] object-contain sm:max-w-[280px] lg:max-w-[320px] xl:max-w-[360px]"
              />
            ) : (
              <div className="flex h-[140px] w-[140px] items-center justify-center rounded-2xl bg-white/10 sm:h-[160px] sm:w-[160px] lg:h-[180px] lg:w-[180px]">
                <GraduationCap className="h-16 w-16 text-white lg:h-20 lg:w-20" />
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* title block */}
        <motion.div
          initial={{ opacity: 0, y: 28, rotateX: 10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <h1 className="text-[1.75rem] font-extrabold tracking-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
            {siteName}
          </h1>
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.55, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="login-brand-divider my-4 h-[2px] w-20 origin-left rounded-full"
          />
          <p className="max-w-md text-sm leading-relaxed text-white/70 sm:text-[15px] sm:leading-7">
            {tagline ||
              "Quality education for everyone. Courses, certifications, and franchise opportunities."}
          </p>
        </motion.div>

        {/* feature grid — 3D stagger */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.42 } },
          }}
          className="mt-8 grid grid-cols-1 gap-2.5 sm:mt-10 sm:grid-cols-2 sm:gap-3"
        >
          {FEATURES.map((item, i) => (
            <motion.div
              key={item}
              variants={{
                hidden: { opacity: 0, y: 22, rotateX: 14, scale: 0.96 },
                show: {
                  opacity: 1,
                  y: 0,
                  rotateX: 0,
                  scale: 1,
                  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              whileHover={{
                y: -5,
                rotateX: 5,
                rotateY: i % 2 === 0 ? -3 : 3,
                scale: 1.02,
                transition: { duration: 0.22 },
              }}
              className="login-feature-pill login-feature-pill-3d flex items-center gap-2.5 rounded-xl px-3.5 py-3"
              style={{ transformStyle: "preserve-3d" }}
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#C4A35A]/20">
                <Check className="h-3.5 w-3.5 text-[#C4A35A]" strokeWidth={3} />
              </span>
              <span className="text-xs font-medium leading-snug text-white/88 sm:text-[13px]">
                {item}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
