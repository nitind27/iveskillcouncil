"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  FiMenu, FiX, FiLogIn, FiArrowRight, FiChevronDown, FiPhone, FiMail, FiCheckCircle, FiShield,
  FiHome, FiBookOpen, FiTag, FiBriefcase, FiImage, FiGrid, FiStar, FiMapPin, FiLayers, FiFileText,
  FiInfo, FiUsers, FiUserCheck,
} from "react-icons/fi";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { defaultConfig, type UserPanelConfig } from "@/config/userpanel.config";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserPanelBasePath, useUserPanelHref } from "@/hooks/useUserPanelBasePath";
import { useAuth } from "@/contexts/AuthContext";
import { franchiseDashboardPath, getFranchisePathSlug, sanitizeFranchiseSlug, shouldPrefixFranchiseApp } from "@/lib/franchise-path";
import { COUNCIL } from "./ui/council";
import { upButton } from "./ui/button";
import Magnetic from "./ui/Magnetic";

const NAV_LABEL_KEYS: Record<string, string> = {
  Home: "nav.home",
  Courses: "nav.courses",
  Offers: "nav.offers",
  Franchise: "nav.franchise",
  Gallery: "nav.gallery",
  Contact: "nav.contact",
};

const NAV_ICONS: Record<string, React.ReactNode> = {
  Home: <FiHome className="h-4 w-4" />,
  About: <FiInfo className="h-4 w-4" />,
  Courses: <FiBookOpen className="h-4 w-4" />,
  Branches: <FiMapPin className="h-4 w-4" />,
  "Student Zone": <FiUsers className="h-4 w-4" />,
  Offers: <FiTag className="h-4 w-4" />,
  Franchise: <FiBriefcase className="h-4 w-4" />,
  Gallery: <FiImage className="h-4 w-4" />,
  Contact: <FiPhone className="h-4 w-4" />,
};

type NavChild = { label: string; href: string; description: string; icon: React.ReactNode };
type NavItem = { label: string; href: string; children?: NavChild[]; menuOnly?: boolean };

interface UserPanelNavbarProps {
  config: UserPanelConfig;
  userName?: string | null;
  notificationCount?: number;
}

export default function UserPanelNavbar({ config, userName }: UserPanelNavbarProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const ticking = useRef(false);
  const pathname = usePathname();
  const { site, nav } = config;
  const basePath = useUserPanelBasePath();
  const up = useUserPanelHref();
  const siteSlug = getFranchisePathSlug(pathname || "")?.replace(/-/g, "") || null;
  const ownSlug = user?.franchise?.slug ? sanitizeFranchiseSlug(user.franchise.slug) : "";
  const dashboardPath = user
    ? shouldPrefixFranchiseApp(user.roleId, ownSlug)
      ? franchiseDashboardPath(ownSlug)
      : "/dashboard"
    : franchiseDashboardPath(siteSlug);
  const loggedIn = Boolean(userName || user);
  const dashboardOrLoginHref = loggedIn ? dashboardPath : `/login?as=student&redirect=${encodeURIComponent(dashboardPath)}`;
  const authLabel = userName ? t("menu.dashboard", "Dashboard") : "Student Login";

  const label = (raw: string) => (NAV_LABEL_KEYS[raw] ? t(NAV_LABEL_KEYS[raw], raw) : raw);

  const items = useMemo<NavItem[]>(() => {
    const configured = (nav.links?.length > 0 ? nav.links : defaultConfig.nav.links).map((l) => ({ ...l }));
    const list: NavItem[] = [...configured];
    const has = (name: string) => list.some((l) => l.label.toLowerCase() === name.toLowerCase());
    const indexOf = (name: string) => list.findIndex((l) => l.label.toLowerCase() === name.toLowerCase());

    if (!has("About")) list.splice(Math.max(indexOf("Home") + 1, 0), 0, { label: "About", href: "/userpanel#about" });
    if (!has("Branches")) {
      const at = indexOf("Courses");
      list.splice(at >= 0 ? at + 1 : list.length, 0, { label: "Branches", href: "/userpanel/franchises" });
    }
    if (!has("Student Zone")) {
      const at = indexOf("Franchise");
      list.splice(at >= 0 ? at : list.length, 0, { label: "Student Zone", href: "", menuOnly: true });
    }

    const children: Record<string, NavChild[]> = {
      Courses: [
        { label: "All Courses", href: "/userpanel/courses", description: "Browse the complete course catalogue", icon: <FiGrid /> },
        { label: "Featured Courses", href: "/userpanel#courses", description: "Popular programs on the home page", icon: <FiStar /> },
      ],
      "Student Zone": [
        { label: loggedIn ? "My Dashboard" : "Student Login", href: dashboardOrLoginHref, description: "Access your courses, fees and exams", icon: <FiUserCheck /> },
        { label: "Verify Certificate", href: "/verify", description: "Scan QR or enter certificate number", icon: <FiCheckCircle /> },
        { label: "All Courses", href: "/userpanel/courses", description: "Find the right program for you", icon: <FiBookOpen /> },
        { label: "Current Offers", href: "/userpanel#offers", description: "Fee concessions and student perks", icon: <FiTag /> },
      ],
      Franchise: [
        { label: "Franchise Overview", href: "/userpanel#franchise", description: "Why partner with us", icon: <FiBriefcase /> },
        { label: "All Franchises", href: "/userpanel/franchises", description: "Explore our centre network", icon: <FiMapPin /> },
        { label: "Franchise Plans", href: "/userpanel/franchise-plans", description: "Compare plans and pricing", icon: <FiLayers /> },
        { label: "Apply for Franchise", href: "/userpanel/apply-franchise", description: "Submit your application online", icon: <FiFileText /> },
      ],
    };

    return list.map((l) => ({ ...l, children: children[l.label] }));
  }, [nav.links, loggedIn, dashboardOrLoginHref]);

  const resolveHref = (href: string) => (href.startsWith("/login") || href.startsWith("/verify") || href === dashboardPath ? href : up(href));

  const isActive = (href: string) =>
    !!href &&
    (pathname === href ||
      (href !== basePath && !!pathname?.startsWith(href.split("#")[0]) && !href.includes("#")));

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        ticking.current = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const openDropdown = useCallback((name: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(name);
  }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  }, []);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const marqueeText =
    site?.headerMarquee ??
    "Welcome — Explore our courses, offers, and franchise opportunities!";

  const logo = (size: "nav" | "drawer") => (
    <span className="relative flex flex-shrink-0 items-center justify-center">
      {site.logoUrl ? (
        <img
          src={site.logoUrl}
          alt={site.name}
          className={cn("w-auto object-contain", size === "nav" ? "h-11 max-w-[130px] lg:h-12" : "h-9 max-w-[110px]")}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.display = "none";
            const fb = img.nextElementSibling as HTMLElement | null;
            if (fb) fb.style.display = "flex";
          }}
        />
      ) : null}
      <span
        className="h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ive-saffron to-ive-saffron-dark text-base font-black text-white shadow-sm"
        style={{ display: site.logoUrl ? "none" : "flex" }}
      >
        {site.logoLetter}
      </span>
    </span>
  );

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-[100] isolate transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ transform: scrolled ? "translateY(calc(-1 * var(--up-topbar-height)))" : "translateY(0)" }}
      >
        {/* Official info bar */}
        <div className="relative h-[var(--up-topbar-height)] border-b border-ive-line bg-white text-ive-slate">
          <div className="up-tricolor absolute inset-x-0 top-0 h-[2px]" aria-hidden />
          <div className="mx-auto flex h-full max-w-7xl items-center gap-5 px-4 text-[11.5px] font-medium sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-shrink-0 items-center gap-4">
              <a href={`mailto:${COUNCIL.email}`} className="hidden items-center gap-1.5 transition-colors hover:text-ive-navy md:inline-flex">
                <FiMail className="h-3.5 w-3.5 text-ive-saffron" />
                {COUNCIL.email}
              </a>
              <a href={`tel:${COUNCIL.helpline}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-ive-navy">
                <FiPhone className="h-3.5 w-3.5 text-ive-saffron" />
                +91 {COUNCIL.helpline}
              </a>
              <span className="hidden items-center gap-1.5 xl:inline-flex" title="Corporate Identification Number">
                <FiShield className="h-3.5 w-3.5 text-ive-emerald" />
                CIN: {COUNCIL.cin}
              </span>
            </div>

            <div className="relative hidden min-w-0 flex-1 overflow-hidden lg:block [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
              <div className="marquee-track flex items-center gap-12 whitespace-nowrap">
                {[1, 2].map((k) => (
                  <span key={k} aria-hidden={k === 2} className="flex shrink-0 items-center gap-12 text-ive-navy/80">
                    <span>{marqueeText}</span>
                    <span className="h-1 w-1 rounded-full bg-ive-saffron" />
                  </span>
                ))}
              </div>
            </div>

            <div className="ml-auto flex flex-shrink-0 items-center gap-1 sm:gap-2">
              <Link href={dashboardOrLoginHref} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-semibold text-ive-navy transition-colors hover:bg-ive-mist">
                <FiUserCheck className="h-3.5 w-3.5 text-ive-royal" />
                {authLabel}
              </Link>
              {!loggedIn && (
                <>
                  <span className="hidden h-3.5 w-px bg-ive-line sm:block" aria-hidden />
                  <Link href="/login?as=partner" className="hidden items-center gap-1.5 rounded-md px-2 py-1 font-semibold text-ive-navy transition-colors hover:bg-ive-mist sm:inline-flex">
                    <FiBriefcase className="h-3.5 w-3.5 text-ive-saffron" />
                    Partner Login
                  </Link>
                </>
              )}
              <span className="hidden h-3.5 w-px bg-ive-line md:block" aria-hidden />
              <LanguageSwitcher variant="userpanel" className="hidden scale-90 md:flex" />
            </div>
          </div>
        </div>

        {/* Primary navigation */}
        <nav
          aria-label="Main"
          className={cn(
            "relative transition-[background-color,box-shadow] duration-300",
            scrolled
              ? "bg-white/95 shadow-[0_12px_32px_-14px_rgba(6,27,54,0.28)] backdrop-blur-xl"
              : "bg-white shadow-[0_1px_0_rgba(6,27,54,0.06)]"
          )}
        >
          <div className="mx-auto flex h-[var(--up-header-height)] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link href={basePath} className="group flex min-w-0 flex-shrink-0 items-center gap-3" aria-label={`${site.name} home`}>
              {logo("nav")}
              <span className="hidden min-w-0 border-l border-ive-line pl-3 sm:block">
                <span className="block truncate text-[15px] font-extrabold leading-tight tracking-tight text-ive-navy">{site.name}</span>
                <span className="mt-0.5 block max-w-[210px] text-[9.5px] font-bold uppercase leading-tight tracking-[0.06em] text-ive-slate">
                  {COUNCIL.fullName}
                </span>
              </span>
            </Link>

            <ul className="hidden flex-1 items-center justify-center xl:flex">
              {items.map((item) => {
                const href = item.href ? resolveHref(item.href) : "";
                const active = isActive(href);
                const open = openMenu === item.label;
                const text = label(item.label);
                const underline = (
                  <span
                    className={cn(
                      "absolute inset-x-2.5 -bottom-0.5 h-[2px] origin-left rounded-full bg-ive-saffron transition-transform duration-300",
                      active || open ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    )}
                  />
                );

                return (
                  <li
                    key={item.label}
                    className="relative"
                    onMouseEnter={item.children ? () => openDropdown(item.label) : undefined}
                    onMouseLeave={item.children ? scheduleClose : undefined}
                    onKeyDown={item.children ? (e) => e.key === "Escape" && setOpenMenu(null) : undefined}
                  >
                    {item.menuOnly ? (
                      <button
                        type="button"
                        aria-haspopup="true"
                        aria-expanded={open}
                        onClick={() => setOpenMenu(open ? null : item.label)}
                        className={cn(
                          "group relative flex items-center gap-1 px-2.5 py-2 text-[13.5px] font-semibold transition-colors",
                          open ? "text-ive-navy" : "text-ive-ink/75 hover:text-ive-navy"
                        )}
                      >
                        {text}
                        <FiChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-180")} />
                        {underline}
                      </button>
                    ) : (
                      <div className="flex items-center">
                        <Link
                          href={href}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group relative px-2.5 py-2 text-[13.5px] font-semibold transition-colors",
                            active || open ? "text-ive-navy" : "text-ive-ink/75 hover:text-ive-navy",
                            item.children && "pr-0.5"
                          )}
                        >
                          {text}
                          {underline}
                        </Link>
                        {item.children && (
                          <button
                            type="button"
                            aria-label={`${text} menu`}
                            aria-haspopup="true"
                            aria-expanded={open}
                            onClick={() => setOpenMenu(open ? null : item.label)}
                            className="flex h-7 w-5 items-center justify-center text-ive-slate transition-colors hover:text-ive-navy"
                          >
                            <FiChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-180")} />
                          </button>
                        )}
                      </div>
                    )}

                    {item.children && (
                      <AnimatePresence>
                        {open && (
                          <div className="absolute left-1/2 top-full z-10 -translate-x-1/2 pt-3">
                            <motion.div
                              initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: reduce ? 0 : 6 }}
                              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                              className="w-[320px] overflow-hidden rounded-2xl border border-ive-line bg-white p-2 shadow-[0_24px_60px_-20px_rgba(6,27,54,0.35)]"
                            >
                              <div className="up-tricolor -mx-2 -mt-2 mb-2 h-[3px]" aria-hidden />
                              {item.children.map((child) => (
                                <Link
                                  key={child.label}
                                  href={resolveHref(child.href)}
                                  onClick={() => setOpenMenu(null)}
                                  className="group/item flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-ive-mist focus-visible:bg-ive-mist focus-visible:outline-none"
                                >
                                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-ive-royal/[0.08] text-ive-royal transition-colors group-hover/item:bg-ive-saffron group-hover/item:text-white">
                                    {child.icon}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="flex items-center gap-1 text-sm font-bold text-ive-navy">
                                      {child.label}
                                      <FiArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover/item:translate-x-0 group-hover/item:opacity-100" />
                                    </span>
                                    <span className="mt-0.5 block text-xs text-ive-slate">{child.description}</span>
                                  </span>
                                </Link>
                              ))}
                            </motion.div>
                          </div>
                        )}
                      </AnimatePresence>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-shrink-0 items-center gap-2">
              <Magnetic className="hidden sm:inline-flex">
                <Link href={up("/userpanel/courses")} className={upButton("primary", "md", "px-6")}>
                  Apply Now
                  <FiArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                </Link>
              </Magnetic>

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-ive-navy text-white shadow-sm transition-colors hover:bg-ive-navy-2 xl:hidden"
                aria-label="Open menu"
                aria-expanded={mobileOpen}
              >
                <FiMenu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[200] bg-ive-navy/50 backdrop-blur-sm"
            />

            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 34 }}
              className="fixed bottom-0 right-0 top-0 z-[201] flex w-[min(88vw,370px)] flex-col bg-white shadow-2xl"
            >
              <div className="relative overflow-hidden bg-ive-navy px-5 pb-5 pt-4 text-white">
                <div className="up-grid-pattern absolute inset-0 opacity-30" aria-hidden />
                <div className="up-tricolor absolute inset-x-0 top-0 h-[3px]" aria-hidden />
                <div className="relative flex items-center justify-between gap-3">
                  <span className="rounded-xl bg-white px-2 py-1.5">{logo("drawer")}</span>
                  <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
                    aria-label="Close menu"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
                <p className="relative mt-4 text-sm font-bold">{site.name}</p>
                <p className="relative mt-0.5 text-[11px] leading-snug text-white/60">{COUNCIL.fullName}</p>
              </div>

              <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                  {items.map((item, i) => {
                    const href = item.href ? resolveHref(item.href) : "";
                    const active = isActive(href);
                    const expanded = mobileExpanded === item.label;
                    const text = label(item.label);
                    const toggle = () => setMobileExpanded(expanded ? null : item.label);
                    const iconBox = (
                      <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", active ? "bg-ive-saffron text-white" : "bg-ive-mist text-ive-royal")}>
                        {NAV_ICONS[item.label] ?? <FiHome className="h-4 w-4" />}
                      </span>
                    );
                    return (
                      <motion.li
                        key={item.label}
                        initial={{ opacity: 0, x: reduce ? 0 : 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: reduce ? 0 : 0.04 + i * 0.035 }}
                      >
                        <div className={cn("flex items-center rounded-xl transition-colors", active ? "bg-ive-saffron/10" : "hover:bg-ive-mist")}>
                          {item.menuOnly ? (
                            <button type="button" onClick={toggle} aria-expanded={expanded} className="flex flex-1 items-center gap-3 px-3 py-2.5 text-left text-[15px] font-semibold text-ive-ink">
                              {iconBox}
                              {text}
                            </button>
                          ) : (
                            <Link
                              href={href}
                              onClick={() => setMobileOpen(false)}
                              className={cn("flex flex-1 items-center gap-3 px-3 py-2.5 text-[15px] font-semibold", active ? "text-ive-saffron-dark" : "text-ive-ink")}
                            >
                              {iconBox}
                              {text}
                            </Link>
                          )}
                          {item.children && (
                            <button
                              type="button"
                              aria-label={`Toggle ${text} links`}
                              aria-expanded={expanded}
                              onClick={toggle}
                              className="mr-1.5 flex h-10 w-10 items-center justify-center rounded-lg text-ive-slate hover:bg-white"
                            >
                              <FiChevronDown className={cn("h-4 w-4 transition-transform duration-300", expanded && "rotate-180")} />
                            </button>
                          )}
                        </div>
                        {item.children && (
                          <AnimatePresence initial={false}>
                            {expanded && (
                              <motion.ul
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                                className="ml-[30px] overflow-hidden border-l-2 border-ive-line pl-3"
                              >
                                {item.children.map((child) => (
                                  <li key={child.label}>
                                    <Link
                                      href={resolveHref(child.href)}
                                      onClick={() => setMobileOpen(false)}
                                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ive-slate transition-colors hover:bg-ive-mist hover:text-ive-navy"
                                    >
                                      {child.label}
                                    </Link>
                                  </li>
                                ))}
                              </motion.ul>
                            )}
                          </AnimatePresence>
                        )}
                      </motion.li>
                    );
                  })}
                </ul>

                <div className="mt-5 rounded-2xl border border-ive-line bg-ive-mist p-4 text-sm">
                  <a href={`tel:${COUNCIL.helpline}`} className="flex items-center gap-2.5 font-semibold text-ive-navy">
                    <FiPhone className="h-4 w-4 text-ive-saffron" /> +91 {COUNCIL.helpline}
                  </a>
                  <a href={`mailto:${COUNCIL.email}`} className="mt-2.5 flex items-center gap-2.5 break-all text-ive-slate">
                    <FiMail className="h-4 w-4 flex-shrink-0 text-ive-saffron" /> {COUNCIL.email}
                  </a>
                  <Link href="/verify" onClick={() => setMobileOpen(false)} className="mt-3 flex items-center gap-2.5 font-semibold text-ive-emerald">
                    <FiCheckCircle className="h-4 w-4" /> Verify Certificate
                  </Link>
                </div>

                <div className="mt-4 flex justify-center">
                  <LanguageSwitcher variant="userpanel" />
                </div>
              </nav>

              <div className="grid grid-cols-2 gap-2 border-t border-ive-line px-3 pb-5 pt-3">
                <Link href={dashboardOrLoginHref} onClick={() => setMobileOpen(false)} className={upButton("outline", "md")}>
                  <FiLogIn className="h-4 w-4" /> {loggedIn ? authLabel : "Login"}
                </Link>
                <Link href={up("/userpanel/courses")} onClick={() => setMobileOpen(false)} className={upButton("primary", "md")}>
                  Apply Now <FiArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
