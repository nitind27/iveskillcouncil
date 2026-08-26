"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAVY = "#1E4A85";
const NAVY_DEEP = "#0F2A4A";
const GOLD = "#C4A35A";
const GREEN = "#2E7D32";

/** Official full lockup (figures + wordmark + gear) */
export const IVESDC_LOGO_COLOR = "/logo/IVESDC LOGO-01.png";
/** White lockup for navy backgrounds */
export const IVESDC_LOGO_WHITE = "/logo/IVESDC LOGO-05.png";

export type FranchiseIdCardData = {
  partnerId: string;
  ownerName: string;
  centerName: string;
  location: string;
  issueDate: string;
  validUpto: string;
  photoUrl?: string | null;
  logoUrl?: string | null;
  qrDataUrl?: string | null;
  hqAddress?: string;
  website?: string;
  helpline?: string;
};

const DEFAULT_HQ = {
  address:
    "3rd Floor, Matrushri Complex, Junagam Main Road, Fort-Songadh, Dist. Tapi, Gujarat - 394670",
  website: "www.ivesdc.org",
  helpline: "98248 17111",
};

function PunchHole() {
  return (
    <div className="relative z-20 flex justify-center pt-2.5">
      <div className="h-3 w-10 rounded-full border-[1.5px] border-slate-300 bg-slate-100 shadow-inner" />
    </div>
  );
}

function LogoBlock({
  variant,
  logoUrl,
}: {
  variant: "front" | "back";
  logoUrl?: string | null;
}) {
  const light = variant === "back";
  // Always prefer official lockup so card matches printed sample
  const src = light
    ? IVESDC_LOGO_WHITE
    : logoUrl && !logoUrl.includes("userpanel")
      ? logoUrl
      : IVESDC_LOGO_COLOR;

  return (
    <div
      className={cn(
        "relative z-10 flex flex-col items-center px-3",
        light ? "pt-2" : "pt-1"
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="IVESDC — Institute Of Vocational Education & Skill Development Council"
        className={cn(
          "object-contain object-center drop-shadow-sm",
          light ? "h-[78px] w-[268px]" : "h-[88px] w-[280px]"
        )}
        onError={(e) => {
          const el = e.target as HTMLImageElement;
          if (el.src !== encodeURI(IVESDC_LOGO_COLOR) && !light) {
            el.src = IVESDC_LOGO_COLOR;
          }
        }}
      />
    </div>
  );
}

function Ribbon() {
  return (
    <div className="relative z-10 mx-auto mt-1.5 w-[88%]">
      <svg viewBox="0 0 280 36" className="h-8 w-full drop-shadow-md" aria-hidden>
        <path
          d="M18 2h244l18 16-18 16H18L0 18 18 2Z"
          fill={NAVY_DEEP}
        />
        <path
          d="M20 4h240l15 14-15 14H20L5 18 20 4Z"
          fill={NAVY}
        />
        <path d="M0 18 L18 2 v32 Z" fill={GREEN} />
        <path d="M280 18 L262 2 v32 Z" fill={GOLD} />
      </svg>
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10.5px] font-bold uppercase tracking-[0.16em] text-white">
        Franchise Partner
      </span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_6px_1fr] items-baseline gap-x-0.5 text-[8.5px] leading-[1.35]">
      <span className="font-semibold text-[#1E4A85]">{label}</span>
      <span className="font-semibold text-[#1E4A85]">:</span>
      <span className="break-words font-bold text-[#0F2A4A]">{value}</span>
    </div>
  );
}

function FrontDecor() {
  return (
    <>
      {/* Top-left corner curves */}
      <svg
        className="pointer-events-none absolute left-0 top-0 z-0 h-[100px] w-[110px]"
        viewBox="0 0 110 100"
        aria-hidden
      >
        <path d="M0 0h90C52 32 34 62 0 100V0Z" fill={NAVY} />
        <path d="M0 10h62C38 40 22 64 0 86V10Z" fill="#2D6BB0" opacity="0.65" />
        <path d="M0 0h36C22 22 12 44 0 60V0Z" fill={GREEN} opacity="0.9" />
      </svg>
      {/* Bottom wave */}
      <svg
        className="pointer-events-none absolute bottom-0 left-0 z-0 h-[110px] w-full"
        viewBox="0 0 320 110"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 110V78c48 8 96 6 150-8 54-14 100-36 170-52v92H0Z"
          fill={NAVY}
        />
        <path
          d="M0 110V90c55 4 105 0 160-14 52-14 95-32 160-44v68H0Z"
          fill={GREEN}
          opacity="0.95"
        />
        <path
          d="M40 82c70-10 130-28 200-48 30-8 55-16 80-22"
          fill="none"
          stroke={GOLD}
          strokeWidth="2"
          opacity="0.75"
        />
      </svg>
    </>
  );
}

function BackFooterWave() {
  return (
    <svg
      className="pointer-events-none absolute bottom-0 left-0 z-0 h-[72px] w-full"
      viewBox="0 0 320 72"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 72V34c48 16 100 24 168 16C236 42 284 18 320 6v66H0Z"
        fill={NAVY}
      />
      <path
        d="M0 72V46c55 10 110 12 178 2C246 38 290 16 320 10v62H0Z"
        fill={NAVY_DEEP}
      />
    </svg>
  );
}

function Seal() {
  return (
    <div className="relative flex h-[76px] w-[76px] items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={NAVY}
          strokeWidth="3"
          strokeDasharray="3 2.5"
        />
        <circle cx="50" cy="50" r="38" fill="#D6E4F5" stroke={NAVY} strokeWidth="1.5" />
      </svg>
      <div className="relative z-10 flex flex-col items-center px-1 text-center">
        <p className="text-[5.5px] font-extrabold uppercase leading-[1.15] tracking-wide text-[#1E4A85]">
          Authorized
        </p>
        <p className="text-[5.5px] font-extrabold uppercase leading-[1.15] tracking-wide text-[#1E4A85]">
          Franchise
        </p>
        <p className="text-[5.5px] font-extrabold uppercase leading-[1.15] tracking-wide text-[#1E4A85]">
          Partner
        </p>
        <p className="mt-0.5 text-[8px] leading-none text-[#C4A35A]">★★★</p>
      </div>
    </div>
  );
}

function TermRow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 border-b border-dotted border-slate-300/90 pb-1.5">
      <span
        className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-white shadow-sm"
        style={{ background: NAVY }}
      >
        {icon}
      </span>
      <p className="text-[7.5px] leading-snug text-slate-700">{children}</p>
    </div>
  );
}

export function FranchiseIdCardFront({
  data,
  className,
}: {
  data: FranchiseIdCardData;
  className?: string;
}) {
  const initials = data.ownerName
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article
      className={cn(
        "id-card-face relative overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-xl",
        className
      )}
      style={{ width: 340, height: 536 }}
    >
      <FrontDecor />
      <PunchHole />

      {/* Left spine */}
      <div
        className="absolute bottom-[88px] left-0 top-[118px] z-20 flex w-[18px] items-center justify-center"
        style={{ background: NAVY }}
      >
        <span
          className="whitespace-nowrap text-[6.5px] font-bold uppercase tracking-[0.2em] text-white"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Franchise Partner ID Card
        </span>
      </div>

      <LogoBlock variant="front" logoUrl={data.logoUrl} />
      <Ribbon />

      <div className="relative z-10 mt-2.5 flex flex-col items-center px-4 pl-7">
        <div
          className="overflow-hidden rounded-[6px] border-[2.5px] bg-slate-100 shadow-sm"
          style={{ borderColor: NAVY, width: 118, height: 118 }}
        >
          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.photoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1E4A85]/15 to-[#C4A35A]/20 text-2xl font-bold text-[#1E4A85]">
              {initials || "FP"}
            </div>
          )}
        </div>

        <h2 className="mt-2.5 max-w-[92%] text-center text-[15px] font-extrabold uppercase leading-tight tracking-wide text-[#1E4A85]">
          {data.ownerName}
        </h2>
        <p className="mt-0.5 text-[9px] font-medium text-slate-700">
          Franchise Partner
        </p>

        <div className="mt-3 w-full space-y-[5px] pr-1">
          <DetailRow label="Partner ID" value={data.partnerId} />
          <DetailRow label="Center Name" value={data.centerName} />
          <DetailRow label="Location" value={data.location} />
          <DetailRow label="Issue Date" value={data.issueDate} />
          <DetailRow label="Valid Upto" value={data.validUpto} />
        </div>
      </div>

      <div className="absolute bottom-8 right-5 z-10 text-right">
        <p
          className="text-[15px] italic leading-none text-[#1E4A85]"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          IVESDC
        </p>
        <p className="mt-1 text-[7px] font-semibold uppercase tracking-wide text-white/95">
          Authorised Signatory
        </p>
      </div>
    </article>
  );
}

export function FranchiseIdCardBack({
  data,
  className,
}: {
  data: FranchiseIdCardData;
  className?: string;
}) {
  const hq = {
    address: data.hqAddress || DEFAULT_HQ.address,
    website: data.website || DEFAULT_HQ.website,
    helpline: data.helpline || DEFAULT_HQ.helpline,
  };

  return (
    <article
      className={cn(
        "id-card-face relative overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-xl",
        className
      )}
      style={{ width: 340, height: 536 }}
    >
      <div
        className="relative pb-5 pt-1"
        style={{
          background: `linear-gradient(165deg, ${NAVY_DEEP} 0%, ${NAVY} 50%, #245A9E 100%)`,
        }}
      >
        <PunchHole />
        <LogoBlock variant="back" logoUrl={data.logoUrl} />
        <div className="mt-3 flex justify-center">
          <span
            className="rounded-full px-6 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-md"
            style={{
              background: `linear-gradient(90deg, #B8860B 0%, ${GOLD} 45%, #E8C56A 100%)`,
            }}
          >
            Franchise Partner
          </span>
        </div>
      </div>

      <div className="relative z-10 space-y-2 px-4 pb-[88px] pt-3.5">
        <TermRow
          icon={
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current">
              <path d="M4 4h16v4H4V4zm0 6h10v2H4v-2zm0 4h16v2H4v-2zm0 4h10v2H4v-2z" />
            </svg>
          }
        >
          This card is the property of <strong>IVESDC.</strong>
        </TermRow>
        <TermRow
          icon={
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current">
              <path d="M12 2l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5l8-3z" />
            </svg>
          }
        >
          This card authorizes the bearer as an{" "}
          <strong>authorized Franchise Partner</strong> of <strong>IVESDC.</strong>
        </TermRow>
        <TermRow
          icon={
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current">
              <path d="M8 11a3 3 0 110-6 3 3 0 010 6zm8 0a3 3 0 110-6 3 3 0 010 6zM4 20v-1c0-2.5 3-4 6-4s6 1.5 6 4v1H4zm10 0v-1c0-1 .3-1.9.9-2.7 1.3.5 2.8.7 4.1.7 2.5 0 5-1.2 5-3.3V20h-10z" />
            </svg>
          }
        >
          This card is non-transferable and valid only with official identity
          proof.
        </TermRow>
        <TermRow
          icon={
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.2 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1l-2.2 2.2z" />
            </svg>
          }
        >
          In case of loss, please inform the head office immediately.
        </TermRow>

        <div className="flex items-start gap-2.5 pt-1">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start gap-1.5">
              <span
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] text-white"
                style={{ background: NAVY }}
              >
                ⌖
              </span>
              <p className="text-[6.5px] leading-snug text-slate-600">
                {hq.address}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] text-white"
                style={{ background: NAVY }}
              >
                ◎
              </span>
              <p className="text-[8px] font-semibold text-[#1E4A85]">
                {hq.website}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[7px] text-white"
                style={{ background: NAVY }}
              >
                ☎
              </span>
              <p className="text-[8px] font-semibold text-slate-700">
                HelpLine No. <strong>{hq.helpline}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            {data.qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.qrDataUrl}
                alt="QR"
                className="h-[86px] w-[86px] rounded-sm border border-slate-300 bg-white p-0.5"
              />
            ) : (
              <div className="flex h-[86px] w-[86px] items-center justify-center rounded-sm border border-dashed border-slate-300 text-[8px] text-slate-400">
                QR
              </div>
            )}
            <Seal />
          </div>
        </div>
      </div>

      <BackFooterWave />
      <p className="absolute bottom-3.5 left-0 right-0 z-10 text-center text-[10px] font-semibold text-white">
        Together We <span style={{ color: GOLD }}>Build.</span> Together We{" "}
        <span style={{ color: "#7CFC9A" }}>Grow.</span>
      </p>
    </article>
  );
}
