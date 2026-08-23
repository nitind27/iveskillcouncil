"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter,
  FiLinkedin, FiInstagram, FiYoutube, FiUser, FiArrowRight,
} from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";

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

const TEAM = [
  { name: "Yashvantbhai Prajapati", role: "Managing Director", phone: "9824817111" },
  { name: "Sonali Prajapati", role: "Chief Executive Officer", phone: "9689271627" },
  { name: "Rajendra Sandanshiv", role: "Executive Director", phone: "9638019997" },
];

const FIXED_CONTACT = {
  helpline: "9925222523",
  address: "Shivaji Nagar, Fort-Songadh, Dist-Tapi, Gujarat - 394670",
  cin: "U88900GJ2026NPL175855",
  email: "iveskillcouncil@gmail.com",
};

interface UserPanelFooterProps {
  config: UserPanelConfig;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-5 text-sm font-bold uppercase tracking-[0.16em] text-white">
      {children}
      <span className="mt-2 block h-[2px] w-10 rounded-full bg-[#C4A35A]" />
    </h4>
  );
}

export default function UserPanelFooter({ config }: UserPanelFooterProps) {
  const { site, footer } = config;

  return (
    <footer id="contact" className="relative overflow-hidden bg-[#070F1C]">
      <div className="h-[3px] bg-gradient-to-r from-[#163A6B] via-[#C4A35A] to-[#1E4A85]" />
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#1E4A85]/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-[#C4A35A]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-5"
          >
            <div>
              {site.logoUrl ? (
                <img
                  src={site.logoUrl}
                  alt={site.name}
                  className="h-14 w-auto max-w-[180px] object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E4A85] text-xl font-bold text-white">
                    {site.logoLetter}
                  </span>
                  <span className="text-lg font-bold text-white">{site.name}</span>
                </div>
              )}
            </div>
            <p className="text-sm leading-relaxed text-white/65">{footer.tagline}</p>
            <div className="inline-flex rounded-lg border border-[#C4A35A]/25 bg-[#C4A35A]/10 px-3 py-2">
              <p className="text-[11px] leading-snug text-white/70">
                <span className="font-semibold text-[#C4A35A]">CIN</span>
                <span className="mt-0.5 block font-mono text-white/80">{FIXED_CONTACT.cin}</span>
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              {(footer.social || []).map((s) => {
                const Icon = SOCIAL_ICONS[s.iconKey] || FiFacebook;
                return (
                  <a
                    key={s.iconKey}
                    href={s.href}
                    aria-label={s.label || s.iconKey}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-all hover:-translate-y-0.5 hover:border-[#C4A35A]/40 hover:bg-[#1E4A85] hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
          >
            <SectionTitle>Quick Links</SectionTitle>
            <ul className="space-y-2.5">
              {(footer.quickLinks || []).map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={quickLinkHref(link.href)}
                    className="group inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-[#C4A35A]"
                  >
                    <FiArrowRight className="h-3.5 w-3.5 text-[#C4A35A] opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                    <span className="transition-transform group-hover:translate-x-0.5">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16 }}
          >
            <SectionTitle>Our Team</SectionTitle>
            <ul className="space-y-3">
              {TEAM.map((member) => (
                <li key={member.name} className="rounded-xl border border-white/8 bg-white/[0.04] p-3 transition-colors hover:border-[#C4A35A]/25 hover:bg-white/[0.06]">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1E4A85]/40 text-[#C4A35A]">
                      <FiUser className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight text-white">{member.name}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-[#C4A35A]">{member.role}</p>
                      <a
                        href={`tel:${member.phone}`}
                        className="mt-1 inline-flex items-center gap-1.5 text-xs text-white/55 transition-colors hover:text-white"
                      >
                        <FiPhone className="h-3 w-3" />
                        {member.phone}
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.24 }}
          >
            <SectionTitle>Contact Us</SectionTitle>
            <ul className="space-y-3">
              <li className="rounded-xl border border-white/8 bg-white/[0.04] p-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#C4A35A]/15 text-[#C4A35A]">
                    <FiPhone className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Help Line</p>
                    <a href={`tel:${FIXED_CONTACT.helpline}`} className="text-sm font-semibold text-white transition-colors hover:text-[#C4A35A]">
                      {FIXED_CONTACT.helpline}
                    </a>
                  </div>
                </div>
              </li>
              <li className="rounded-xl border border-white/8 bg-white/[0.04] p-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1E4A85]/40 text-[#C4A35A]">
                    <FiMail className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Email</p>
                    <a href={`mailto:${FIXED_CONTACT.email}`} className="break-all text-sm font-semibold text-white transition-colors hover:text-[#C4A35A]">
                      {FIXED_CONTACT.email}
                    </a>
                  </div>
                </div>
              </li>
              <li className="rounded-xl border border-white/8 bg-white/[0.04] p-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#1E4A85]/40 text-[#C4A35A]">
                    <FiMapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Office Address</p>
                    <p className="text-sm leading-relaxed text-white/80">{FIXED_CONTACT.address}</p>
                  </div>
                </div>
              </li>
            </ul>
          </motion.div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-center text-xs text-white/45 sm:text-left">
            © {new Date().getFullYear()} <span className="font-semibold text-white/70">{site.name}</span>. {footer.copyrightText}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/45">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C4A35A]" />
              All services operational
            </span>
            <span className="hidden sm:inline text-white/20">|</span>
            <span>CIN {FIXED_CONTACT.cin}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
