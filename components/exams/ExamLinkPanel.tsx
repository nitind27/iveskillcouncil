"use client";

import { useEffect, useState } from "react";
import { Copy, ExternalLink, Link2, Loader2, Power, PowerOff } from "lucide-react";
import { examLinkAbsoluteUrl } from "@/lib/exam-link";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface ExamLinkPanelProps {
  examId: string;
  linkToken: string | null | undefined;
  linkActive: boolean;
  published: boolean;
  compact?: boolean;
  onUpdated?: () => void;
}

export function ExamLinkPanel({
  examId,
  linkToken,
  linkActive,
  published,
  compact = false,
  onUpdated,
}: ExamLinkPanelProps) {
  const [origin, setOrigin] = useState("");
  const [busy, setBusy] = useState<"on" | "off" | "copy" | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const url = linkToken ? examLinkAbsoluteUrl(linkToken, origin || undefined) : "";

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/exams/${examId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Failed");
    return json;
  };

  const setActive = async (active: boolean) => {
    if (!published && active) {
      await showError("Publish first", "Publish the exam before activating the link");
      return;
    }
    setBusy(active ? "on" : "off");
    try {
      await patch({ linkActive: active });
      await showSuccess(
        active ? "Link activated" : "Link deactivated",
        active
          ? "Students can open the link and start with enrollment number"
          : "New starts are blocked until you activate again"
      );
      onUpdated?.();
    } catch (e) {
      await showError("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    if (!url) return;
    setBusy("copy");
    try {
      await navigator.clipboard.writeText(url);
      await showSuccess("Copied", "Exam link copied — open it on your tablet");
    } catch {
      await showError("Copy failed", "Select and copy the link manually");
    } finally {
      setBusy(null);
    }
  };

  if (!linkToken) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        No walk-in link yet. Open the exam and use Regenerate link.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#C4A35A]/40 bg-gradient-to-br from-[#C4A35A]/10 to-white",
        compact ? "p-3" : "p-4 sm:p-5"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1E4A85]">
            <Link2 className="h-4 w-4 shrink-0 text-[#C4A35A]" />
            Walk-in exam link
          </p>
          {!compact && (
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              Open on tablet at the centre. Students enter enrollment + photo. Not shown on
              franchise or student portals.
            </p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
            linkActive
              ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
              : "bg-slate-200 text-slate-600 ring-1 ring-slate-300"
          )}
        >
          {linkActive ? "● Active" : "○ Deactivated"}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <div className="min-w-0 flex-1 rounded-xl border border-[#1E4A85]/15 bg-white px-3 py-2.5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#1E4A85]/60">
            Public link
          </p>
          <p className="mt-0.5 break-all font-mono text-[11px] leading-snug text-[#0B1F3A] sm:text-xs">
            {url || "…"}
          </p>
        </div>
        <div className="flex shrink-0 gap-2 sm:flex-col">
          <button
            type="button"
            onClick={copy}
            disabled={busy === "copy"}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1E4A85] px-3 py-2 text-xs font-bold text-white hover:bg-[#163a6b] disabled:opacity-50 sm:flex-none"
          >
            {busy === "copy" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            Copy
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#1E4A85]/20 bg-white px-3 py-2 text-xs font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/5 sm:flex-none"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </a>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {!linkActive ? (
          <button
            type="button"
            disabled={!published || busy === "on"}
            onClick={() => setActive(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "on" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Power className="h-3.5 w-3.5" />
            )}
            Activate link
          </button>
        ) : (
          <button
            type="button"
            disabled={busy === "off"}
            onClick={() => setActive(false)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy === "off" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <PowerOff className="h-3.5 w-3.5" />
            )}
            Deactivate link
          </button>
        )}
        {!published && (
          <span className="self-center text-[11px] font-medium text-amber-800">
            Publish exam first, then activate
          </span>
        )}
      </div>
    </div>
  );
}
