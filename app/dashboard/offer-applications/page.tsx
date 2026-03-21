"use client";

import React from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Loader2, Tag } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

interface ApplicationRow {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  offerId: string;
  offerTitle: string;
  message: string | null;
  createdAt: string;
}

interface ApiResponse {
  applications: ApplicationRow[];
}

export default function OfferApplicationsPage() {
  const { data, error, isLoading } = useSWR<ApiResponse>(
    "/api/offer-applications",
    fetcher,
    { revalidateOnFocus: true }
  );

  const applications = data?.applications ?? [];
  const errorMsg =
    (error as { status?: number })?.status === 401
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to load offer applications";

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
          <Tag className="w-8 h-8 text-primary" />
          Offer Applications
        </h1>
        <p className="text-muted-foreground mt-1">
          Users who applied for offers via &quot;Apply Now&quot; on the user panel.
        </p>
      </div>

      <Card className="rounded-xl shadow-lg">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            All Applications ({applications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {applications.length === 0 ? (
            <div className="py-16 text-center">
              <Tag className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No offer applications yet.</p>
              <p className="text-sm text-muted-foreground/80 mt-1">
                Applications will appear here when users submit via &quot;Apply Now&quot; on offers.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold">Offer</th>
                    <th className="text-left py-3 px-4 font-semibold">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((row) => (
                    <tr key={row.id} className="border-b border-border/70 hover:bg-muted/50">
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium">{row.fullName}</td>
                      <td className="py-3 px-4">
                        <a
                          href={`mailto:${row.email}`}
                          className="text-primary hover:underline"
                        >
                          {row.email}
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <a href={`tel:${row.phone}`} className="hover:text-primary">
                          {row.phone}
                        </a>
                      </td>
                      <td className="py-3 px-4">{row.offerTitle}</td>
                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {row.message || "—"}
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
