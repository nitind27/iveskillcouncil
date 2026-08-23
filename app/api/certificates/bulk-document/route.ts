import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { canPrintCertificates } from "@/lib/certificate-access";
import { getCertificateDisplayData } from "@/lib/certificate-display";

export const dynamic = "force-dynamic";

/** POST — bulk certificate documents for institute admin batch printing */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (!canPrintCertificates(roleId)) {
      return errorResponse("Only institute admin can print certificates", 403);
    }

    const body = await request.json();
    const { ids, franchiseId, courseId, status = "ISSUED" } = body as {
      ids?: string[];
      franchiseId?: string;
      courseId?: string;
      status?: string;
    };

    let certIds: bigint[] = [];

    if (ids?.length) {
      certIds = ids.map((id) => BigInt(id));
    } else {
      const where: Record<string, unknown> = { status };
      if (franchiseId) where.franchiseId = BigInt(franchiseId);
      if (courseId) where.student = { courseId: BigInt(courseId) };

      const certs = await prisma.certificate.findMany({
        where,
        orderBy: [{ franchiseId: "asc" }, { createdAt: "asc" }],
        select: { id: true },
        take: 100,
      });
      certIds = certs.map((c) => c.id);
    }

    if (!certIds.length) {
      return successResponse({ items: [], count: 0 }, "No certificates to print");
    }

    const items = [];
    for (const id of certIds) {
      const cert = await prisma.certificate.findUnique({ where: { id } });
      if (!cert || cert.status !== "ISSUED") continue;
      const display = await getCertificateDisplayData(id);
      if (display) items.push(display);
    }

    return successResponse({ items, count: items.length }, "Bulk certificates retrieved");
  } catch (err) {
    console.error("Bulk document POST:", err);
    return errorResponse("Failed to load certificates for print", 500);
  }
}
