"use client";

import { Children, Suspense, useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import ProtectedView from "@/components/verify/ProtectedView";
import { SectionLoader } from "@/components/common/PageLoader";
import { COUNCIL } from "@/components/userpanel/ui/council";
import { upButton } from "@/components/userpanel/ui/button";
import { useLogoConfig } from "@/hooks/useLogoConfig";
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarDays,
  FileText,
  Hash,
  Mail,
  MapPin,
  Phone,
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
  trainingStart?: string | null;
  trainingEnd?: string | null;
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

const FALLBACK_LOGO = "/logo/IVESDC%20LOGO-01.png";

function formatDate(iso?: string | null) {
  if (!iso) return null;
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function CouncilLogo({ className }: { className?: string }) {
  const { logoUrl, siteName } = useLogoConfig();
  const [src, setSrc] = useState(logoUrl || FALLBACK_LOGO);

  useEffect(() => {
    setSrc(logoUrl || FALLBACK_LOGO);
  }, [logoUrl]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={siteName && siteName !== "Edu Institute" ? siteName : COUNCIL.shortName}
      className={className}
      onError={() => setSrc(FALLBACK_LOGO)}
    />
  );
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
    <div className="flex gap-3 rounded-2xl border border-ive-line bg-white px-3.5 py-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ive-royal/10 text-ive-royal">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ive-slate">{label}</p>
        <p className="break-words text-sm font-semibold text-ive-navy">{value}</p>
      </div>
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: ReactNode }) {
  if (Children.toArray(children).length === 0) return null;
  return (
    <section>
      <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-ive-slate">{title}</h4>
      <div className="grid gap-2.5 sm:grid-cols-2">{children}</div>
    </section>
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
    <div className={compact ? "" : "rounded-[1.4rem] border border-ive-line bg-white p-5 shadow-[0_18px_50px_-28px_rgba(6,27,54,0.35)] sm:p-7"}>
      {!compact && (
        <div className="mb-5 text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-ive-navy text-ive-saffron shadow-lg">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h2 className="text-lg font-extrabold text-ive-navy">Verify a certificate or result</h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-ive-slate">
            Scan the QR code or barcode printed on the document, or type the enrollment / document number.
          </p>
        </div>
      )}
      <button type="button" onClick={onScan} className={upButton("navy", "lg", "w-full")}>
        <ScanLine className="h-5 w-5 text-ive-saffron" />
        Scan QR / Barcode with camera
      </button>
      <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ive-slate/70">
        <span className="h-px flex-1 bg-ive-line" />
        or enter number
        <span className="h-px flex-1 bg-ive-line" />
      </div>
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus={!compact}
          placeholder="Enrollment, certificate or marksheet number"
          className="h-12 min-w-0 flex-1 rounded-xl border border-ive-line bg-ive-mist/60 px-4 text-sm font-semibold uppercase tracking-wide text-ive-navy outline-none placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:border-ive-royal/40 focus:bg-white focus:ring-4 focus:ring-ive-royal/10"
        />
        <button type="submit" className={upButton("primary", "lg", "sm:px-6")}>
          <Search className="h-4 w-4" />
          Verify
        </button>
      </form>
      <p className="mt-3 text-[11px] text-ive-slate">USB barcode scanners work too — click the box and scan.</p>
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
    <div className="overflow-hidden rounded-[1.5rem] border border-ive-line bg-white shadow-[0_24px_60px_-32px_rgba(6,27,54,0.45)]">
      <div className={`relative bg-gradient-to-r ${banner.wrap} px-5 py-6 text-white sm:px-7`}>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/25">
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
                  className="h-32 w-28 rounded-2xl border-4 border-white object-cover shadow-lg ring-2 ring-ive-saffron"
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <div className="flex h-32 w-28 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-ive-navy to-ive-royal text-3xl font-bold text-ive-saffron shadow-lg ring-2 ring-ive-saffron">
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
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-ive-royal">{COUNCIL.shortName} registry</p>
              <h3 className="mt-1 text-2xl font-extrabold uppercase tracking-wide text-ive-navy">{doc.studentName}</h3>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                {doc.enrollmentNo && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ive-navy px-3 py-1 text-xs font-bold tracking-wide text-white">
                    <Hash className="h-3.5 w-3.5 text-ive-saffron" />
                    {doc.enrollmentNo}
                  </span>
                )}
                {doc.studentStatus && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      doc.studentStatus === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-700"
                        : doc.studentStatus === "ACTIVE"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {doc.studentStatus === "COMPLETED" ? "Course Completed" : doc.studentStatus === "ACTIVE" ? "Enrolled" : doc.studentStatus}
                  </span>
                )}
              </div>
              {doc.courseName && <p className="mt-3 text-sm font-semibold text-ive-slate">{doc.courseName}</p>}
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <DetailGroup title="Student">
              <Detail icon={<User className="h-4 w-4" />} label="Father / Husband" value={doc.fatherName} />
              <Detail icon={<User className="h-4 w-4" />} label="Mother" value={doc.motherName} />
            </DetailGroup>
            <DetailGroup title="Programme">
              <Detail icon={<BookOpen className="h-4 w-4" />} label="Course code" value={doc.courseCode && doc.courseCode.length <= 20 ? doc.courseCode : null} />
              <Detail icon={<CalendarDays className="h-4 w-4" />} label="Duration" value={doc.duration} />
              <Detail icon={<CalendarDays className="h-4 w-4" />} label="Session" value={doc.session} />
              <Detail icon={<CalendarDays className="h-4 w-4" />} label="Training start" value={formatDate(doc.trainingStart)} />
              <Detail icon={<CalendarDays className="h-4 w-4" />} label="Training end" value={formatDate(doc.trainingEnd)} />
            </DetailGroup>
            <DetailGroup title="Training centre">
              <Detail icon={<Building2 className="h-4 w-4" />} label="Centre (ATC)" value={doc.centreName} />
              <Detail icon={<Hash className="h-4 w-4" />} label="ATC code" value={doc.centreCode} />
              <Detail icon={<MapPin className="h-4 w-4" />} label="Location" value={doc.centreLocation} />
            </DetailGroup>
            <DetailGroup title="Document">
              <Detail icon={<FileText className="h-4 w-4" />} label="Document number" value={doc.certificateNumber} />
              <Detail icon={<CalendarDays className="h-4 w-4" />} label="Issue date" value={formatDate(doc.issueDate)} />
              <Detail icon={<ShieldCheck className="h-4 w-4" />} label="Record status" value={doc.status} />
            </DetailGroup>
          </div>

          {docType === "student" && verified && (
            <p className="mt-6 flex items-center gap-2 rounded-2xl border border-ive-saffron/30 bg-[#FFF6EB] px-4 py-3 text-xs font-semibold text-[#9A4E00]">
              <ScanLine className="h-4 w-4 shrink-0" />
              Student identity verified. Scan the Marksheet No. barcode or QR code on the result to view marks.
            </p>
          )}

          {doc.result && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-ive-line">
              <div className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-ive-navy to-ive-royal px-5 py-4 text-white">
                <Award className="h-6 w-6 text-ive-saffron" />
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
                        ? "border-ive-saffron bg-ive-saffron/15 text-[#FFD7A8]"
                        : "border-rose-300 bg-rose-500/20 text-rose-100"
                    }`}
                  >
                    {doc.result.status}
                  </span>
                )}
              </div>
              {doc.result.division && (
                <p className="border-b border-ive-line bg-ive-mist px-5 py-2 text-xs font-semibold text-ive-navy">
                  Division: {doc.result.division}
                </p>
              )}
              {doc.subjects && doc.subjects.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-ive-mist text-left text-[10px] font-bold uppercase tracking-wider text-ive-slate">
                      <tr>
                        <th className="px-4 py-2.5">#</th>
                        <th className="px-2 py-2.5">Subject</th>
                        <th className="px-2 py-2.5 text-right">Max</th>
                        <th className="px-4 py-2.5 text-right">Obtained</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doc.subjects.map((s, i) => (
                        <tr key={`${s.code}-${i}`} className="border-t border-ive-line">
                          <td className="px-4 py-2.5 text-xs text-ive-slate">{i + 1}</td>
                          <td className="px-2 py-2.5 font-semibold text-ive-navy">{s.name}</td>
                          <td className="px-2 py-2.5 text-right tabular-nums text-ive-slate">{s.max}</td>
                          <td className="px-4 py-2.5 text-right font-bold tabular-nums text-ive-navy">{s.obtained}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ive-mist px-4 py-3 text-[11px] text-ive-slate">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-ive-saffron" />
              Checked against the {COUNCIL.shortName} registry on{" "}
              {checkedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </span>
            {payload.reason && !verified ? <span className="font-mono">Code: {payload.reason}</span> : null}
          </div>
        </div>
      ) : (
        <div className="space-y-2 p-5 text-sm text-ive-slate sm:p-7">
          {query.enr && (
            <p>
              <span className="font-semibold text-ive-navy">Enrollment:</span> {query.enr}
            </p>
          )}
          {query.id && (
            <p>
              <span className="font-semibold text-ive-navy">Document number:</span> {query.id}
            </p>
          )}
          <p className="pt-2 text-xs leading-relaxed">
            Check that the number is typed correctly. If you believe this document is genuine, contact the training centre or {COUNCIL.shortName} on{" "}
            <a href={`tel:+91${COUNCIL.helpline}`} className="font-semibold text-ive-royal hover:underline">
              +91 {COUNCIL.helpline}
            </a>
            .
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
    <div className="userpanel min-h-screen bg-[#F4F7FB] text-ive-navy">
      <header className="border-b border-ive-line bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/verify" className="min-w-0">
            <CouncilLogo className="h-14 w-auto max-w-[min(16rem,58vw)] object-contain object-left sm:h-[4.5rem]" />
          </Link>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ive-saffron">Official portal</p>
            <p className="text-sm font-extrabold text-ive-navy">Document verification</p>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-ive-saffron via-white to-ive-emerald" />
      </header>

      <section className="bg-gradient-to-br from-ive-navy via-[#0A2748] to-ive-royal">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FFB15C]">{COUNCIL.shortName}</p>
          <h1 className="mt-2 max-w-xl text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Official document <span className="text-ive-saffron">verification</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/75">{COUNCIL.fullName}</p>
          <p className="mt-1 text-sm text-white/60">{COUNCIL.mission}</p>
        </div>
      </section>

      <main className="mx-auto -mt-6 max-w-3xl px-4 pb-10 sm:px-6">
        {!hasQuery ? (
          <SearchPanel onScan={() => setScanning(true)} />
        ) : (
          <div className="space-y-5">
            {loading ? (
              <div className="rounded-[1.4rem] border border-ive-line bg-white text-center shadow-[0_18px_50px_-28px_rgba(6,27,54,0.35)]">
                <SectionLoader text="Checking the IVESDC registry..." />
              </div>
            ) : error ? (
              <div className="rounded-[1.4rem] border border-rose-200 bg-white px-6 py-10 text-center shadow-sm">
                <XCircle className="mx-auto h-10 w-10 text-rose-500" />
                <p className="mt-2 text-lg font-extrabold text-ive-navy">Verification unavailable</p>
                <p className="text-sm text-ive-slate">{error}</p>
              </div>
            ) : payload ? (
              <ProtectedView
                watermark={`${COUNCIL.shortName} VERIFICATION • ${payload.document?.enrollmentNo || enr || id} • ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`}
              >
                <ResultCard key={`${type}|${enr}|${id}`} payload={payload} query={{ type, enr, id }} />
              </ProtectedView>
            ) : null}

            <div className="rounded-[1.4rem] border border-ive-line bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-extrabold text-ive-navy">Verify another document</p>
              <SearchPanel compact onScan={() => setScanning(true)} />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-ive-line bg-white">
        <div className="mx-auto grid max-w-3xl gap-4 px-4 py-6 text-sm text-ive-slate sm:grid-cols-2 sm:px-6">
          <div>
            <p className="font-extrabold text-ive-navy">{COUNCIL.fullName}</p>
            <p className="mt-1 flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ive-saffron" />
              {COUNCIL.address}
            </p>
            <p className="mt-1 text-xs">CIN: {COUNCIL.cin}</p>
          </div>
          <div className="sm:text-right">
            <a href={`tel:+91${COUNCIL.helpline}`} className="inline-flex items-center gap-2 font-semibold text-ive-navy hover:text-ive-royal">
              <Phone className="h-4 w-4 text-ive-saffron" />
              +91 {COUNCIL.helpline}
            </a>
            <a href={`mailto:${COUNCIL.email}`} className="mt-1 flex items-center gap-2 hover:text-ive-royal sm:justify-end">
              <Mail className="h-4 w-4 text-ive-royal" />
              {COUNCIL.email}
            </a>
            <Link href="/userpanel" className="mt-3 inline-block text-xs font-bold text-ive-royal hover:underline">
              Back to website
            </Link>
          </div>
        </div>
      </footer>

      {scanning && <VerifyScanner onResult={onScanResult} onClose={() => setScanning(false)} />}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#F4F7FB] text-ive-navy">Loading verification…</div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
