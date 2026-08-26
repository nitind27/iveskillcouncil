import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { canTakeExams, canManageExams, canViewExamResults } from "@/lib/exam-access";

type AttemptWithExam = NonNullable<
  Awaited<ReturnType<typeof prisma.examAttempt.findUnique>>
>;

/**
 * Authorize access to an attempt:
 * - Logged-in student who owns it
 * - Admin / results viewer
 * - Walk-in via x-exam-access-key / Authorization Bearer / cookie
 */
export async function authorizeExamAttempt(
  request: NextRequest,
  attemptId: string
): Promise<
  | { ok: true; attempt: AttemptWithExam; via: "user" | "accessKey" | "admin" }
  | { ok: false; status: number; error: string }
> {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: BigInt(attemptId) },
  });
  if (!attempt) return { ok: false, status: 404, error: "Attempt not found" };

  const accessKey =
    request.headers.get("x-exam-access-key") ||
    request.cookies.get("exam_access_key")?.value ||
    (request.headers.get("authorization")?.startsWith("Bearer ")
      ? request.headers.get("authorization")!.slice(7).trim()
      : null);

  if (accessKey && attempt.accessKey && accessKey === attempt.accessKey) {
    return { ok: true, attempt, via: "accessKey" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const roleId = Number(user.roleId);
  if (canManageExams(roleId) || canViewExamResults(roleId)) {
    return { ok: true, attempt, via: "admin" };
  }

  if (canTakeExams(roleId) && attempt.userId?.toString() === user.id) {
    return { ok: true, attempt, via: "user" };
  }

  return { ok: false, status: 403, error: "Forbidden" };
}
