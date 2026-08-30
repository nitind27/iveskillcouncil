/** Format franchise order for API responses */
export function formatFranchiseOrder(o: {
  id: bigint;
  orderId: string;
  cfOrderId: string | null;
  cfPaymentId: string | null;
  fullName: string;
  email: string;
  phone: string;
  planId: number;
  planName: string;
  amount: { toString(): string } | number;
  status: string;
  paymentMode: string | null;
  paymentSessionId?: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  message: string | null;
  splitApplied: boolean;
  splitStatus: string | null;
  splitConfigSnapshot: unknown;
  createdAt: Date;
  updatedAt: Date;
  plan?: { name: string; price: { toString(): string } | number } | null;
}) {
  const amount = Number(o.amount);
  const snapshot = parseSplitSnapshot(o.splitConfigSnapshot);

  return {
    id: o.id.toString(),
    orderId: o.orderId,
    cfOrderId: o.cfOrderId,
    cfPaymentId: o.cfPaymentId,
    fullName: o.fullName,
    email: o.email,
    phone: o.phone,
    planId: o.planId,
    planName: o.planName,
    amount,
    status: o.status,
    paymentMode: o.paymentMode,
    city: o.city,
    state: o.state,
    address: o.address,
    message: o.message,
    splitApplied: o.splitApplied,
    splitStatus: o.splitStatus,
    splitLabel: getSplitStatusLabel(o.splitStatus, o.splitApplied, o.status),
    splitBreakdown: snapshot ? buildSplitBreakdown(amount, snapshot) : null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

export interface SplitSnapshot {
  planId?: number;
  planName?: string;
  amount?: number;
  beneficiaries?: Array<{
    slot: number;
    label: string;
    vendorId: string;
    percentage: number;
  }>;
}

export function parseSplitSnapshot(raw: unknown): SplitSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as SplitSnapshot;
  if (!s.beneficiaries?.length) return null;
  return s;
}

export function buildSplitBreakdown(amount: number, snapshot: SplitSnapshot) {
  return (snapshot.beneficiaries || []).map((b) => ({
    slot: b.slot,
    label: b.label,
    vendorId: b.vendorId,
    percentage: b.percentage,
    amount: Math.round((amount * b.percentage) / 100 * 100) / 100,
  }));
}

export function getSplitStatusLabel(
  splitStatus: string | null,
  splitApplied: boolean,
  paymentStatus: string
): string {
  if (paymentStatus !== "PAID") {
    if (splitStatus === "CONFIGURED_AT_ORDER") return "Split ready (awaiting payment)";
    if (splitStatus) return "Split configured";
    return "No split";
  }
  if (splitApplied && splitStatus === "SPLIT_AT_ORDER") return "Split settled (at order)";
  if (splitApplied && splitStatus === "SPLIT_APPLIED") return "Split settled (after payment)";
  if (splitStatus?.startsWith("SPLIT_FAILED")) return "Split failed";
  if (splitStatus === "CONFIGURED_AT_ORDER") return "Paid — split pending";
  return splitApplied ? "Split applied" : "No split configured";
}
