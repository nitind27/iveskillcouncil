"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import PageLoader from "@/components/common/PageLoader";

function normalize(path: string) {
  const bare = (path || "").split("?")[0].split("#")[0];
  if (bare.length > 1 && bare.endsWith("/")) return bare.slice(0, -1);
  return bare || "";
}

function pathOf(url: unknown) {
  const raw = String(url ?? "");
  if (!raw || raw === "null" || raw === "undefined") return "";
  try {
    return normalize(new URL(raw, window.location.origin).pathname);
  } catch {
    return normalize(raw);
  }
}

/** Full-screen logo loader only while a real client navigation is in progress. */
export default function GlobalLoader() {
  const pathname = usePathname() || "";
  const pathRef = useRef(normalize(pathname));
  const timerRef = useRef(0);
  const hideRef = useRef(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    pathRef.current = normalize(pathname);
    window.clearTimeout(timerRef.current);
    window.clearTimeout(hideRef.current);
    setVisible(false);
  }, [pathname]);

  useEffect(() => {
    let ready = false;
    const boot = window.setTimeout(() => {
      ready = true;
      pathRef.current = normalize(window.location.pathname);
    }, 800);

    const arm = (url: unknown) => {
      if (!ready) return;
      const next = pathOf(url);
      if (!next || next === pathRef.current) return;
      window.clearTimeout(timerRef.current);
      window.clearTimeout(hideRef.current);
      timerRef.current = window.setTimeout(() => {
        if (normalize(window.location.pathname) === pathRef.current) return;
        setVisible(true);
        hideRef.current = window.setTimeout(() => setVisible(false), 4000);
      }, 140);
    };

    const push = history.pushState.bind(history);
    const replace = history.replaceState.bind(history);
    history.pushState = function (this: History, ...args: Parameters<History["pushState"]>) {
      arm(args[2]);
      return push.apply(history, args);
    } as History["pushState"];
    history.replaceState = function (this: History, ...args: Parameters<History["replaceState"]>) {
      arm(args[2]);
      return replace.apply(history, args);
    } as History["replaceState"];

    const onPop = () => arm(window.location.pathname);
    window.addEventListener("popstate", onPop);

    return () => {
      ready = false;
      window.clearTimeout(boot);
      window.clearTimeout(timerRef.current);
      window.clearTimeout(hideRef.current);
      history.pushState = push;
      history.replaceState = replace;
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[99990]">
      <PageLoader text="Loading..." />
    </div>
  );
}
