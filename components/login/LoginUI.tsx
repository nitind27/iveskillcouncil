"use client";

import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { ArrowRight, Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const inputBase =
  "w-full rounded-xl border border-[#D7E2F0] bg-white text-[15px] font-medium text-ive-navy shadow-[0_1px_2px_rgba(6,27,54,0.04)] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:font-normal placeholder:text-[#9AA9BD] hover:border-[#BFD1E8] focus:border-ive-royal focus:ring-4 focus:ring-ive-royal/10";

export function LoginLabel({ htmlFor, children, action }: { htmlFor?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-3">
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ive-navy">
        {children}
      </label>
      {action}
    </div>
  );
}

type LoginFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: LucideIcon;
  labelAction?: ReactNode;
  trailing?: ReactNode;
};

export function LoginField({ label, icon: Icon, labelAction, trailing, id, className, ...input }: LoginFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div>
      <LoginLabel htmlFor={fieldId} action={labelAction}>
        {label}
      </LoginLabel>
      <div className="group/field relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#8C9DB4] transition-colors group-focus-within/field:text-ive-royal"
            aria-hidden
          />
        )}
        <input
          id={fieldId}
          className={cn(inputBase, "h-[clamp(2.85rem,5.6vh,3.35rem)]", Icon ? "pl-11" : "pl-4", trailing ? "pr-12" : "pr-4", className)}
          {...input}
        />
        {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
    </div>
  );
}

type OtpFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; hint?: ReactNode };

export function OtpField({ label, hint, id, className, ...input }: OtpFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div>
      <LoginLabel htmlFor={fieldId}>{label}</LoginLabel>
      <input
        id={fieldId}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        className={cn(inputBase, "h-[clamp(3.15rem,6.2vh,3.6rem)] px-4 text-center font-mono text-2xl font-bold tracking-[0.45em]", className)}
        {...input}
      />
      {hint && <p className="mt-1.5 text-xs text-ive-slate">{hint}</p>}
    </div>
  );
}

type PrimaryButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  loading?: boolean;
  loadingText?: string;
  arrow?: boolean;
  children: ReactNode;
};

export function PrimaryButton({ loading, loadingText, arrow = true, disabled, className, children, ...rest }: PrimaryButtonProps) {
  const reduce = useReducedMotion();
  const inactive = disabled || loading;
  return (
    <motion.button
      disabled={inactive}
      whileHover={inactive || reduce ? undefined : { scale: 1.015, y: -1 }}
      whileTap={inactive || reduce ? undefined : { scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "group/btn relative flex h-[clamp(2.85rem,5.6vh,3.35rem)] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#FFA22E] via-ive-saffron to-[#F06A00] px-5 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,133,0,0.75)] outline-none transition-shadow duration-300 hover:shadow-[0_18px_40px_-12px_rgba(255,133,0,0.85)] focus-visible:ring-4 focus-visible:ring-ive-saffron/30",
        inactive && "cursor-not-allowed opacity-70 shadow-none hover:shadow-none",
        className
      )}
      {...rest}
    >
      <span
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 opacity-0 transition-all duration-700 group-hover/btn:left-[110%] group-hover/btn:opacity-100"
        aria-hidden
      />
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {children}
          {arrow && <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />}
        </>
      )}
    </motion.button>
  );
}

export function SecondaryButton({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-[clamp(2.85rem,5.6vh,3.35rem)] flex-1 items-center justify-center rounded-xl border border-[#D7E2F0] bg-white px-4 text-sm font-semibold text-ive-navy transition-colors hover:border-ive-royal/30 hover:bg-ive-mist focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ive-royal/10 disabled:opacity-60",
        className
      )}
      {...rest}
    />
  );
}

export function LoginError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-medium text-red-600">
      {children}
    </p>
  );
}

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
}

export function SegmentedSwitch<T extends string>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const reduce = useReducedMotion();
  return (
    <div role="tablist" aria-label="Sign-in method" className="relative flex rounded-xl border border-[#DCE6F3] bg-[#F1F5FB] p-1">
      {options.map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={cn(
              "relative flex h-[clamp(2.4rem,4.6vh,2.85rem)] flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-ive-royal/30",
              active ? "text-white" : "text-ive-slate hover:text-ive-navy"
            )}
          >
            {active && (
              <motion.span
                layoutId="login-method-pill"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-ive-royal to-[#1E6AD0] shadow-[0_8px_18px_-8px_rgba(18,78,150,0.8)]"
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon className="relative h-4 w-4" />
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
