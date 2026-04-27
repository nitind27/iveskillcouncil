"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiMenu, FiX, FiLogIn, FiArrowRight,
  FiHome, FiBookOpen, FiTag, FiBriefcase, FiImage, FiPhone,
} from "react-icons/fi";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { UserPanelConfig } from "@/config/userpanel.config";

function navHref(href: string): string {
  if (href === "#home" || href === "/" || href === "") return "/userpanel";
  if (href === "#courses") return "/userpanel/courses";
  if (href.startsWith("#")) return `/userpanel${href}`;
  return href;
}

const NAV_ICONS: Record<string, React.ReactNode> = {
  Home:      <FiHome      className="w-3.5 h-3.5" />,
  Courses:   <FiBookOpen  className="w-3.5 h-3.5" />,
  Offers:    <FiTag       className="w-3.5 h-3.5" />,
  Franchise: <FiBriefcase className="w-3.5 h-3.5" />,
  Gallery:   <FiImage     className="w-3.5 h-3.5" />,
  Contact:   <FiPhone     className="w-3.5 h-3.5" />,
};

interface UserPanelNavbarProps {
  config: UserPanelConfig;
  userName?: string | null;
  notificationCount?: number;
}

export default function UserPanelNavbar({ config }: UserPanelNavbarProps) {
  const [scrolled,    setScrolled]    = useState(false);
  const [visible,     setVisible]     = useState(true);   // true = shown, false = hidden
  const [mobileOpen,  setMobileOpen]  = useState(false);

  const lastScrollY = useRef(0);
  const ticking     = useRef(false);
  const pathname    = usePathname();
  const { site, nav } = config;

  // ── Scroll handler ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      window.requestAnimationFrame(() => {
        const current = window.scrollY;

        // scrolled state — for glass bg
        setScrolled(current > 30);

        // hide/show logic
        if (current <= 10) {
          // always show at very top
          setVisible(true);
        } else if (current > lastScrollY.current + 6) {
          // scrolling DOWN — hide
          setVisible(false);
        } else if (current < lastScrollY.current - 6) {
          // scrolling UP — show
          setVisible(true);
        }

        lastScrollY.current = current;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const marqueeText =
    site?.headerMarquee ??
    "Welcome — Explore our courses, offers, and franchise opportunities!";

  // total height of navbar + marquee strip so we can translate both together
  const TOTAL_HEIGHT = "var(--up-nav-height)"; // defined in globals.css

  return (
    <>
      {/*
        ── WRAPPER — both navbar + marquee move together ──────────────────────
        We use a single motion.div that wraps both fixed bars.
        translateY(-TOTAL_HEIGHT) hides both; 0 shows both.
      */}
      <motion.div
        animate={{ y: visible ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.8 }}
        className="fixed top-0 left-0 right-0 z-[100]"
        style={{ willChange: "transform" }}
      >
        {/* ── MAIN NAVBAR ─────────────────────────────────────────────────── */}
        <nav
          className={cn(
            "w-full transition-colors duration-300 border-b",
            scrolled
              ? "bg-white/95 backdrop-blur-xl border-[#E5E7EB] shadow-[0_4px_24px_rgba(45,93,168,0.10)]"
              : "bg-white/80 backdrop-blur-md border-transparent"
          )}
        >
          {/* brand accent bar */}
          <div className="h-[3px] bg-gradient-to-r from-[#2D5DA8] via-[#A8C63A] to-[#F39C12]" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[var(--up-header-height)] flex items-center justify-between gap-6">

            {/* ── LOGO ── */}
            <Link href="/userpanel" className="flex items-center gap-3 group flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="relative"
              >
                <span className="absolute -inset-2 rounded-2xl bg-[#2D5DA8]/10 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />
                <div className="relative flex items-center justify-center">
                  {site.logoUrl ? (
                    <img
                      src={site.logoUrl}
                      alt={site.name}
                      className="h-20 w-auto max-w-[160px] object-contain"
                      onError={(e) => {
                        const t = e.target as HTMLImageElement;
                        t.style.display = "none";
                        const fb = t.nextElementSibling as HTMLElement | null;
                        if (fb) fb.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <span
                    className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2D5DA8] to-[#1E4A85] text-white font-black text-xl items-center justify-center shadow-md"
                    style={{ display: site.logoUrl ? "none" : "flex" }}
                  >
                    {site.logoLetter}
                  </span>
                </div>
              </motion.div>

              {!site.logoUrl && (
                <span className="font-extrabold text-[#1A1A1A] text-lg tracking-tight leading-none hidden sm:block">
                  {site.name}
                </span>
              )}
            </Link>

            {/* ── DESKTOP NAV ── */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {nav.links?.map((link, i) => {
                const href     = navHref(link.href);
                const isActive =
                  pathname === href ||
                  (href !== "/userpanel" && !!pathname?.startsWith(href));
                return (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 + i * 0.04, type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <Link
                      href={href}
                      className={cn(
                        "relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 group",
                        isActive
                          ? "text-[#2D5DA8]"
                          : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F8FAFC]"
                      )}
                    >
                      <span className={cn(
                        "transition-colors duration-200",
                        isActive ? "text-[#2D5DA8]" : "text-[#9CA3AF] group-hover:text-[#2D5DA8]"
                      )}>
                        {NAV_ICONS[link.label]}
                      </span>
                      {link.label}
                      {isActive && (
                        <motion.span
                          layoutId="nav-pill"
                          className="absolute inset-0 rounded-xl bg-[#2D5DA8]/10 border border-[#2D5DA8]/20 -z-10"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* ── RIGHT ACTIONS ── */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={`/login?redirect=${encodeURIComponent("/admin")}`}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#374151] font-semibold text-sm border border-[#E5E7EB] hover:border-[#2D5DA8]/50 hover:text-[#2D5DA8] shadow-sm transition-all duration-200"
              >
                <FiLogIn className="w-4 h-4" />
                Login
              </Link>

              <Link href="/userpanel/courses" className="hidden sm:block">
                <motion.span
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#F39C12] text-white font-bold text-sm shadow-md hover:bg-[#D68910] transition-colors duration-200 cursor-pointer"
                >
                  Enroll Now
                  <FiArrowRight className="w-4 h-4" />
                </motion.span>
              </Link>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMobileOpen(true)}
                className="lg:hidden w-10 h-10 rounded-xl bg-[#2D5DA8] flex items-center justify-center text-white shadow-md"
                aria-label="Open menu"
              >
                <FiMenu className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </nav>

        {/* ── MARQUEE STRIP ─────────────────────────────────────────────────── */}
        <div
          className="w-full overflow-hidden bg-[#2D5DA8] border-b border-[#1E4A85]/40"
          style={{ height: "var(--up-marquee-height)" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.10)_50%,transparent_100%)] animate-shine-sweep" />
          <div className="h-full flex items-center px-4 sm:px-6 lg:px-8 gap-4 overflow-hidden">
            <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[11px] font-bold uppercase tracking-widest text-white">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#A8C63A] opacity-80" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#A8C63A]" />
              </span>
              Live
            </span>
            <div className="flex-1 overflow-hidden">
              <div className="marquee-track flex items-center gap-16 whitespace-nowrap">
                {[1, 2].map((k) => (
                  <span key={k} className="flex items-center gap-16 shrink-0 text-[13px] font-medium text-white/90">
                    <span>{marqueeText}</span>
                    <span className="flex items-center gap-2 text-white/40">
                      <span className="w-6 h-px bg-white/30 rounded-full" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A8C63A]" />
                      <span className="w-6 h-px bg-white/30 rounded-full" />
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── MOBILE DRAWER ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            />

            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] bg-white z-[201] shadow-2xl flex flex-col"
            >
              {/* header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  {site.logoUrl ? (
                    <img src={site.logoUrl} alt={site.name} className="h-9 w-auto max-w-[120px] object-contain" />
                  ) : (
                    <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2D5DA8] to-[#1E4A85] flex items-center justify-center text-white font-black text-sm">
                      {site.logoLetter}
                    </span>
                  )}
                  <span className="font-bold text-[#1A1A1A] text-base">{site.name}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  onClick={() => setMobileOpen(false)}
                  className="w-9 h-9 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280]"
                >
                  <FiX className="w-4 h-4" />
                </motion.button>
              </div>

              {/* links */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                {nav.links?.map((link, i) => {
                  const href     = navHref(link.href);
                  const isActive = pathname === href;
                  return (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 22 }}
                    >
                      <Link
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-200",
                          isActive
                            ? "bg-[#2D5DA8] text-white shadow-md"
                            : "text-[#374151] hover:bg-[#EEF2F7] hover:text-[#2D5DA8]"
                        )}
                      >
                        <span className={isActive ? "text-white" : "text-[#2D5DA8]"}>
                          {NAV_ICONS[link.label] ?? <FiHome className="w-3.5 h-3.5" />}
                        </span>
                        {link.label}
                        {isActive && <FiArrowRight className="w-4 h-4 ml-auto" />}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* footer */}
              <div className="px-4 pb-6 pt-4 border-t border-[#E5E7EB] space-y-3">
                <Link href={`/login?redirect=${encodeURIComponent("/admin")}`} onClick={() => setMobileOpen(false)}>
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-[#2D5DA8] text-[#2D5DA8] font-bold text-sm cursor-pointer hover:bg-[#EEF2F7] transition-all"
                  >
                    <FiLogIn className="w-4 h-4" /> Login
                  </motion.span>
                </Link>
                <Link href="/userpanel/franchise-plans" onClick={() => setMobileOpen(false)}>
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#2D5DA8] text-white font-bold text-sm cursor-pointer hover:bg-[#1E4A85] transition-all shadow-md"
                  >
                    <FiBriefcase className="w-4 h-4" /> Franchise Plans
                  </motion.span>
                </Link>
                <Link href="/userpanel/courses" onClick={() => setMobileOpen(false)}>
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-[#F39C12] text-white font-bold text-sm cursor-pointer hover:bg-[#D68910] transition-all shadow-md"
                  >
                    Enroll Now <FiArrowRight className="w-4 h-4" />
                  </motion.span>
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
