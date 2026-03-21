"use client";

import { useState } from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { Award, Loader2 } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

export default function CertificatePage() {
  const { data, error, isLoading } = useSWR<{ certificate: { id: string; certificateNumber: string; status: string; issueDate: string | null } | null }>(
    "/api/students/certificate",
    fetcher,
    { revalidateOnFocus: true }
  );

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const cert = data?.certificate ?? null;

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div>
        <h1 className="text-3xl font-bold text-foreground">My Certificate</h1>
        <p className="text-muted-foreground mt-1">View your course certificate</p>
      </div>

      <Card className="rounded-xl shadow-lg max-w-lg">
        <CardContent className="p-6">
          {!cert ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Award className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="font-medium">No certificate yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your certificate will appear here once it has been issued.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
                <Award className="w-12 h-12 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Certificate Number</p>
                  <p className="text-lg font-bold">{cert.certificateNumber}</p>
                </div>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{cert.status}</span>
              </div>
              {cert.issueDate && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Issue Date</span>
                  <span className="font-medium">{cert.issueDate}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
