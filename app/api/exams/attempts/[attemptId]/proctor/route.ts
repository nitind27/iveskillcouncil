import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { authorizeExamAttempt } from "@/lib/exam-attempt-auth";
import { gradeAndFinalizeAttempt, ensureAttemptNotExpired } from "@/lib/exam-grade";

export const dynamic = "force-dynamic";

const VIOLATION_TYPES = new Set([
  "NO_FACE",
  "MULTIPLE_FACES",
  "TAB_HIDDEN",
  "CAMERA_LOST",
  "LOOKING_AWAY",
  "WINDOW_BLUR",
  "WINDOW_RESIZE",
  "FULLSCREEN_EXIT",
]);

const INSTANT_CLOSE = new Set([
  "MULTIPLE_FACES",
  "TAB_HIDDEN",
  "WINDOW_BLUR",
  "WINDOW_RESIZE",
  "FULLSCREEN_EXIT",
  "CAMERA_LOST",
  "NO_FACE",
]);

const LOOK_AWAY_CLOSE_AT = 6;
const LOOK_AWAY_MAX_WARNINGS = 5;

const CLOSE_MESSAGES: Record<string, string> = {
  LOOKING_AWAY: "Exam closed — looked away too many times",
  MULTIPLE_FACES: "Exam closed — multiple faces detected",
  TAB_HIDDEN: "Exam closed — another tab opened",
  WINDOW_BLUR: "Exam closed — switched to another window",
  WINDOW_RESIZE: "Exam closed — window minimized / resized",
  FULLSCREEN_EXIT: "Exam closed — left fullscreen",
  CAMERA_LOST: "Exam closed — camera lost",
  NO_FACE: "Exam closed — face not detected",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const auth = await authorizeExamAttempt(request, attemptId);
    if (!auth.ok) return errorResponse(auth.error, auth.status);
    if (auth.via === "admin") return errorResponse("Forbidden", 403);

    const body = await request.json().catch(() => ({}));
    const type = String(body.type || "").toUpperCase();
    if (!VIOLATION_TYPES.has(type)) {
      return errorResponse("Invalid event type", 400);
    }

    await ensureAttemptNotExpired(auth.attempt.id);
    const current = await prisma.examAttempt.findUnique({
      where: { id: auth.attempt.id },
      include: { exam: true },
    });
    if (!current || current.status !== "IN_PROGRESS") {
      return successResponse(
        { terminated: true, status: current?.status ?? "UNKNOWN" },
        "Already finished"
      );
    }

    await prisma.examProctorEvent.create({
      data: {
        attemptId: current.id,
        type,
        detail: body.detail ? String(body.detail).slice(0, 500) : null,
      },
    });

    let faceViolations = current.faceViolations;
    if (type === "LOOKING_AWAY") {
      faceViolations = current.faceViolations + 1;
      await prisma.examAttempt.update({
        where: { id: current.id },
        data: { faceViolations },
      });
    }

    if (type === "LOOKING_AWAY" && body.forceClose !== true) {
      if (faceViolations >= LOOK_AWAY_CLOSE_AT) {
        const result = await gradeAndFinalizeAttempt(current.id, "TERMINATED");
        return successResponse(
          {
            terminated: true,
            reason: type,
            faceViolations,
            warning: false,
            status: result?.status,
            percent: result?.percent != null ? Number(result.percent) : null,
          },
          CLOSE_MESSAGES.LOOKING_AWAY
        );
      }

      return successResponse(
        {
          terminated: false,
          warning: true,
          faceViolations,
          warningNumber: faceViolations,
          maxWarnings: LOOK_AWAY_MAX_WARNINGS,
          remaining: LOOK_AWAY_CLOSE_AT - faceViolations,
        },
        `Warning ${faceViolations}/${LOOK_AWAY_MAX_WARNINGS} — look at the screen`
      );
    }

    const shouldTerminate =
      INSTANT_CLOSE.has(type) ||
      body.forceClose === true ||
      (type === "LOOKING_AWAY" && faceViolations >= LOOK_AWAY_CLOSE_AT);

    if (shouldTerminate) {
      const result = await gradeAndFinalizeAttempt(current.id, "TERMINATED");
      return successResponse(
        {
          terminated: true,
          reason: type,
          faceViolations,
          status: result?.status,
          percent: result?.percent != null ? Number(result.percent) : null,
        },
        CLOSE_MESSAGES[type] || "Exam terminated"
      );
    }

    return successResponse(
      { terminated: false, faceViolations },
      "Proctor event logged"
    );
  } catch (e) {
    console.error("POST proctor", e);
    return errorResponse("Failed to log proctor event", 500);
  }
}
