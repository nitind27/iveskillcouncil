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
import { defaultConfig, type UserPanelConfig } from "@/config/userpanel.config";

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

export default function UserPanelNavbar({ config, userName }: UserPanelNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ticking = useRef(false);
  const pathname = usePathname();
  const { site, nav } = config;

  const links =
    nav.links?.length > 0 ? nav.links : defaultConfig.nav.links;

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 12);
        ticking.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const marqueeText =
    site?.headerMarquee ??
    "Welcome — Explore our courses, offers, and franchise opportunities!";

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[100] isolate bg-white shadow-[0_1px_0_rgba(15,23,42,0.06)]">
        <nav className="w-full bg-white">
          <div className="h-[2px] bg-[#1E4A85]" />

          <div className={cn(
            "mx-auto flex h-[var(--up-header-height)] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8",
            scrolled ? "border-b border-[#EEF2F7]" : ""
          )}>
            <Link href="/userpanel" className="group flex min-w-0 flex-shrink-0 items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                {site.logoUrl ? (
                  <img
                    src={site.logoUrl}
                    alt={site.name}
                    className="h-9 w-auto max-w-[120px] object-contain sm:h-10"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      t.style.display = "none";
                      const fb = t.nextElementSibling as HTMLElement | null;
                      if (fb) fb.style.display = "flex";
                    }}
                  />
                ) : null}
                <span
                  className="h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2D5DA8] to-[#1E4A85] text-sm font-black text-white shadow-sm sm:h-10 sm:w-10 sm:text-base"
                  style={{ display: site.logoUrl ? "none" : "flex" }}
                >
                  {site.logoLetter}
                </span>
              </div>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-[15px] font-extrabold leading-tight tracking-tight text-[#1A1A1A]">
                  {site.name}
                </span>
                {site.tagline ? (
                  <span className="mt-0.5 hidden max-w-[220px] truncate text-[10px] font-medium text-[#6B7280] lg:block">
                    {site.tagline}
                  </span>
                ) : null}
              </span>
            </Link>

            <div className="hidden flex-1 items-center justify-center md:flex">
              <div className="flex items-center gap-0.5 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] p-1">
                {links.map((link) => {
                  const href = navHref(link.href);
                  const isActive =
                    pathname === href ||
                    (href !== "/userpanel" && !!pathname?.startsWith(href.split("#")[0]) && !href.includes("#"));
                  return (
                    <Link
                      key={link.label}
                      href={href}
                      className={cn(
                        "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200",
                        isActive
                          ? "bg-white text-[#2D5DA8] shadow-sm"
                          : "text-[#6B7280] hover:bg-white/80 hover:text-[#1A1A1A]"
                      )}
                    >
                      <span className={isActive ? "text-[#2D5DA8]" : "text-[#9CA3AF]"}>
                        {NAV_ICONS[link.label]}
                      </span>
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <Link
                href="/login?redirect=%2Fdashboard"
                className="hidden items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#374151] shadow-sm transition-all hover:border-[#2D5DA8]/40 hover:text-[#2D5DA8] sm:inline-flex"
              >
                <FiLogIn className="h-3.5 w-3.5" />
                {userName ? "Dashboard" : "Login"}
              </Link>

              <Link href="/userpanel/courses" className="hidden sm:block">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E4A85] px-4 py-1.5 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-[#163A6B]">
                  Enroll Now
                  <FiArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2D5DA8] text-white shadow-sm md:hidden"
                aria-label="Open menu"
              >
                <FiMenu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </nav>

        <div
          className="relative w-full overflow-hidden bg-[#163A6B]"
          style={{ height: "var(--up-marquee-height)" }}
        >
          <div className="flex h-full items-center gap-3 overflow-hidden px-4 sm:px-6 lg:px-8">
            <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-white/20 bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C4A35A] opacity-80" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#C4A35A]" />
              </span>
              Live
            </span>
            <div className="flex-1 overflow-hidden">
              <div className="marquee-track flex items-center gap-12 whitespace-nowrap">
                {[1, 2].map((k) => (
                  <span key={k} className="flex shrink-0 items-center gap-12 text-[12px] font-medium text-white/90">
                    <span>{marqueeText}</span>
                    <span className="flex items-center gap-2 text-white/40">
                      <span className="h-px w-5 rounded-full bg-white/30" />
                      <span className="h-1 w-1 rounded-full bg-[#C4A35A]" />
                      <span className="h-px w-5 rounded-full bg-white/30" />
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

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
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
            />

            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed bottom-0 right-0 top-0 z-[201] flex w-[280px] flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
                <div className="flex items-center gap-2.5">
                  {site.logoUrl ? (
                    <img src={site.logoUrl} alt={site.name} className="h-8 w-auto max-w-[100px] object-contain" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2D5DA8] to-[#1E4A85] text-xs font-black text-white">
                      {site.logoLetter}
                    </span>
                  )}
                  <span className="text-sm font-bold text-[#1A1A1A]">{site.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {links.map((link) => {
                  const href = navHref(link.href);
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={link.label}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                        isActive
                          ? "bg-[#2D5DA8] text-white shadow-sm"
                          : "text-[#374151] hover:bg-[#EEF2F7] hover:text-[#2D5DA8]"
                      )}
                    >
                      <span className={isActive ? "text-white" : "text-[#2D5DA8]"}>
                        {NAV_ICONS[link.label] ?? <FiHome className="h-3.5 w-3.5" />}
                      </span>
                      {link.label}
                      {isActive && <FiArrowRight className="ml-auto h-4 w-4" />}
                    </Link>
                  );
                })}
              </div>

              <div className="space-y-2 border-t border-[#E5E7EB] px-3 pb-5 pt-3">
                <Link href="/login?redirect=%2Fdashboard" onClick={() => setMobileOpen(false)}>
                  <span className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#2D5DA8] py-2.5 text-sm font-bold text-[#2D5DA8]">
                    <FiLogIn className="h-4 w-4" /> Login
                  </span>
                </Link>
                <Link href="/userpanel/courses" onClick={() => setMobileOpen(false)}>
                  <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E4A85] py-2.5 text-sm font-bold text-white">
                    Enroll Now <FiArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
