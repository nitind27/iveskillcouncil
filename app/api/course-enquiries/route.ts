import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { requireSuperAdmin } from "@/lib/api-auth";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/** GET: List course enrolment requests (Enquire Now). Super admin only. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperAdmin();
    if (!user) return unauthorizedResponse();

    const list = await prisma.courseEnrollmentRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const data = list.map((r) => ({
      id: String(r.id),
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
      courseName: r.courseName,
      message: r.message,
      address: r.address,
      pincode: r.pincode,
      area: r.area,
      city: r.city,
      state: r.state,
      createdAt: r.createdAt.toISOString(),
    }));

    return successResponse({ enquiries: data }, "Course enquiries retrieved");
  } catch (error: unknown) {
    console.error("Course enquiries API error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return errorResponse(
        "Database table `course_enrollment_requests` is missing. Run the DB fix script to create it.",
        503
      );
    }
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch course enquiries",
      500
    );
  }
}

/** DELETE: Remove an enquiry by id (Super admin only). */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireSuperAdmin();
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("Missing id", 400);

    await prisma.courseEnrollmentRequest.delete({
      where: { id: BigInt(id) },
    });

    return successResponse({ deleted: true }, "Enquiry deleted");
  } catch (error: unknown) {
    console.error("Course enquiries DELETE error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return errorResponse(
        "Database table `course_enrollment_requests` is missing. Run the DB fix script to create it.",
        503
      );
    }
    return errorResponse(
      error instanceof Error ? error.message : "Failed to delete enquiry",
      500
    );
  }
}
