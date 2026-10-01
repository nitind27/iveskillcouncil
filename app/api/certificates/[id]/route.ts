import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { canManageCertificateWorkflow } from "@/lib/certificate-access";
import { applyCertificateStatus, WORKFLOW_STATUSES, type WorkflowStatus } from "@/lib/certificate-workflow";

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
    if (!/^\d+$/.test(id)) return errorResponse("Invalid certificate id", 400);
    const body = await request.json();
    const { status } = body as { status: WorkflowStatus };

    if (!WORKFLOW_STATUSES.includes(status)) {
      return errorResponse("Invalid status. Use APPROVED, ISSUED, or REJECTED", 400);
    }

    const cert = await prisma.certificate.findUnique({ where: { id: BigInt(id) } });
    if (!cert) return errorResponse("Certificate not found", 404);

    const result = await applyCertificateStatus([cert.id], status, user.id);
    if (result.updated === 0) {
      return errorResponse(`Cannot change a ${cert.status} certificate to ${status}`, 400);
    }

    return successResponse(null, "Certificate updated");
  } catch (err) {
    console.error("Certificate PUT:", err);
    return errorResponse("Failed to update certificate", 500);
  }
}
