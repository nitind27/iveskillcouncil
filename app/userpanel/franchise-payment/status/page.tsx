"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FiCheckCircle, FiXCircle, FiLoader, FiArrowRight } from "react-icons/fi";
import Link from "next/link";

import PageLoader from "@/components/common/PageLoader";

interface OrderResult {
  status: "PAID" | "FAILED" | "PENDING" | "EXPIRED";
  orderId: string;
  planName: string;
  amount: number;
  fullName: string;
  email: string;
  phone?: string;
}

function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("order_id") || "";
  const [result, setResult] = useState<OrderResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("No order ID found.");
      setLoading(false);
      return;
    }

    // Poll verify endpoint
    const verify = async () => {
      try {
        const res = await fetch("/api/franchise-payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || "Verification failed");
        } else {
          setResult(data.data);
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [orderId]);

  if (loading) {
    return <PageLoader text="Verifying your payment..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#E5E7EB] p-8 text-center">
          <FiXCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Verification Error</h2>
          <p className="text-[#6B7280] mb-6">{error}</p>
          <Link href="/userpanel/franchise-plans" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2D5DA8] text-white font-semibold">
            Try Again <FiArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const isPaid    = result?.status === "PAID";
  const isFailed  = result?.status === "FAILED" || result?.status === "EXPIRED";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-[#E5E7EB] overflow-hidden"
      >
        {/* top bar */}
        <div className={`h-2 ${isPaid ? "bg-gradient-to-r from-[#A8C63A] to-[#2D5DA8]" : "bg-red-400"}`} />

        <div className="p-8 text-center">
          {isPaid ? (
            <FiCheckCircle className="w-16 h-16 text-[#A8C63A] mx-auto mb-4" />
          ) : (
            <FiXCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          )}

          <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-2">
            {isPaid ? "Payment Successful!" : isFailed ? "Payment Failed" : "Payment Pending"}
          </h2>
          <p className="text-[#6B7280] mb-6">
            {isPaid
              ? "Your franchise plan purchase is confirmed. Our team will contact you shortly."
              : isFailed
              ? "Your payment could not be processed. Please try again."
              : "Your payment is being processed. Please check back in a few minutes."}
          </p>

          {result && (
            <div className="bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB] p-5 text-left space-y-3 mb-6">
              <Row label="Order ID"   value={result.orderId} />
              <Row label="Plan"       value={result.planName} />
              <Row label="Amount"     value={`₹${result.amount.toLocaleString("en-IN")}`} />
              <Row label="Name"       value={result.fullName} />
              <Row label="Email"      value={result.email} />
            </div>
          )}

          <div className="flex flex-col gap-3">
            {isPaid ? (
              <Link
                href="/userpanel"
                className="w-full py-3 rounded-xl bg-[#2D5DA8] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#1E4A85] transition-all"
              >
                Back to Home <FiArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/userpanel/franchise-plans"
                className="w-full py-3 rounded-xl bg-[#F39C12] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#D68910] transition-all"
              >
                Try Again <FiArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-[#6B7280]">{label}</span>
      <span className="font-semibold text-[#1A1A1A]">{value}</span>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<PageLoader text="Loading..." />}>
      <PaymentStatusContent />
    </Suspense>
  );
}
