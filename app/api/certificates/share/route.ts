import { randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";
import {
  MAX_SHARE_STUDENTS,
  normalizeShareUsername,
  parseShareKind,
  parseShareStudentIds,
} from "@/lib/certificate-share";

export const dynamic = "force-dynamic";

function sharePath(token: string) {
  return `/certificates/share/${token}`;
}

export async function GET() {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return unauthorizedResponse();

    const rows = await prisma.certificateShareLink.findMany({
      where: { createdBy: BigInt(user.id) },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    return successResponse({
      items: rows.map((row) => ({
        token: row.token,
        username: row.username,
        title: row.title,
        kinds: row.kinds,
        courseId: row.courseId,
        studentCount: parseShareStudentIds(row.studentIds).length,
        createdAt: row.createdAt.toISOString(),
        path: sharePath(row.token),
      })),
    });
  } catch (err) {
    console.error("List certificate share links:", err);
    return errorResponse("Could not load share links", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return unauthorizedResponse();

    const body = await request.json().catch(() => ({}));
    const username = normalizeShareUsername(body.username);
    const password = String(body.password ?? "");
    const kinds = parseShareKind(body.kinds) ?? "both";
    const studentIds = parseShareStudentIds(body.studentIds);
    const courseId = typeof body.courseId === "string" && /^\d+$/.test(body.courseId) ? body.courseId : null;
    const title = String(body.title ?? "").trim().slice(0, 150) || null;

    if (!username) {
      return errorResponse("Username must be 3–40 letters, numbers, . _ or -", 400, "username");
    }
    if (password.length < 6 || password.length > 72) {
      return errorResponse("Password must be 6–72 characters", 400, "password");
    }
    if (!studentIds.length) {
      return errorResponse("Choose at least one student to share", 400);
    }

    const passwordHash = await hashPassword(password);
    const token = randomBytes(18).toString("base64url");

    await prisma.certificateShareLink.create({
      data: {
        token,
        username,
        passwordHash,
        title,
        studentIds,
        courseId,
        kinds,
        createdBy: BigInt(user.id),
      },
    });

    return successResponse({
      token,
      username,
      title,
      kinds,
      studentCount: studentIds.length,
      path: sharePath(token),
      capped: Array.isArray(body.studentIds) && body.studentIds.length > MAX_SHARE_STUDENTS,
    });
  } catch (err) {
    console.error("Create certificate share link:", err);
    return errorResponse("Could not create the share link", 500);
  }
}
