"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import {
  FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter, FiLinkedin, FiInstagram, FiYoutube,
  FiArrowUp, FiShield, FiChevronRight, FiChevronLeft, FiArrowUpRight,
} from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";
import { useUserPanelHref } from "@/hooks/useUserPanelBasePath";
import { COUNCIL, COUNCIL_TEAM } from "./ui/council";
import FlagWave from "./ui/FlagWave";
import Reveal from "./ui/Reveal";

function quickLinkHref(href: string): string {
  if (href === "#home" || href === "/" || href === "") return "/userpanel";
  if (href === "#courses") return "/userpanel/courses";
  if (href.startsWith("#")) return `/userpanel${href}`;
  return href;
}

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: FiFacebook,
  twitter: FiTwitter,
  linkedin: FiLinkedin,
  instagram: FiInstagram,
  youtube: FiYoutube,
};

const STUDENT_ZONE = [
  { label: "Student Login", href: "/login?as=student", external: true },
  { label: "Verify Certificate", href: "/verify", external: true },
  { label: "All Courses", href: "/userpanel/courses" },
  { label: "Current Offers", href: "/userpanel#offers" },
  { label: "Apply for Franchise", href: "/userpanel/apply-franchise" },
];

interface UserPanelFooterProps {
  config: UserPanelConfig;
}

function ColumnTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-5 text-[13px] font-bold uppercase tracking-[0.16em] text-white">
      {children}
      <span className="mt-2.5 flex gap-1" aria-hidden>
        <span className="h-[3px] w-7 rounded-full bg-ive-saffron" />
        <span className="h-[3px] w-2 rounded-full bg-white/70" />
        <span className="h-[3px] w-3.5 rounded-full bg-ive-emerald" />
      </span>
    </h4>
  );
}

const linkClass = "group inline-flex items-center gap-2 text-sm text-white/70 transition-colors duration-300 hover:text-white";

function LeadershipCarousel() {
  const reduce = useReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(1);
  const team = [...COUNCIL_TEAM];
  const n = team.length;
  const maxIndex = Math.max(n - visible, 0);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const apply = () => {
      const w = el.clientWidth;
      setVisible(w >= 1024 ? Math.min(3, n) : w >= 640 ? Math.min(2, n) : 1);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [n]);

  useEffect(() => {
    if (index > maxIndex) setIndex(0);
  }, [index, maxIndex]);

  useEffect(() => {
    if (reduce || paused || maxIndex === 0) return;
    const id = window.setInterval(() => setIndex((i) => (i >= maxIndex ? 0 : i + 1)), 3200);
    return () => window.clearInterval(id);
  }, [reduce, paused, maxIndex]);

  const step = (dir: number) => {
    if (maxIndex === 0) return;
    setIndex((i) => {
      const next = i + dir;
      if (next > maxIndex) return 0;
      if (next < 0) return maxIndex;
      return next;
    });
  };

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="mb-3 flex justify-end gap-2">
        <button
          type="button"
          aria-label="Previous leader"
          onClick={() => step(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/15"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Next leader"
          onClick={() => step(1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-ive-saffron text-white transition hover:bg-[#E67600]"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div ref={frameRef} className="overflow-hidden">
        <motion.ul
          className="flex"
          style={{ width: `${(n / visible) * 100}%` }}
          animate={{ x: `${maxIndex === 0 ? 0 : (-index * 100) / n}%` }}
          transition={reduce ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {team.map((member) => (
            <li
              key={member.name}
              style={{ width: `${100 / n}%` }}
              className="px-2"
            >
              <div className="flex h-full items-center gap-4 rounded-2xl border border-white/10 bg-[#08203f]/80 px-4 py-4 shadow-[0_18px_36px_-26px_rgba(0,0,0,0.85)] transition duration-300 hover:-translate-y-1 hover:border-ive-saffron/40 hover:bg-[#0c2c56] hover:shadow-[0_22px_40px_-22px_rgba(255,133,0,0.35)]">
              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ive-saffron via-white to-ive-emerald p-[2px]">
                <span className="relative block h-full w-full overflow-hidden rounded-full bg-[#0B2A52]">
                  <Image
                    src={member.photo}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover object-[center_22%]"
                  />
                </span>
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-snug text-white">{member.name}</span>
                <span className="mt-1 block text-[12px] font-medium leading-snug text-ive-saffron">{member.role}</span>
                {member.phone ? (
                  <a href={`tel:${member.phone}`} className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white">
                    <FiPhone className="h-3 w-3" />
                    {member.phone}
                  </a>
                ) : null}
              </span>
            </div>
            </li>
          ))}
        </motion.ul>
      </div>
    </div>
  );
}

export default function UserPanelFooter({ config }: UserPanelFooterProps) {
  const up = useUserPanelHref();
  const { site, footer } = config;
  const mapQuery = encodeURIComponent(COUNCIL.address);
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <footer id="contact" className="relative overflow-hidden bg-ive-navy text-white shadow-[0_-48px_80px_-36px_rgba(6,27,54,0.72)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_0%,rgba(255,133,0,0.18),transparent_36%),radial-gradient(ellipse_at_88%_8%,rgba(18,78,150,0.55),transparent_42%),radial-gradient(ellipse_at_50%_100%,rgba(21,154,112,0.16),transparent_38%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0B2A52] via-[#061B36] to-[#04122A]" aria-hidden />
      <div className="up-grid-pattern pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <FlagWave tone="dark" rotate={-8} opacity={0.16} className="-left-40 -top-16 w-[560px]" />
      <FlagWave tone="dark" rotate={10} opacity={0.12} className="-right-32 bottom-10 w-[480px]" />
      <img
        src="/assets/home/login-skyline.jpg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-48 w-full object-cover opacity-[0.1] [mask-image:linear-gradient(to_top,#000,transparent)]"
      />

      <svg className="pointer-events-none absolute -top-px left-0 h-14 w-full text-[#FF8500]/20" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden>
        <path d="M0 40C240 8 480 70 760 42S1200 0 1440 36V0H0Z" fill="currentColor" />
      </svg>
      <svg className="pointer-events-none absolute right-0 top-0 h-28 w-44 text-ive-emerald/25" viewBox="0 0 160 96" aria-hidden>
        <path d="M160 0C90 8 40 40 20 96h140Z" fill="currentColor" />
      </svg>

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 sm:pt-20 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-0">
          <Reveal className="space-y-5 sm:col-span-2 lg:col-span-4 lg:pr-8">
            <div className="flex items-center gap-3">
              <span className="flex shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
                {site.logoUrl ? (
                  <img
                    src={site.logoUrl}
                    alt={site.name}
                    loading="lazy"
                    className="h-12 w-auto max-w-[128px] object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ive-navy text-xl font-bold text-white">{site.logoLetter}</span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-extrabold leading-tight">{site.name}</span>
                <span className="mt-0.5 block max-w-[240px] text-[10px] font-semibold uppercase leading-snug tracking-wider text-white/55">
                  {COUNCIL.fullName}
                </span>
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/65">{footer.tagline}</p>
            <p className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/75">
              <FiShield className="h-3.5 w-3.5 text-ive-emerald" />
              CIN: <span className="font-mono">{COUNCIL.cin}</span>
            </p>
            {(footer.social || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(footer.social || []).map((s) => {
                  const Icon = SOCIAL_ICONS[s.iconKey] || FiFacebook;
                  return (
                    <a
                      key={s.iconKey}
                      href={s.href}
                      aria-label={s.label || s.iconKey}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition-all duration-300 hover:-translate-y-1 hover:border-ive-saffron hover:bg-ive-saffron hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </Reveal>

          <Reveal delay={0.06} className="lg:col-span-2 lg:border-l lg:border-white/10 lg:px-6">
            <ColumnTitle>Quick Links</ColumnTitle>
            <ul className="space-y-3">
              {(footer.quickLinks || []).map((link) => (
                <li key={link.href + link.label}>
                  <Link href={up(quickLinkHref(link.href))} className={linkClass}>
                    <FiChevronRight className="h-3.5 w-3.5 text-ive-saffron transition-transform group-hover:translate-x-0.5" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-3 lg:border-l lg:border-white/10 lg:px-6">
            <ColumnTitle>Student Zone</ColumnTitle>
            <ul className="space-y-3">
              {STUDENT_ZONE.map((link) => (
                <li key={link.label}>
                  <Link href={link.external ? link.href : up(link.href)} className={linkClass}>
                    <FiChevronRight className="h-3.5 w-3.5 text-ive-saffron transition-transform group-hover:translate-x-0.5" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.14} className="sm:col-span-2 lg:col-span-3 lg:border-l lg:border-white/10 lg:pl-6">
            <ColumnTitle>Contact Us</ColumnTitle>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-3">
                <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-ive-saffron" />
                <span className="leading-relaxed text-white/75">{COUNCIL.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="h-4 w-4 shrink-0 text-ive-saffron" />
                <a href={`tel:${COUNCIL.helpline}`} className="font-semibold text-white hover:text-ive-saffron">
                  +91 {COUNCIL.helpline}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="h-4 w-4 shrink-0 text-ive-saffron" />
                <a href={`mailto:${COUNCIL.email}`} className="break-all text-white/75 hover:text-white">{COUNCIL.email}</a>
              </li>
            </ul>
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative mt-5 block overflow-hidden rounded-2xl border border-white/15 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.75)]"
            >
              <iframe
                title="IVESDC location"
                src={`https://maps.google.com/maps?q=${mapQuery}&z=14&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="pointer-events-none h-36 w-full border-0 grayscale-[20%]"
              />
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-[#041530] to-transparent px-3 pb-2 pt-8 text-xs font-bold">
                <span>Our Location</span>
                <span className="inline-flex items-center gap-1 text-ive-saffron">
                  View on Maps <FiArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </span>
            </a>
          </Reveal>
        </div>

        <Reveal className="up-gradient-border relative mt-12 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#071a33]/75 p-4 shadow-[0_30px_70px_-34px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-ive-saffron">Our Leadership Team</p>
              <p className="mt-1 max-w-md text-sm text-white/60">Guiding {COUNCIL.shortName} towards a skilled and brighter India.</p>
            </div>
          </div>
          <LeadershipCarousel />
        </Reveal>

        <a
          href="https://codeatinfotech.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-6 flex flex-col items-center gap-4 rounded-[1.4rem] border border-white/10 bg-gradient-to-r from-white/[0.06] via-[#0B2A52]/50 to-ive-emerald/[0.08] p-4 shadow-[0_24px_50px_-30px_rgba(18,78,150,0.85)] transition-colors hover:border-white/20 sm:flex-row sm:gap-6 sm:p-5"
        >
          <Image
            src="/brand/codeat-wordmark.png"
            alt="Codeat Infotech"
            width={582}
            height={196}
            className="h-14 w-auto shrink-0 drop-shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
          />
          <span className="min-w-0 text-center sm:text-left">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Website managed by</span>
            <span className="mt-1 block text-lg font-extrabold text-white">Codeat Infotech</span>
            <span className="mt-0.5 block text-sm text-white/60">This website is designed, developed and managed by Codeat Infotech.</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-ive-saffron sm:ml-auto">
            codeatinfotech.com
            <FiArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </a>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-5 sm:flex-row">
          <p className="text-center text-xs text-white/45 sm:text-left">
            © {new Date().getFullYear()} <span className="font-semibold text-white/75">{site.name}</span>. {footer.copyrightText}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/50">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ive-emerald" />
              All services operational
            </span>
            <span className="hidden text-white/20 sm:inline">|</span>
            <span className="italic text-white/60">{COUNCIL.motto}</span>
            <motion.button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Back to top"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.96 }}
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-ive-saffron text-white shadow-[0_8px_20px_-8px_rgba(255,133,0,0.9)]"
            >
              <FiArrowUp className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>
      <div className="up-tricolor h-1" aria-hidden />
    </footer>
  );
}
