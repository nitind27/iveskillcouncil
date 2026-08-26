import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authorizeExamAttempt } from "@/lib/exam-attempt-auth";
import { ensureAttemptNotExpired, gradeAndFinalizeAttempt } from "@/lib/exam-grade";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const auth = await authorizeExamAttempt(request, attemptId);
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    let attempt = await prisma.examAttempt.findUnique({
      where: { id: BigInt(attemptId) },
      include: {
        exam: {
          include: {
            questions: {
              include: { options: { orderBy: { sortOrder: "asc" } } },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        answers: true,
      },
    });
    if (!attempt) return errorResponse("Attempt not found", 404);

    if (attempt.status === "IN_PROGRESS") {
      const refreshed = await ensureAttemptNotExpired(attempt.id);
      if (refreshed && refreshed.status !== "IN_PROGRESS") {
        attempt = await prisma.examAttempt.findUnique({
          where: { id: attempt.id },
          include: {
            exam: {
              include: {
                questions: {
                  include: { options: { orderBy: { sortOrder: "asc" } } },
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
            answers: true,
          },
        });
      }
    }

    if (!attempt) return errorResponse("Attempt not found", 404);

    const order = Array.isArray(attempt.questionOrder)
      ? (attempt.questionOrder as string[])
      : attempt.exam.questions.map((q) => q.id.toString());

    const qMap = new Map(attempt.exam.questions.map((q) => [q.id.toString(), q]));
    const ordered = order.map((qid) => qMap.get(qid)).filter(Boolean);
    const showCorrect = attempt.status !== "IN_PROGRESS";

    return successResponse({
      attempt: {
        id: attempt.id.toString(),
        status: attempt.status,
        startedAt: attempt.startedAt.toISOString(),
        endsAt: attempt.endsAt.toISOString(),
        submittedAt: attempt.submittedAt?.toISOString() ?? null,
        serverNow: new Date().toISOString(),
        score: attempt.score != null ? Number(attempt.score) : null,
        maxScore: attempt.maxScore != null ? Number(attempt.maxScore) : null,
        percent: attempt.percent != null ? Number(attempt.percent) : null,
        passed: attempt.passed,
        faceViolations: attempt.faceViolations,
        enrollmentNumber: attempt.enrollmentNumber,
      },
      exam: {
        id: attempt.exam.id.toString(),
        title: attempt.exam.title,
        description: attempt.exam.description,
        durationMinutes: attempt.exam.durationMinutes,
        passPercent: attempt.exam.passPercent,
        requireCamera: attempt.exam.requireCamera,
        requireFaceDetect: attempt.exam.requireFaceDetect,
        maxFaceViolations: attempt.exam.maxFaceViolations,
        accessMode: attempt.exam.accessMode,
      },
      questions: ordered.map((q) => ({
        id: q!.id.toString(),
        text: q!.text,
        type: q!.type,
        marks: q!.marks,
        options: q!.options.map((o) => ({
          id: o.id.toString(),
          text: o.text,
          ...(showCorrect ? { isCorrect: o.isCorrect } : {}),
        })),
        selectedOptionIds: (() => {
          const ans = attempt!.answers.find((a) => a.questionId === q!.id);
          return Array.isArray(ans?.selectedOptionIds)
            ? (ans!.selectedOptionIds as string[]).map(String)
            : [];
        })(),
      })),
    });
  } catch (e) {
    console.error("GET attempt", e);
    return errorResponse("Failed to load attempt", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const auth = await authorizeExamAttempt(request, attemptId);
    if (!auth.ok) return errorResponse(auth.error, auth.status);
    if (auth.via === "admin") {
      return errorResponse("Admins cannot submit answers for a student", 403);
    }

    const body = await request.json();
    const action = String(body.action || "answer");

    const attempt = auth.attempt;
    await ensureAttemptNotExpired(attempt.id);
    const current = await prisma.examAttempt.findUnique({ where: { id: attempt.id } });
    if (!current || current.status !== "IN_PROGRESS") {
      return errorResponse("Exam already submitted", 400);
    }

    if (action === "submit") {
      const reason = body.reason === "timeout" ? "AUTO_SUBMITTED" : "SUBMITTED";
      const result = await gradeAndFinalizeAttempt(attempt.id, reason);
      return successResponse(
        {
          status: result?.status,
          score: result?.score != null ? Number(result.score) : null,
          maxScore: result?.maxScore != null ? Number(result.maxScore) : null,
          percent: result?.percent != null ? Number(result.percent) : null,
          passed: result?.passed,
        },
        "Exam submitted"
      );
    }

    const questionId = String(body.questionId || "");
    const selectedOptionIds = Array.isArray(body.selectedOptionIds)
      ? body.selectedOptionIds.map(String)
      : [];

    const question = await prisma.examQuestion.findFirst({
      where: { id: BigInt(questionId), examId: attempt.examId },
      include: { options: true },
    });
    if (!question) return errorResponse("Invalid question", 400);

    const validIds = new Set(question.options.map((o) => o.id.toString()));
    if (selectedOptionIds.some((id: string) => !validIds.has(id))) {
      return errorResponse("Invalid option", 400);
    }
    if (question.type === "SINGLE_CHOICE" && selectedOptionIds.length > 1) {
      return errorResponse("Only one option allowed", 400);
    }

    await prisma.examAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: attempt.id,
          questionId: question.id,
        },
      },
      create: {
        attemptId: attempt.id,
        questionId: question.id,
        selectedOptionIds,
      },
      update: { selectedOptionIds },
    });

    return successResponse({ saved: true }, "Answer saved");
  } catch (e) {
    console.error("POST attempt", e);
    return errorResponse("Failed to update attempt", 500);
  }
}
