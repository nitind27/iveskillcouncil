import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { canPrintCertificates } from "@/lib/certificate-access";
import { getCertificateDisplayData } from "@/lib/certificate-display";
import type { CertificateOverrides } from "@/lib/certificate-overrides";

export const dynamic = "force-dynamic";

const OVERRIDE_KEYS = [
  "serialNumber",
  "certificateNumber",
  "atcCode",
  "atcName",
  "studentName",
  "parentName",
  "registrationNumber",
  "courseName",
  "grade",
  "gradeLabel",
  "marksPercent",
  "trainingStart",
  "trainingEnd",
  "issueDate",
  "trainingCentre",
  "trainingCentreName",
  "franchiseAddress",
] as const;

function pickOverrides(body: Record<string, unknown>): CertificateOverrides {
  const out: CertificateOverrides = {};
  for (const key of OVERRIDE_KEYS) {
    if (body[key] !== undefined) {
      (out as Record<string, unknown>)[key] = body[key];
    }
  }
  return out;
}

/** GET certificate document — institute admin print/preview only */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (!canPrintCertificates(roleId)) {
      return errorResponse("Only institute admin can preview or print certificates", 403);
    }

    const { id } = await params;
    const cert = await prisma.certificate.findUnique({
      where: { id: BigInt(id) },
    });

    if (!cert) return errorResponse("Certificate not found", 404);

    const canPreview = cert.status === "ISSUED" || cert.status === "APPROVED";
    if (!canPreview) {
      return errorResponse("Preview available after approval", 400);
    }

    const display = await getCertificateDisplayData(cert.id);
    if (!display) return errorResponse("Certificate not found", 404);

    return successResponse(
      { ...display, isDraft: cert.status === "APPROVED" },
      "Certificate document retrieved"
    );
  } catch (err) {
    console.error("Certificate document GET:", err);
    return errorResponse("Failed to fetch certificate", 500);
  }
}

/** PUT — save admin edits to certificate display fields */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (!canPrintCertificates(roleId)) {
      return errorResponse("Only institute admin can edit certificates", 403);
    }

    const { id } = await params;
    const cert = await prisma.certificate.findUnique({
      where: { id: BigInt(id) },
    });

    if (!cert) return errorResponse("Certificate not found", 404);

    if (cert.status !== "APPROVED" && cert.status !== "ISSUED") {
      return errorResponse("Can only edit approved or issued certificates", 400);
    }

    const body = await request.json();
    const source = (body.overrides ?? body) as Record<string, unknown>;
    const overrides = pickOverrides(source);

    await prisma.certificate.update({
      where: { id: cert.id },
      data: { displayOverrides: overrides },
    });

    const display = await getCertificateDisplayData(cert.id);
    if (!display) return errorResponse("Certificate not found", 404);

    return successResponse(
      { ...display, isDraft: cert.status === "APPROVED" },
      "Certificate updated"
    );
  } catch (err) {
    console.error("Certificate document PUT:", err);
    return errorResponse("Failed to save certificate", 500);
  }
}
