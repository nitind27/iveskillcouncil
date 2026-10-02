"use client";

import Link from "next/link";
import {
  FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter, FiLinkedin, FiInstagram, FiYoutube,
  FiArrowUp, FiShield, FiChevronRight,
} from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";
import { useUserPanelHref } from "@/hooks/useUserPanelBasePath";
import { COUNCIL, COUNCIL_TEAM } from "./ui/council";
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
  { label: "Student Login", href: "/login", external: true },
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
    <h4 className="mb-5 text-sm font-bold uppercase tracking-[0.14em] text-white">
      {children}
      <span className="mt-2.5 flex gap-1" aria-hidden>
        <span className="h-[3px] w-6 rounded-full bg-ive-saffron" />
        <span className="h-[3px] w-2 rounded-full bg-white/60" />
        <span className="h-[3px] w-3 rounded-full bg-ive-emerald" />
      </span>
    </h4>
  );
}

const linkClass = "group inline-flex items-center gap-1.5 text-sm text-white/65 transition-colors hover:text-white";

export default function UserPanelFooter({ config }: UserPanelFooterProps) {
  const up = useUserPanelHref();
  const { site, footer } = config;

  return (
    <footer id="contact" className="relative overflow-hidden bg-[#04132A] text-white">
      <div className="up-grid-pattern pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full border border-white/[0.05]" aria-hidden />
      <div className="pointer-events-none absolute -right-20 -top-20 h-[360px] w-[360px] rounded-full border border-white/[0.05]" aria-hidden />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-ive-royal/25 blur-[120px]" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 sm:pt-20 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <Reveal className="space-y-5 sm:col-span-2 lg:col-span-4">
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 rounded-2xl bg-white p-2 shadow-lg">
                {site.logoUrl ? (
                  <img
                    src={site.logoUrl}
                    alt={site.name}
                    loading="lazy"
                    className="h-12 w-auto max-w-[120px] object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ive-navy text-xl font-bold text-white">{site.logoLetter}</span>
                )}
              </span>
              <span>
                <span className="block text-lg font-extrabold leading-tight">{site.name}</span>
                <span className="mt-0.5 block max-w-[220px] text-[10px] font-semibold uppercase leading-snug tracking-wider text-white/55">
                  {COUNCIL.fullName}
                </span>
              </span>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/60">{footer.tagline}</p>
            <p className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70">
              <FiShield className="h-3.5 w-3.5 text-ive-emerald" />
              CIN: <span className="font-mono">{COUNCIL.cin}</span>
            </p>
            {(footer.social || []).length > 0 && (
              <div className="flex gap-2">
                {(footer.social || []).map((s) => {
                  const Icon = SOCIAL_ICONS[s.iconKey] || FiFacebook;
                  return (
                    <a
                      key={s.iconKey}
                      href={s.href}
                      aria-label={s.label || s.iconKey}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-all duration-300 hover:-translate-y-1 hover:border-ive-saffron hover:bg-ive-saffron hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </Reveal>

          <Reveal delay={0.06} className="lg:col-span-2">
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

          <Reveal delay={0.12} className="lg:col-span-2">
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

          <Reveal delay={0.18} className="sm:col-span-2 lg:col-span-4">
            <ColumnTitle>Contact Us</ColumnTitle>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <FiMapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-ive-saffron" />
                <span className="leading-relaxed text-white/75">{COUNCIL.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="h-4 w-4 flex-shrink-0 text-ive-saffron" />
                <span className="text-white/75">
                  Help Line:{" "}
                  <a href={`tel:${COUNCIL.helpline}`} className="font-semibold text-white hover:text-ive-saffron">+91 {COUNCIL.helpline}</a>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="h-4 w-4 flex-shrink-0 text-ive-saffron" />
                <a href={`mailto:${COUNCIL.email}`} className="break-all text-white/75 hover:text-white">{COUNCIL.email}</a>
              </li>
            </ul>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#FFB15C]">{COUNCIL.mission}</p>
          </Reveal>
        </div>

        <Reveal className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">Our Team</p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {COUNCIL_TEAM.map((member) => (
              <li key={member.name} className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-3 transition-colors hover:bg-white/[0.07]">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-ive-royal/50 text-sm font-bold text-white">
                  {member.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{member.name}</span>
                  <span className="block text-[11px] font-medium text-ive-saffron">{member.role}</span>
                  <a href={`tel:${member.phone}`} className="inline-flex items-center gap-1 text-xs text-white/55 hover:text-white">
                    <FiPhone className="h-3 w-3" />
                    {member.phone}
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-center text-xs text-white/45 sm:text-left">
            © {new Date().getFullYear()} <span className="font-semibold text-white/70">{site.name}</span>. {footer.copyrightText}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/45">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-ive-emerald" />
              All services operational
            </span>
            <span className="hidden text-white/20 sm:inline">|</span>
            <span className="italic text-white/55">{COUNCIL.motto}</span>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Back to top"
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-ive-saffron text-white transition-transform hover:-translate-y-0.5"
            >
              <FiArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="up-tricolor h-1" aria-hidden />
    </footer>
  );
}
