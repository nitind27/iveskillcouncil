"use client";

import Link from "next/link";
import { BadgeCheck, GraduationCap, Lightbulb, ShieldCheck, type LucideIcon } from "lucide-react";
import { COUNCIL } from "@/components/userpanel/ui/council";

const ITEMS: { icon: LucideIcon; title: string; href?: string }[] = [
  { icon: ShieldCheck, title: "Secure & Trusted Platform" },
  { icon: GraduationCap, title: "Quality Education" },
  { icon: Lightbulb, title: "Skill for Better Future" },
  { icon: BadgeCheck, title: "Online Certificate Verification", href: "/verify" },
];

export default function LoginTrustBand({ siteName }: { siteName: string }) {
  return (
    <footer className="relative z-[5] -mt-10 text-white lg:-mt-[clamp(4.5rem,9vh,7rem)]">
      <svg className="block h-14 w-full sm:h-20 lg:h-[clamp(5.5rem,10vh,8rem)]" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden>
        <path d="M0 40C220 10 420 60 640 92s480 30 800-40v88H0z" fill="#124E96" fillOpacity="0.55" />
        <path d="M0 62C260 34 470 82 700 110s470 20 740-50v80H0z" fill="#061B36" />
      </svg>
      <div className="-mt-px bg-ive-navy">
        <div className="mx-auto grid max-w-[min(100rem,96vw)] items-end gap-6 px-[var(--login-pad-x)] pb-3 pt-1 lg:grid-cols-[minmax(0,1fr)_auto]">
          <figure className="relative max-w-sm pl-8">
            <span className="absolute left-0 top-0 font-serif text-4xl leading-none text-ive-saffron" aria-hidden>
              &ldquo;
            </span>
            <blockquote className="text-[clamp(1rem,2.1vh,1.35rem)] font-semibold leading-snug text-white">{COUNCIL.mission}</blockquote>
            <figcaption className="mt-1.5 flex items-center gap-3 text-sm text-white/70">
              — {COUNCIL.shortName}
              <span className="h-0.5 w-8 rounded-full bg-ive-saffron" aria-hidden />
            </figcaption>
          </figure>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 lg:flex lg:items-center lg:gap-0">
            {ITEMS.map(({ icon: Icon, title, href }, i) => {
              const body = (
                <>
                  <Icon className="h-6 w-6 shrink-0 text-white/90" strokeWidth={1.6} />
                  <span className="max-w-[7.5rem] text-xs font-medium leading-snug text-white/85">{title}</span>
                </>
              );
              return (
                <li key={title} className={i > 0 ? "lg:border-l lg:border-white/15 lg:pl-5" : ""}>
                  {href ? (
                    <Link href={href} className="flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80 lg:pr-5">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2.5 lg:pr-5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[min(100rem,96vw)] flex-col gap-1.5 px-[var(--login-pad-x)] py-2 text-[11px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {new Date().getFullYear()} {siteName} · CIN: {COUNCIL.cin}
            </span>
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <a href={`tel:+91${COUNCIL.helpline}`} className="transition-colors hover:text-white">
                Helpline: +91 {COUNCIL.helpline}
              </a>
              <span className="inline-flex items-center gap-1.5 text-emerald-300/80">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                All systems operational
              </span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
