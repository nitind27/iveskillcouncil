"use client";

import { useState } from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { IndianRupee, Loader2, CheckCircle2 } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

interface CourseData {
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  courseName: string;
}

export default function MyFeesPage() {
  const { data, error, isLoading } = useSWR<CourseData>("/api/students/me", fetcher, {
    revalidateOnFocus: true,
  });

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

  const totalFee = data?.totalFee ?? 0;
  const paidFee = data?.paidFee ?? 0;
  const pendingFee = data?.pendingFee ?? 0;

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div>
        <h1 className="text-3xl font-bold text-foreground">My Fees</h1>
        <p className="text-muted-foreground mt-1">Your fee payment status</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Fee</p>
                <p className="text-xl font-bold">₹{totalFee.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-xl font-bold">₹{paidFee.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">₹{pendingFee.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-6">
          <div className="w-full bg-muted rounded-lg h-3 overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: totalFee > 0 ? `${(paidFee / totalFee) * 100}%` : "0%" }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {totalFee > 0 ? Math.round((paidFee / totalFee) * 100) : 0}% paid
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
