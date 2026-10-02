import { cn } from "@/lib/utils";

const FLAG_WAVE_SRC = "/assets/home/flag-wave.webp";

interface FlagWaveProps {
  /** Positioning and width, e.g. "-left-40 top-10 w-[720px]". */
  className?: string;
  /** Keep within ±20° so saffron always stays on top. */
  rotate?: number;
  opacity?: number;
  /** `dark` blends as light on navy backgrounds. */
  tone?: "light" | "dark";
  drift?: boolean;
}

/** Decorative tricolour watermark. Parent must be `relative overflow-hidden`. */
export default function FlagWave({ className, rotate = -8, opacity = 0.12, tone = "light", drift = true }: FlagWaveProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute select-none", className)}
      style={{ rotate: `${rotate}deg`, opacity }}
    >
      <img
        src={FLAG_WAVE_SRC}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className={cn(
          "h-auto w-full [mask-image:radial-gradient(ellipse_at_center,#000_40%,transparent_72%)]",
          tone === "dark" ? "mix-blend-screen saturate-[1.15]" : "mix-blend-multiply saturate-[0.9]",
          drift && "up-flag-drift"
        )}
      />
    </div>
  );
}
