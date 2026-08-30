import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCashfreeVendor } from "@/lib/cashfree";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/** POST /api/admin/split-beneficiaries/[slot]/register — register beneficiary with Cashfree Easy Split */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slot: string }> }
) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const { slot: slotStr } = await params;
    const slot = Number(slotStr);
    if (![1, 2, 3].includes(slot)) return errorResponse("Invalid slot", 400);

    const ben = await prisma.splitBeneficiary.findUnique({ where: { slot } });
    if (!ben) return errorResponse("Configure beneficiary bank details first", 400);

    if (!ben.email || !ben.phone) {
      return errorResponse("Email and phone are required for Cashfree vendor registration", 400);
    }

    const vendorId =
      ben.cashfreeVendorId ||
      `IVESDC_BEN_${slot}_${ben.id}`.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 50);

    const cfResult = await createCashfreeVendor({
      vendorId,
      name: ben.label || ben.accountHolderName,
      email: ben.email,
      phone: ben.phone,
      accountHolder: ben.accountHolderName,
      accountNumber: ben.bankAccountNumber,
      ifsc: ben.bankIfsc,
      pan: ben.panNumber || undefined,
    });

    if (!cfResult.success) {
      return errorResponse(`Cashfree vendor registration failed: ${cfResult.error}`, 502);
    }

    const updated = await prisma.splitBeneficiary.update({
      where: { slot },
      data: {
        cashfreeVendorId: cfResult.vendorId,
        vendorStatus: cfResult.status,
      },
    });

    return successResponse(
      {
        slot: updated.slot,
        cashfreeVendorId: updated.cashfreeVendorId,
        vendorStatus: updated.vendorStatus,
      },
      "Vendor registered with Cashfree Easy Split"
    );
  } catch (e) {
    console.error("POST split-beneficiaries register", e);
    return errorResponse("Failed to register vendor", 500);
  }
}
