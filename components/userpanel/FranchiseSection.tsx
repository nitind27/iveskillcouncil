"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiMapPin, FiUser, FiPhone, FiMail, FiArrowRight, FiBriefcase, FiCheck,
  FiLayers, FiMessageCircle, FiNavigation, FiExternalLink, FiGlobe,
} from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";
import { useUserPanelHref } from "@/hooks/useUserPanelBasePath";
import FranchiseInquiryModal from "./FranchiseInquiryModal";
import FranchisePlansModal from "./FranchisePlansModal";
import SectionHeading from "./ui/SectionHeading";
import Reveal from "./ui/Reveal";
import { upButton } from "./ui/button";
import { COUNCIL } from "./ui/council";

interface FranchiseSectionProps {
  config: UserPanelConfig;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80";
const BANNER_IMAGE = "/assets/home/branch-building.jpg";

const perks = [
  "Full training & onboarding support",
  "Marketing & branding materials",
  "Dedicated franchise manager",
  "Revenue sharing model",
];

export default function FranchiseSection({ config }: FranchiseSectionProps) {
  const up = useUserPanelHref();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryFranchise, setInquiryFranchise] = useState<{ id?: string; name: string } | null>(null);
  const [plansOpen, setPlansOpen] = useState(false);
  const { franchise } = config;
  const highlight = franchise?.highlight;
  const [highlightSrc, setHighlightSrc] = useState(highlight?.image || FALLBACK_IMAGE);

  const openInquiry = (f?: { id?: string; name: string } | null) => {
    setInquiryFranchise(f ?? null);
    setInquiryOpen(true);
  };

  const mapQuery = highlight?.location?.trim() ? encodeURIComponent(highlight.location.trim()) : "";
  const details = highlight
    ? [
        { label: "Address", icon: FiMapPin, value: highlight.location },
        { label: "Centre Head", icon: FiUser, value: highlight.head },
        { label: "Phone", icon: FiPhone, value: highlight.contact, href: highlight.contact ? `tel:${highlight.contact}` : undefined },
        { label: "Email", icon: FiMail, value: highlight.email, href: highlight.email ? `mailto:${highlight.email}` : undefined },
      ].filter((d) => d.value)
    : [];

  return (
    <>
      <section id="franchise" className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="relative mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Our Network"
            icon={<FiGlobe className="h-3.5 w-3.5" />}
            title={franchise?.sectionTitle || "Featured Branch"}
            description="Join our franchise network and build a successful education business."
          />

          {/* Partnership banner */}
          <Reveal className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ive-navy via-ive-navy-2 to-ive-royal shadow-[0_40px_90px_-35px_rgba(6,27,54,0.7)]">
            <div className="up-grid-pattern pointer-events-none absolute inset-0 opacity-70" aria-hidden />
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-ive-saffron/20 blur-[100px]" aria-hidden />
            <div className="up-tricolor absolute inset-x-0 top-0 z-10 h-[3px]" aria-hidden />

            <div className="relative grid lg:grid-cols-[0.95fr_1.35fr_0.8fr]">
              <div className="group relative h-52 overflow-hidden sm:h-64 lg:h-auto lg:[clip-path:polygon(0_0,100%_0,86%_100%,0_100%)]">
                <img
                  src={BANNER_IMAGE}
                  alt="Modern skill development learning centre building"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ive-navy/70 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-ive-navy/40" />
              </div>

              <div className="p-6 sm:p-9 lg:py-12 lg:pl-6 lg:pr-4">
                <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#FFB15C]">
                  <span className="h-px w-8 bg-ive-saffron" />
                  Partner with {COUNCIL.shortName}
                </p>
                <h3 className="mt-3 text-[1.7rem] font-extrabold leading-[1.15] tracking-tight text-white sm:text-[2.1rem]">
                  Ready to open your own branch?
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-[15px]">
                  Partner with us and get full support — from setup to operations. Our team is with you every step.
                </p>
                <ul className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {perks.map((p) => (
                    <li key={p} className="flex items-center gap-2.5 text-sm font-medium text-white/90">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ive-emerald text-white">
                        <FiCheck className="h-3.5 w-3.5" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col justify-center gap-3 border-t border-white/10 p-6 sm:p-9 lg:border-l lg:border-t-0 lg:py-12">
                <Link href={up("/userpanel/apply-franchise")} className={upButton("primary", "lg", "w-full")}>
                  Apply for Franchise
                  <FiArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                </Link>
                <button type="button" onClick={() => setPlansOpen(true)} className={upButton("white", "lg", "w-full")}>
                  <FiLayers className="h-4 w-4" />
                  View Plans &amp; Buy
                </button>
                <button type="button" onClick={() => openInquiry(null)} className={upButton("ghost-dark", "lg", "w-full")}>
                  <FiMessageCircle className="h-4 w-4" />
                  Ask a Query
                </button>
              </div>
            </div>
          </Reveal>

          {/* Featured branch card */}
          {highlight && (
            <Reveal delay={0.05} className="mt-8 overflow-hidden rounded-[1.75rem] border border-ive-line bg-white shadow-[var(--up-card-shadow)] sm:mt-10">
              <div className="grid lg:grid-cols-[1fr_1.15fr_1fr]">
                <div className="group relative min-h-[220px] overflow-hidden bg-ive-mist">
                  <img
                    src={highlightSrc}
                    alt={highlight.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={() => setHighlightSrc(FALLBACK_IMAGE)}
                  />
                </div>

                <div className="flex flex-col justify-center p-6 sm:p-8">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ive-saffron/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ive-saffron-dark">
                    <FiBriefcase className="h-3.5 w-3.5" />
                    Featured Branch
                  </span>
                  <h3 className="mt-3 text-2xl font-extrabold text-ive-navy">{highlight.name}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {details.map(({ label, icon: Icon, value, href }) => (
                      <li key={label} className="flex items-start gap-3 text-sm text-ive-slate">
                        <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-ive-royal" aria-label={label} />
                        {href ? (
                          <a href={href} className="break-words font-medium text-ive-ink transition-colors hover:text-ive-royal">{value}</a>
                        ) : (
                          <span className="break-words">{label === "Centre Head" ? `Head: ${value}` : value}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap gap-2.5">
                    {mapQuery && (
                      <>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={upButton("navy", "sm")}
                        >
                          <FiMapPin className="h-3.5 w-3.5" />
                          View Location
                        </a>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={upButton("outline", "sm")}
                        >
                          <FiNavigation className="h-3.5 w-3.5" />
                          Get Direction
                        </a>
                      </>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
                    <button type="button" onClick={() => openInquiry({ name: highlight.name })} className="inline-flex items-center gap-1.5 text-ive-saffron-dark hover:underline">
                      Visit &amp; Enquire <FiExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <Link href={highlight.detailsUrl || up("/userpanel/franchises")} className="inline-flex items-center gap-1.5 text-ive-royal hover:underline">
                      All Franchises <FiArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="relative min-h-[240px] border-t border-ive-line bg-ive-mist lg:border-l lg:border-t-0">
                  {mapQuery ? (
                    <iframe
                      title={`Map showing ${highlight.name}`}
                      src={`https://maps.google.com/maps?q=${mapQuery}&hl=en&z=16&output=embed`}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0 h-full w-full border-0 grayscale-[30%]"
                    />
                  ) : (
                    <div className="up-dot-pattern flex h-full items-center justify-center text-sm text-ive-slate">Location not available</div>
                  )}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <FranchiseInquiryModal
        open={inquiryOpen}
        onClose={() => { setInquiryOpen(false); setInquiryFranchise(null); }}
        franchise={inquiryFranchise}
      />

      <FranchisePlansModal
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
      />
    </>
  );
}
