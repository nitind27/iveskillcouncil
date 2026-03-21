"use client";

import { useState } from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { Megaphone, Plus, Loader2 } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { showSuccess, showError } from "@/lib/toast";
import { GlassModal } from "@/components/common/GlassModal";

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

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const roleId = Number(user?.roleId) ?? 0;
  const canCreate = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;

  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<AnnouncementsResponse>(
    `/api/announcements?page=${page}&limit=15`,
    fetcher,
    { revalidateOnFocus: true, keepPreviousData: true }
  );

  const items = data?.items ?? [];
  const pagination = data?.pagination ?? { page: 1, limit: 15, total: 0, totalPages: 1 };

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
      await showSuccess("Created", "Announcement sent to all franchise admins");
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

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1">
            {canCreate ? "Create and broadcast announcements to all franchise admins" : "View announcements from Super Admin"}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        )}
      </div>

      <Card className="rounded-xl shadow-lg">
        <CardContent className="p-4">
          {isLoading && !data ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="py-12 text-center text-muted-foreground">
              {error instanceof Error ? error.message : "Failed to load announcements"}
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No announcements yet. {canCreate && "Create one to broadcast to all franchise admins."}
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((a) => (
                <div
                  key={a.id}
                  className="p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Megaphone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground">{a.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        By {a.createdBy} • {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="px-3 py-1 rounded border border-border disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                      className="px-3 py-1 rounded border border-border disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <GlassModal
          open={showModal}
          onClose={() => !submitting && setShowModal(false)}
          title="New Announcement"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Full announcement message"
                rows={5}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => !submitting && setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !title.trim() || !message.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send to All Franchise Admins"}
              </button>
            </div>
          </div>
        </GlassModal>
      )}
    </div>
  );
}
