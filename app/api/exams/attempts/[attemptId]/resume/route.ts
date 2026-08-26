import { NextRequest } from "next/server";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { canTakeExams } from "@/lib/exam-access";
import { resumeTerminatedAttempt } from "@/lib/exam-resume";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Student resumes a terminated exam after institute admin approval.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (!canTakeExams(Number(user.roleId))) {
      return errorResponse("Forbidden", 403);
    }

    const { attemptId } = await params;
    const attempt = await prisma.examAttempt.findUnique({
      where: { id: BigInt(attemptId) },
    });

    if (!attempt || attempt.userId?.toString() !== user.id) {
      return errorResponse("Attempt not found", 404);
    }

    const result = await resumeTerminatedAttempt(attempt.id);
    if ("error" in result && result.error) {
      return errorResponse(result.error, result.status || 400);
    }
    return successResponse(
      result.data,
      "Exam resumed — continue from where you left off"
    );
  } catch (e) {
    console.error("POST resume", e);
    return errorResponse("Failed to resume exam", 500);
  }
}
