import { prisma } from "@/lib/prisma";
import type { ExamAttemptStatus } from "@prisma/client";
import { arraysEqualAsSets } from "@/lib/exam-access";

export async function gradeAndFinalizeAttempt(
  attemptId: bigint,
  status: Extract<ExamAttemptStatus, "SUBMITTED" | "AUTO_SUBMITTED" | "TERMINATED">
) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      exam: {
        include: {
          questions: { include: { options: true } },
        },
      },
      answers: true,
    },
  });

  if (!attempt) return null;
  if (attempt.status !== "IN_PROGRESS") return attempt;

  let score = 0;
  let maxScore = 0;

  for (const q of attempt.exam.questions) {
    maxScore += q.marks;
    const correctIds = q.options
      .filter((o) => o.isCorrect)
      .map((o) => o.id.toString())
      .sort();
    const ans = attempt.answers.find((a) => a.questionId === q.id);
    const selected = Array.isArray(ans?.selectedOptionIds)
      ? (ans!.selectedOptionIds as string[]).map(String).sort()
      : [];

    const isCorrect = arraysEqualAsSets(selected, correctIds);
    const marksAwarded = isCorrect ? q.marks : 0;
    if (isCorrect) score += q.marks;

    if (ans) {
      await prisma.examAnswer.update({
        where: { id: ans.id },
        data: { isCorrect, marksAwarded },
      });
    }
  }

  const percent = maxScore > 0 ? Math.round((score / maxScore) * 10000) / 100 : 0;
  const passed = percent >= attempt.exam.passPercent;

  const now = new Date();
  const remainingSecondsAtStop =
    status === "TERMINATED"
      ? Math.max(0, Math.floor((attempt.endsAt.getTime() - now.getTime()) / 1000))
      : undefined;

  return prisma.examAttempt.update({
    where: { id: attemptId },
    data: {
      status,
      submittedAt: now,
      score,
      maxScore,
      percent,
      passed,
      ...(remainingSecondsAtStop != null
        ? { remainingSecondsAtStop, restartApprovedAt: null }
        : {}),
    },
    include: {
      exam: { select: { id: true, title: true, passPercent: true } },
    },
  });
}

/** If attempt is still in progress past endsAt, auto-submit it */
export async function ensureAttemptNotExpired(attemptId: bigint) {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.status !== "IN_PROGRESS") return attempt;
  if (new Date() >= attempt.endsAt) {
    return gradeAndFinalizeAttempt(attemptId, "AUTO_SUBMITTED");
  }
  return attempt;
}
