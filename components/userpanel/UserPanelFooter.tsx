"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter,
  FiLinkedin, FiInstagram, FiYoutube, FiUser, FiHash,
} from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";

function quickLinkHref(href: string): string {
  if (href === "#home" || href === "/" || href === "") return "/userpanel";
  if (href === "#courses") return "/userpanel/courses";
  if (href.startsWith("#")) return `/userpanel${href}`;
  return href;
}

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook:  FiFacebook,
  twitter:   FiTwitter,
  linkedin:  FiLinkedin,
  instagram: FiInstagram,
  youtube:   FiYoutube,
};

// ── Fixed IVESDC team data ────────────────────────────────────────────────────
const TEAM = [
  { name: "Yashvantbhai Prajapati", role: "Managing Director",   phone: "9824817111" },
  { name: "Sonali Prajapati",       role: "Chief Executive Officer", phone: "9689271627" },
  { name: "Rajendra Sandanshiv",    role: "Executive Director",  phone: "9638019997" },
];

const FIXED_CONTACT = {
  helpline: "9925222523",
  address:  "Shivaji Nagar, Fort-Songadh, Dist-Tapi, Gujarat - 394670",
  cin:      "U88900GJ2026NPL175855",
  email:    "iveskillcouncil@gmail.com",
};

interface UserPanelFooterProps {
  config: UserPanelConfig;
}

export default function UserPanelFooter({ config }: UserPanelFooterProps) {
  const { site, footer } = config;

  return (
    <footer id="contact" className="relative bg-[#1A1A1A] overflow-hidden">
      {/* top accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#2D5DA8] via-[#A8C63A] to-[#F39C12]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-10 mb-12">

          {/* ── Col 1: Brand ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-5"
          >
            {/* Logo */}
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
                  <span className="w-12 h-12 rounded-xl bg-[#2D5DA8] flex items-center justify-center font-bold text-xl text-white">
                    {site.logoLetter}
                  </span>
                  <span className="font-bold text-lg text-white">{site.name}</span>
                </div>
              )}
            </div>
            <p className="text-white/60 text-sm leading-relaxed">{footer.tagline}</p>

            {/* CIN */}
            <div className="flex items-start gap-2 text-xs text-white/50">
              <FiHash className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[#A8C63A]" />
              <span>CIN: <span className="text-white/70 font-mono">{FIXED_CONTACT.cin}</span></span>
            </div>

            {/* Social */}
            <div className="flex gap-2 pt-1">
              {(footer.social || []).map((s) => {
                const Icon = SOCIAL_ICONS[s.iconKey] || FiFacebook;
                return (
                  <motion.a
                    key={s.iconKey}
                    href={s.href}
                    whileHover={{ scale: 1.12, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-[#2D5DA8] text-white/60 hover:text-white transition-all border border-white/10"
                  >
                    <Icon className="w-4 h-4" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* ── Col 2: Quick Links ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-widest">Quick Links</h4>
            <ul className="space-y-2.5">
              {(footer.quickLinks || []).map((link) => (
                <li key={link.href + link.label}>
                  <Link href={quickLinkHref(link.href)}>
                    <motion.span
                      whileHover={{ x: 5 }}
                      className="inline-flex items-center gap-2 text-white/60 hover:text-[#A8C63A] text-sm transition-colors cursor-pointer"
                    >
                      <span className="w-1 h-1 rounded-full bg-[#2D5DA8] flex-shrink-0" />
                      {link.label}
                    </motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* ── Col 3: Team ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-widest">Our Team</h4>
            <ul className="space-y-4">
              {TEAM.map((member) => (
                <li key={member.name} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#2D5DA8]/30 border border-[#2D5DA8]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiUser className="w-3.5 h-3.5 text-[#2D5DA8]" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">{member.name}</p>
                    <p className="text-[#A8C63A] text-[11px] font-medium mt-0.5">{member.role}</p>
                    <a href={`tel:${member.phone}`} className="flex items-center gap-1 text-white/50 hover:text-white text-xs mt-1 transition-colors">
                      <FiPhone className="w-3 h-3" />
                      {member.phone}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* ── Col 4: Contact ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-widest">Contact Us</h4>
            <ul className="space-y-4">
              {/* Helpline */}
              <li className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-lg bg-[#F39C12]/15 border border-[#F39C12]/25 flex items-center justify-center flex-shrink-0">
                  <FiPhone className="w-4 h-4 text-[#F39C12]" />
                </span>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Help Line</p>
                  <a href={`tel:${FIXED_CONTACT.helpline}`} className="text-white text-sm font-semibold hover:text-[#F39C12] transition-colors">
                    {FIXED_CONTACT.helpline}
                  </a>
                </div>
              </li>

              {/* Email */}
              <li className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-lg bg-[#2D5DA8]/20 border border-[#2D5DA8]/30 flex items-center justify-center flex-shrink-0">
                  <FiMail className="w-4 h-4 text-[#2D5DA8]" />
                </span>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Email</p>
                  <a href={`mailto:${FIXED_CONTACT.email}`} className="text-white text-sm font-semibold hover:text-[#2D5DA8] transition-colors break-all">
                    {FIXED_CONTACT.email}
                  </a>
                </div>
              </li>

              {/* Address */}
              <li className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-lg bg-[#A8C63A]/15 border border-[#A8C63A]/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiMapPin className="w-4 h-4 text-[#A8C63A]" />
                </span>
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Office Address</p>
                  <p className="text-white/80 text-sm leading-relaxed">{FIXED_CONTACT.address}</p>
                </div>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* ── Bottom bar ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p className="text-white/40 text-xs text-center sm:text-left">
            © {new Date().getFullYear()} <span className="text-white/60 font-semibold">{site.name}</span>. {footer.copyrightText}
          </p>
          <div className="flex items-center gap-4 text-white/40 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A8C63A] animate-pulse" />
              All services operational
            </span>
            <span>·</span>
            <span>CIN: {FIXED_CONTACT.cin}</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
