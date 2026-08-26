import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { canViewExamResults } from "@/lib/exam-access";
import { ROLES } from "@/lib/permissions";
import { ensureAttemptNotExpired } from "@/lib/exam-grade";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    const roleId = Number(user.roleId);
    if (!canViewExamResults(roleId)) return errorResponse("Forbidden", 403);

    const { id } = await params;
    const exam = await prisma.exam.findUnique({
      where: { id: BigInt(id) },
      include: { targets: true },
    });
    if (!exam) return errorResponse("Exam not found", 404);

    if (roleId === ROLES.SUB_ADMIN) {
      if (exam.accessMode === "LINK") return errorResponse("Forbidden", 403);
      if (user.franchiseId) {
        const ok = exam.targets.some((t) => t.franchiseId.toString() === user.franchiseId);
        if (!ok) return errorResponse("Forbidden", 403);
      }
    }

    const attempts = await prisma.examAttempt.findMany({
      where: {
        examId: exam.id,
        ...(roleId === ROLES.SUB_ADMIN && user.franchiseId
          ? { student: { franchiseId: BigInt(user.franchiseId) } }
          : {}),
      },
      orderBy: { startedAt: "desc" },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
            course: { select: { name: true } },
            franchise: { select: { name: true } },
          },
        },
        _count: { select: { proctorEvents: true } },
      },
    });

    // Finalize any expired in-progress attempts
    for (const a of attempts) {
      if (a.status === "IN_PROGRESS") await ensureAttemptNotExpired(a.id);
    }

    const refreshed = await prisma.examAttempt.findMany({
      where: {
        examId: exam.id,
        ...(roleId === ROLES.SUB_ADMIN && user.franchiseId
          ? { student: { franchiseId: BigInt(user.franchiseId) } }
          : {}),
      },
      orderBy: { startedAt: "desc" },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true } },
            course: { select: { name: true } },
            franchise: { select: { name: true } },
          },
        },
        _count: { select: { proctorEvents: true } },
      },
    });

    return successResponse({
      exam: {
        id: exam.id.toString(),
        title: exam.title,
        passPercent: exam.passPercent,
        durationMinutes: exam.durationMinutes,
        status: exam.status,
        accessMode: exam.accessMode,
      },
      attempts: refreshed.map((a) => ({
        id: a.id.toString(),
        status: a.status,
        studentName: a.student?.user.fullName ?? a.enrollmentNumber ?? "Walk-in",
        studentEmail: a.student?.user.email ?? "—",
        enrollmentNumber: a.enrollmentNumber,
        photoUrl: a.photoUrl,
        courseName: a.student?.course.name ?? "—",
        franchiseName: a.student?.franchise.name ?? "Walk-in link",
        startedAt: a.startedAt.toISOString(),
        submittedAt: a.submittedAt?.toISOString() ?? null,
        endsAt: a.endsAt.toISOString(),
        score: a.score != null ? Number(a.score) : null,
        maxScore: a.maxScore != null ? Number(a.maxScore) : null,
        percent: a.percent != null ? Number(a.percent) : null,
        passed: a.passed,
        faceViolations: a.faceViolations,
        proctorEventCount: a._count.proctorEvents,
        restartApproved: !!a.restartApprovedAt,
        remainingSecondsAtStop: a.remainingSecondsAtStop,
      })),
    });
  } catch (e) {
    console.error("GET /api/exams/[id]/results", e);
    return errorResponse("Failed to load results", 500);
  }
}
