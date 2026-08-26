import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import { canManageExams, canViewExamResults } from "@/lib/exam-access";
import { generateExamLinkToken } from "@/lib/exam-link";

export const dynamic = "force-dynamic";

function mapExam(e: {
  id: bigint;
  title: string;
  description: string | null;
  durationMinutes: number;
  passPercent: number;
  status: string;
  accessMode?: string;
  linkToken?: string | null;
  linkActive?: boolean;
  batchLabel: string | null;
  requireCamera: boolean;
  requireFaceDetect: boolean;
  maxFaceViolations: number;
  shuffleQuestions: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  _count?: { questions: number; attempts: number; targets: number };
  targets?: Array<{
    franchiseId: bigint;
    courseId: bigint;
  }>;
}) {
  return {
    id: e.id.toString(),
    title: e.title,
    description: e.description,
    durationMinutes: e.durationMinutes,
    passPercent: e.passPercent,
    status: e.status,
    accessMode: e.accessMode ?? "ASSIGNED",
    linkToken: e.linkToken ?? null,
    linkActive: !!e.linkActive,
    batchLabel: e.batchLabel,
    requireCamera: e.requireCamera,
    requireFaceDetect: e.requireFaceDetect,
    maxFaceViolations: e.maxFaceViolations,
    shuffleQuestions: e.shuffleQuestions,
    startsAt: e.startsAt?.toISOString() ?? null,
    endsAt: e.endsAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    questionCount: e._count?.questions ?? 0,
    attemptCount: e._count?.attempts ?? 0,
    targetCount: e._count?.targets ?? 0,
    targets: (e.targets ?? []).map((t) => ({
      franchiseId: t.franchiseId.toString(),
      courseId: t.courseId.toString(),
    })),
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    const roleId = Number(user.roleId);

    if (!canManageExams(roleId) && !canViewExamResults(roleId)) {
      return errorResponse("Forbidden", 403);
    }

    const status = request.nextUrl.searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    // Franchise admin: only ASSIGNED exams for their franchise (LINK exams stay hidden)
    if (roleId === ROLES.SUB_ADMIN && user.franchiseId) {
      where.accessMode = "ASSIGNED";
      where.targets = { some: { franchiseId: BigInt(user.franchiseId) } };
    }

    const exams = await prisma.exam.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questions: true, attempts: true, targets: true } },
        targets: true,
      },
    });

    return successResponse(exams.map(mapExam), "Exams retrieved");
  } catch (e) {
    console.error("GET /api/exams", e);
    return errorResponse("Failed to load exams", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (!canManageExams(Number(user.roleId))) {
      return errorResponse("Only institute admin can create exams", 403);
    }

    const body = await request.json();
    const title = String(body.title || "").trim();
    const durationMinutes = Number(body.durationMinutes);
    if (!title || title.length < 3) {
      return errorResponse("Title must be at least 3 characters", 400);
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes < 5 || durationMinutes > 600) {
      return errorResponse("Duration must be between 5 and 600 minutes", 400);
    }

    const targets: Array<{ franchiseId: string; courseId: string }> = Array.isArray(body.targets)
      ? body.targets
      : [];

    const accessMode = body.accessMode === "ASSIGNED" ? "ASSIGNED" : "LINK";

    if (accessMode === "ASSIGNED" && !targets.length) {
      return errorResponse("Select at least one franchise + course (batch)", 400);
    }

    const linkToken = accessMode === "LINK" ? generateExamLinkToken() : null;

    const exam = await prisma.exam.create({
      data: {
        title,
        description: body.description ? String(body.description).trim() : null,
        durationMinutes,
        passPercent: Math.min(100, Math.max(0, Number(body.passPercent) || 40)),
        batchLabel: body.batchLabel ? String(body.batchLabel).trim() : null,
        accessMode,
        linkToken,
        linkActive: false,
        requireCamera: body.requireCamera !== false,
        requireFaceDetect: body.requireFaceDetect !== false,
        maxFaceViolations: Math.min(10, Math.max(1, Number(body.maxFaceViolations) || 3)),
        shuffleQuestions: body.shuffleQuestions !== false,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        createdBy: BigInt(user.id),
        ...(targets.length
          ? {
              targets: {
                create: targets.map((t) => ({
                  franchiseId: BigInt(t.franchiseId),
                  courseId: BigInt(t.courseId),
                })),
              },
            }
          : {}),
      },
      include: {
        _count: { select: { questions: true, attempts: true, targets: true } },
        targets: true,
      },
    });

    return successResponse(mapExam(exam), "Exam created");
  } catch (e) {
    console.error("POST /api/exams", e);
    return errorResponse("Failed to create exam", 500);
  }
}
