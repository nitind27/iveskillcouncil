import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

type DocType = "ms" | "cert";

const studentSelect = {
  id: true,
  studentCode: true,
  firstName: true,
  surname: true,
  course: { select: { name: true } },
  franchise: { select: { name: true, slug: true } },
} as const;

function normalizeEnr(raw: string): string {
  return String(raw || "").replace(/\D/g, "");
}

function normalizeId(raw: string): string {
  return String(raw || "").trim().toUpperCase();
}

/**
 * Public certificate / marksheet verification.
 * Query: type=ms|cert, enr=<enrollment digits>, id=<certificate number>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeRaw = (searchParams.get("type") || "ms").toLowerCase();
    const type: DocType = typeRaw === "cert" ? "cert" : "ms";
    const enr = normalizeEnr(searchParams.get("enr") || "");
    const id = normalizeId(searchParams.get("id") || "");

    if (!enr && !id) {
      return errorResponse(
        "Provide enrollment number (enr) and/or certificate number (id).",
        400
      );
    }

    // MySQL ci collations already match case-insensitively — do not use mode:"insensitive"
    let certificate =
      id.length > 0
        ? await prisma.certificate.findFirst({
            where: {
              OR: [
                { certificateNumber: id },
                { certificateNumber: { contains: id } },
              ],
            },
            include: { student: { select: studentSelect } },
            orderBy: { createdAt: "desc" },
          })
        : null;

    if (!certificate && enr) {
      const student = await prisma.student.findFirst({
        where: {
          OR: [{ studentCode: { contains: enr } }, { studentCode: enr }],
        },
        select: { id: true },
      });

      if (student) {
        certificate = await prisma.certificate.findFirst({
          where: {
            studentId: student.id,
            ...(type === "cert"
              ? {
                  OR: [
                    { certificateNumber: { startsWith: "IVESDC/CERT" } },
                    { certificateNumber: { contains: "/CERT/" } },
                  ],
                }
              : {
                  OR: [
                    { certificateNumber: { startsWith: "IVESDC/MS" } },
                    { certificateNumber: { contains: "/MS/" } },
                  ],
                }),
          },
          include: { student: { select: studentSelect } },
          orderBy: { createdAt: "desc" },
        });

        if (!certificate) {
          certificate = await prisma.certificate.findFirst({
            where: { studentId: student.id },
            include: { student: { select: studentSelect } },
            orderBy: { createdAt: "desc" },
          });
        }
      }
    }

    if (!certificate) {
      return successResponse({
        verified: false,
        reason: "NOT_FOUND",
        message:
          "No matching certificate or marksheet was found in the IVESDC registry.",
        query: { type, enr: enr || null, id: id || null },
      });
    }

    const studentCodeDigits = normalizeEnr(certificate.student.studentCode || "");
    const enrMatches =
      !enr ||
      studentCodeDigits === enr ||
      studentCodeDigits.endsWith(enr) ||
      enr.endsWith(studentCodeDigits) ||
      studentCodeDigits.includes(enr);

    const certUpper = certificate.certificateNumber.toUpperCase();
    const idMatches = !id || certUpper === id || certUpper.includes(id);

    if (!enrMatches || !idMatches) {
      return successResponse({
        verified: false,
        reason: "MISMATCH",
        message:
          "The enrollment / certificate details on the document do not match our records.",
        query: { type, enr: enr || null, id: id || null },
      });
    }

    const status = String(certificate.status || "").toUpperCase();
    const issuedOk = status === "ISSUED" || status === "APPROVED";

    if (!issuedOk) {
      return successResponse({
        verified: false,
        reason: "NOT_ISSUED",
        message: `This document exists but is not issued (status: ${status || "UNKNOWN"}).`,
        query: { type, enr: enr || null, id: id || null },
        document: {
          certificateNumber: certificate.certificateNumber,
          status: certificate.status,
          type,
        },
      });
    }

    const fullName = [certificate.student.firstName, certificate.student.surname]
      .filter(Boolean)
      .join(" ")
      .trim();

    return successResponse({
      verified: true,
      reason: "OK",
      message: "This document is authentic and verified in the IVESDC registry.",
      query: { type, enr: enr || null, id: id || null },
      document: {
        type,
        certificateNumber: certificate.certificateNumber,
        status: certificate.status,
        issueDate: certificate.issueDate
          ? certificate.issueDate.toISOString()
          : null,
        courseName: certificate.student.course?.name || null,
        studentName: fullName || "—",
        enrollmentNo: certificate.student.studentCode,
        centreName: certificate.student.franchise?.name || null,
        centreCode: certificate.student.franchise?.slug || null,
      },
    });
  } catch (error) {
    console.error("Certificate verify error:", error);
    return errorResponse("Verification service temporarily unavailable", 503);
  }
}
