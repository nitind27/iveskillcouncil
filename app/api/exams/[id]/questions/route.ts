import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { canManageExams } from "@/lib/exam-access";
import { asQuestionType, isWrittenQuestion, validateQuestionDraft } from "@/lib/exam-question-types";

export const dynamic = "force-dynamic";

/** Replace all questions for an exam (Google-Form style builder save) */
export async function PUT(
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
    const exam = await prisma.exam.findUnique({ where: { id: BigInt(id) } });
    if (!exam) return errorResponse("Exam not found", 404);
    if (exam.status === "PUBLISHED") {
      const attempts = await prisma.examAttempt.count({ where: { examId: exam.id } });
      if (attempts > 0) {
        return errorResponse("Cannot edit questions after students have started the exam", 400);
      }
    }

    const body = await request.json();
    const questions = Array.isArray(body.questions) ? body.questions : [];
    if (!questions.length) return errorResponse("Add at least one question", 400);

    for (let i = 0; i < questions.length; i++) {
      const problem = validateQuestionDraft(questions[i], i);
      if (problem) return errorResponse(problem, 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.examQuestion.deleteMany({ where: { examId: exam.id } });
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const type = asQuestionType(q.type);
        const options = (Array.isArray(q.options) ? q.options : []) as Array<{
          text?: string;
          isCorrect?: boolean;
        }>;
        const falseIsCorrect =
          type === "TRUE_FALSE" &&
          String(options.find((o) => o.isCorrect)?.text || "")
            .trim()
            .toLowerCase() === "false";
        const stored =
          type === "TRUE_FALSE"
            ? [
                { text: "True", isCorrect: !falseIsCorrect },
                { text: "False", isCorrect: falseIsCorrect },
              ]
            : options
                .map((o) => ({
                  text: String(o.text || "").trim().slice(0, 500),
                  isCorrect: isWrittenQuestion(type) ? true : !!o.isCorrect,
                }))
                .filter((o) => o.text);
        await tx.examQuestion.create({
          data: {
            examId: exam.id,
            text: String(q.text).trim(),
            type,
            marks: Math.max(1, Number(q.marks) || 1),
            sortOrder: i,
            options: {
              create: stored.map((o, oi) => ({
                text: o.text,
                isCorrect: o.isCorrect,
                sortOrder: oi,
              })),
            },
          },
        });
      }
    });

    const updated = await prisma.exam.findUnique({
      where: { id: exam.id },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
          include: { options: { orderBy: { sortOrder: "asc" } } },
        },
      },
    });

    return successResponse(
      {
        questions: (updated?.questions ?? []).map((q) => ({
          id: q.id.toString(),
          text: q.text,
          type: q.type,
          marks: q.marks,
          options: q.options.map((o) => ({
            id: o.id.toString(),
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        })),
      },
      "Questions saved"
    );
  } catch (e) {
    console.error("PUT /api/exams/[id]/questions", e);
    return errorResponse("Failed to save questions", 500);
  }
}
