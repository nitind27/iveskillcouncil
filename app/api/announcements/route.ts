import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser, requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** GET: List announcements. Super Admin/Admin can see all; used for notifications. */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") || "20")));

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          creator: { select: { fullName: true, email: true } },
        },
      }),
      prisma.announcement.count(),
    ]);

    const items = announcements.map((a) => ({
      id: a.id.toString(),
      title: a.title,
      message: a.message,
      createdBy: a.creator.fullName,
      createdAt: a.createdAt.toISOString(),
    }));

    return successResponse(
      { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      "Announcements retrieved"
    );
  } catch (err) {
    console.error("Announcements GET:", err);
    return errorResponse("Failed to fetch announcements", 500);
  }
}

/** POST: Create announcement. Super Admin only. */
export async function POST(request: NextRequest) {
  try {
    const superAdmin = await requireSuperAdminOrAdmin();
    if (!superAdmin) return errorResponse("Forbidden", 403);

    const body = await request.json();
    const { title, message } = body;

    if (!title || !message) {
      return errorResponse("Missing required fields: title, message", 400);
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: String(title).trim(),
        message: String(message).trim(),
        createdBy: BigInt(superAdmin.id),
      },
      include: {
        creator: { select: { fullName: true } },
      },
    });

    return successResponse(
      {
        id: announcement.id.toString(),
        title: announcement.title,
        message: announcement.message,
        createdBy: announcement.creator.fullName,
        createdAt: announcement.createdAt.toISOString(),
      },
      "Announcement created"
    );
  } catch (err) {
    console.error("Announcements POST:", err);
    return errorResponse("Failed to create announcement", 500);
  }
}
