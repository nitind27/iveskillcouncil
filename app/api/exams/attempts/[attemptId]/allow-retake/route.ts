import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { canManageExams } from "@/lib/exam-access";
import { resetAttemptForFreshRetake } from "@/lib/exam-resume";

export const dynamic = "force-dynamic";

/**
 * Institute admin: wipe finished attempt so student can start the exam again from scratch.
 * Works for SUBMITTED / AUTO_SUBMITTED / TERMINATED.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (!canManageExams(Number(user.roleId))) {
      return errorResponse("Only institute admin can allow retake", 403);
    }

    const { attemptId } = await params;
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: BigInt(attemptId) },
      include: {
        exam: { select: { title: true } },
        student: {
          include: { user: { select: { fullName: true } } },
        },
      },
    });

    if (!attempt) return errorResponse("Attempt not found", 404);

    const result = await resetAttemptForFreshRetake(attempt.id);
    if ("error" in result && result.error) {
      return errorResponse(result.error, result.status || 400);
    }

    return successResponse(
      {
        ...result.data,
        studentName: attempt.student?.user.fullName ?? "Student",
        examTitle: attempt.exam.title,
      },
      "Retake allowed — student can start this exam again from My Exams"
    );
  } catch (e) {
    console.error("POST allow-retake", e);
    return errorResponse("Failed to allow retake", 500);
  }
}
