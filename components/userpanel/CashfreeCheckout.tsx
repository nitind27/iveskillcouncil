"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: "_self" | "_blank" | "_top" | "_modal";
      }) => Promise<{ error?: { message: string }; redirect?: boolean; paymentDetails?: unknown }>;
    };
  }
}

interface Props {
  paymentSessionId: string;
  onError: (msg: string) => void;
}

/**
 * Loads Cashfree JS SDK and triggers checkout automatically.
 * Renders nothing — just handles the SDK redirect.
 */
export default function CashfreeCheckout({ paymentSessionId, onError }: Props) {
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current || !paymentSessionId) return;
    triggered.current = true;

    const cfEnv = process.env.NEXT_PUBLIC_CASHFREE_ENV === "PROD" ? "production" : "sandbox";

    const run = async () => {
      // Load SDK if not already loaded
      if (!window.Cashfree) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
          script.onload  = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
          document.head.appendChild(script);
        });
      }

      if (!window.Cashfree) {
        onError("Cashfree SDK failed to load. Please try again.");
        return;
      }

      const cashfree = window.Cashfree({ mode: cfEnv });
      const result   = await cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self",
      });

      if (result?.error) {
        onError(result.error.message || "Payment failed. Please try again.");
      }
    };

    run().catch((err) => {
      onError(err instanceof Error ? err.message : "Payment error. Please try again.");
    });
  }, [paymentSessionId, onError]);

  return null;
}
