"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/common/Card";
import { IndianRupee, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  studentName: string;
  amount: string;
  status: string;
  date: string | Date;
}

interface RecentPaymentsProps {
  payments: Payment[];
}

export default function RecentPayments({ payments }: RecentPaymentsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "PENDING":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <IndianRupee className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No recent payments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between pb-4 border-b border-border last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {payment.studentName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(payment.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold">
                      ₹{parseFloat(payment.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {getStatusIcon(payment.status)}
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          getStatusColor(payment.status)
                        )}
                      >
                        {payment.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

