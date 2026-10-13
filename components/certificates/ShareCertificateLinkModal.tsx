"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Link2, Loader2, Lock, Trash2, X } from "lucide-react";
import { collectCertificateStudentIds } from "@/components/certificates/CertificateJpegZipDialog";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Kind = "both" | "certificate" | "result";

type RecentLink = {
  token: string;
  username: string;
  title: string | null;
  kinds: string;
  studentCount: number;
  createdAt: string;
  path: string;
};

const KIND_OPTIONS: { id: Kind; label: string; hint: string }[] = [
  { id: "both", label: "Both", hint: "Certificate and result" },
  { id: "certificate", label: "Certificate", hint: "Certificate only" },
  { id: "result", label: "Result", hint: "Statement of marks only" },
];

function absUrl(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function ShareCertificateLinkModal({
  open,
  onClose,
  selectedIds,
  filters,
  countHint,
}: {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  filters: { status?: string; franchiseId?: string; courseId?: string; search?: string };
  countHint: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [kinds, setKinds] = useState<Kind>("both");
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ path: string; username: string; studentCount: number } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentLink[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    setCreated(null);
    setCopied(null);
    setLoadingRecent(true);
    void fetch("/api/certificates/share", { credentials: "include" })
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json?.data?.items)) setRecent(json.data.items);
      })
      .catch(() => setRecent([]))
      .finally(() => setLoadingRecent(false));
  }, [open]);

  if (!open || !mounted) return null;

  const copy = async (path: string) => {
    try {
      await navigator.clipboard.writeText(absUrl(path));
      setCopied(path);
    } catch {
      setCopied(null);
    }
  };

  const createLink = async () => {
    if (password !== confirm) {
      await showError("Passwords do not match", "Type the same password in both fields.");
      return;
    }
    setSaving(true);
    try {
      const ids = selectedIds.length
        ? Array.from(new Set(selectedIds)).slice(0, 100)
        : (await collectCertificateStudentIds(filters)).ids.slice(0, 100);
      if (!ids.length) {
        await showError("Nothing to share", "No students in this filter.");
        return;
      }
      const res = await fetch("/api/certificates/share", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          username,
          password,
          kinds,
          studentIds: ids,
          courseId: filters.courseId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Could not create the link");
      setCreated({
        path: json.data.path,
        username: json.data.username,
        studentCount: json.data.studentCount,
      });
      setRecent((prev) => [
        {
          token: json.data.token,
          username: json.data.username,
          title: json.data.title,
          kinds: json.data.kinds,
          studentCount: json.data.studentCount,
          createdAt: new Date().toISOString(),
          path: json.data.path,
        },
        ...prev,
      ]);
    } catch (err) {
      await showError("Could not create the link", err instanceof Error ? err.message : "Try again");
    } finally {
      setSaving(false);
    }
  };

  const removeLink = async (token: string) => {
    const res = await fetch(`/api/certificates/share/${token}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      await showError("Could not remove the link", json?.error || "Try again");
      return;
    }
    setRecent((prev) => prev.filter((item) => item.token !== token));
    if (created && created.path.endsWith(token)) setCreated(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[10050] flex items-center justify-center bg-[#071525]/70 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[min(92vh,760px)] w-full max-w-xl flex-col overflow-hidden rounded-[28px] border border-[#C4A35A]/40 bg-white shadow-[0_30px_80px_rgba(7,21,37,0.35)]">
        <div className="relative shrink-0 overflow-hidden bg-[#0B1F3A] px-5 py-4 text-white">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#C4A35A] to-transparent" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C4A35A]">Private link</p>
              <h2 className="mt-1 text-lg font-bold">Share certificate & result</h2>
              <p className="mt-1 text-xs text-white/70">
                {countHint} student{countHint === 1 ? "" : "s"} · they sign in with the username and password you set
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {created ? (
            <div className="rounded-2xl border border-[#C4A35A]/50 bg-[#FBF6EA] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A6A2F]">Link ready</p>
              <p className="mt-1 text-sm font-semibold text-[#0B1F3A]">
                {created.studentCount} student{created.studentCount === 1 ? "" : "s"} · username <span className="font-mono">{created.username}</span>
              </p>
              <p className="mt-2 break-all rounded-xl bg-white px-3 py-2 font-mono text-xs text-[#0B1F3A]">{absUrl(created.path)}</p>
              <button
                type="button"
                onClick={() => void copy(created.path)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F3A] px-3 py-2 text-xs font-bold text-white"
              >
                {copied === created.path ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === created.path ? "Copied" : "Copy link"}
              </button>
              <p className="mt-2 text-[11px] leading-relaxed text-[#5C4A28]">
                Send the link, username, and password together. The password is not stored in plain text, so it cannot be shown again.
              </p>
              <button type="button" onClick={() => setCreated(null)} className="mt-3 text-xs font-semibold text-[#1E4A85] underline">
                Create another link
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#0B1F3A]">
                Label
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Optional, e.g. March batch"
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[#1E4A85]"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-[#0B1F3A]">
                  Username
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="off"
                    placeholder="viewer01"
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[#1E4A85]"
                  />
                </label>
                <label className="block text-xs font-semibold text-[#0B1F3A]">
                  Password
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[#1E4A85]"
                  />
                </label>
              </div>
              <label className="block text-xs font-semibold text-[#0B1F3A]">
                Confirm password
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[#1E4A85]"
                />
              </label>
              <div>
                <p className="text-xs font-semibold text-[#0B1F3A]">What they can open</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {KIND_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setKinds(option.id)}
                      className={cn(
                        "rounded-xl border px-2 py-2 text-left transition",
                        kinds === option.id
                          ? "border-[#0B1F3A] bg-[#0B1F3A] text-white"
                          : "border-border bg-white text-[#0B1F3A] hover:border-[#C4A35A]"
                      )}
                    >
                      <span className="block text-xs font-bold">{option.label}</span>
                      <span className={cn("mt-0.5 block text-[10px] leading-snug", kinds === option.id ? "text-white/70" : "text-muted-foreground")}>
                        {option.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void createLink()}
                disabled={saving || !username.trim() || password.length < 6}
                className="inline-flex items-center gap-2 rounded-xl bg-[#C4A35A] px-4 py-2.5 text-sm font-bold text-[#0B1F3A] disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                Create link
              </button>
            </div>
          )}

          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <Lock className="h-3 w-3" /> Recent links
            </p>
            {loadingRecent ? (
              <p className="mt-2 text-xs text-muted-foreground">Loading…</p>
            ) : recent.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">No links yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {recent.map((item) => (
                  <li key={item.token} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[#0B1F3A]">{item.title || item.username}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {item.username} · {item.studentCount} · {item.kinds}
                      </p>
                    </div>
                    <button type="button" onClick={() => void copy(item.path)} className="rounded-lg p-1.5 text-[#1E4A85] hover:bg-[#F5E6C8]" aria-label="Copy link">
                      {copied === item.path ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button type="button" onClick={() => void removeLink(item.token)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-50" aria-label="Remove link">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
