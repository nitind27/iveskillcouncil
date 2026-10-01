"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { EyeOff, ShieldAlert } from "lucide-react";

/**
 * Deters printing / capturing a verification result:
 * blocks print (CSS + shortcuts), right-click, drag and selection, hides the content while the tab
 * is not focused (screen-snip tools take focus first), clears the clipboard on PrintScreen, and
 * stamps a traceable watermark. Browsers cannot fully block OS / phone screenshots.
 */
export default function ProtectedView({ children, watermark }: { children: ReactNode; watermark: string }) {
  const [concealed, setConcealed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let noticeTimer: ReturnType<typeof setTimeout> | undefined;
    const warn = (msg: string) => {
      setNotice(msg);
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => setNotice(null), 2500);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if ((mod && (key === "p" || key === "s")) || (mod && e.shiftKey && (key === "s" || key === "3" || key === "4" || key === "5"))) {
        e.preventDefault();
        e.stopPropagation();
        setConcealed(true);
        warn("Printing, saving and screenshots are disabled for verification results.");
      }
      if (key === "printscreen") {
        setConcealed(true);
        navigator.clipboard?.writeText("").catch(() => undefined);
        warn("Screenshots are disabled for verification results.");
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "printscreen") {
        navigator.clipboard?.writeText("").catch(() => undefined);
        setTimeout(() => setConcealed(false), 800);
      }
    };
    const hide = () => setConcealed(true);
    const show = () => setConcealed(false);
    const onVisibility = () => (document.hidden ? hide() : show());
    const block = (e: Event) => e.preventDefault();
    const onBeforePrint = () => warn("Printing is disabled for verification results.");

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("contextmenu", block);
    document.addEventListener("copy", block);
    window.addEventListener("beforeprint", onBeforePrint);
    return () => {
      clearTimeout(noticeTimer);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("copy", block);
      window.removeEventListener("beforeprint", onBeforePrint);
    };
  }, []);

  const watermarkBg = useMemo(() => {
    const text = watermark.replace(/[<>&"]/g, "");
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='340' height='170'><text x='0' y='110' transform='rotate(-24 170 85)' font-family='Arial' font-size='13' font-weight='700' fill='rgba(11,31,58,0.10)'>${text}</text></svg>`;
    return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
  }, [watermark]);

  return (
    <>
      <div
        className="relative select-none print:hidden"
        style={{ WebkitTouchCallout: "none", WebkitUserSelect: "none" }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div
          className="transition-[filter] duration-150"
          style={{ filter: concealed ? "blur(18px)" : undefined }}
          aria-hidden={concealed}
        >
          {children}
        </div>
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-3xl"
          style={{ backgroundImage: watermarkBg, backgroundRepeat: "repeat" }}
          aria-hidden
        />
        {concealed && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-3xl bg-[#0B1F3A]/70 px-6 text-center text-white">
            <EyeOff className="h-8 w-8 text-[#E8C46A]" />
            <p className="text-base font-bold">Content hidden</p>
            <p className="text-xs text-white/80">Click back on this page to view the verification result.</p>
          </div>
        )}
        {notice && (
          <div className="fixed inset-x-0 top-4 z-[100] mx-auto flex w-fit max-w-[92vw] items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg">
            <ShieldAlert className="h-4 w-4" />
            {notice}
          </div>
        )}
      </div>
      <style>{`@media print {
        body * { visibility: hidden !important; }
        .verify-print-block, .verify-print-block * { visibility: visible !important; }
        .verify-print-block { position: fixed; top: 40px; left: 0; right: 0; }
      }`}</style>
      <div className="verify-print-block hidden rounded-3xl border border-rose-200 bg-white p-8 text-center print:block">
        <p className="text-lg font-bold">Printing is disabled</p>
        <p className="mt-1 text-sm">Verification results can only be viewed online at the IVESDC verification portal.</p>
      </div>
    </>
  );
}
