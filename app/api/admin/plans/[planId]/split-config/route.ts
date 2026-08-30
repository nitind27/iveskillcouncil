import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { validateSplitPercentages, normalizeSplitPercentages } from "@/lib/split-validation";

export const dynamic = "force-dynamic";

/** GET /api/admin/plans/[planId]/split-config */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const { planId } = await params;
    const planIdNum = parseInt(planId, 10);
    if (Number.isNaN(planIdNum)) return errorResponse("Invalid plan ID", 400);

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planIdNum } });
    if (!plan) return errorResponse("Plan not found", 404);

    const config = await prisma.planSplitConfig.findUnique({ where: { planId: planIdNum } });

    return successResponse({
      planId: plan.id,
      planName: plan.name,
      price: Number(plan.price),
      splitConfig: config
        ? {
            beneficiary1Pct: Number(config.beneficiary1Pct),
            beneficiary2Pct: Number(config.beneficiary2Pct),
            beneficiary3Pct: Number(config.beneficiary3Pct),
            isActive: config.isActive,
            total:
              Number(config.beneficiary1Pct) +
              Number(config.beneficiary2Pct) +
              Number(config.beneficiary3Pct),
          }
        : null,
    });
  } catch (e) {
    console.error("GET plan split-config", e);
    return errorResponse("Failed to load split config", 500);
  }
}

/** PUT /api/admin/plans/[planId]/split-config — save percentages (must sum to 100%) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const { planId } = await params;
    const planIdNum = parseInt(planId, 10);
    if (Number.isNaN(planIdNum)) return errorResponse("Invalid plan ID", 400);

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planIdNum } });
    if (!plan) return errorResponse("Plan not found", 404);

    const body = await request.json();
    const pct1 = Number(body.beneficiary1Pct);
    const pct2 = Number(body.beneficiary2Pct);
    const pct3 = Number(body.beneficiary3Pct);
    const isActive = body.isActive !== false;

    const validation = validateSplitPercentages(pct1, pct2, pct3);
    if (!validation.valid) return errorResponse(validation.error, 400);

    const normalized = normalizeSplitPercentages(pct1, pct2, pct3);

    const config = await prisma.planSplitConfig.upsert({
      where: { planId: planIdNum },
      create: {
        planId: planIdNum,
        beneficiary1Pct: normalized.beneficiary1Pct ?? 100,
        beneficiary2Pct: normalized.beneficiary2Pct ?? 0,
        beneficiary3Pct: normalized.beneficiary3Pct ?? 0,
        isActive,
      },
      update: {
        beneficiary1Pct: normalized.beneficiary1Pct,
        beneficiary2Pct: normalized.beneficiary2Pct,
        beneficiary3Pct: normalized.beneficiary3Pct,
        isActive,
      },
    });

    // Optional: admin can override franchise sell price on same request
    let price = Number(plan.price);
    if (typeof body.price === "number" && body.price >= 0) {
      const updatedPlan = await prisma.subscriptionPlan.update({
        where: { id: planIdNum },
        data: { price: body.price },
      });
      price = Number(updatedPlan.price);
    }

    return successResponse(
      {
        planId: plan.id,
        planName: plan.name,
        price,
        splitConfig: {
          beneficiary1Pct: Number(config.beneficiary1Pct),
          beneficiary2Pct: Number(config.beneficiary2Pct),
          beneficiary3Pct: Number(config.beneficiary3Pct),
          isActive: config.isActive,
          total: 100,
        },
      },
      "Split configuration saved"
    );
  } catch (e) {
    console.error("PUT plan split-config", e);
    return errorResponse("Failed to save split config", 500);
  }
}
