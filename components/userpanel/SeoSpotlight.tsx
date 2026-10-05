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
    <section aria-labelledby="seo-headline" className="relative border-y border-ive-line bg-white px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ive-saffron-dark">
          {seo.siteName} · {seo.instituteName} · {seo.city}, {seo.district}
        </p>
        <h1 id="seo-headline" className="mt-3 text-[1.85rem] font-extrabold leading-[1.15] tracking-tight text-ive-navy sm:text-4xl">
          {seo.headline}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ive-slate md:text-[17px]">{seo.intro}</p>
        {seo.localLine ? (
          <p className="mt-3 text-base leading-relaxed text-ive-navy/90" style={{ fontFamily: "var(--font-gujarati), sans-serif" }}>{seo.localLine}</p>
        ) : null}
        <p className="mt-5 text-sm font-semibold text-ive-navy">
          {seo.founderName}
          <span className="font-medium text-ive-slate"> · {seo.founderRole} of {seo.siteName}</span>
        </p>
        <p className="mt-1 inline-flex items-center justify-center gap-1.5 text-sm text-ive-slate">
          <FiMapPin className="h-3.5 w-3.5 text-ive-saffron" aria-hidden />
          {seo.streetAddress}
        </p>
        {topics.length > 0 && (
          <ul className="mt-6 flex flex-wrap justify-center gap-2">
            {topics.map((topic) => (
              <li key={topic}>
                <Link
                  href={up("/userpanel/courses")}
                  className="inline-flex rounded-full border border-ive-line bg-ive-mist px-3 py-1.5 text-xs font-semibold text-ive-navy transition-colors hover:border-ive-royal/30 hover:bg-white"
                >
                  {topic}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-7">
          <Link href={up("/userpanel/courses")} className={upButton("primary", "lg")}>
            View computer courses
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
