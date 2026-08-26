import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { canManageExams, canViewExamResults } from "@/lib/exam-access";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    const roleId = Number(user.roleId);
    if (!canManageExams(roleId) && !canViewExamResults(roleId)) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    const exam = await prisma.exam.findUnique({
      where: { id: BigInt(id) },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
          include: { options: { orderBy: { sortOrder: "asc" } } },
        },
        targets: true,
        _count: { select: { attempts: true } },
      },
    });
    if (!exam) return errorResponse("Exam not found", 404);

    // LINK exams are institute-admin only (hidden from franchise)
    if (roleId === ROLES.SUB_ADMIN) {
      if (exam.accessMode === "LINK") return errorResponse("Forbidden", 403);
      if (user.franchiseId) {
        const ok = exam.targets.some((t) => t.franchiseId.toString() === user.franchiseId);
        if (!ok) return errorResponse("Forbidden", 403);
      }
    }

    return successResponse({
      id: exam.id.toString(),
      title: exam.title,
      description: exam.description,
      durationMinutes: exam.durationMinutes,
      passPercent: exam.passPercent,
      status: exam.status,
      accessMode: exam.accessMode,
      linkToken: canManageExams(roleId) ? exam.linkToken : null,
      linkActive: exam.linkActive,
      batchLabel: exam.batchLabel,
      requireCamera: exam.requireCamera,
      requireFaceDetect: exam.requireFaceDetect,
      maxFaceViolations: exam.maxFaceViolations,
      shuffleQuestions: exam.shuffleQuestions,
      startsAt: exam.startsAt?.toISOString() ?? null,
      endsAt: exam.endsAt?.toISOString() ?? null,
      attemptCount: exam._count.attempts,
      targets: exam.targets.map((t) => ({
        franchiseId: t.franchiseId.toString(),
        courseId: t.courseId.toString(),
      })),
      questions: exam.questions.map((q) => ({
        id: q.id.toString(),
        text: q.text,
        type: q.type,
        marks: q.marks,
        sortOrder: q.sortOrder,
        options: q.options.map((o) => ({
          id: o.id.toString(),
          text: o.text,
          isCorrect: o.isCorrect,
          sortOrder: o.sortOrder,
        })),
      })),
    });
  } catch (e) {
    console.error("GET /api/exams/[id]", e);
    return errorResponse("Failed to load exam", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (!canManageExams(Number(user.roleId))) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    const existing = await prisma.exam.findUnique({ where: { id: BigInt(id) } });
    if (!existing) return errorResponse("Exam not found", 404);

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.title != null) {
      const title = String(body.title).trim();
      if (title.length < 3) return errorResponse("Title too short", 400);
      data.title = title;
    }
    if (body.description !== undefined) {
      data.description = body.description ? String(body.description).trim() : null;
    }
    if (body.durationMinutes != null) {
      const d = Number(body.durationMinutes);
      if (!Number.isFinite(d) || d < 5 || d > 600) {
        return errorResponse("Invalid duration", 400);
      }
      data.durationMinutes = d;
    }
    if (body.passPercent != null) data.passPercent = Math.min(100, Math.max(0, Number(body.passPercent)));
    if (body.batchLabel !== undefined) {
      data.batchLabel = body.batchLabel ? String(body.batchLabel).trim() : null;
    }
    if (body.requireCamera != null) data.requireCamera = !!body.requireCamera;
    if (body.requireFaceDetect != null) data.requireFaceDetect = !!body.requireFaceDetect;
    if (body.maxFaceViolations != null) {
      data.maxFaceViolations = Math.min(10, Math.max(1, Number(body.maxFaceViolations)));
    }
    if (body.shuffleQuestions != null) data.shuffleQuestions = !!body.shuffleQuestions;
    if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(body.endsAt) : null;
    if (body.status === "DRAFT" || body.status === "PUBLISHED" || body.status === "ARCHIVED") {
      if (body.status === "PUBLISHED") {
        const qCount = await prisma.examQuestion.count({ where: { examId: BigInt(id) } });
        if (qCount < 1) return errorResponse("Add at least one question before publishing", 400);
      }
      data.status = body.status;
    }

    if (typeof body.linkActive === "boolean") {
      if (existing.accessMode !== "LINK") {
        return errorResponse("Only walk-in link exams can activate/deactivate a link", 400);
      }
      if (!existing.linkToken) {
        const { generateExamLinkToken } = await import("@/lib/exam-link");
        data.linkToken = generateExamLinkToken();
      }
      data.linkActive = body.linkActive;
    }

    if (body.regenerateLink === true) {
      if (existing.accessMode !== "LINK") {
        return errorResponse("Only walk-in link exams have a public link", 400);
      }
      const { generateExamLinkToken } = await import("@/lib/exam-link");
      data.linkToken = generateExamLinkToken();
      data.linkActive = false;
    }

    if (body.convertToLink === true) {
      const { generateExamLinkToken } = await import("@/lib/exam-link");
      data.accessMode = "LINK";
      data.linkToken = existing.linkToken || generateExamLinkToken();
      data.linkActive = false;
    }

    if (Array.isArray(body.targets)) {
      if (existing.accessMode === "ASSIGNED" && !body.targets.length) {
        return errorResponse("At least one target required", 400);
      }
      await prisma.examTarget.deleteMany({ where: { examId: BigInt(id) } });
      if (body.targets.length) {
        await prisma.examTarget.createMany({
          data: body.targets.map((t: { franchiseId: string; courseId: string }) => ({
            examId: BigInt(id),
            franchiseId: BigInt(t.franchiseId),
            courseId: BigInt(t.courseId),
          })),
        });
      }
    }

    const exam = await prisma.exam.update({
      where: { id: BigInt(id) },
      data,
      include: {
        targets: true,
        _count: { select: { questions: true, attempts: true, targets: true } },
      },
    });

    return successResponse(
      {
        id: exam.id.toString(),
        title: exam.title,
        status: exam.status,
        accessMode: exam.accessMode,
        linkToken: exam.linkToken,
        linkActive: exam.linkActive,
        durationMinutes: exam.durationMinutes,
        targets: exam.targets.map((t) => ({
          franchiseId: t.franchiseId.toString(),
          courseId: t.courseId.toString(),
        })),
      },
      "Exam updated"
    );
  } catch (e) {
    console.error("PATCH /api/exams/[id]", e);
    return errorResponse("Failed to update exam", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (!canManageExams(Number(user.roleId))) {
      return errorResponse("Forbidden", 403);
    }
    const { id } = await params;
    await prisma.exam.delete({ where: { id: BigInt(id) } });
    return successResponse({ id }, "Exam deleted");
  } catch (e) {
    console.error("DELETE /api/exams/[id]", e);
    return errorResponse("Failed to delete exam", 500);
  }
}
