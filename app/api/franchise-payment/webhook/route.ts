import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/** Verify Cashfree webhook signature */
function verifySignature(
  rawBody: string,
  timestamp: string,
  signature: string
): boolean {
  const secret = process.env.CASHFREE_SECRET_KEY || "";
  const data   = timestamp + rawBody;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64");
  return expected === signature;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody  = await request.text();
    const timestamp = request.headers.get("x-webhook-timestamp") || "";
    const signature = request.headers.get("x-webhook-signature") || "";

    // Verify signature in production
    if (process.env.CASHFREE_ENV === "PROD") {
      if (!verifySignature(rawBody, timestamp, signature)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const type  = event?.type;

    if (type === "PAYMENT_SUCCESS_WEBHOOK") {
      const orderId   = event?.data?.order?.order_id;
      const cfPayId   = event?.data?.payment?.cf_payment_id;
      const payMode   = event?.data?.payment?.payment_method?.type || null;

      if (orderId) {
        await prisma.franchiseOrder.updateMany({
          where: { orderId: String(orderId), status: "PENDING" },
          data: {
            status:      "PAID",
            cfPaymentId: cfPayId ? String(cfPayId) : null,
            paymentMode: payMode,
          },
        });
      }
    } else if (type === "PAYMENT_FAILED_WEBHOOK") {
      const orderId = event?.data?.order?.order_id;
      if (orderId) {
        await prisma.franchiseOrder.updateMany({
          where: { orderId: String(orderId), status: "PENDING" },
          data: { status: "FAILED" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("franchise-payment/webhook:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
