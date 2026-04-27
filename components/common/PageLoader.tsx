"use client";

import { motion } from "framer-motion";

interface PageLoaderProps {
  /** Text shown below the animation. Defaults to "Loading..." */
  text?: string;
  /** Use userpanel brand colors (blue/green/orange). Default: true */
  variant?: "userpanel" | "admin";
}

/**
 * Full-screen animated page loader.
 * Replaces all plain spinner loaders across the app.
 */
export default function PageLoader({ text = "Loading...", variant = "userpanel" }: PageLoaderProps) {
  const isAdmin = variant === "admin";

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center gap-8 ${isAdmin ? "bg-background" : "bg-[#F8FAFC]"}`}>
      {/* ── Animated logo mark ── */}
      <div className="relative flex items-center justify-center">
        {/* outer slow ring */}
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute w-20 h-20 rounded-full border-2 border-dashed border-[#2D5DA8]/20"
        />

        {/* middle ring — counter-rotate */}
        <motion.span
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute w-14 h-14 rounded-full border-2 border-[#A8C63A]/30"
          style={{ borderTopColor: "#A8C63A", borderRightColor: "transparent", borderBottomColor: "transparent", borderLeftColor: "transparent" }}
        />

        {/* inner fast arc */}
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          className="absolute w-9 h-9 rounded-full"
          style={{
            border: "2.5px solid transparent",
            borderTopColor: "#F39C12",
            borderRightColor: "#F39C12",
          }}
        />

        {/* center dot — pulse */}
        <motion.span
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="w-4 h-4 rounded-full bg-[#2D5DA8]"
        />
      </div>

      {/* ── Animated dots text ── */}
      <div className="flex flex-col items-center gap-2">
        <p className={`text-sm font-semibold tracking-wide ${isAdmin ? "text-muted-foreground" : "text-[#374151]"}`}>
          {text}
        </p>

        {/* three bouncing dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 0.7,
                repeat: Infinity,
                delay: i * 0.15,
                ease: "easeInOut",
              }}
              className="w-1.5 h-1.5 rounded-full bg-[#2D5DA8]/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline mini loader — for buttons, small sections.
 * Usage: <MiniLoader />
 */
export function MiniLoader({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
          className="w-1.5 h-1.5 rounded-full bg-current"
        />
      ))}
    </span>
  );
}

/**
 * Section loader — for partial page areas (not full screen).
 */
export function SectionLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5">
      <div className="relative flex items-center justify-center">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="absolute w-12 h-12 rounded-full"
          style={{
            border: "2px solid transparent",
            borderTopColor: "#2D5DA8",
            borderRightColor: "#A8C63A",
          }}
        />
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="w-3 h-3 rounded-full bg-[#2D5DA8]"
        />
      </div>
      <p className="text-sm font-medium text-[#6B7280]">{text}</p>
    </div>
  );
}
