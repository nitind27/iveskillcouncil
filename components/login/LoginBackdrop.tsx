"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/** Sky gradient, heritage skyline and tricolour ribbon behind the login layout. */
export default function LoginBackdrop() {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 18 });
  const sy = useSpring(my, { stiffness: 40, damping: 18 });
  const flagX = useTransform(sx, [-0.5, 0.5], [-18, 18]);
  const flagY = useTransform(sy, [-0.5, 0.5], [-12, 12]);
  const skyX = useTransform(sx, [-0.5, 0.5], [10, -10]);

  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce, mx, my]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#E4EFFC_0%,#F3F8FE_38%,#FFFFFF_70%)]" />

      <motion.div
        style={{ x: skyX }}
        className="absolute -left-6 bottom-0 h-[58%] w-[calc(100%+3rem)] lg:h-[74%] lg:w-[72%] lg:[mask-image:linear-gradient(to_right,#000_68%,transparent_100%)]"
      >
        <Image
          src="/assets/home/login-skyline.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 72vw, 100vw"
          className="object-cover object-bottom opacity-95 [mask-image:linear-gradient(to_bottom,transparent_0%,#000_42%)]"
        />
      </motion.div>

      <div className="absolute left-0 top-0 h-[60%] w-full bg-[radial-gradient(ellipse_70%_80%_at_15%_25%,rgba(255,255,255,0.85),transparent_70%)] lg:w-[60%]" />
      <div className="absolute -right-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-ive-royal/[0.10] blur-[120px]" />

      <div className="absolute -right-[40%] -top-[4%] w-[150%] sm:-right-[24%] sm:w-[110%] lg:-right-[20%] lg:-top-[6%] lg:w-[72%]">
        <motion.div style={{ x: flagX, y: flagY }}>
          <div style={{ rotate: "-10deg" }} className="opacity-45 lg:opacity-100">
            <Image
              src="/assets/home/flag-wave.webp"
              alt=""
              width={1200}
              height={600}
              priority
              sizes="(min-width: 1024px) 68vw, 110vw"
              className="login-flag-drift h-auto w-full saturate-[1.15] [mask-image:linear-gradient(to_right,transparent_0%,#000_30%)]"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
