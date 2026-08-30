import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const SLOTS = [1, 2, 3] as const;

function maskAccount(num: string): string {
  const clean = num.replace(/\s/g, "");
  if (clean.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, clean.length - 4))}${clean.slice(-4)}`;
}

/** GET /api/admin/split-beneficiaries — list 3 beneficiary slots */
export async function GET() {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const rows = await prisma.splitBeneficiary.findMany({ orderBy: { slot: "asc" } });
    const bySlot = new Map(rows.map((r) => [r.slot, r]));

    const beneficiaries = SLOTS.map((slot) => {
      const row = bySlot.get(slot);
      if (!row) {
        return {
          slot,
          label: "",
          accountHolderName: "",
          bankName: "",
          bankAccountNumber: "",
          bankIfsc: "",
          panNumber: "",
          email: "",
          phone: "",
          cashfreeVendorId: null,
          vendorStatus: null,
          status: "INACTIVE",
          accountMasked: null,
          isConfigured: false,
        };
      }
      return {
        slot: row.slot,
        label: row.label,
        accountHolderName: row.accountHolderName,
        bankName: row.bankName,
        bankAccountNumber: row.bankAccountNumber,
        bankIfsc: row.bankIfsc,
        panNumber: row.panNumber,
        email: row.email,
        phone: row.phone,
        cashfreeVendorId: row.cashfreeVendorId,
        vendorStatus: row.vendorStatus,
        status: row.status,
        accountMasked: maskAccount(row.bankAccountNumber),
        isConfigured: true,
      };
    });

    return successResponse({ beneficiaries });
  } catch (e) {
    console.error("GET split-beneficiaries", e);
    return errorResponse("Failed to load beneficiaries", 500);
  }
}

/** PUT /api/admin/split-beneficiaries — upsert beneficiary for a slot (1–3) */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const body = await request.json();
    const slot = Number(body.slot);
    if (!SLOTS.includes(slot as (typeof SLOTS)[number])) {
      return errorResponse("slot must be 1, 2, or 3", 400);
    }

    const label = String(body.label || "").trim();
    const accountHolderName = String(body.accountHolderName || "").trim();
    const bankAccountNumber = String(body.bankAccountNumber || "").replace(/\s/g, "");
    const bankIfsc = String(body.bankIfsc || "").trim().toUpperCase();
    const bankName = body.bankName ? String(body.bankName).trim() : null;
    const panNumber = body.panNumber ? String(body.panNumber).trim().toUpperCase() : null;
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const phone = body.phone ? String(body.phone).trim() : null;
    const status = body.status === "INACTIVE" ? "INACTIVE" : "ACTIVE";

    if (!label || !accountHolderName || !bankAccountNumber || !bankIfsc) {
      return errorResponse("label, accountHolderName, bankAccountNumber and bankIfsc are required", 400);
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc)) {
      return errorResponse("Invalid IFSC code format", 400);
    }

    const row = await prisma.splitBeneficiary.upsert({
      where: { slot },
      create: {
        slot,
        label,
        accountHolderName,
        bankName,
        bankAccountNumber,
        bankIfsc,
        panNumber,
        email,
        phone,
        status,
      },
      update: {
        label,
        accountHolderName,
        bankName,
        bankAccountNumber,
        bankIfsc,
        panNumber,
        email,
        phone,
        status,
        // Reset vendor if bank details changed — admin must re-register
        ...(body.bankDetailsChanged
          ? { cashfreeVendorId: null, vendorStatus: null }
          : {}),
      },
    });

    return successResponse(
      {
        slot: row.slot,
        label: row.label,
        cashfreeVendorId: row.cashfreeVendorId,
        vendorStatus: row.vendorStatus,
        status: row.status,
      },
      "Beneficiary saved"
    );
  } catch (e) {
    console.error("PUT split-beneficiaries", e);
    return errorResponse("Failed to save beneficiary", 500);
  }
}
