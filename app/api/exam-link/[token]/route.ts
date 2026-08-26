import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { shuffleIds } from "@/lib/exam-access";
import {
  generateAttemptAccessKey,
  normalizeEnrollment,
} from "@/lib/exam-link";

export const dynamic = "force-dynamic";

async function saveExamPhoto(base64OrDataUrl: string, tag: string): Promise<string> {
  const raw = base64OrDataUrl.includes(",")
    ? base64OrDataUrl.split(",")[1]
    : base64OrDataUrl;
  const buffer = Buffer.from(raw, "base64");
  if (buffer.length < 1000) throw new Error("Photo too small");
  if (buffer.length > 5 * 1024 * 1024) throw new Error("Photo must be under 5MB");

  const dir = path.join(process.cwd(), "public", "uploads", "exam-photos");
  await mkdir(dir, { recursive: true });
  const filename = `walkin-${tag}-${Date.now()}.jpg`;
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/exam-photos/${filename}`;
}

async function getLinkExam(token: string) {
  return prisma.exam.findFirst({
    where: { linkToken: token, accessMode: "LINK" },
    include: {
      questions: { select: { id: true } },
      _count: { select: { questions: true } },
    },
  });
}

/** Public: exam info for walk-in link (no login) */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const exam = await getLinkExam(token);
    if (!exam || exam.status !== "PUBLISHED") {
      return errorResponse("Exam link not found or not published", 404);
    }

    const now = new Date();
    if (exam.startsAt && exam.startsAt > now) {
      return errorResponse("Exam has not started yet", 400);
    }
    if (exam.endsAt && exam.endsAt < now) {
      return errorResponse("Exam window has closed", 400);
    }

    if (!exam.linkActive) {
      return successResponse(
        {
          active: false,
          title: exam.title,
          durationMinutes: exam.durationMinutes,
          questionCount: exam._count.questions,
          requireCamera: exam.requireCamera,
        },
        "Exam link is deactivated"
      );
    }

    return successResponse(
      {
        active: true,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        passPercent: exam.passPercent,
        questionCount: exam._count.questions,
        requireCamera: exam.requireCamera,
        requireFaceDetect: exam.requireFaceDetect,
      },
      "Exam link ready"
    );
  } catch (e) {
    console.error("GET exam-link", e);
    return errorResponse("Failed to load exam link", 500);
  }
}

/** Public: start walk-in attempt with enrollment + photo */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const exam = await getLinkExam(token);
    if (!exam || exam.status !== "PUBLISHED") {
      return errorResponse("Exam link not found or not published", 404);
    }
    if (!exam.linkActive) {
      return errorResponse(
        "This exam link is deactivated. Ask the institute admin to activate it.",
        403
      );
    }

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

    const body = await request.json().catch(() => ({}));
    const enrollmentNumber = normalizeEnrollment(String(body.enrollmentNumber || ""));
    const photoBase64 = String(body.photoBase64 || "").trim();

    if (!enrollmentNumber || enrollmentNumber.length < 3) {
      return errorResponse("Enter a valid enrollment number", 400);
    }
    if (!photoBase64) {
      return errorResponse("Capture your photo before starting the exam", 400);
    }

    let photoUrl: string;
    try {
      photoUrl = await saveExamPhoto(photoBase64, enrollmentNumber.slice(0, 20));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid photo";
      return errorResponse(msg, 400);
    }

    const existing = await prisma.examAttempt.findFirst({
      where: {
        examId: exam.id,
        enrollmentNumber,
        studentId: null,
      },
    });

    if (existing) {
      if (existing.status === "TERMINATED" && existing.restartApprovedAt) {
        const { resumeTerminatedAttempt } = await import("@/lib/exam-resume");
        const accessKey = existing.accessKey || generateAttemptAccessKey();
        await prisma.examAttempt.update({
          where: { id: existing.id },
          data: { accessKey, photoUrl, enrollmentNumber },
        });
        const resumed = await resumeTerminatedAttempt(existing.id);
        if ("error" in resumed && resumed.error) {
          return errorResponse(resumed.error, resumed.status || 400);
        }
        return successResponse(
          {
            attemptId: existing.id.toString(),
            accessKey,
            endsAt: resumed.data?.endsAt,
            resumed: true,
          },
          "Exam resumed"
        );
      }

      if (existing.status !== "IN_PROGRESS") {
        return errorResponse(
          "This enrollment number has already completed this exam.",
          400
        );
      }
      if (now >= existing.endsAt) {
        return errorResponse("Exam time is over for this attempt.", 400);
      }
      const accessKey = existing.accessKey || generateAttemptAccessKey();
      if (!existing.accessKey) {
        await prisma.examAttempt.update({
          where: { id: existing.id },
          data: { accessKey, photoUrl, enrollmentNumber },
        });
      }
      return successResponse(
        {
          attemptId: existing.id.toString(),
          accessKey,
          endsAt: existing.endsAt.toISOString(),
          resumed: true,
        },
        "Exam resumed"
      );
    }

    const questionIds = exam.questions.map((q) => q.id.toString());
    const order = exam.shuffleQuestions ? shuffleIds(questionIds) : questionIds;
    const endsAt = new Date(now.getTime() + exam.durationMinutes * 60 * 1000);
    const accessKey = generateAttemptAccessKey();

    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        studentId: null,
        userId: null,
        accessKey,
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
        accessKey,
        endsAt: attempt.endsAt.toISOString(),
        resumed: false,
        requireCamera: exam.requireCamera,
        requireFaceDetect: exam.requireFaceDetect,
      },
      "Exam started"
    );
  } catch (e) {
    console.error("POST exam-link start", e);
    return errorResponse("Failed to start exam", 500);
  }
}
