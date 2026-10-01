"use client";

import { Suspense, useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarDays,
  FileText,
  Hash,
  Loader2,
  MapPin,
  ScanLine,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

const VerifyScanner = dynamic(() => import("@/components/verify/VerifyScanner"), { ssr: false });

type VerifyDoc = {
  type?: string;
  certificateNumber?: string | null;
  status?: string;
  issueDate?: string | null;
  studentName?: string;
  fatherName?: string | null;
  motherName?: string | null;
  photoUrl?: string | null;
  enrollmentNo?: string | null;
  studentStatus?: string;
  courseName?: string | null;
  courseCode?: string | null;
  duration?: string | null;
  session?: string | null;
  centreName?: string | null;
  centreCode?: string | null;
  centreLocation?: string | null;
  result?: {
    percent: number;
    grade: string | null;
    gradeLabel: string | null;
    division: string | null;
    status: string | null;
  } | null;
  subjects?: { code: string; name: string; max: number; obtained: number }[];
};

type VerifyPayload = {
  verified: boolean;
  reason?: string;
  message?: string;
  query?: { type?: string; enr?: string | null; id?: string | null };
  document?: VerifyDoc;
};

const DOC_LABEL: Record<string, string> = {
  cert: "Certificate of Completion",
  ms: "Statement of Marks (Result)",
  student: "Student Enrollment",
};

function formatDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** Turns any scanned text (QR URL, document number, enrollment barcode) into verify query params. */
function paramsFromScan(raw: string): URLSearchParams | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    const short = /^\/v\/(m|c)\/([^/]+)(?:\/(.+))?$/i.exec(url.pathname);
    if (short) {
      const qs = new URLSearchParams({ type: short[1].toLowerCase() === "c" ? "cert" : "ms", enr: decodeURIComponent(short[2]) });
      if (short[3]) qs.set("id", decodeURIComponent(short[3]));
      return qs;
    }
    if (url.searchParams.get("enr") || url.searchParams.get("id")) return url.searchParams;
  } catch {
    // not a URL
  }
  const qs = new URLSearchParams();
  if (/^IVESDC\//i.test(text)) {
    qs.set("id", text.toUpperCase());
  } else if (/^\d{5}$/.test(text)) {
    qs.set("type", "ms");
    qs.set("id", text);
  } else {
    qs.set("type", "student");
    qs.set("enr", text.toUpperCase());
  }
  return qs;
}

function initials(name?: string) {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 rounded-xl border border-[#0B1F3A]/[0.07] bg-white/70 px-3.5 py-2.5">
      <span className="mt-0.5 shrink-0 text-[#B8922A]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="break-words text-sm font-semibold text-[#0B1F3A]">{value}</p>
      </div>
    </div>
  );
}

function SearchPanel({ onScan, compact }: { onScan: () => void; compact?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const qs = paramsFromScan(value);
    if (qs) router.push(`/verify?${qs.toString()}`);
  };

  return (
    <div className={compact ? "" : "rounded-3xl border border-[#0B1F3A]/10 bg-white/80 p-5 shadow-xl shadow-[#0B1F3A]/5 backdrop-blur sm:p-7"}>
      {!compact && (
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1F3A] to-[#1E4A85] text-[#E8C46A] shadow-lg">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-[#0B1F3A]">Verify a certificate or result</h2>
          <p className="mt-1 text-sm text-slate-600">
            Scan the QR code or barcode printed on the document, or type the enrollment / document number.
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={onScan}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0B1F3A] to-[#1E4A85] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0B1F3A]/20 transition hover:brightness-110"
      >
        <ScanLine className="h-5 w-5 text-[#E8C46A]" />
        Scan QR / Barcode with camera
      </button>
      <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or enter number
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus={!compact}
          placeholder="e.g. STU-2026-000001 or Marksheet No. 00001"
          className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold uppercase tracking-wide text-[#0B1F3A] outline-none placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:border-[#B8922A] focus:ring-2 focus:ring-[#E8C46A]/40"
        />
        <button
          type="submit"
          className="inline-flex h-12 items-center gap-1.5 rounded-xl bg-[#B8922A] px-4 text-sm font-bold text-white hover:bg-[#a5821f]"
        >
          <Search className="h-4 w-4" />
          Verify
        </button>
      </form>
      <p className="mt-2 text-[11px] text-slate-500">USB barcode scanners work too — click the box and scan.</p>
    </div>
  );
}

function ResultCard({ payload, query }: { payload: VerifyPayload; query: { type: string; enr: string; id: string } }) {
  const doc = payload.document;
  const verified = payload.verified;
  const hasStudent = Boolean(doc?.studentName);
  const tone = verified ? "ok" : hasStudent ? "warn" : "bad";
  const docType = doc?.type || query.type;
  const [checkedAt] = useState(() => new Date());
  const [photoFailed, setPhotoFailed] = useState(false);

  const banner = {
    ok: {
      wrap: "from-emerald-600 via-emerald-500 to-teal-500",
      icon: <BadgeCheck className="h-9 w-9" />,
      title: "Verified — Authentic",
    },
    warn: {
      wrap: "from-amber-500 via-amber-500 to-orange-500",
      icon: <AlertTriangle className="h-9 w-9" />,
      title: "Not verified",
    },
    bad: {
      wrap: "from-rose-600 via-rose-500 to-red-500",
      icon: <XCircle className="h-9 w-9" />,
      title: "Not found",
    },
  }[tone];

  return (
    <div className="overflow-hidden rounded-3xl border border-[#0B1F3A]/10 bg-[#FFFDF8] shadow-2xl shadow-[#0B1F3A]/10">
      <div className={`relative bg-gradient-to-r ${banner.wrap} px-5 py-6 text-white sm:px-7`}>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/20 ring-4 ring-white/30">
            {banner.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">{DOC_LABEL[docType] || "Document"}</p>
            <h2 className="text-2xl font-extrabold leading-tight">{banner.title}</h2>
            <p className="mt-1 text-sm text-white/90">{payload.message}</p>
          </div>
        </div>
      </div>

      {hasStudent && doc ? (
        <div className="p-5 sm:p-7">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="relative shrink-0">
              {doc.photoUrl && !photoFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doc.photoUrl}
                  alt={doc.studentName}
                  className="h-32 w-28 rounded-2xl border-4 border-white object-cover shadow-lg ring-2 ring-[#E8C46A]"
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <div className="flex h-32 w-28 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-[#0B1F3A] to-[#1E4A85] text-3xl font-bold text-[#E8C46A] shadow-lg ring-2 ring-[#E8C46A]">
                  {initials(doc.studentName)}
                </div>
              )}
              {verified && (
                <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md ring-4 ring-white">
                  <BadgeCheck className="h-5 w-5" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-2xl font-extrabold uppercase tracking-wide text-[#0B1F3A]">{doc.studentName}</h3>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                {doc.enrollmentNo && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#0B1F3A] px-3 py-1 text-xs font-bold tracking-wide text-[#E8C46A]">
                    <Hash className="h-3.5 w-3.5" />
                    {doc.enrollmentNo}
                  </span>
                )}
                {doc.studentStatus && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      doc.studentStatus === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700"
                        : doc.studentStatus === "ACTIVE"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {doc.studentStatus === "COMPLETED" ? "Course Completed" : doc.studentStatus === "ACTIVE" ? "Enrolled" : doc.studentStatus}
                  </span>
                )}
              </div>
              {doc.courseName && <p className="mt-3 text-sm font-semibold text-slate-700">{doc.courseName}</p>}
            </div>
          </div>

          <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
            <Detail icon={<User className="h-4 w-4" />} label="Father / Husband" value={doc.fatherName} />
            <Detail icon={<User className="h-4 w-4" />} label="Mother" value={doc.motherName} />
            <Detail icon={<BookOpen className="h-4 w-4" />} label="Course code" value={doc.courseCode && doc.courseCode.length <= 20 ? doc.courseCode : null} />
            <Detail icon={<CalendarDays className="h-4 w-4" />} label="Duration" value={doc.duration} />
            <Detail icon={<CalendarDays className="h-4 w-4" />} label="Session" value={doc.session} />
            <Detail icon={<Building2 className="h-4 w-4" />} label="Training centre (ATC)" value={doc.centreName} />
            <Detail icon={<Hash className="h-4 w-4" />} label="ATC code" value={doc.centreCode} />
            <Detail icon={<MapPin className="h-4 w-4" />} label="Centre location" value={doc.centreLocation} />
            <Detail icon={<FileText className="h-4 w-4" />} label="Document number" value={doc.certificateNumber} />
            <Detail icon={<CalendarDays className="h-4 w-4" />} label="Issue date" value={formatDate(doc.issueDate)} />
          </div>

          {doc.result && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-[#B8922A]/30">
              <div className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-[#0B1F3A] to-[#1E4A85] px-5 py-4 text-white">
                <Award className="h-6 w-6 text-[#E8C46A]" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Result</p>
                  <p className="text-2xl font-extrabold">{doc.result.percent.toFixed(2)}%</p>
                </div>
                {doc.result.grade && doc.result.grade !== "—" && (
                  <div className="border-l border-white/20 pl-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Grade</p>
                    <p className="text-lg font-bold">
                      {doc.result.grade}
                      {doc.result.gradeLabel && doc.result.gradeLabel !== "—" ? (
                        <span className="ml-1 text-sm font-medium text-white/80">({doc.result.gradeLabel})</span>
                      ) : null}
                    </p>
                  </div>
                )}
                {doc.result.status && doc.result.status !== "—" && (
                  <span
                    className={`ml-auto rounded-full border px-4 py-1 text-sm font-extrabold tracking-wider ${
                      doc.result.status === "PASS"
                        ? "border-[#E8C46A] bg-[#E8C46A]/15 text-[#F6DE9A]"
                        : "border-rose-300 bg-rose-500/20 text-rose-100"
                    }`}
                  >
                    {doc.result.status}
                  </span>
                )}
              </div>
              {doc.result.division && (
                <p className="border-b border-[#B8922A]/20 bg-[#FBF5E6] px-5 py-2 text-xs font-semibold text-[#6B5414]">
                  Division: {doc.result.division}
                </p>
              )}
              {doc.subjects && doc.subjects.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#FBF5E6] text-left text-[10px] font-bold uppercase tracking-wider text-[#6B5414]">
                      <tr>
                        <th className="px-4 py-2">#</th>
                        <th className="px-2 py-2">Subject</th>
                        <th className="px-2 py-2 text-right">Max</th>
                        <th className="px-4 py-2 text-right">Obtained</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doc.subjects.map((s, i) => (
                        <tr key={`${s.code}-${i}`} className="border-t border-[#B8922A]/10">
                          <td className="px-4 py-2 text-xs text-slate-500">{i + 1}</td>
                          <td className="px-2 py-2 font-semibold text-[#0B1F3A]">{s.name}</td>
                          <td className="px-2 py-2 text-right tabular-nums text-slate-600">{s.max}</td>
                          <td className="px-4 py-2 text-right font-bold tabular-nums text-[#0B1F3A]">{s.obtained}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#0B1F3A]/[0.04] px-4 py-3 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#B8922A]" />
              Checked against the IVESDC registry on{" "}
              {checkedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </span>
            {payload.reason && !verified ? <span className="font-mono">Code: {payload.reason}</span> : null}
          </div>
        </div>
      ) : (
        <div className="space-y-1 p-5 text-sm text-slate-600 sm:p-7">
          {query.enr && (
            <p>
              <span className="font-semibold text-[#0B1F3A]">Enrollment:</span> {query.enr}
            </p>
          )}
          {query.id && (
            <p>
              <span className="font-semibold text-[#0B1F3A]">Document number:</span> {query.id}
            </p>
          )}
          <p className="pt-2 text-xs text-slate-500">
            Check that the number is typed correctly. If you believe this document is genuine, contact the training
            centre or IVESDC.
          </p>
        </div>
      )}
    </div>
  );
}

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = (searchParams?.get("type") || "ms").toLowerCase();
  const enr = searchParams?.get("enr") || "";
  const id = searchParams?.get("id") || "";
  const hasQuery = Boolean(enr || id);

  const [loading, setLoading] = useState(hasQuery);
  const [payload, setPayload] = useState<VerifyPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!hasQuery) {
      setLoading(false);
      setPayload(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        qs.set("type", type === "cert" ? "cert" : type === "student" ? "student" : "ms");
        if (enr) qs.set("enr", enr);
        if (id) qs.set("id", id);
        const res = await fetch(`/api/certificates/verify?${qs.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setError(json.error || "Verification failed");
          setPayload(null);
        } else {
          setPayload(json.data as VerifyPayload);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to reach the verification service. Please try again.");
          setPayload(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasQuery, type, enr, id]);

  const onScanResult = useCallback(
    (text: string) => {
      setScanning(false);
      const qs = paramsFromScan(text);
      if (qs) router.push(`/verify?${qs.toString()}`);
    },
    [router]
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(184,146,42,0.22),transparent_60%),linear-gradient(165deg,#f6f1e6_0%,#ece4d2_50%,#e3d8c2_100%)] text-[#0B1F3A]">
      <div className="mx-auto max-w-2xl px-4 pb-14 pt-8 sm:pt-12">
        <header className="mb-7 text-center">
          <Link href="/verify" className="inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo/IVESDC LOGO-01.png" alt="IVESDC" className="mx-auto h-16 w-auto object-contain sm:h-20" />
          </Link>
          <h1 className="mt-3 text-xl font-extrabold tracking-wide sm:text-2xl">Official Document Verification</h1>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            Institute of Vocational Education &amp; Skill Development Council
          </p>
        </header>

        {!hasQuery ? (
          <SearchPanel onScan={() => setScanning(true)} />
        ) : (
          <div className="space-y-5">
            {loading ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-[#0B1F3A]/10 bg-white/80 px-6 py-16 text-center shadow-xl">
                <Loader2 className="h-10 w-10 animate-spin text-[#B8922A]" />
                <p className="text-lg font-bold">Verifying…</p>
                <p className="text-sm text-slate-600">Checking the IVESDC registry for this document.</p>
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-rose-200 bg-white/90 px-6 py-10 text-center shadow-xl">
                <XCircle className="mx-auto h-10 w-10 text-rose-500" />
                <p className="mt-2 text-lg font-bold">Verification unavailable</p>
                <p className="text-sm text-slate-600">{error}</p>
              </div>
            ) : payload ? (
              <ResultCard key={`${type}|${enr}|${id}`} payload={payload} query={{ type, enr, id }} />
            ) : null}

            <div className="rounded-3xl border border-[#0B1F3A]/10 bg-white/70 p-5 shadow-lg backdrop-blur">
              <p className="mb-3 text-sm font-bold">Verify another document</p>
              <SearchPanel compact onScan={() => setScanning(true)} />
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-slate-500">
          Official verification portal of IVESDC ·{" "}
          <Link href="/" className="font-semibold text-[#0B1F3A] hover:underline">
            Home
          </Link>
        </p>
      </div>

      {scanning && <VerifyScanner onResult={onScanResult} onClose={() => setScanning(false)} />}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#f4efe4] text-[#132a4a]">Loading verification…</div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
