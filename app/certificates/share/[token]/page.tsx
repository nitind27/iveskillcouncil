"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Award, FileText, Loader2, Lock, LogOut } from "lucide-react";
import type { CertificateDemoData } from "@/components/certificates/demo/types";
import { OfficialDocumentSheet, type OfficialDocKind } from "@/components/certificates/OfficialDocumentPrint";
import { cn } from "@/lib/utils";

type Kind = "both" | "certificate" | "result";

type ShareStudent = {
  id: string;
  studentCode: string;
  studentName: string;
  courseName: string | null;
};

type Session = {
  title: string | null;
  kinds: Kind;
  courseName: string | null;
  students: ShareStudent[];
};

type Docs = {
  vocational: CertificateDemoData | null;
  marksheet: CertificateDemoData | null;
};

const SHEET_W = 1054;
const SHEET_H = 1492;

export default function CertificateSharePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || "";
  const [phase, setPhase] = useState<"loading" | "invalid" | "locked" | "open">("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<OfficialDocKind>("vocational");
  const [docs, setDocs] = useState<Record<string, Docs>>({});
  const [loadingDoc, setLoadingDoc] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.45);

  const applySession = (data: Session) => {
    const kinds: Kind = data.kinds === "certificate" || data.kinds === "result" ? data.kinds : "both";
    setSession({ ...data, kinds });
    setView(kinds === "result" ? "marksheet" : "vocational");
    setActiveId(data.students[0]?.id ?? null);
    setPhase("open");
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void fetch(`/api/certificates/share/${token}`, { credentials: "include" })
      .then(async (res) => {
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setPhase("invalid");
          return;
        }
        if (json.data?.locked) setPhase("locked");
        else applySession(json.data);
      })
      .catch(() => {
        if (!cancelled) setPhase("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const node = frameRef.current;
    if (!node || phase !== "open") return;
    const fit = () => {
      const width = node.clientWidth;
      const height = node.clientHeight;
      if (!width || !height) return;
      setScale(Math.min(width / SHEET_W, height / SHEET_H, 1));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    return () => observer.disconnect();
  }, [phase, activeId, view]);

  useEffect(() => {
    if (!activeId || !token) return;
    if (docs[activeId]) {
      setLoadingDoc(false);
      return;
    }
    let cancelled = false;
    setLoadingDoc(true);
    void fetch(`/api/certificates/share/${token}/documents?studentId=${activeId}`, { credentials: "include" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Could not load");
        if (cancelled) return;
        setDocs((prev) => ({
          ...prev,
          [activeId]: { vocational: json.data.vocational, marksheet: json.data.marksheet },
        }));
      })
      .catch(() => {
        if (!cancelled) setError("This document could not be opened.");
      })
      .finally(() => {
        if (!cancelled) setLoadingDoc(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId, token, docs]);

  const signIn = async () => {
    setSigningIn(true);
    setError("");
    try {
      const res = await fetch(`/api/certificates/share/${token}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Username or password is incorrect");
      applySession(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Username or password is incorrect");
    } finally {
      setSigningIn(false);
    }
  };

  const signOut = async () => {
    await fetch(`/api/certificates/share/${token}/logout`, { method: "POST", credentials: "include" });
    setSession(null);
    setDocs({});
    setPassword("");
    setPhase("locked");
  };

  const current = session?.students.find((student) => student.id === activeId) ?? null;
  const currentDocs = activeId ? docs[activeId] : undefined;
  const sheet = currentDocs ? (view === "marksheet" ? currentDocs.marksheet : currentDocs.vocational) : null;
  const allowBoth = session?.kinds === "both";
  const views = useMemo(() => {
    if (!session) return [];
    if (session.kinds === "certificate") return [{ id: "vocational" as const, label: "Certificate" }];
    if (session.kinds === "result") return [{ id: "marksheet" as const, label: "Result" }];
    return [
      { id: "vocational" as const, label: "Certificate" },
      { id: "marksheet" as const, label: "Result" },
    ];
  }, [session]);

  return (
    <div className="min-h-screen bg-[#F4F0E6] text-[#0B1F3A]">
      <header className="border-b border-[#C4A35A]/40 bg-[#0B1F3A] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#C4A35A]">IVESDC</p>
            <p className="text-sm font-semibold">{session?.title || "Shared certificates"}</p>
          </div>
          {phase === "open" ? (
            <button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          ) : null}
        </div>
      </header>

      {phase === "loading" ? (
        <div className="flex min-h-[70vh] items-center justify-center text-sm text-[#0B1F3A]/70">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening link…
        </div>
      ) : null}

      {phase === "invalid" ? (
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <Lock className="mx-auto h-8 w-8 text-[#C4A35A]" />
          <h1 className="mt-3 text-xl font-bold">This link is not valid</h1>
          <p className="mt-2 text-sm text-[#0B1F3A]/70">Ask the person who shared it for a new link.</p>
        </div>
      ) : null}

      {phase === "locked" ? (
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
          <form
            className="w-full rounded-[28px] border border-[#C4A35A]/40 bg-white p-6 shadow-[0_20px_50px_rgba(11,31,58,0.08)]"
            onSubmit={(e) => {
              e.preventDefault();
              void signIn();
            }}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B1F3A] text-[#C4A35A]">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-center text-xl font-bold">Open shared documents</h1>
            <p className="mt-1 text-center text-sm text-[#0B1F3A]/65">Use the username and password you were given. You will only see the certificates on this link.</p>
            <label className="mt-5 block text-xs font-semibold">
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="mt-1 w-full rounded-xl border border-[#0B1F3A]/15 px-3 py-2 text-sm font-normal outline-none focus:border-[#1E4A85]"
              />
            </label>
            <label className="mt-3 block text-xs font-semibold">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="mt-1 w-full rounded-xl border border-[#0B1F3A]/15 px-3 py-2 text-sm font-normal outline-none focus:border-[#1E4A85]"
              />
            </label>
            {error ? <p className="mt-3 text-xs font-medium text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={signingIn || !username.trim() || !password}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F3A] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
            >
              {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Open
            </button>
          </form>
        </div>
      ) : null}

      {phase === "open" && session ? (
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[#C4A35A]/30 bg-white p-3">
            <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A6A2F]">
              {session.students.length === 1 ? "1 student" : `${session.students.length} students`}
            </p>
            {session.courseName ? <p className="mt-1 px-1 text-xs text-[#0B1F3A]/70">{session.courseName}</p> : null}
            <div className="mt-2 max-h-[40vh] space-y-1 overflow-auto lg:max-h-[calc(100vh-140px)]">
              {session.students.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => {
                    setError("");
                    setActiveId(student.id);
                  }}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-left",
                    student.id === activeId ? "bg-[#0B1F3A] text-white" : "hover:bg-[#F4F0E6]"
                  )}
                >
                  <span className="block truncate text-sm font-semibold">{student.studentName}</span>
                  <span className={cn("block truncate text-[11px]", student.id === activeId ? "text-white/70" : "text-[#0B1F3A]/55")}>
                    {student.studentCode}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="flex min-h-[70vh] flex-col rounded-2xl border border-[#C4A35A]/30 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold">{current?.studentName || "Document"}</p>
                <p className="text-[11px] text-[#0B1F3A]/60">{current?.studentCode}</p>
              </div>
              {allowBoth || views.length > 1 ? (
                <div className="inline-flex rounded-xl bg-[#F4F0E6] p-1">
                  {views.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setView(item.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold",
                        view === item.id ? "bg-[#0B1F3A] text-white" : "text-[#0B1F3A]"
                      )}
                    >
                      {item.id === "marksheet" ? <FileText className="h-3.5 w-3.5" /> : <Award className="h-3.5 w-3.5" />}
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="rounded-full bg-[#F4F0E6] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#8A6A2F]">
                  {views[0]?.label}
                </span>
              )}
            </div>
            {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
            <div ref={frameRef} className="relative mt-3 min-h-[68vh] flex-1 overflow-auto rounded-xl bg-[#E7E1D4]">
              {loadingDoc && !sheet ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-[#0B1F3A]/70">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading document…
                </div>
              ) : null}
              {sheet ? (
                <div className="flex min-h-full items-start justify-center p-4">
                  <div style={{ width: SHEET_W * scale, height: SHEET_H * scale }}>
                    <div style={{ width: SHEET_W, height: SHEET_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                      <OfficialDocumentSheet kind={view} data={sheet} printId={`share-${activeId}-${view}`} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
