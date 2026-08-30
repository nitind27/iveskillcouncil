/**
 * Cashfree Payment Gateway — server-side utility
 * API version: 2025-01-01 (v5 — latest)
 * Docs: https://www.cashfree.com/docs/api-reference/payments/latest/overview
 *
 * Credentials (CASHFREE_APP_ID, CASHFREE_SECRET_KEY) are NEVER exposed to the client.
 */

const CF_APP_ID     = process.env.CASHFREE_APP_ID     || "";
const CF_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "";
const CF_ENV        = process.env.CASHFREE_ENV        || "TEST"; // "TEST" | "PROD"

const BASE_URL =
  CF_ENV === "PROD"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const CF_VERSION = "2025-01-01";

function cfHeaders(extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    "x-api-version": CF_VERSION,
    "x-client-id": CF_APP_ID,
    "x-client-secret": CF_SECRET_KEY,
    ...extra,
  };
}

export function isCashfreeConfigured(): boolean {
  return Boolean(CF_APP_ID && CF_SECRET_KEY);
}

export interface CfOrderSplit {
  vendor_id: string;
  percentage?: number;
  amount?: number;
  tags?: Record<string, string>;
}

export interface CfOrderRequest {
  orderId: string;
  amount: number;
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl?: string;
  orderNote?: string;
  orderSplits?: CfOrderSplit[];
}

export interface CfOrderResponse {
  cf_order_id: string;
  order_id: string;
  entity: string;
  order_currency: string;
  order_amount: number;
  order_status: string;
  payment_session_id: string;
  order_expiry_time: string;
}

/** Create a Cashfree order and return payment_session_id */
export async function createCashfreeOrder(
  req: CfOrderRequest
): Promise<{ success: true; data: CfOrderResponse } | { success: false; error: string }> {
  if (!isCashfreeConfigured()) {
    return { success: false, error: "Cashfree credentials not configured on server" };
  }

  try {
    const body: Record<string, unknown> = {
      order_id: req.orderId,
      order_amount: req.amount,
      order_currency: req.currency || "INR",
      order_note: req.orderNote || "Franchise Plan Purchase",
      customer_details: {
        customer_id: req.customerEmail.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50),
        customer_name: req.customerName,
        customer_email: req.customerEmail,
        customer_phone: req.customerPhone.replace(/^\+91/, "").replace(/\D/g, "").slice(-10),
      },
      order_meta: {
        return_url: req.returnUrl,
        notify_url: req.notifyUrl,
      },
    };

    if (req.orderSplits && req.orderSplits.length > 0) {
      body.order_splits = req.orderSplits;
    }

    const res = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: cfHeaders(),
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      const errMsg = json?.message || json?.error_msg || json?.error || `Cashfree error ${res.status}`;
      console.error("Cashfree API error:", res.status, JSON.stringify(json));
      return { success: false, error: errMsg };
    }

    return { success: true, data: json as CfOrderResponse };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Cashfree request failed",
    };
  }
}

export interface CfPaymentStatus {
  order_id: string;
  order_status: "PAID" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  order_amount: number;
  cf_order_id: string;
  payments?: Array<{
    cf_payment_id: string;
    payment_status: string;
    payment_amount: number;
    payment_method?: { type?: string };
  }>;
}

/** Verify order status from Cashfree */
export async function verifyCashfreeOrder(
  orderId: string
): Promise<{ success: true; data: CfPaymentStatus } | { success: false; error: string }> {
  if (!isCashfreeConfigured()) {
    return { success: false, error: "Cashfree credentials not configured on server" };
  }

  try {
    const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
      method: "GET",
      headers: cfHeaders(),
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: json?.message || json?.error_msg || `Cashfree verify error ${res.status}`,
      };
    }

    return { success: true, data: json as CfPaymentStatus };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Cashfree verify failed",
    };
  }
}

export interface CreateVendorParams {
  vendorId: string;
  name: string;
  email: string;
  phone: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  pan?: string;
}

/** Register a beneficiary as Cashfree Easy Split vendor */
export async function createCashfreeVendor(
  params: CreateVendorParams
): Promise<{ success: true; vendorId: string; status: string } | { success: false; error: string }> {
  if (!isCashfreeConfigured()) {
    return { success: false, error: "Cashfree credentials not configured on server" };
  }

  try {
    const body = {
      vendor_id: params.vendorId,
      status: "ACTIVE",
      name: params.name,
      email: params.email,
      phone: params.phone.replace(/^\+91/, "").replace(/\D/g, "").slice(-10),
      verify_account: true,
      dashboard_access: false,
      schedule_option: 1,
      bank: {
        account_number: params.accountNumber.replace(/\s/g, ""),
        account_holder: params.accountHolder,
        ifsc: params.ifsc.toUpperCase(),
      },
      kyc_details: {
        account_type: "BUSINESS",
        business_type: "Education",
        ...(params.pan ? { pan: params.pan.toUpperCase() } : {}),
      },
    };

    const res = await fetch(`${BASE_URL}/easy-split/vendors`, {
      method: "POST",
      headers: cfHeaders(),
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      const errMsg = json?.message || json?.error_msg || `Cashfree vendor error ${res.status}`;
      console.error("Cashfree vendor API error:", res.status, JSON.stringify(json));
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      vendorId: String(json.vendor_id || params.vendorId),
      status: String(json.status || "IN_BENE_CREATION"),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Cashfree vendor request failed",
    };
  }
}

/** Split After Payment — fallback if order_splits were not set at order creation */
export async function splitCashfreeOrderAfterPayment(
  orderId: string,
  splits: CfOrderSplit[]
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  if (!isCashfreeConfigured()) {
    return { success: false, error: "Cashfree credentials not configured on server" };
  }

  try {
    const body = {
      split: splits.map((s) => ({
        vendor_id: s.vendor_id,
        ...(s.percentage != null ? { percentage: s.percentage } : {}),
        ...(s.amount != null ? { amount: s.amount } : {}),
        ...(s.tags ? { tags: s.tags } : {}),
      })),
      disable_split: true,
    };

    const res = await fetch(`${BASE_URL}/easy-split/orders/${encodeURIComponent(orderId)}/split`, {
      method: "POST",
      headers: cfHeaders(),
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      const errMsg = json?.message || json?.error_msg || `Cashfree split error ${res.status}`;
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      message: String(json.message || "Order split created"),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Cashfree split request failed",
    };
  }
}
