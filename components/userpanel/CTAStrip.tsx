"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { FiSend, FiArrowRight, FiCheck } from "react-icons/fi";
import { FaGraduationCap } from "react-icons/fa";
import { useUserPanelHref } from "@/hooks/useUserPanelBasePath";
import { upButton } from "./ui/button";
import Reveal from "./ui/Reveal";
import Magnetic from "./ui/Magnetic";
import FlagWave from "./ui/FlagWave";

const perks = ["Course updates", "Exclusive offers", "Learning tips", "No spam, ever"];

function FlowLines({ animate }: { animate: boolean }) {
  const paths = [
    "M-50 140 C 250 40, 450 220, 750 110 S 1250 30, 1500 120",
    "M-50 190 C 300 110, 500 260, 820 160 S 1300 90, 1500 180",
  ];
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1440 280" preserveAspectRatio="none" aria-hidden>
      {paths.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke={i === 0 ? "rgba(255,133,0,0.35)" : "rgba(255,255,255,0.12)"}
          strokeWidth={1.5}
          initial={{ pathLength: animate ? 0 : 1 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2.4, delay: i * 0.3, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}

export default function CTAStrip() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const up = useUserPanelHref();
  const reduce = useReducedMotion();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-r from-ive-navy via-ive-navy-2 to-ive-royal px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="up-grid-pattern pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <FlowLines animate={!reduce} />
      <FlagWave tone="dark" rotate={-6} opacity={0.16} className="-right-40 top-1/2 w-[620px] -translate-y-1/2 sm:w-[760px] lg:-right-24 lg:w-[880px]" />
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-ive-saffron/15 blur-[100px]" aria-hidden />
      <div className="up-tricolor absolute inset-x-0 top-0 h-[3px]" aria-hidden />

      <Reveal className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[auto_1fr_minmax(0,460px)] lg:gap-12">
        <div className="relative mx-auto flex h-28 w-28 items-center justify-center lg:mx-0" aria-hidden>
          <span className="absolute inset-0 rounded-full border border-white/15" />
          <span className="absolute inset-3 rounded-full border border-dashed border-ive-saffron/40 up-spin-slow" />
          <span className="up-float flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-ive-saffron to-ive-saffron-dark text-white shadow-[0_16px_40px_-10px_rgba(255,133,0,0.8)]">
            <FaGraduationCap className="h-8 w-8" />
          </span>
        </div>

        <div className="text-center lg:text-left">
          <h2 className="text-[1.65rem] font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
            Start Your <span className="text-ive-saffron">Learning Journey</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/70 lg:mx-0">
            Get course updates, exclusive offers and learning tips. Stay connected with IVESDC — no spam, ever.
          </p>
          <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 lg:justify-start">
            {perks.map((perk) => (
              <li key={perk} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80">
                <FiCheck className="h-3.5 w-3.5 text-[#3DDC97]" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full">
          {submitted ? (
            <motion.div
              initial={{ scale: reduce ? 1 : 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              role="status"
              className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur"
            >
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-ive-emerald text-white">
                <FiCheck className="h-6 w-6" />
              </span>
              <span>
                <span className="block font-bold text-white">You&apos;re subscribed</span>
                <span className="block text-sm text-white/65">We&apos;ll send useful updates to your inbox.</span>
              </span>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)] md:flex-row">
              <label htmlFor="cta-email" className="sr-only">Email address</label>
              <input
                id="cta-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                autoComplete="email"
                className="min-w-0 flex-1 rounded-xl px-4 py-3 text-sm text-ive-ink placeholder:text-ive-slate/70 focus:outline-none focus:ring-2 focus:ring-ive-royal/20"
              />
              <button type="submit" className={upButton("navy", "lg", "w-full flex-shrink-0 md:w-auto")}>
                Subscribe
                <FiSend className="h-4 w-4" />
              </button>
            </form>
          )}
          <div className="mt-4 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-start">
            <Magnetic className="w-full sm:w-auto">
              <Link href={up("/userpanel/courses")} className={upButton("primary", "lg", "w-full sm:w-auto")}>
                Apply Now
                <FiArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
            </Magnetic>
            <Link href={up("/userpanel/franchise-plans")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80 transition-colors hover:text-white">
              Franchise Plans
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
