import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const params = request.nextUrl.searchParams;
    const page   = Math.max(1, parseInt(params.get("page") || "1"));
    const limit  = Math.min(50, parseInt(params.get("limit") || "20"));
    const status = params.get("status") || undefined;
    const search = params.get("search")?.trim() || undefined;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { instituteName: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const [apps, total] = await Promise.all([
      prisma.franchiseApplication.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { plan: { select: { name: true, price: true } } },
      }),
      prisma.franchiseApplication.count({ where }),
    ]);

    const items = apps.map((a) => ({
      id:            a.id.toString(),
      fullName:      a.fullName,
      email:         a.email,
      phone:         a.phone,
      alternatePhone: a.alternatPhone,
      instituteName: a.instituteName,
      businessType:  a.businessType,
      address:       a.address,
      city:          a.city,
      state:         a.state,
      pincode:       a.pincode,
      planId:        a.planId,
      planName:      a.plan?.name ?? null,
      message:       a.message,
      documents:     a.documents,
      status:        a.status,
      adminNotes:    a.adminNotes,
      reviewedAt:    a.reviewedAt?.toISOString() ?? null,
      createdAt:     a.createdAt.toISOString(),
    }));

    return successResponse(
      { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      "Applications"
    );
  } catch (err) {
    console.error("admin/franchise-applications GET:", err);
    return errorResponse("Failed to fetch applications", 500);
  }
}
