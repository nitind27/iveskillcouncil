import { prisma } from "@/lib/prisma";

/**
 * Resume a terminated attempt after admin approval.
 * Keeps answers & question order; restores IN_PROGRESS with remaining time.
 */
export async function resumeTerminatedAttempt(attemptId: bigint) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: true },
  });
  if (!attempt) return { error: "Attempt not found", status: 404 as const };
  if (attempt.status === "IN_PROGRESS") {
    return {
      data: {
        attemptId: attempt.id.toString(),
        endsAt: attempt.endsAt.toISOString(),
        resumed: true,
        alreadyInProgress: true,
      },
    };
  }
  if (attempt.status !== "TERMINATED") {
    return { error: "This exam cannot be resumed", status: 400 as const };
  }
  if (!attempt.restartApprovedAt) {
    return {
      error:
        "Waiting for institute admin approval. After approval, open My Exams and tap Continue exam to resume.",
      status: 403 as const,
    };
  }

  const remainingSec = Math.max(
    10 * 60,
    attempt.remainingSecondsAtStop ?? attempt.exam.durationMinutes * 60
  );
  const endsAt = new Date(Date.now() + remainingSec * 1000);

  await prisma.examAnswer.updateMany({
    where: { attemptId: attempt.id },
    data: { isCorrect: null, marksAwarded: null },
  });

  const updated = await prisma.examAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "IN_PROGRESS",
      submittedAt: null,
      score: null,
      maxScore: null,
      percent: null,
      passed: null,
      faceViolations: 0,
      endsAt,
      restartApprovedAt: null,
      remainingSecondsAtStop: null,
    },
  });

  return {
    data: {
      attemptId: updated.id.toString(),
      endsAt: updated.endsAt.toISOString(),
      remainingSeconds: remainingSec,
      resumed: true,
    },
  };
}

/** Wipe attempt so student can start the exam fresh (admin retake). */
export async function resetAttemptForFreshRetake(attemptId: bigint) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
  });
  if (!attempt) return { error: "Attempt not found", status: 404 as const };
  if (attempt.status === "IN_PROGRESS") {
    return { error: "Exam is still in progress — cannot reset", status: 400 as const };
  }

  await prisma.examAttempt.delete({ where: { id: attempt.id } });
  return { data: { deleted: true, examId: attempt.examId.toString() } };
}
