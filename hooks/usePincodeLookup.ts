"use client";

import { useState, useCallback } from "react";

export interface PincodeLookupResult {
  area: string;
  city: string;
  state: string;
}

/**
 * Reusable hook for pincode-based address lookup (India).
 * Fetches area, city, state from /api/pincode/[pincode].
 */
export function usePincodeLookup(onFetched?: (data: PincodeLookupResult) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchByPincode = useCallback(
    async (pincode: string): Promise<PincodeLookupResult | null> => {
      const pin = String(pincode).trim().replace(/\D/g, "").slice(0, 6);
      if (pin.length !== 6) {
        setError("Enter a valid 6-digit pincode");
        return null;
      }
      setError("");
      setLoading(true);
      try {
        const res = await fetch(`/api/pincode/${pin}`);
        const json = await res.json();
        const data = json?.data;
        if (data?.found) {
          const result: PincodeLookupResult = {
            area: data.area || "",
            city: data.city || "",
            state: data.state || "",
          };
          onFetched?.(result);
          return result;
        } else {
          setError("No details found for this pincode");
          return null;
        }
      } catch {
        setError("Could not fetch location. Try again.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [onFetched]
  );

  const clearError = useCallback(() => setError(""), []);

  return { fetchByPincode, loading, error, clearError };
}
