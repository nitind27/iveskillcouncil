import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { canManageCertificateWorkflow } from "@/lib/certificate-access";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (!canManageCertificateWorkflow(roleId)) {
      return errorResponse("Only institute admin can approve or issue certificates", 403);
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["APPROVED", "ISSUED", "REJECTED"].includes(status)) {
      return errorResponse("Invalid status. Use APPROVED, ISSUED, or REJECTED", 400);
    }

    const cert = await prisma.certificate.findUnique({
      where: { id: BigInt(id) },
    });

    if (!cert) return errorResponse("Certificate not found", 404);

    await prisma.certificate.update({
      where: { id: BigInt(id) },
      data:
        status === "ISSUED"
          ? { status, issueDate: new Date(), issuer: { connect: { id: BigInt(user.id) } } }
          : { status },
    });

    return successResponse(null, "Certificate updated");
  } catch (err) {
    console.error("Certificate PUT:", err);
    return errorResponse("Failed to update certificate", 500);
  }
}
