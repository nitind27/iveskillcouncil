import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { canTakeExams, shuffleIds } from "@/lib/exam-access";
import { resumeTerminatedAttempt } from "@/lib/exam-resume";

export const dynamic = "force-dynamic";

async function saveExamPhoto(base64OrDataUrl: string, userId: string): Promise<string> {
  const raw = base64OrDataUrl.includes(",")
    ? base64OrDataUrl.split(",")[1]
    : base64OrDataUrl;
  const buffer = Buffer.from(raw, "base64");
  if (buffer.length < 1000) throw new Error("Photo too small");
  if (buffer.length > 5 * 1024 * 1024) throw new Error("Photo must be under 5MB");

  const dir = path.join(process.cwd(), "public", "uploads", "exam-photos");
  await mkdir(dir, { recursive: true });
  const filename = `exam-${userId}-${Date.now()}.jpg`;
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/exam-photos/${filename}`;
}

/** Student starts exam after enrollment number + photo verification */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (!canTakeExams(Number(user.roleId))) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    const body = await request.json();
    const enrollmentNumber = String(body.enrollmentNumber || "").trim();
    const photoBase64 = String(body.photoBase64 || "").trim();

    if (!enrollmentNumber || enrollmentNumber.length < 3) {
      return errorResponse("Enter a valid enrollment number", 400);
    }
    if (!photoBase64) {
      return errorResponse("Capture your photo before starting the exam", 400);
    }

    let photoUrl: string;
    try {
      photoUrl = await saveExamPhoto(photoBase64, user.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid photo";
      return errorResponse(msg, 400);
    }

    const student = await prisma.student.findUnique({
      where: { userId: BigInt(user.id) },
    });
    if (!student) return errorResponse("Student profile not found", 404);

    const exam = await prisma.exam.findUnique({
      where: { id: BigInt(id) },
      include: {
        targets: true,
        questions: { select: { id: true } },
      },
    });
    if (!exam || exam.status !== "PUBLISHED") {
      return errorResponse("Exam not available", 404);
    }

    const eligible = exam.targets.some(
      (t) =>
        t.franchiseId === student.franchiseId && t.courseId === student.courseId
    );
    if (!eligible) return errorResponse("You are not assigned to this exam", 403);

    const now = new Date();
    if (exam.startsAt && exam.startsAt > now) {
      return errorResponse("Exam has not started yet", 400);
    }
    if (exam.endsAt && exam.endsAt < now) {
      return errorResponse("Exam window has closed", 400);
    }
    if (!exam.questions.length) {
      return errorResponse("Exam has no questions", 400);
    }

    const existing = await prisma.examAttempt.findUnique({
      where: {
        examId_studentId: { examId: exam.id, studentId: student.id },
      },
    });

    if (existing) {
      if (existing.status === "IN_PROGRESS") {
        if (now >= existing.endsAt) {
          return errorResponse("Exam time is over. Submit to see result.", 400);
        }
        if (!existing.enrollmentNumber || !existing.photoUrl) {
          await prisma.examAttempt.update({
            where: { id: existing.id },
            data: { enrollmentNumber, photoUrl },
          });
        }
        return successResponse(
          {
            attemptId: existing.id.toString(),
            endsAt: existing.endsAt.toISOString(),
            resumed: true,
          },
          "Exam resumed"
        );
      }

      if (existing.status === "TERMINATED") {
        if (!existing.restartApprovedAt) {
          return errorResponse(
            "This exam was closed by proctoring. Ask your institute admin to approve restart, then open My Exams → Continue exam.",
            400
          );
        }
        await prisma.examAttempt.update({
          where: { id: existing.id },
          data: { enrollmentNumber, photoUrl },
        });
        const resumed = await resumeTerminatedAttempt(existing.id);
        if ("error" in resumed && resumed.error) {
          return errorResponse(resumed.error, resumed.status || 400);
        }
        return successResponse(resumed.data, "Exam resumed — continue from where you left");
      }

      return errorResponse(
        "You have already completed this exam. Ask your institute admin to click Allow retake on Results if you need to take it again.",
        400
      );
    }

    const questionIds = exam.questions.map((q) => q.id.toString());
    const order = exam.shuffleQuestions ? shuffleIds(questionIds) : questionIds;
    const endsAt = new Date(now.getTime() + exam.durationMinutes * 60 * 1000);

    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        studentId: student.id,
        userId: BigInt(user.id),
        endsAt,
        questionOrder: order,
        status: "IN_PROGRESS",
        enrollmentNumber,
        photoUrl,
      },
    });

    return successResponse(
      {
        attemptId: attempt.id.toString(),
        endsAt: attempt.endsAt.toISOString(),
        resumed: false,
        requireCamera: exam.requireCamera,
        requireFaceDetect: exam.requireFaceDetect,
        maxFaceViolations: exam.maxFaceViolations,
      },
      "Exam started"
    );
  } catch (e) {
    console.error("POST /api/exams/[id]/start", e);
    return errorResponse("Failed to start exam", 500);
  }
}
