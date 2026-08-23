import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** Students see certificate status only — hard copy is sent by institute */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.roleId !== ROLES.STUDENT) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: BigInt(user.id) },
      include: { course: { select: { name: true } } },
    });

    if (!student) {
      return NextResponse.json({ success: true, data: { certificate: null } });
    }

    const cert = await prisma.certificate.findFirst({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
    });

    if (!cert) {
      return NextResponse.json({ success: true, data: { certificate: null } });
    }

    return NextResponse.json({
      success: true,
      data: {
        certificate: {
          id: cert.id.toString(),
          certificateNumber: cert.certificateNumber,
          status: cert.status,
          issueDate: cert.issueDate?.toISOString().split("T")[0] ?? null,
          courseName: student.course?.name ?? null,
          message:
            cert.status === "ISSUED"
              ? "Your certificate has been issued. The hard copy will be sent to your training centre by the institute."
              : cert.status === "APPROVED"
                ? "Your certificate is approved and will be printed by the institute shortly."
                : cert.status === "REQUESTED"
                  ? "Certificate request submitted. Awaiting institute approval."
                  : cert.status === "REJECTED"
                    ? "Certificate request was rejected. Contact your training centre."
                    : null,
        },
      },
    });
  } catch (e) {
    console.error("GET /api/students/certificate", e);
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}
