"use client";

import { useState } from "react";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { Card, CardContent } from "@/components/common/Card";
import { Wallet, Loader2 } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

interface SalaryData {
  item: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    franchiseName: string;
    salary: number;
    joiningDate: string;
    status: string;
  } | null;
  isStaff: boolean;
}

export default function StaffSalaryPage() {
  const { data, error, isLoading } = useSWR<SalaryData>("/api/staff", fetcher, { revalidateOnFocus: true });

  const item = data?.item;
  const isStaff = data?.isStaff ?? false;

  return (
    <div className="space-y-6">
      <Breadcrumb />

      <div>
        <h1 className="text-3xl font-bold text-foreground">Salary</h1>
        <p className="text-muted-foreground mt-1">View your salary information</p>
      </div>

      <Card className="rounded-xl shadow-lg max-w-lg">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !isStaff || !item ? (
            <div className="py-12 text-center text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No salary information available.</p>
              <p className="text-sm mt-2">Staff members can view their salary details here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5">
                <Wallet className="w-10 h-10 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Salary</p>
                  <p className="text-2xl font-bold">₹{item.salary.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{item.fullName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Franchise</span>
                  <span className="font-medium">{item.franchiseName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Joining Date</span>
                  <span className="font-medium">{item.joiningDate}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium">{item.status}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
