"use client";

import React from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Loader2, HelpCircle, Mail } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

interface SupportRow {
  id: string;
  fullName: string;
  email: string;
  message: string;
  source: string | null;
  createdAt: string;
}

export default function SupportRequestsPage() {
  const { data, error, isLoading, mutate } = useSWR<SupportRow[]>(
    "/api/support",
    fetcher,
    { revalidateOnFocus: true }
  );

  const requests = Array.isArray(data) ? data : [];
  const errorMsg =
    (error as { status?: number })?.status === 401
      ? "Unauthorized"
      : (error as { status?: number })?.status === 403
        ? "Access denied"
        : error instanceof Error
          ? error.message
          : "Failed to load support requests";

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <Card className="rounded-xl shadow-lg">
          <CardContent className="py-12 text-center text-muted-foreground">
            {errorMsg}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <HelpCircle className="w-8 h-8" />
          Support Requests
        </h1>
        <p className="text-muted-foreground mt-1">
          Support requests from login page and other sources. Emails sent to codeatinfotech@gmail.com.
        </p>
      </div>

      <Card className="rounded-xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Requests ({requests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              No support requests yet.
            </p>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-semibold">Date</th>
                    <th className="text-left py-3 px-2 font-semibold">Name</th>
                    <th className="text-left py-3 px-2 font-semibold">Email</th>
                    <th className="text-left py-3 px-2 font-semibold">Source</th>
                    <th className="text-left py-3 px-2 font-semibold">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 font-medium">{r.fullName}</td>
                      <td className="py-3 px-2">
                        <a href={`mailto:${r.email}`} className="text-primary hover:underline">
                          {r.email}
                        </a>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{r.source || "—"}</td>
                      <td className="py-3 px-2 max-w-xs truncate" title={r.message}>
                        {r.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
