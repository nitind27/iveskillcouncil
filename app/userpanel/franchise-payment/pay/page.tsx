"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, IndianRupee, ShieldCheck } from "lucide-react";
import CashfreeCheckout from "@/components/userpanel/CashfreeCheckout";
import PageLoader from "@/components/common/PageLoader";

function PayContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("order_id") || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<{
    orderId: string;
    fullName: string;
    planName: string;
    amount: number;
    paymentSessionId: string;
  } | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError("Invalid payment link.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/franchise-payment/order/${encodeURIComponent(orderId)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Order not found");
        setOrder(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load payment");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) return <PageLoader text="Loading payment…" />;

  if (error || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
        <div className="max-w-md w-full rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center shadow-xl">
          <p className="text-lg font-bold text-[#1A1A1A] mb-2">Payment unavailable</p>
          <p className="text-sm text-[#6B7280] mb-6">{error || "Order not found"}</p>
          <Link
            href="/userpanel/franchise-plans"
            className="inline-block rounded-xl bg-[#1E4A85] px-6 py-3 text-sm font-semibold text-white"
          >
            View franchise plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#0F2A4A] to-[#1E4A85] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E4A85]/10 text-[#1E4A85]">
            <IndianRupee className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-[#1E4A85]">Franchise Fee Payment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.fullName} · {order.planName}
          </p>
          <p className="mt-3 text-3xl font-extrabold text-[#1E4A85]">
            ₹{order.amount.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Secure payment via Cashfree. Fee is settled to the institute owner account.</span>
        </div>

        <CashfreeCheckout
          paymentSessionId={order.paymentSessionId}
          onError={(msg) => setError(msg)}
        />

        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Order {order.orderId}
        </p>
      </div>
    </div>
  );
}

export default function FranchisePayPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading…" />}>
      <PayContent />
    </Suspense>
  );
}
