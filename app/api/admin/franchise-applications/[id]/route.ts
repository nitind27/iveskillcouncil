import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** PATCH — update status / admin notes */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const { id } = await params;
    const body = await request.json();
    const { status, adminNotes } = body;

    const app = await prisma.franchiseApplication.findUnique({ where: { id: BigInt(id) } });
    if (!app) return notFoundResponse();

    const updated = await prisma.franchiseApplication.update({
      where: { id: BigInt(id) },
      data: {
        ...(status && { status: String(status) }),
        ...(adminNotes !== undefined && { adminNotes: adminNotes ? String(adminNotes) : null }),
        reviewedBy: BigInt(user.id),
        reviewedAt: new Date(),
      },
    });

    return successResponse(
      { id: updated.id.toString(), status: updated.status },
      "Application updated"
    );
  } catch (err) {
    console.error("admin/franchise-applications PATCH:", err);
    return errorResponse("Failed to update application", 500);
  }
}

/** GET single application */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const { id } = await params;
    const app = await prisma.franchiseApplication.findUnique({
      where: { id: BigInt(id) },
      include: { plan: { select: { name: true, price: true } } },
    });
    if (!app) return notFoundResponse();

    return successResponse({
      id:            app.id.toString(),
      fullName:      app.fullName,
      email:         app.email,
      phone:         app.phone,
      alternatePhone: app.alternatPhone,
      instituteName: app.instituteName,
      businessType:  app.businessType,
      address:       app.address,
      city:          app.city,
      state:         app.state,
      pincode:       app.pincode,
      planId:        app.planId,
      planName:      app.plan?.name ?? null,
      message:       app.message,
      documents:     app.documents,
      status:        app.status,
      adminNotes:    app.adminNotes,
      reviewedAt:    app.reviewedAt?.toISOString() ?? null,
      createdAt:     app.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("admin/franchise-applications GET single:", err);
    return errorResponse("Failed to fetch application", 500);
  }
}
