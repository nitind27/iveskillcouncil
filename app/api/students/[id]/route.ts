import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** PATCH /api/students/[id] – Update student (totalFee, address, etc.) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    const sid = BigInt(id);

    const student = await prisma.student.findUnique({
      where: { id: sid },
      include: { user: true },
    });
    if (!student) return errorResponse("Student not found", 404);

    if (roleId === ROLES.SUB_ADMIN && user.franchiseId && BigInt(user.franchiseId) !== student.franchiseId) {
      return errorResponse("Cannot edit student from another franchise", 403);
    }

    const body = await request.json();
    const { totalFee, address, area, pincode, city, state } = body;

    const updateData: Record<string, unknown> = {};

    if (totalFee != null) {
      const tf = Number(totalFee);
      if (tf < 0) return errorResponse("Total fee cannot be negative", 400);
      if (tf < Number(student.paidFee)) {
        return errorResponse(`Total fee cannot be less than paid amount (₹${Number(student.paidFee).toLocaleString("en-IN")})`, 400);
      }
      updateData.totalFee = tf;
    }

    if (address !== undefined) updateData.address = address?.trim() || null;
    if (area !== undefined) updateData.area = area?.trim() || null;
    if (pincode !== undefined) updateData.pincode = pincode?.trim() || null;
    if (city !== undefined) updateData.city = city?.trim() || null;
    if (state !== undefined) updateData.state = state?.trim() || null;

    if (Object.keys(updateData).length === 0) {
      return errorResponse("No fields to update", 400);
    }

    await prisma.student.update({
      where: { id: sid },
      data: updateData,
    });

    return successResponse({ id }, "Student updated successfully");
  } catch (err) {
    console.error("Students PATCH:", err);
    return errorResponse("Failed to update student", 500);
  }
}
