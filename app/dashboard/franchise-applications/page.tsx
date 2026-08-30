"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Download,
  X,
  RefreshCw,
  Building2,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Loader2,
  ExternalLink,
  AlertTriangle,
  ImageIcon,
  IndianRupee,
  Copy,
  Link2,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface Doc {
  key: string;
  url: string;
  name: string;
  type: string;
  label: string;
}

interface Application {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  alternatePhone?: string | null;
  instituteName: string;
  businessType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  planId?: number | null;
  planName?: string | null;
  message?: string | null;
  documents: Doc[];
  status: string;
  adminNotes?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

type ExpectedDoc = { key: string; label: string; required: boolean };

const INDIVIDUAL_EXPECTED: ExpectedDoc[] = [
  { key: "pan", label: "PAN Card", required: true },
  { key: "aadhar", label: "Aadhaar Card", required: true },
  { key: "photo", label: "Applicant Photo", required: true },
  { key: "signature", label: "Signature", required: true },
  { key: "logo", label: "Institute Logo", required: false },
  { key: "centre_photo", label: "Centre Photo", required: false },
];

const ENTITY_EXPECTED: ExpectedDoc[] = [
  ...INDIVIDUAL_EXPECTED,
  { key: "udyam", label: "Udyam / MSME", required: false },
  { key: "entity_reg", label: "Entity Registration + GST", required: false },
  { key: "bank", label: "Bank Passbook / Cheque", required: false },
  { key: "stamp", label: "Institute Stamp", required: false },
];

const DOC_LABELS: Record<string, string> = Object.fromEntries(
  [...INDIVIDUAL_EXPECTED, ...ENTITY_EXPECTED].map((d) => [d.key, d.label])
);

function normalizeDocuments(raw: unknown): Doc[] {
  let value: unknown = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  if (!value) return [];

  const list: unknown[] = Array.isArray(value)
    ? value
    : typeof value === "object"
      ? Object.values(value as Record<string, unknown>)
      : [];

  return list
    .map((item, index): Doc | null => {
      if (!item || typeof item !== "object") return null;
      const d = item as Record<string, unknown>;
      const url = String(d.url || d.path || d.fileUrl || "").trim();
      if (!url) return null;
      const key = String(d.key || d.docType || d.type || `doc_${index}`);
      const mime = String(d.type || d.mimeType || "");
      const isImage =
        mime.startsWith("image/") ||
        /\.(jpe?g|png|webp|gif)$/i.test(url) ||
        /\.(jpe?g|png|webp|gif)$/i.test(String(d.name || ""));
      return {
        key,
        url,
        name: String(d.name || d.fileName || key),
        type: mime || (isImage ? "image/jpeg" : "application/pdf"),
        label: String(d.label || DOC_LABELS[key] || key),
      };
    })
    .filter((d): d is Doc => !!d);
}

function expectedDocsFor(businessType: string): ExpectedDoc[] {
  const t = (businessType || "").toUpperCase();
  if (t === "INDIVIDUAL" || t === "PROPRIETOR") return INDIVIDUAL_EXPECTED;
  return ENTITY_EXPECTED;
}

function isImageDoc(doc: Doc) {
  return (
    doc.type?.startsWith("image/") ||
    /\.(jpe?g|png|webp|gif)$/i.test(doc.url) ||
    /\.(jpe?g|png|webp|gif)$/i.test(doc.name)
  );
}

const STATUS_FILTERS = ["ALL", "PENDING", "VERIFIED", "APPROVED", "REJECTED"] as const;

const STATUS_CONFIG: Record<
  string,
  { label: string; chip: string; icon: typeof Clock }
> = {
  PENDING: {
    label: "Pending",
    chip: "bg-amber-500/15 text-amber-800 border-amber-200/80",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    chip: "bg-emerald-500/15 text-emerald-800 border-emerald-200/80",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Rejected",
    chip: "bg-red-500/15 text-red-700 border-red-200/80",
    icon: XCircle,
  },
  VERIFIED: {
    label: "Verified",
    chip: "bg-[#1E4A85]/10 text-[#1E4A85] border-[#1E4A85]/20",
    icon: ShieldCheck,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        cfg.chip
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

export default function FranchiseApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [counts, setCounts] = useState({
    total: 0,
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    VERIFIED: 0,
  });
  const [selected, setSelected] = useState<Application | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [docPreview, setDocPreview] = useState<Doc | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [paymentOrders, setPaymentOrders] = useState<
    Array<{ orderId: string; amount: number; status: string; splitApplied: boolean; createdAt: string }>
  >([]);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [feeAmount, setFeeAmount] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, pageSize]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/franchise-applications?${params}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        const items = (data.data.items || []).map((item: Application & { documents?: unknown }) => ({
          ...item,
          documents: normalizeDocuments(item.documents),
        }));
        setApps(items);
        const pag = data.data.pagination || {};
        setTotal(pag.total || 0);
        setTotalPages(pag.totalPages || 0);
        if (data.data.counts) {
          setCounts({
            total: data.data.counts.total || 0,
            PENDING: data.data.counts.PENDING || 0,
            APPROVED: data.data.counts.APPROVED || 0,
            REJECTED: data.data.counts.REJECTED || 0,
            VERIFIED: data.data.counts.VERIFIED || 0,
          });
        }
      }
    } catch {
      showError("Error", "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/franchise-applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        showError("Error", data.error || "Failed");
        return;
      }
      showSuccess("Updated", `Application ${status.toLowerCase()}.`);
      setSelected(null);
      void load();
    } catch {
      showError("Error", "Network error");
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (app: Application) => {
    setSelected({ ...app, documents: normalizeDocuments(app.documents) });
    setNotes(app.adminNotes || "");
    setBrokenImages({});
    setPaymentLink(null);
    setFeeAmount("");
    setDetailLoading(true);
    try {
      const [detailRes, payRes] = await Promise.all([
        fetch(`/api/admin/franchise-applications/${app.id}`, { credentials: "include" }),
        fetch(`/api/admin/franchise-sale/create-order?applicationId=${app.id}`, {
          credentials: "include",
        }),
      ]);
      const data = await detailRes.json();
      if (detailRes.ok && data?.data) {
        const full = {
          ...data.data,
          documents: normalizeDocuments(data.data.documents),
        } as Application;
        setSelected(full);
        setNotes(full.adminNotes || "");
      }
      const payJson = await payRes.json();
      if (payRes.ok && payJson.data?.orders) {
        setPaymentOrders(payJson.data.orders);
        const pending = payJson.data.orders.find((o: { status: string }) => o.status === "PENDING");
        if (pending) {
          const base = typeof window !== "undefined" ? window.location.origin : "";
          setPaymentLink(`${base}/userpanel/franchise-payment/pay?order_id=${pending.orderId}`);
        }
      } else {
        setPaymentOrders([]);
      }
    } catch {
      // keep list snapshot
    } finally {
      setDetailLoading(false);
    }
  };

  const createPaymentLink = async () => {
    if (!selected) return;
    if (!selected.planId) {
      showError("Plan required", "Applicant ne plan select nahi kiya. Pehle plan assign karein.");
      return;
    }
    setCreatingPayment(true);
    try {
      const res = await fetch("/api/admin/franchise-sale/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          applicationId: selected.id,
          planId: selected.planId,
          amount: feeAmount ? Number(feeAmount) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showError("Payment link failed", json.error || "Could not create link");
        return;
      }
      setPaymentLink(json.data.paymentUrl);
      showSuccess(
        "Payment link ready",
        "Franchise owner ko yeh link bhejein — fee institute owner ke account mein jayegi."
      );
      const payRes = await fetch(
        `/api/admin/franchise-sale/create-order?applicationId=${selected.id}`,
        { credentials: "include" }
      );
      const payJson = await payRes.json();
      if (payRes.ok) setPaymentOrders(payJson.data?.orders || []);
    } catch {
      showError("Error", "Network error");
    } finally {
      setCreatingPayment(false);
    }
  };

  const copyPaymentLink = async () => {
    if (!paymentLink) return;
    try {
      await navigator.clipboard.writeText(paymentLink);
      showSuccess("Copied", "Payment link copied");
    } catch {
      showError("Copy failed", paymentLink);
    }
  };

  const docs = useMemo(
    () => (selected ? normalizeDocuments(selected.documents) : []),
    [selected]
  );

  const expectedDocs = useMemo(
    () => (selected ? expectedDocsFor(selected.businessType) : []),
    [selected]
  );

  const docsByKey = useMemo(() => {
    const map = new Map<string, Doc>();
    for (const d of docs) map.set(d.key, d);
    return map;
  }, [docs]);

  const uploadedExpected = expectedDocs.filter((e) => docsByKey.has(e.key)).length;
  const missingRequired = expectedDocs.filter((e) => e.required && !docsByKey.has(e.key));
  const extraDocs = docs.filter((d) => !expectedDocs.some((e) => e.key === d.key));

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set<number>([1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages));
    return Array.from(set).sort((a, b) => a - b);
  }, [page, totalPages]);

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <header className="overflow-hidden rounded-2xl border border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] text-white shadow-md shadow-[#1E4A85]/15">
        <div className="flex flex-col gap-4 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav className="mb-1.5 flex flex-wrap items-center gap-1 text-[11px] text-white/55">
              <Link href="/dashboard" className="hover:text-white/90">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-white/80">Franchise Applications</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Franchise Applications
              </h1>
              <span className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#E8D5A3] sm:inline-flex">
                <FileText className="h-3 w-3" />
                KYC Review
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs text-white/60 sm:text-sm">
              Verify documents, notes, and approve or reject applicants
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                  Total
                </p>
                <p className="font-bold tabular-nums leading-tight">{counts.total}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-[#E8D5A3]/70">
                  Pending
                </p>
                <p className="font-bold tabular-nums leading-tight text-[#F5E6C8]">
                  {counts.PENDING}
                </p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-sky-200/80">
                  Verified
                </p>
                <p className="font-bold tabular-nums leading-tight text-sky-100">
                  {counts.VERIFIED}
                </p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-200/80">
                  Approved
                </p>
                <p className="font-bold tabular-nums leading-tight text-emerald-100">
                  {counts.APPROVED}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.04] to-transparent px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, institute…"
              className="h-9 w-full rounded-lg border border-border/70 bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
            />
          </div>
          <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border/60 bg-muted/30 p-0.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition",
                  statusFilter === s
                    ? "bg-[#1E4A85] text-white shadow-sm"
                    : "text-muted-foreground hover:text-[#1E4A85]"
                )}
              >
                {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                {s !== "ALL" && (
                  <span className="ml-1 opacity-70">
                    {counts[s as keyof typeof counts] ?? 0}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
            </div>
          ) : apps.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E4A85]/10 text-[#1E4A85]">
                <FileText className="h-6 w-6" />
              </div>
              <p className="font-semibold text-foreground">No applications found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {debouncedSearch || statusFilter !== "ALL"
                  ? "Try changing search or status filter"
                  : "New franchise applications will appear here"}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[820px] text-sm">
              <thead className="sticky top-0 z-[1] border-b border-[#1E4A85]/10 bg-[#1E4A85]/[0.04]">
                <tr>
                  {["Applicant", "Institute", "Location", "Type", "Docs", "Status", "Applied", ""].map(
                    (h) => (
                      <th
                        key={h || "actions"}
                        className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[#1E4A85]/70"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {apps.map((app, i) => {
                  const docCount = Array.isArray(app.documents) ? app.documents.length : 0;
                  return (
                    <motion.tr
                      key={app.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.2) }}
                      className="border-b border-border/50 transition-colors hover:bg-[#1E4A85]/[0.03]"
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-foreground">{app.fullName}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {app.email}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {app.phone}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1E4A85]/10 text-[#1E4A85]">
                            <Building2 className="h-3.5 w-3.5" />
                          </span>
                          <div>
                            <p className="font-medium text-foreground">{app.instituteName}</p>
                            {app.planName && (
                              <p className="text-[11px] font-semibold text-[#C4A35A]">
                                {app.planName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3 text-[#1E4A85]" />
                          {[app.city, app.state].filter(Boolean).join(", ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                          {app.businessType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-md border border-[#1E4A85]/15 bg-[#1E4A85]/5 px-2 py-0.5 text-[11px] font-semibold text-[#1E4A85]">
                          <FileText className="h-3 w-3" />
                          {docCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                        {new Date(app.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openDetail(app)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4A85] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#163A6B]"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {total > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#1E4A85]/10 bg-[#1E4A85]/[0.02] px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {Math.min((page - 1) * pageSize + 1, total)}
                </span>
                –
                <span className="font-semibold text-foreground">
                  {Math.min(page * pageSize, total)}
                </span>{" "}
                of <span className="font-semibold text-foreground">{total}</span>
              </span>
              <label className="inline-flex items-center gap-1.5">
                <span>Rows</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 rounded-md border border-border/70 bg-background px-2 text-xs font-semibold outline-none focus:border-[#1E4A85]"
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 disabled:opacity-40"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border/70 px-2.5 text-xs font-semibold disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </button>
              {pageNumbers.map((n, idx) => {
                const prev = pageNumbers[idx - 1];
                const showGap = prev != null && n - prev > 1;
                return (
                  <span key={n} className="inline-flex items-center">
                    {showGap && <span className="px-1 text-muted-foreground">…</span>}
                    <button
                      type="button"
                      onClick={() => setPage(n)}
                      className={cn(
                        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold",
                        n === page
                          ? "bg-[#1E4A85] text-white"
                          : "border border-border/70 hover:border-[#1E4A85]/40"
                      )}
                    >
                      {n}
                    </button>
                  </span>
                );
              })}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-border/70 px-2.5 text-xs font-semibold disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(totalPages)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 disabled:opacity-40"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed bottom-0 right-0 top-0 z-[51] flex w-full max-w-2xl flex-col overflow-hidden border-l border-[#1E4A85]/15 bg-background shadow-2xl"
            >
              <div className="border-b border-[#1E4A85]/15 bg-gradient-to-r from-[#0F2A4A] via-[#1E4A85] to-[#163A6B] px-5 py-4 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#E8D5A3]/80">
                      Application review
                    </p>
                    <h2 className="truncate text-lg font-bold">{selected.instituteName}</h2>
                    <p className="mt-0.5 truncate text-sm text-white/70">
                      {selected.fullName} · {selected.email}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="rounded-xl bg-white/10 p-2 transition hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-5">
                {detailLoading && (
                  <div className="flex items-center gap-2 rounded-xl border border-[#1E4A85]/15 bg-[#1E4A85]/[0.04] px-3 py-2 text-sm text-[#1E4A85]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading full application…
                  </div>
                )}

                <section>
                  <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#1E4A85]">
                    Applicant details
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      ["Full Name", selected.fullName || "—"],
                      ["Email", selected.email || "—"],
                      ["Phone", selected.phone || "—"],
                      ["Alt Phone", selected.alternatePhone || "—"],
                      ["Institute", selected.instituteName || "—"],
                      ["Business Type", selected.businessType || "—"],
                      ["Plan", selected.planName || (selected.planId ? `Plan #${selected.planId}` : "—")],
                      ["Applied On", selected.createdAt ? new Date(selected.createdAt).toLocaleString("en-IN") : "—"],
                      ["Reviewed At", selected.reviewedAt ? new Date(selected.reviewedAt).toLocaleString("en-IN") : "—"],
                      ["Status", selected.status || "—"],
                      ["Address", selected.address || "—"],
                      ["City", selected.city || "—"],
                      ["State", selected.state || "—"],
                      ["Pincode", selected.pincode || "—"],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        className={cn(
                          "rounded-xl border border-[#1E4A85]/10 bg-[#1E4A85]/[0.03] p-3",
                          (k === "Address" || k === "Institute") && "col-span-2"
                        )}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {k}
                        </p>
                        <p className="mt-0.5 break-words text-sm font-semibold text-foreground">
                          {v}
                        </p>
                      </div>
                    ))}
                  </div>
                  {selected.message ? (
                    <div className="mt-2.5 rounded-xl border border-[#C4A35A]/25 bg-[#C4A35A]/10 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B6914]">
                        Message
                      </p>
                      <p className="mt-1 text-sm text-foreground">{selected.message}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">No message from applicant.</p>
                  )}
                </section>

                <section>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#1E4A85]">
                      KYC documents checklist
                    </h3>
                    <span className="rounded-full bg-[#1E4A85]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#1E4A85]">
                      {uploadedExpected}/{expectedDocs.length} expected · {docs.length} total files
                    </span>
                  </div>

                  {missingRequired.length > 0 && (
                    <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Missing required:{" "}
                        <strong>{missingRequired.map((d) => d.label).join(", ")}</strong>
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {expectedDocs.map((expected) => {
                      const uploaded = docsByKey.get(expected.key);
                      const broken = uploaded ? brokenImages[uploaded.url] : false;
                      return (
                        <div
                          key={expected.key}
                          className={cn(
                            "overflow-hidden rounded-xl border",
                            uploaded
                              ? "border-emerald-200 bg-emerald-50/40"
                              : expected.required
                                ? "border-red-200 bg-red-50/40"
                                : "border-dashed border-border bg-muted/20"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-black/5 px-3 py-2">
                            <div>
                              <p className="text-xs font-semibold text-foreground">
                                {expected.label}
                                {expected.required && <span className="ml-1 text-red-500">*</span>}
                              </p>
                              <p className="text-[10px] text-muted-foreground">{expected.key}</p>
                            </div>
                            <span
                              className={cn(
                                "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                                uploaded
                                  ? "bg-emerald-100 text-emerald-700"
                                  : expected.required
                                    ? "bg-red-100 text-red-700"
                                    : "bg-slate-100 text-slate-500"
                              )}
                            >
                              {uploaded ? "Uploaded" : expected.required ? "Missing" : "Optional"}
                            </span>
                          </div>

                          {uploaded ? (
                            <div className="p-2">
                              {isImageDoc(uploaded) && !broken ? (
                                <button
                                  type="button"
                                  onClick={() => setDocPreview(uploaded)}
                                  className="block w-full overflow-hidden rounded-lg"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={uploaded.url}
                                    alt={uploaded.label}
                                    className="h-28 w-full object-cover"
                                    onError={() =>
                                      setBrokenImages((prev) => ({ ...prev, [uploaded.url]: true }))
                                    }
                                  />
                                </button>
                              ) : (
                                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-white px-3 py-5 text-center">
                                  {broken ? (
                                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                                  ) : (
                                    <FileText className="h-6 w-6 text-[#1E4A85]" />
                                  )}
                                  <p className="truncate text-[11px] font-medium text-foreground">
                                    {uploaded.name}
                                  </p>
                                  {broken && (
                                    <p className="text-[10px] text-amber-700">
                                      File not found on server
                                    </p>
                                  )}
                                </div>
                              )}
                              <div className="mt-2 flex gap-2">
                                <a
                                  href={uploaded.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-[#1E4A85]/20 px-2 py-1.5 text-[11px] font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/5"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Open
                                </a>
                                <a
                                  href={uploaded.url}
                                  download={uploaded.name}
                                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-border px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
                                >
                                  <Download className="h-3 w-3" />
                                  Download
                                </a>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 px-3 py-8 text-xs text-muted-foreground">
                              <ImageIcon className="h-4 w-4" />
                              Not uploaded
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {extraDocs.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Additional files ({extraDocs.length})
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {extraDocs.map((doc) => (
                          <a
                            key={`${doc.key}-${doc.url}`}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-xl border border-[#1E4A85]/12 bg-white px-3 py-2 text-xs font-semibold text-[#1E4A85] hover:bg-[#1E4A85]/5"
                          >
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="truncate">{doc.label || doc.name}</span>
                            <ExternalLink className="ml-auto h-3 w-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {docs.length === 0 && (
                    <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                      No document files found in this application.
                    </p>
                  )}
                </section>

                <section className="rounded-2xl border border-[#C4A35A]/30 bg-gradient-to-br from-[#C4A35A]/10 to-[#1E4A85]/5 p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#1E4A85]">
                    <IndianRupee className="h-3.5 w-3.5" />
                    Franchise fee — owner ko payment
                  </h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Institute admin franchise owner se fee collect kare. Payment ke baad paisa{" "}
                    <strong>institute owner ke bank account</strong> mein Cashfree Easy Split se settle hoga.
                  </p>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <input
                      type="number"
                      min={0}
                      placeholder="Custom amount (optional)"
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                      className="min-w-[140px] flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={creatingPayment || selected.status === "REJECTED"}
                      onClick={createPaymentLink}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {creatingPayment ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Link2 className="h-4 w-4" />
                      )}
                      Payment link banao
                    </button>
                  </div>
                  {paymentLink && (
                    <div className="mb-3 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3">
                      <p className="flex-1 break-all font-mono text-[11px] text-emerald-900">{paymentLink}</p>
                      <button
                        type="button"
                        onClick={copyPaymentLink}
                        className="shrink-0 rounded-lg border border-emerald-300 p-2 text-emerald-800 hover:bg-emerald-100"
                        title="Copy link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {paymentOrders.length > 0 && (
                    <ul className="space-y-1.5 text-xs">
                      {paymentOrders.map((o) => (
                        <li
                          key={o.orderId}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-white/80 px-2.5 py-1.5"
                        >
                          <span className="font-mono text-[10px]">{o.orderId}</span>
                          <span className="font-semibold">₹{o.amount.toLocaleString("en-IN")}</span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-bold",
                              o.status === "PAID"
                                ? "bg-emerald-100 text-emerald-700"
                                : o.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-700"
                            )}
                          >
                            {o.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/subscription/easy-split"
                    className="mt-2 inline-block text-[11px] font-semibold text-[#1E4A85] hover:underline"
                  >
                    Owner bank account configure karein →
                  </Link>
                </section>

                <section>
                  <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#1E4A85]">
                    Admin notes
                  </h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add review notes for this application…"
                    className="w-full resize-none rounded-xl border border-[#1E4A85]/15 bg-background px-4 py-3 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
                  />
                </section>
              </div>

              <div className="flex gap-2 border-t border-[#1E4A85]/10 bg-[#1E4A85]/[0.02] px-5 py-4">
                <button
                  type="button"
                  onClick={() => updateStatus(selected.id, "REJECTED")}
                  disabled={saving || selected.status === "REJECTED"}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-200 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(selected.id, "VERIFIED")}
                  disabled={saving || selected.status === "VERIFIED"}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[#1E4A85]/25 py-2.5 text-sm font-bold text-[#1E4A85] transition hover:bg-[#1E4A85]/5 disabled:opacity-40"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(selected.id, "APPROVED")}
                  disabled={saving || selected.status === "APPROVED"}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#C4A35A] py-2.5 text-sm font-bold text-[#0B132B] transition hover:brightness-110 disabled:opacity-40"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {docPreview && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDocPreview(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          >
            <button
              type="button"
              onClick={() => setDocPreview(null)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={docPreview.url}
              alt={docPreview.label}
              className="max-h-[90vh] max-w-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm font-medium text-white/80">
              {docPreview.label}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
