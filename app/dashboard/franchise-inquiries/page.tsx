"use client";

import React from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { Breadcrumb } from "@/components/common";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { Mail, Building2 } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

interface EnquiryRow {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string | null;
  state: string | null;
  investmentRange: string | null;
  message: string | null;
  franchiseId: string | null;
  franchiseName: string | null;
  createdAt: string;
}

interface ApiResponse {
  enquiries: EnquiryRow[];
}

export default function FranchiseInquiriesPage() {
  const { data, error, isLoading } = useSWR<ApiResponse>(
    "/api/franchise-inquiries",
    fetcher,
    { revalidateOnFocus: true }
  );

  const enquiries = data?.enquiries ?? [];
  const errorMsg =
    (error as { status?: number })?.status === 401
      ? "Unauthorized"
      : error instanceof Error
        ? error.message
        : "Failed to load enquiries";

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="flex justify-center py-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary"
          />
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="w-8 h-8 text-primary" />
          Franchise Inquiries
        </h1>
        <p className="text-muted-foreground mt-1">
          Visit & Enquire submissions from the user panel. Each inquiry shows which franchise the user was interested in.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="rounded-xl shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Inquiries ({enquiries.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {enquiries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <Building2 className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No franchise enquiries yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Enquiries will appear when users click &quot;Visit & Enquire&quot; on franchise cards.
                </p>
              </motion.div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-4 px-4 font-semibold">Date</th>
                      <th className="text-left py-4 px-4 font-semibold">Name</th>
                      <th className="text-left py-4 px-4 font-semibold">Contact</th>
                      <th className="text-left py-4 px-4 font-semibold">Franchise</th>
                      <th className="text-left py-4 px-4 font-semibold">Location</th>
                      <th className="text-left py-4 px-4 font-semibold">Investment</th>
                      <th className="text-left py-4 px-4 font-semibold">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {enquiries.map((row, i) => (
                        <motion.tr
                          key={row.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-border/70 hover:bg-muted/40 transition-colors"
                        >
                          <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">
                            {new Date(row.createdAt).toLocaleString()}
                          </td>
                          <td className="py-4 px-4 font-medium">{row.fullName}</td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <a
                                href={`mailto:${row.email}`}
                                className="text-primary hover:underline block"
                              >
                                {row.email}
                              </a>
                              <a
                                href={`tel:${row.phone}`}
                                className="text-muted-foreground hover:text-foreground text-xs"
                              >
                                {row.phone}
                              </a>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {row.franchiseName ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium">
                                <Building2 className="w-3.5 h-3.5" />
                                {row.franchiseName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-muted-foreground">
                            {[row.city, row.state].filter(Boolean).join(", ") || "—"}
                          </td>
                          <td className="py-4 px-4 text-muted-foreground">
                            {row.investmentRange || "—"}
                          </td>
                          <td className="py-4 px-4 text-muted-foreground max-w-xs">
                            <span className="line-clamp-2">{row.message || "—"}</span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
