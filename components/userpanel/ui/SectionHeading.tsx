import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Reveal from "./Reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  align?: "center" | "left";
  tone?: "light" | "dark";
  className?: string;
  action?: ReactNode;
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  icon,
  align = "center",
  tone = "light",
  className,
  action,
}: SectionHeadingProps) {
  const dark = tone === "dark";
  const centered = align === "center";

  return (
    <Reveal
      className={cn(
        "mb-10 flex flex-col gap-5 sm:mb-14",
        centered ? "items-center text-center" : "md:flex-row md:items-end md:justify-between",
        className
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]",
            dark
              ? "border border-white/15 bg-white/5 text-[#FFB15C]"
              : "border border-ive-royal/15 bg-ive-royal/[0.06] text-ive-royal"
          )}
        >
          {icon ?? <span className="h-1.5 w-1.5 rounded-full bg-ive-saffron" />}
          {eyebrow}
        </span>
        <h2
          className={cn(
            "mt-4 text-[1.65rem] font-extrabold leading-[1.15] tracking-tight sm:text-4xl lg:text-[2.75rem]",
            dark ? "text-white" : "text-ive-navy"
          )}
        >
          {title}
        </h2>
        <div className={cn("mt-4 flex items-center gap-1.5", centered && "justify-center")} aria-hidden>
          <span className="h-1 w-10 rounded-full bg-ive-saffron" />
          <span className={cn("h-1 w-3 rounded-full", dark ? "bg-white/70" : "bg-ive-line")} />
          <span className="h-1 w-6 rounded-full bg-ive-emerald" />
        </div>
        {description && (
          <p className={cn("mt-4 text-base leading-relaxed sm:text-lg", dark ? "text-white/65" : "text-ive-slate")}>
            {description}
          </p>
        )}
      </div>
      {action}
    </Reveal>
  );
}
