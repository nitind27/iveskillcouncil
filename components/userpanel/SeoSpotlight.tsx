"use client";

import Link from "next/link";
import { FiArrowRight, FiMapPin } from "react-icons/fi";
import type { UserPanelConfig } from "@/config/userpanel.config";
import { useUserPanelHref } from "@/hooks/useUserPanelBasePath";
import { upButton } from "./ui/button";

export default function SeoSpotlight({ config }: { config: UserPanelConfig }) {
  const seo = config.seo;
  if (!seo?.enabled) return null;
  const up = useUserPanelHref();
  const topics = seo.keywords.slice(0, 8);

  return (
    <section aria-labelledby="seo-headline" className="bg-[#F4F7FB] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-3xl border border-[#1E4A85]/10 bg-white p-6 shadow-[0_20px_50px_-32px_rgba(6,27,54,0.45)] sm:p-8 lg:grid-cols-12 lg:gap-10 lg:p-10">
        <div className="lg:col-span-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C4A35A]">
            {seo.city}, {seo.district}
          </p>
          <h2 id="seo-headline" className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-[#0B1F3A] sm:text-3xl">
            {seo.headline}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">{seo.intro}</p>
          {seo.localLine ? (
            <p
              className="mt-3 text-sm leading-relaxed text-[#1E4A85]"
              style={{ fontFamily: "var(--font-gujarati), sans-serif" }}
            >
              {seo.localLine}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl bg-[#F4F7FB] p-5 lg:col-span-5">
          <p className="text-sm font-bold text-[#0B1F3A]">{seo.founderName}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {seo.founderRole} · {seo.siteName}
          </p>
          <p className="mt-3 inline-flex items-start gap-1.5 text-sm leading-snug text-slate-600">
            <FiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C4A35A]" aria-hidden />
            {seo.streetAddress}
          </p>
          {topics.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {topics.map((topic) => (
                <li key={topic}>
                  <Link
                    href={up("/userpanel/courses")}
                    className="inline-flex rounded-full border border-[#1E4A85]/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1E4A85] transition-colors hover:border-[#1E4A85]/30"
                  >
                    {topic}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={up("/userpanel/courses")} className={`${upButton("primary", "md")} mt-5`}>
            View computer courses
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
