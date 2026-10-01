"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Building2, Check, ImageUp, Loader2, PenLine, Save, Stamp, Trash2, UserCheck } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Slot = "atcStamp" | "atcSignature" | "coordinatorSignature";

type Signatures = {
  atcStampUrl?: string;
  atcSignatureUrl?: string;
  atcSignatoryName?: string;
  coordinatorSignatureUrl?: string;
  coordinatorName?: string;
  updatedAt?: string;
};

type SignaturesResponse = { franchiseId: string; franchiseName: string; signatures: Signatures };

const SLOTS: { slot: Slot; field: keyof Signatures; title: string; hint: string; usedOn: string; icon: typeof Stamp }[] = [
  {
    slot: "atcStamp",
    field: "atcStampUrl",
    title: "ATC Stamp / Seal",
    hint: "Round centre seal. Transparent PNG works best (square image).",
    usedOn: "Certificate + Result (ATC Authorised Signatory)",
    icon: Stamp,
  },
  {
    slot: "atcSignature",
    field: "atcSignatureUrl",
    title: "ATC Authorised Signature",
    hint: "Centre head / authorised person's signature. Sign on white paper, crop tight.",
    usedOn: "Certificate + Result (ATC Authorised Signatory)",
    icon: PenLine,
  },
  {
    slot: "coordinatorSignature",
    field: "coordinatorSignatureUrl",
    title: "Examination Coordinator Signature",
    hint: "Signature of the examination coordinator of your centre.",
    usedOn: "Statement of Marks (Result) - 3",
    icon: UserCheck,
  },
];

function UploadCard({
  title,
  hint,
  usedOn,
  icon: Icon,
  url,
  busy,
  onPick,
  onRemove,
}: {
  title: string;
  hint: string;
  usedOn: string;
  icon: typeof Stamp;
  url?: string;
  busy: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
      <div className="flex items-start gap-3 border-b border-border/60 px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C4A35A]/15 text-[#8B6914]">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-[11px] text-muted-foreground">{usedOn}</p>
        </div>
        {url ? (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <Check className="h-3 w-3" />
            Uploaded
          </span>
        ) : (
          <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Missing</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="group relative mx-4 mt-4 flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-[#1E4A85]/20 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:16px_16px] transition hover:border-[#C4A35A]"
      >
        {busy ? (
          <Loader2 className="h-7 w-7 animate-spin text-[#1E4A85]" />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={title} className="max-h-36 max-w-[90%] object-contain" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <ImageUp className="h-7 w-7 text-[#1E4A85]/60" />
            Click to upload
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onPick(f);
        }}
      />

      <p className="px-4 pt-2 text-[11px] leading-relaxed text-muted-foreground">{hint} PNG / JPG / WEBP, max 2 MB.</p>
      <div className="mt-auto flex gap-2 p-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0B1F3A] px-3 py-2 text-xs font-bold text-white hover:bg-[#163A5C] disabled:opacity-50"
        >
          <ImageUp className="h-3.5 w-3.5" />
          {url ? "Replace" : "Upload"}
        </button>
        {url ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function DocumentSignaturesPage() {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) || 0;
  const isAdmin = roleId === 1 || roleId === 2;
  const isFranchiseAdmin = roleId === 3;

  const [franchiseId, setFranchiseId] = useState("");
  const [data, setData] = useState<SignaturesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [busySlot, setBusySlot] = useState<Slot | null>(null);
  const [names, setNames] = useState({ atcSignatoryName: "", coordinatorName: "" });
  const [savingNames, setSavingNames] = useState(false);

  const { data: franchisesData } = useSWR(isAdmin ? "/api/franchises?limit=200" : null, fetcher);
  const franchises = (
    Array.isArray(franchisesData)
      ? franchisesData
      : ((franchisesData as { items?: unknown[] } | null)?.items ??
        (franchisesData as { data?: unknown[] } | null)?.data ??
        [])
  ) as { id: string; name: string }[];

  const query = isAdmin ? (franchiseId ? `?franchiseId=${franchiseId}` : null) : isFranchiseAdmin ? "" : null;

  const apply = (res: SignaturesResponse) => {
    setData(res);
    setNames({
      atcSignatoryName: res.signatures.atcSignatoryName || "",
      coordinatorName: res.signatures.coordinatorName || "",
    });
  };

  const load = useCallback(async () => {
    if (query === null) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      apply(await fetcher<SignaturesResponse>(`/api/franchise/document-signatures${query}`));
    } catch (e) {
      await showError("Error", e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async (init: RequestInit, url = "/api/franchise/document-signatures") => {
    const res = await fetch(url, { credentials: "include", ...init });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) throw new Error(json.error || json.message || "Request failed");
    apply(json.data as SignaturesResponse);
  };

  const upload = async (slot: Slot, file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      await showError("Too large", "Image must be 2 MB or smaller.");
      return;
    }
    setBusySlot(slot);
    try {
      const fd = new FormData();
      fd.set("slot", slot);
      fd.set("file", file);
      if (isAdmin && data) fd.set("franchiseId", data.franchiseId);
      await send({ method: "POST", body: fd });
    } catch (e) {
      await showError("Upload failed", e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusySlot(null);
    }
  };

  const remove = async (slot: Slot) => {
    if (!window.confirm("Remove this image? It will disappear from newly printed documents.")) return;
    setBusySlot(slot);
    try {
      const qs = new URLSearchParams({ slot });
      if (isAdmin && data) qs.set("franchiseId", data.franchiseId);
      await send({ method: "DELETE" }, `/api/franchise/document-signatures?${qs}`);
    } catch (e) {
      await showError("Remove failed", e instanceof Error ? e.message : "Remove failed");
    } finally {
      setBusySlot(null);
    }
  };

  const saveNames = async () => {
    setSavingNames(true);
    try {
      await send({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...names, ...(isAdmin && data ? { franchiseId: data.franchiseId } : {}) }),
      });
      await showSuccess("Saved", "Names will print under the signatures.");
    } catch (e) {
      await showError("Save failed", e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingNames(false);
    }
  };

  if (user && !isAdmin && !isFranchiseAdmin) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Only centre admins can manage document signatures.</p>;
  }

  const s = data?.signatures ?? {};

  return (
    <div className="space-y-5 pb-6">
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0B1F3A] via-[#163A5C] to-[#0B1F3A] px-5 py-4 text-white shadow-md sm:px-6">
        <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/55">
          <Link href="/dashboard" className="hover:text-white/90">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/certificates/requests" className="hover:text-white/90">
            Certificates
          </Link>
          <span>/</span>
          <span className="text-white/80">Stamp &amp; Signatures</span>
        </nav>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Centre Stamp &amp; Signatures</h1>
        <p className="mt-1 max-w-3xl text-xs text-white/65 sm:text-sm">
          Upload your ATC stamp, authorised signature and Examination Coordinator signature. They print automatically
          on every student&apos;s Certificate of Completion and Statement of Marks (Result) - 3 from your centre.
        </p>
      </header>

      {isAdmin && (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-[#1E4A85]/12 bg-card p-4 shadow-sm">
          <label className="block min-w-[260px] flex-1">
            <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Building2 className="h-3.5 w-3.5 text-[#1E4A85]" />
              Franchise / ATC
            </span>
            <select
              value={franchiseId}
              onChange={(e) => setFranchiseId(e.target.value)}
              className="h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
            >
              <option value="">Select a franchise…</option>
              {franchises.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <p className="pb-2 text-xs text-muted-foreground">Admins can manage signatures for any centre.</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
        </div>
      ) : !data ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Select a franchise to manage its stamp and signatures.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-[#1E4A85]" />
            <span className="font-bold text-foreground">{data.franchiseName}</span>
            {s.updatedAt ? (
              <span className="text-xs text-muted-foreground">
                · last updated {new Date(s.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {SLOTS.map((cfg) => (
              <UploadCard
                key={cfg.slot}
                title={cfg.title}
                hint={cfg.hint}
                usedOn={cfg.usedOn}
                icon={cfg.icon}
                url={s[cfg.field] as string | undefined}
                busy={busySlot === cfg.slot}
                onPick={(f) => upload(cfg.slot, f)}
                onRemove={() => remove(cfg.slot)}
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-[#1E4A85]/12 bg-card p-4 shadow-sm">
              <p className="text-sm font-bold text-foreground">Names printed under signatures</p>
              <p className="text-[11px] text-muted-foreground">Optional — leave blank to print only the title.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold">ATC Authorised Signatory</span>
                  <input
                    value={names.atcSignatoryName}
                    maxLength={80}
                    onChange={(e) => setNames((n) => ({ ...n, atcSignatoryName: e.target.value }))}
                    placeholder="e.g. Rajesh Patel (Centre Head)"
                    className="h-9 w-full rounded-lg border border-border/70 bg-background px-2.5 text-sm outline-none focus:border-[#1E4A85]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold">Examination Coordinator</span>
                  <input
                    value={names.coordinatorName}
                    maxLength={80}
                    onChange={(e) => setNames((n) => ({ ...n, coordinatorName: e.target.value }))}
                    placeholder="e.g. Priya Shah"
                    className="h-9 w-full rounded-lg border border-border/70 bg-background px-2.5 text-sm outline-none focus:border-[#1E4A85]"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={saveNames}
                disabled={savingNames}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#C4A35A] px-4 py-2 text-xs font-bold text-[#0B1F3A] hover:bg-[#d4b56c] disabled:opacity-50"
              >
                {savingNames ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save names
              </button>
            </div>

            <div className="rounded-2xl border border-[#1E4A85]/12 bg-[#FBF7EE] p-4 shadow-sm">
              <p className="text-sm font-bold text-foreground">How it prints</p>
              <p className="text-[11px] text-muted-foreground">Preview of the signature row on the documents.</p>
              <div className="mt-3 grid grid-cols-2 gap-4 rounded-xl border border-[#C4A35A]/40 bg-white px-4 py-4">
                {[
                  {
                    label: "ATC Authorised Signatory",
                    name: names.atcSignatoryName || data.franchiseName,
                    stamp: s.atcStampUrl,
                    sig: s.atcSignatureUrl,
                  },
                  { label: "Examination Coordinator", name: names.coordinatorName, stamp: undefined, sig: s.coordinatorSignatureUrl },
                ].map((col) => (
                  <div key={col.label} className="flex flex-col items-center">
                    <div className="relative flex h-24 w-full items-end justify-center">
                      {col.stamp ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={col.stamp} alt="" className="absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 object-contain opacity-90" />
                      ) : null}
                      {col.sig ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={col.sig} alt="" className="relative z-[1] h-12 max-w-[150px] object-contain" />
                      ) : null}
                    </div>
                    <div className="w-full border-t-[1.5px] border-[#0B1F3A]" />
                    <p className="mt-1 text-center text-[9px] font-bold uppercase tracking-wider text-[#0B1F3A]">{col.label}</p>
                    <p className={cn("truncate text-center text-[10px] font-semibold text-slate-500", !col.name && "invisible")}>
                      {col.name || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
