"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import PageLoader from "@/components/common/PageLoader";

function pathOf(url: unknown) {
  const raw = String(url ?? "");
  if (!raw || raw === "null" || raw === "undefined") return "";
  try {
    return new URL(raw, window.location.origin).pathname;
  } catch {
    return raw.split("?")[0] || "";
  }
}

/** Full-screen logo loader on every client-side route change, on every page. */
export default function GlobalLoader() {
  const pathname = usePathname() || "";
  const pathRef = useRef(pathname);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    pathRef.current = pathname;
    setVisible(false);
  }, [pathname]);

  useEffect(() => {
    let timer = 0;
    const arm = (url: unknown) => {
      const next = pathOf(url);
      if (!next || next === pathRef.current) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setVisible(true), 100);
    };

    const push = history.pushState.bind(history);
    const replace = history.replaceState.bind(history);
    history.pushState = ((...args: Parameters<History["pushState"]>) => {
      arm(args[2]);
      return push(...args);
    }) as History["pushState"];
    history.replaceState = ((...args: Parameters<History["replaceState"]>) => {
      arm(args[2]);
      return replace(...args);
    }) as History["replaceState"];

    const onPop = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setVisible(true), 100);
    };
    window.addEventListener("popstate", onPop);

    return () => {
      history.pushState = push;
      history.replaceState = replace;
      window.removeEventListener("popstate", onPop);
      window.clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[99990]">
      <PageLoader text="Loading..." />
    </div>
  );
}
