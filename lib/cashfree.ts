/**
 * Cashfree Payment Gateway — server-side utility
 * Docs: https://docs.cashfree.com/docs/payment-gateway
 */

const CF_APP_ID     = process.env.CASHFREE_APP_ID     || "";
const CF_SECRET_KEY = process.env.CASHFREE_SECRET_KEY || "";
const CF_ENV        = process.env.CASHFREE_ENV        || "TEST"; // "TEST" | "PROD"

const BASE_URL =
  CF_ENV === "PROD"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const CF_VERSION = "2023-08-01";

function cfHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-version": CF_VERSION,
    "x-client-id": CF_APP_ID,
    "x-client-secret": CF_SECRET_KEY,
  };
}

export interface CfOrderRequest {
  orderId: string;
  amount: number;          // in INR
  currency?: string;       // default INR
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;       // redirect after payment
  notifyUrl?: string;      // webhook URL
  orderNote?: string;
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
  try {
    const body = {
      order_id: req.orderId,
      order_amount: req.amount,
      order_currency: req.currency || "INR",
      order_note: req.orderNote || "Franchise Plan Purchase",
      customer_details: {
        customer_id: req.customerEmail.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50),
        customer_name: req.customerName,
        customer_email: req.customerEmail,
        customer_phone: req.customerPhone,
      },
      order_meta: {
        return_url: req.returnUrl,
        notify_url: req.notifyUrl,
      },
    };

    const res = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: cfHeaders(),
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: json?.message || json?.error || `Cashfree error ${res.status}`,
      };
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
  try {
    const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
      method: "GET",
      headers: cfHeaders(),
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: json?.message || `Cashfree verify error ${res.status}`,
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
