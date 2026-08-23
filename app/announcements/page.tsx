"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import {
  Megaphone,
  Plus,
  Loader2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  X,
  Trash2,
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Sparkles,
  Radio,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { showSuccess, showError, showDeleteConfirm } from "@/lib/toast";
import { GlassModal } from "@/components/common/GlassModal";
import { cn } from "@/lib/utils";

interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  createdBy: string;
  createdAt: string;
}

interface AnnouncementsResponse {
  items: AnnouncementItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function isWithinDays(iso: string, days: number) {
  return Date.now() - new Date(iso).getTime() <= days * 24 * 60 * 60 * 1000;
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const canCreate = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<AnnouncementItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(pageSize));
  if (debouncedSearch) query.set("search", debouncedSearch);

  const { data, error, isLoading, mutate } = useSWR<AnnouncementsResponse>(
    `/api/announcements?${query.toString()}`,
    fetcher,
    { revalidateOnFocus: true, keepPreviousData: true }
  );

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 1,
  };

  const weekCount = useMemo(
    () => items.filter((a) => isWithinDays(a.createdAt, 7)).length,
    [items]
  );

  const pageNumbers = useMemo(() => {
    const totalPages = pagination.totalPages || 1;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set(
      [1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages)
    );
    return Array.from(set).sort((a, b) => a - b);
  }, [page, pagination.totalPages]);

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      await showError("Validation", "Title and message are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: title.trim(), message: message.trim() }),
      });
      const d = await res.json();
      if (!res.ok) {
        await showError("Error", d.error || "Failed to create announcement");
        return;
      }
      await showSuccess("Broadcast sent", "Announcement delivered to all franchise admins");
      setShowModal(false);
      setTitle("");
      setMessage("");
      mutate();
    } catch {
      await showError("Error", "Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: AnnouncementItem) => {
    const result = await showDeleteConfirm(
      "Delete announcement?",
      `"${item.title}" will be removed permanently.`
    );
    if (!result.isConfirmed) return;

    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/announcements?id=${item.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError("Error", json.error || "Failed to delete");
        return;
      }
      showSuccess("Deleted", "Announcement removed.");
      if (selected?.id === item.id) setSelected(null);
      mutate();
    } catch {
      showError("Error", "Network error.");
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-border/70 bg-background px-3 py-2.5 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15";

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
              <span className="text-white/80">Announcements</span>
            </nav>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Announcements</h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C4A35A]/35 bg-[#C4A35A]/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#F5E6C8]">
                <Radio className="h-3 w-3" />
                Broadcast
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs text-white/60 sm:text-sm">
              {canCreate
                ? "Create and broadcast updates to all franchise admins"
                : "View announcements from headquarters"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm backdrop-blur-sm">
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                  Total
                </p>
                <p className="font-bold tabular-nums leading-tight">{pagination.total}</p>
              </div>
              <div className="h-7 w-px bg-white/20" />
              <div className="text-center">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-sky-200/80">
                  This page
                </p>
                <p className="font-bold tabular-nums leading-tight text-sky-100">{items.length}</p>
              </div>
              {weekCount > 0 && (
                <>
                  <div className="h-7 w-px bg-white/20" />
                  <div className="text-center">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-[#E8D5A3]/70">
                      Recent
                    </p>
                    <p className="font-bold tabular-nums leading-tight text-[#F5E6C8]">
                      {weekCount}
                    </p>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => mutate()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
              Refresh
            </button>
            {canCreate && (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C4A35A] px-3 text-xs font-bold text-[#0B132B] transition hover:brightness-110"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </button>
            )}
          </div>
        </div>
      </header>

      {/* List card */}
      <div className="overflow-hidden rounded-2xl border border-[#1E4A85]/12 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#1E4A85]/[0.04] to-transparent px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or message…"
              className="h-9 w-full rounded-lg border border-border/70 bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
            />
          </div>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-9 rounded-lg border border-border/70 bg-background px-3 text-sm outline-none focus:border-[#1E4A85]"
          >
            {[10, 15, 25].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>

        <div className="p-4 sm:p-5">
          {isLoading && !data ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
            </div>
          ) : error ? (
            <div className="py-16 text-center">
              <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
              <p className="font-semibold text-amber-700">
                {error instanceof Error ? error.message : "Failed to load announcements"}
              </p>
              <button
                type="button"
                onClick={() => mutate()}
                className="mt-3 rounded-lg bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C4A35A]/15">
                <Megaphone className="h-7 w-7 text-[#C4A35A]" />
              </div>
              <p className="text-lg font-bold text-foreground">No announcements yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {debouncedSearch
                  ? "No matches for your search."
                  : canCreate
                    ? "Create one to broadcast to all franchise admins."
                    : "Check back later for updates from HQ."}
              </p>
              {canCreate && !debouncedSearch && (
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163A6B]"
                >
                  <Sparkles className="h-4 w-4" />
                  Create first announcement
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((a, i) => (
                <motion.article
                  key={a.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="group relative overflow-hidden rounded-xl border border-[#1E4A85]/12 bg-gradient-to-r from-[#1E4A85]/[0.03] to-transparent p-4 transition hover:border-[#1E4A85]/25 hover:shadow-sm sm:p-5"
                >
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#C4A35A] to-[#1E4A85] opacity-80" />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 gap-3 pl-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1E4A85]/10 text-[#1E4A85]">
                        <Megaphone className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-foreground">{a.title}</h3>
                          {isToday(a.createdAt) && (
                            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground whitespace-pre-wrap">
                          {a.message}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {a.createdBy}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(a.createdAt)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(a.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 pl-2 sm:pl-0">
                      <button
                        type="button"
                        onClick={() => setSelected(a)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 px-3 text-xs font-semibold text-[#1E4A85] transition hover:bg-[#1E4A85]/10"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Read
                      </button>
                      {canCreate && (
                        <button
                          type="button"
                          onClick={() => handleDelete(a)}
                          disabled={deletingId === a.id}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === a.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && items.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#1E4A85]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageNumbers.map((p, i) => (
                <span key={p} className="contents">
                  {i > 0 && pageNumbers[i - 1] !== p - 1 && (
                    <span className="px-1 text-muted-foreground">…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(p)}
                    className={cn(
                      "inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-xs font-semibold",
                      page === p
                        ? "border-[#1E4A85] bg-[#1E4A85] text-white"
                        : "border-border hover:bg-muted"
                    )}
                  >
                    {p}
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage(pagination.totalPages)}
                disabled={page >= pagination.totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-muted disabled:opacity-40"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Read drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-lg flex-col border-l border-[#1E4A85]/15 bg-background shadow-2xl"
            >
              <div className="border-b border-[#1E4A85]/10 bg-gradient-to-r from-[#0F2A4A] to-[#1E4A85] px-5 py-4 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#E8D5A3]">
                      Announcement
                    </p>
                    <h2 className="mt-1 text-lg font-bold leading-snug">{selected.title}</h2>
                    <p className="mt-2 text-xs text-white/65">
                      {selected.createdBy} · {formatDateTime(selected.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="rounded-lg bg-white/10 p-2 hover:bg-white/20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="rounded-xl border border-[#C4A35A]/25 bg-gradient-to-br from-[#C4A35A]/10 to-transparent p-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {selected.message}
                  </p>
                </div>
              </div>
              {canCreate && (
                <div className="border-t border-border/60 p-4">
                  <button
                    type="button"
                    onClick={() => handleDelete(selected)}
                    disabled={deletingId === selected.id}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingId === selected.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Delete announcement
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Create modal */}
      {showModal && (
        <GlassModal
          open={showModal}
          onClose={() => !submitting && setShowModal(false)}
          title="New Announcement"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will be visible to all franchise admins in their dashboard notifications.
            </p>
            <div>
              <label className="mb-1 block text-sm font-semibold">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Holiday schedule update"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Full announcement message for franchise admins…"
                rows={6}
                className={cn(inputClass, "resize-none")}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {message.length} characters
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
              <button
                type="button"
                onClick={() => !submitting && setShowModal(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !title.trim() || !message.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1E4A85] px-4 py-2 text-sm font-bold text-white hover:bg-[#163A6B] disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Megaphone className="h-4 w-4" />
                )}
                Broadcast to all admins
              </button>
            </div>
          </div>
        </GlassModal>
      )}
    </div>
  );
}
