import { cn } from "@/lib/utils";

export type UpButtonVariant = "primary" | "navy" | "outline" | "ghost-dark" | "white";
export type UpButtonSize = "sm" | "md" | "lg";

const BASE =
  "up-sheen group/btn inline-flex items-center justify-center gap-2 rounded-xl font-bold tracking-tight transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ive-saffron focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";

const VARIANTS: Record<UpButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-ive-saffron to-[#FF9A2E] text-white shadow-[0_10px_24px_-8px_rgba(255,133,0,0.65)] hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-10px_rgba(255,133,0,0.75)]",
  navy: "bg-ive-navy text-white shadow-[0_10px_24px_-10px_rgba(6,27,54,0.6)] hover:-translate-y-0.5 hover:bg-ive-navy-2",
  outline:
    "border border-ive-royal/25 bg-white text-ive-royal shadow-sm hover:-translate-y-0.5 hover:border-ive-royal/60 hover:bg-ive-royal/[0.04]",
  "ghost-dark":
    "border border-white/20 bg-white/[0.06] text-white backdrop-blur-md hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/[0.12]",
  white: "bg-white text-ive-navy shadow-[0_10px_24px_-10px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 hover:bg-ive-mist",
};

const SIZES: Record<UpButtonSize, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export function upButton(variant: UpButtonVariant = "primary", size: UpButtonSize = "md", className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}
