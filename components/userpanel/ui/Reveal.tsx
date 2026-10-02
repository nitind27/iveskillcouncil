"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { EASE_OUT, VIEWPORT } from "./motion";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  /** Vertical travel in px; horizontal when `x` is set. */
  y?: number;
  x?: number;
  as?: "div" | "li" | "article";
};

/** Scroll-triggered fade-up. Renders static content when the user prefers reduced motion. */
export default function Reveal({ delay = 0, y = 28, x, as = "div", children, ...rest }: RevealProps) {
  const reduce = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;
  const offset = reduce ? {} : x !== undefined ? { x } : { y };

  return (
    <Comp
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: reduce ? 0.2 : 0.65, delay: reduce ? 0 : delay, ease: EASE_OUT }}
      {...rest}
    >
      {children}
    </Comp>
  );
}
