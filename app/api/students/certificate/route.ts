import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

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
    });

    if (!student) {
      return NextResponse.json({ success: true, data: { certificate: null } });
    }

    const certificate = await prisma.certificate.findFirst({
      where: { studentId: student.id },
      orderBy: { createdAt: "desc" },
    });

    const data = certificate
      ? {
          certificate: {
            id: certificate.id.toString(),
            certificateNumber: certificate.certificateNumber,
            status: certificate.status,
            issueDate: certificate.issueDate?.toISOString().split("T")[0] ?? null,
          },
        }
      : { certificate: null };

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("GET /api/students/certificate", e);
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}
