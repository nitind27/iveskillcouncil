import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { canTakeExams } from "@/lib/exam-access";
import { ensureAttemptNotExpired } from "@/lib/exam-grade";

export const dynamic = "force-dynamic";

/** Student: list exams available for their franchise + course */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (!canTakeExams(Number(user.roleId))) {
      return errorResponse("Forbidden", 403);
    }

    const student = await prisma.student.findUnique({
      where: { userId: BigInt(user.id) },
      include: {
        course: { select: { id: true, name: true } },
        enrollments: {
          where: { status: "ACTIVE" },
          include: { course: { select: { id: true, name: true } } },
        },
      },
    });
    if (!student) return errorResponse("Student profile not found", 404);
    const courseIds = [
      ...new Set(
        [
          student.courseId,
          ...student.enrollments.map((row) => row.courseId),
        ].filter((id): id is bigint => id != null)
      ),
    ];
    if (!courseIds.length) {
      return successResponse({ items: [] }, "No course assigned");
    }
    const courseNameById = new Map<string, string>();
    if (student.course) courseNameById.set(student.course.id.toString(), student.course.name);
    for (const row of student.enrollments) {
      courseNameById.set(row.course.id.toString(), row.course.name);
    }

    const now = new Date();
    const exams = await prisma.exam.findMany({
      where: {
        status: "PUBLISHED",
        accessMode: "ASSIGNED",
        targets: {
          some: {
            franchiseId: student.franchiseId,
            courseId: { in: courseIds },
          },
        },
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { questions: true } },
        targets: {
          where: { franchiseId: student.franchiseId, courseId: { in: courseIds } },
          select: { courseId: true },
        },
        attempts: {
          where: { studentId: student.id },
          take: 1,
        },
      },
    });

    const items = [];
    for (const e of exams) {
      // Skip if window ended and no attempt
      if (e.endsAt && e.endsAt < now && !e.attempts.length) continue;

      let attempt: (typeof e.attempts)[number] | null = e.attempts[0] ?? null;
      if (attempt?.status === "IN_PROGRESS") {
        await ensureAttemptNotExpired(attempt.id);
        attempt = await prisma.examAttempt.findUnique({ where: { id: attempt.id } });
      }

      items.push({
        id: e.id.toString(),
        title: e.title,
        description: e.description,
        durationMinutes: e.durationMinutes,
        passPercent: e.passPercent,
        batchLabel: e.batchLabel,
        questionCount: e._count.questions,
        requireCamera: e.requireCamera,
        requireFaceDetect: e.requireFaceDetect,
        courseName:
          e.targets
            .map((target) => courseNameById.get(target.courseId.toString()))
            .filter(Boolean)
            .join(", ") || "—",
        endsAt: e.endsAt?.toISOString() ?? null,
        attempt: attempt
          ? {
              id: attempt.id.toString(),
              status: attempt.status,
              startedAt: attempt.startedAt.toISOString(),
              endsAt: attempt.endsAt.toISOString(),
              submittedAt: attempt.submittedAt?.toISOString() ?? null,
              percent: attempt.percent != null ? Number(attempt.percent) : null,
              passed: attempt.passed,
              score: attempt.score != null ? Number(attempt.score) : null,
              maxScore: attempt.maxScore != null ? Number(attempt.maxScore) : null,
              restartApproved: !!attempt.restartApprovedAt,
              remainingSecondsAtStop: attempt.remainingSecondsAtStop,
            }
          : null,
      });
    }

    return successResponse(items, "Available exams");
  } catch (e) {
    console.error("GET /api/exams/available", e);
    return errorResponse("Failed to load exams", 500);
  }
}
