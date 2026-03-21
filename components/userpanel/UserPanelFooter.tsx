"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiMail, FiPhone, FiFacebook, FiTwitter, FiLinkedin, FiInstagram } from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";

/** Normalize footer link so hash-only works from any page. */
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
};

interface UserPanelFooterProps {
  config: UserPanelConfig;
}

export default function UserPanelFooter({ config }: UserPanelFooterProps) {
  const { site, footer } = config;

  return (
    <footer
      id="contact"
      className="relative py-20 px-4 sm:px-6 lg:px-8 bg-[var(--up-bg-card)] border-t border-[var(--up-border)] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto relative">
        <div className="grid md:grid-cols-4 gap-12 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              {site.logoUrl ? (
                <img src={site.logoUrl} alt={site.name} className="w-12 h-12 rounded-xl object-contain bg-white/10 p-1 shadow-lg border border-[var(--up-border)]" />
              ) : (
                <span className="w-12 h-12 rounded-xl bg-[var(--up-accent)] flex items-center justify-center font-bold text-xl text-white shadow-lg border border-[var(--up-border)]">
                  {site.logoLetter}
                </span>
              )}
              <span className="font-bold text-lg text-[var(--up-text)]">{site.name}</span>
            </div>
            <p className="text-[var(--up-text-muted)] text-sm leading-relaxed">{footer.tagline}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold text-[var(--up-text)] mb-4">Quick Links</h4>
            <ul className="space-y-3 text-[var(--up-text-muted)] text-sm">
              {(footer.quickLinks || []).map((link) => (
                <li key={link.href + link.label}>
                  <Link href={quickLinkHref(link.href)} className="inline-block">
                    <motion.span
                      whileHover={{ x: 4, color: "var(--up-accent)" }}
                      className="inline-block transition-colors"
                    >
                      {link.label}
                    </motion.span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold text-[var(--up-text)] mb-4">Contact</h4>
            <ul className="space-y-3 text-[var(--up-text-muted)] text-sm">
              <li className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-[var(--up-accent)]/15 flex items-center justify-center flex-shrink-0">
                  <FiMail className="w-4 h-4 text-[var(--up-accent)]" />
                </span>
                {footer.contact.email}
              </li>
              <li className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-[var(--up-accent)]/15 flex items-center justify-center flex-shrink-0">
                  <FiPhone className="w-4 h-4 text-[var(--up-accent)]" />
                </span>
                {footer.contact.phone}
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h4 className="font-bold text-[var(--up-text)] mb-4">Follow Us</h4>
            <div className="flex gap-3">
              {(footer.social || []).map((s) => {
                const Icon = SOCIAL_ICONS[s.iconKey] || FiFacebook;
                return (
                  <motion.a
                    key={s.iconKey}
                    href={s.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-11 h-11 rounded-xl bg-[var(--up-bg-muted)] flex items-center justify-center hover:bg-[var(--up-accent)]/15 hover:text-[var(--up-accent)] text-[var(--up-text-muted)] transition-colors border border-[var(--up-border)]"
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="pt-8 border-t border-[var(--up-border)] text-center text-[var(--up-text-subtle)] text-sm"
        >
          © {new Date().getFullYear()} {site.name}. {footer.copyrightText}
        </motion.div>
      </div>
    </footer>
  );
}
