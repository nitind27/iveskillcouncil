import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { canManageExams } from "@/lib/exam-access";

export const dynamic = "force-dynamic";

/**
 * Institute Admin approves a terminated attempt so the student can continue
 * from the same answers / question progress.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (!canManageExams(Number(user.roleId))) {
      return errorResponse("Only institute admin can approve exam restart", 403);
    }

    const { attemptId } = await params;
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: BigInt(attemptId) },
      include: {
        exam: { select: { title: true, durationMinutes: true } },
        student: {
          include: { user: { select: { fullName: true, email: true } } },
        },
        _count: { select: { answers: true } },
      },
    });

    if (!attempt) return errorResponse("Attempt not found", 404);
    if (attempt.status !== "TERMINATED") {
      return errorResponse("Only terminated (proctoring) attempts can be approved for restart", 400);
    }

    // Ensure some resume time (at least 10 minutes if almost none left)
    const remaining = Math.max(10 * 60, attempt.remainingSecondsAtStop ?? 0);

    const updated = await prisma.examAttempt.update({
      where: { id: attempt.id },
      data: {
        restartApprovedAt: new Date(),
        remainingSecondsAtStop: remaining,
      },
    });

    return successResponse(
      {
        id: updated.id.toString(),
        restartApprovedAt: updated.restartApprovedAt?.toISOString() ?? null,
        remainingSeconds: remaining,
        studentName: attempt.student?.user.fullName ?? "Student",
        examTitle: attempt.exam.title,
        answeredCount: attempt._count.answers,
      },
      "Restart approved — student can continue from where they left off"
    );
  } catch (e) {
    console.error("POST approve-restart", e);
    return errorResponse("Failed to approve restart", 500);
  }
}
