"use client";

import { useState } from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { MessageSquare, Loader2, Send } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { showSuccess, showError } from "@/lib/toast";

interface FeedbackItem {
  id: string;
  message: string;
  response: string | null;
  status: string;
  createdAt: string;
}

interface FeedbackResponse {
  items: FeedbackItem[];
  pagination: { page: number; total: number; totalPages: number };
}

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<FeedbackResponse>(
    "/api/feedback?page=1&limit=20",
    fetcher,
    { revalidateOnFocus: true }
  );

  const items = data?.items ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      await showError("Validation", "Please enter your feedback");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: message.trim() }),
      });
      const d = await res.json();
      if (!res.ok) {
        await showError("Error", d.error || "Failed to submit");
        return;
      }
      await showSuccess("Submitted", "Thank you for your feedback");
      setMessage("");
      mutate();
    } catch {
      await showError("Error", "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Feedback</h1>
        <p className="text-muted-foreground mt-1">Submit feedback or view your previous submissions</p>
      </div>

      <Card className="rounded-xl shadow-lg max-w-2xl">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Submit Feedback</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your feedback, suggestions, or concerns..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-y"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit
            </button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Your Feedback History</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
              <p>No feedback submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((f) => (
                <div key={f.id} className="p-4 rounded-lg border border-border">
                  <p className="text-sm">{f.message}</p>
                  {f.response && (
                    <div className="mt-3 pl-4 border-l-2 border-primary/30">
                      <p className="text-xs text-muted-foreground mb-1">Response</p>
                      <p className="text-sm">{f.response}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(f.createdAt).toLocaleString()} · {f.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
