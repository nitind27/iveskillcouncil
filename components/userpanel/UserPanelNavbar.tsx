"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiMenu, FiX, FiSend, FiSmartphone, FiLogIn,
  FiGrid, FiBookOpen, FiActivity, FiShield, FiLayout 
} from "react-icons/fi";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NavLink, UserPanelConfig } from "@/config/userpanel.config";

/** Normalize nav href so hash-only links work from any page (e.g. /userpanel/courses). */
function navHref(href: string): string {
  if (href === "#home" || href === "/" || href === "") return "/userpanel";
  if (href === "#courses") return "/userpanel/courses";
  if (href.startsWith("#")) return `/userpanel${href}`;
  return href;
}

interface UserPanelNavbarProps {
  config: UserPanelConfig;
  userName?: string | null;
  notificationCount?: number;
}

export default function UserPanelNavbar({
  config,
  userName = "Guest User",
  notificationCount = 5,
}: UserPanelNavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { site, nav } = config;

  // Handle scroll effect for navbar transparency
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const marqueeText = site?.headerMarquee ?? "Welcome — Explore our courses, offers, and franchise opportunities. We're glad you're here!";

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b flex flex-col",
          isScrolled 
            ? "panel-glass border-[var(--up-border)] shadow-[var(--up-nav-shadow)]" 
            : "border-transparent"
        )}
      >
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full", isScrolled ? "py-3" : "py-5")}>
          {/* subtle top accent line (like screenshot) */}
          <div className={cn("absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[var(--up-accent)] via-[var(--up-accent-2)] to-[var(--up-accent)]", !isScrolled && "opacity-80")} />
          <div className="flex items-center justify-between">
            
            {/* --- Logo Area --- */}
            <div className="flex items-center gap-10">
              <Link href="/userpanel" className="flex items-center gap-3 group">
                <div className="relative panel-perspective">
                  <div className="absolute -inset-2 bg-[var(--up-accent)]/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="relative w-11 h-11 rounded-xl bg-[var(--up-accent)] flex items-center justify-center shadow-lg border border-[var(--up-border-strong)]"
                  >
                    <span className="text-white font-black text-xl">{site.logoLetter}</span>
                  </motion.div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[var(--up-text)] font-bold tracking-tight text-lg leading-tight">{site.name}</span>
                  <span className="text-[10px] text-[var(--up-accent-muted)] font-bold uppercase tracking-widest">Portal</span>
                </div>
              </Link>

              {/* --- Desktop Navigation --- */}
              <div className="hidden lg:flex items-center gap-1">
                {nav.links?.map((link) => (
                  <Link
                    key={link.label}
                    href={navHref(link.href)}
                    className="relative px-4 py-2.5 text-sm font-semibold text-[var(--up-text-muted)] hover:text-[var(--up-text)] transition-all duration-300 rounded-xl hover:bg-[var(--up-bg-muted)] group"
                  >
                    <span className="relative z-10">{link.label}</span>
                    <span className="absolute inset-0 rounded-xl bg-[var(--up-accent)]/0 group-hover:bg-[var(--up-accent)]/5 transition-all duration-300" />
                  </Link>
                ))}
              </div>
            </div>

            {/* --- Action Buttons --- */}
            <div className="flex items-center gap-3">
              {/* Download Mobile App */}
              <Link
                href="/userpanel#contact"
                className="inline-flex items-center justify-center p-2.5 rounded-full text-[var(--up-text-muted)] hover:text-[var(--up-text)] hover:bg-[var(--up-bg-muted)] transition-all border border-transparent hover:border-[var(--up-border)]"
                aria-label="Download mobile app"
                title="Download mobile app"
              >
                <FiSmartphone className="w-5 h-5" />
              </Link>

              {/* Login */}
              <Link
                href={`/login?redirect=${encodeURIComponent("/admin")}`}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--up-bg-card)] text-[var(--up-text)] font-bold shadow-sm border border-[var(--up-border)] hover:border-[var(--up-border-strong)] hover:bg-[var(--up-bg-muted)] transition-all"
              >
                <FiLogIn className="w-4 h-4 text-[var(--up-accent)]" />
                Login
              </Link>

              {/* Enroll Now CTA */}
              <Link
                href="/userpanel/courses"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[var(--up-accent)] text-white font-bold shadow-lg border border-[var(--up-border-strong)] hover:bg-[var(--up-accent-hover)] transition-all"
              >
                <FiSend className="w-4 h-4" />
                Enroll Now
              </Link>

              {/* Mobile Toggle */}
              <button 
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2.5 bg-[var(--up-accent)] rounded-xl text-white"
              >
                <FiMenu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Marquee strip — clearly below nav bar, no overlap with page content */}
        <div
          className={cn(
            "w-full overflow-hidden relative shrink-0 border-t",
            isScrolled 
              ? "bg-[var(--up-bg-muted)]/80 border-[var(--up-border)] py-1.5" 
              : "bg-[var(--up-bg)]/95 border-transparent py-2"
          )}
          aria-live="polite"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-[var(--up-bg)] to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-[var(--up-bg)] to-transparent z-10" />
            <div className="marquee-track flex shrink-0 items-center gap-8">
              {[1, 2].map((i) => (
                <span key={i} className="marquee-content flex shrink-0 items-center gap-8 whitespace-nowrap text-sm font-medium text-[var(--up-text)]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--up-accent)]/15 px-2 py-0.5 text-xs font-bold text-[var(--up-accent)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--up-accent)] animate-pulse" />
                    Welcome
                  </span>
                  {marqueeText}
                  <span className="text-[var(--up-text-subtle)]">✦</span>
                  {marqueeText}
                  <span className="text-[var(--up-text-subtle)]">✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* --- PROFESSIONAL DRAWER MENU (MOBILE) --- */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[200]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[320px] bg-[var(--up-bg-card)] z-[201] shadow-2xl flex flex-col border-l border-[var(--up-border)]"
            >
              <div className="p-6 flex items-center justify-between border-b border-[var(--up-border)]">
                <span className="font-black text-[var(--up-text)] text-xl tracking-tighter">MENU</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg bg-[var(--up-bg-muted)] text-[var(--up-text)]">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div>
                  <h4 className="text-[10px] font-black text-[var(--up-text-subtle)] uppercase tracking-[0.2em] mb-4">Main Navigation</h4>
                  <div className="grid gap-2">
                    <DrawerItem icon={<FiGrid />} label="Dashboard" active />
                    <DrawerItem icon={<FiBookOpen />} label="Courses" />
                    <DrawerItem icon={<FiActivity />} label="Analytics" />
                    <DrawerItem icon={<FiLayout />} label="Resources" />
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black text-[var(--up-text-subtle)] uppercase tracking-[0.2em] mb-4">Quick Links</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {nav.links?.map(link => (
                      <Link key={link.label} href={navHref(link.href)} className="p-3 rounded-xl bg-[var(--up-bg-muted)] text-center text-xs font-bold text-[var(--up-text)]">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-[var(--up-bg-muted)] border-t border-[var(--up-border)]">
                <button className="w-full py-4 bg-[var(--up-accent)] rounded-2xl text-white font-bold shadow-lg">
                  Contact Support
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function DrawerItem({ icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all",
      active ? "bg-[var(--up-accent)] text-white shadow-lg" : "bg-[var(--up-bg-muted)] text-[var(--up-text-muted)] hover:bg-[var(--up-border)]"
    )}>
      <span className="text-xl">{icon}</span>
      <span className="font-bold tracking-tight">{label}</span>
    </button>
  );
}