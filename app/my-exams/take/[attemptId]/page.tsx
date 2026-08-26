"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Loader2,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { ExamProctor, type ViolationType, LOOK_AWAY_MAX_WARNINGS } from "@/components/exams/ExamProctor";
import { showError, showSuccess, showWarning } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface AttemptPayload {
  attempt: {
    id: string;
    status: string;
    endsAt: string;
    serverNow: string;
    score: number | null;
    maxScore: number | null;
    percent: number | null;
    passed: boolean | null;
    faceViolations: number;
  };
  exam: {
    id: string;
    title: string;
    requireCamera: boolean;
    requireFaceDetect: boolean;
    maxFaceViolations: number;
    passPercent: number;
  };
  questions: Array<{
    id: string;
    text: string;
    type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
    marks: number;
    options: Array<{ id: string; text: string; isCorrect?: boolean }>;
    selectedOptionIds: string[];
  }>;
}

function formatRemain(ms: number) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = String(params.attemptId || "");
  const { data, isLoading, mutate } = useSWR<AttemptPayload>(
    attemptId ? `/api/exams/attempts/${attemptId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [remainMs, setRemainMs] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [violations, setViolations] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [timerReady, setTimerReady] = useState(false);
  const closingRef = useRef(false);

  useEffect(() => {
    if (!data) return;
    const map: Record<string, string[]> = {};
    data.questions.forEach((q) => {
      map[q.id] = q.selectedOptionIds || [];
    });
    setAnswers(map);
    setViolations(data.attempt.faceViolations || 0);

    const ends = new Date(data.attempt.endsAt).getTime();
    const skew = Date.now() - new Date(data.attempt.serverNow).getTime();
    const tick = () => {
      const left = ends - (Date.now() - skew);
      setRemainMs(left);
      setTimerReady(true);
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [data]);

  const finished = data?.attempt.status !== "IN_PROGRESS";

  const submitExam = useCallback(
    async (reason: "manual" | "timeout" = "manual") => {
      if (submitting || finished) return;
      setSubmitting(true);
      try {
        const res = await fetch(`/api/exams/attempts/${attemptId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            action: "submit",
            reason: reason === "timeout" ? "timeout" : "manual",
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          await showError("Error", json.error || "Submit failed");
          return;
        }
        await showSuccess(
          reason === "timeout" ? "Time up" : "Submitted",
          "Your answers have been recorded"
        );
        mutate();
      } finally {
        setSubmitting(false);
      }
    },
    [attemptId, submitting, finished, mutate]
  );

  // Auto-submit on timeout
  useEffect(() => {
    if (!timerReady || finished || !data) return;
    if (remainMs > 0) return;
    submitExam("timeout");
  }, [remainMs, finished, data, submitExam, timerReady]);

  const saveAnswer = async (questionId: string, selectedOptionIds: string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedOptionIds }));
    await fetch(`/api/exams/attempts/${attemptId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ questionId, selectedOptionIds }),
    });
  };

  const onViolation = useCallback(
    async (type: ViolationType, detail?: string) => {
      if (finished || closingRef.current) return;
      closingRef.current = true;
      setWarning(`${type.replace(/_/g, " ")} — closing exam…`);

      const messages: Partial<Record<ViolationType, string>> = {
        TAB_HIDDEN: "Another tab was opened. Exam closed.",
        WINDOW_BLUR: "You switched to another window. Exam closed.",
        WINDOW_RESIZE: "Window was minimized or resized. Exam closed.",
        FULLSCREEN_EXIT: "Fullscreen exited. Exam closed.",
        LOOKING_AWAY: "Looked away 6 times. Exam closed.",
        MULTIPLE_FACES: "Multiple faces detected. Exam closed.",
        NO_FACE: "Face not detected. Exam closed.",
        CAMERA_LOST: "Camera lost. Exam closed.",
      };

      try {
        const res = await fetch(`/api/exams/attempts/${attemptId}/proctor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          keepalive: true,
          body: JSON.stringify({ type, detail, forceClose: true }),
        });
        const json = await res.json().catch(() => ({}));
        if (json?.data?.faceViolations != null) {
          setViolations(json.data.faceViolations);
        }
        await showError("Exam closed", messages[type] || "Proctoring violation. Exam closed.");
      } catch {
        await showError("Exam closed", messages[type] || "Proctoring violation. Exam closed.");
      } finally {
        await mutate();
      }
    },
    [finished, attemptId, mutate]
  );

  const onLookAwayWarning = useCallback(
    async (warningNumber: number, maxWarnings: number) => {
      if (finished || closingRef.current) return;
      setWarning(
        `Warning ${warningNumber}/${maxWarnings}: Looking away detected. Face the screen!`
      );
      setViolations(warningNumber);
      try {
        const res = await fetch(`/api/exams/attempts/${attemptId}/proctor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            type: "LOOKING_AWAY",
            detail: `Warning ${warningNumber}/${maxWarnings}`,
            forceClose: false,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (json?.data?.faceViolations != null) {
          setViolations(json.data.faceViolations);
        }
        if (json?.data?.terminated) {
          closingRef.current = true;
          await showError("Exam closed", "Looked away too many times. Exam closed.");
          await mutate();
          return;
        }
        await showWarning(
          `Warning ${warningNumber}/${maxWarnings}`,
          `Looking left/right detected. ${maxWarnings - warningNumber} warning(s) left, then exam closes.`
        );
      } catch {
        /* network — UI warning already set */
      }
    },
    [finished, attemptId, mutate]
  );

  const questions = data?.questions ?? [];
  const current = questions[qIndex];
  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] || []).length > 0).length,
    [questions, answers]
  );

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
      </div>
    );
  }

  if (finished) {
    const terminated = data.attempt.status === "TERMINATED";
    // restartApproved only on list API — refetch light flag via available not here; show waiting message always for terminated
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
        <div className="rounded-2xl border border-[#1E4A85]/12 bg-white p-8 text-center shadow-sm">
          {terminated ? (
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          ) : data.attempt.passed ? (
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          ) : (
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
          )}
          <h1 className="mt-4 text-2xl font-bold text-[#1E4A85]">{data.exam.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Status: {data.attempt.status.replace(/_/g, " ")}
          </p>
          {terminated && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-left text-sm text-amber-950 ring-1 ring-amber-200">
              <span className="font-semibold">Exam closed (proctoring).</span>
              <span className="mt-1.5 block leading-snug">
                You can take this exam again after institute admin approves restart. Then open{" "}
                <strong>My Exams</strong> → <strong>Continue exam</strong> — your saved answers
                will resume where you left off.
              </span>
            </p>
          )}
          <p className="mt-4 text-3xl font-bold text-[#0B1F3A]">
            {data.attempt.score}/{data.attempt.maxScore}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.attempt.percent}% · Pass mark {data.exam.passPercent}%
          </p>
          <button
            type="button"
            onClick={() => router.push("/my-exams")}
            className="mt-6 rounded-xl bg-[#1E4A85] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Back to my exams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-3 py-4 sm:px-4">
      {/* Top bar */}
      <div className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E4A85]/12 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold text-[#1E4A85] sm:text-base">
            {data.exam.title}
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Answered {answeredCount}/{questions.length} · Look-away warnings {violations}/
            {LOOK_AWAY_MAX_WARNINGS} (6th closes exam)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold tabular-nums",
              remainMs < 5 * 60 * 1000
                ? "bg-red-100 text-red-700"
                : "bg-[#1E4A85]/10 text-[#1E4A85]"
            )}
          >
            <Clock className="h-4 w-4" />
            {formatRemain(remainMs)}
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={() => {
              if (confirm("Submit exam now?")) submitExam("manual");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E4A85] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit
          </button>
        </div>
      </div>

      {warning && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {warning}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="rounded-2xl border border-[#1E4A85]/12 bg-white p-4 shadow-sm sm:p-6">
          {current && (
            <>
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="rounded-lg bg-[#1E4A85] px-2.5 py-1 text-xs font-bold text-white">
                  Question {qIndex + 1} / {questions.length}
                </span>
                <span className="text-xs text-muted-foreground">{current.marks} mark(s)</span>
              </div>
              <p className="text-base font-medium leading-relaxed text-foreground">
                {current.text}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {current.type === "MULTIPLE_CHOICE"
                  ? "Select all correct answers"
                  : "Select one answer"}
              </p>
              <div className="mt-4 space-y-2">
                {current.options.map((opt) => {
                  const selected = (answers[current.id] || []).includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        let next: string[];
                        if (current.type === "SINGLE_CHOICE") {
                          next = [opt.id];
                        } else {
                          const cur = answers[current.id] || [];
                          next = selected
                            ? cur.filter((x) => x !== opt.id)
                            : [...cur, opt.id];
                        }
                        saveAnswer(current.id, next);
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition",
                        selected
                          ? "border-[#1E4A85] bg-[#1E4A85]/8 font-semibold text-[#1E4A85]"
                          : "border-slate-200 hover:border-[#1E4A85]/30 hover:bg-slate-50"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border",
                          current.type === "SINGLE_CHOICE" ? "rounded-full" : "rounded",
                          selected
                            ? "border-[#1E4A85] bg-[#1E4A85]"
                            : "border-slate-300"
                        )}
                      >
                        {selected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      {opt.text}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  disabled={qIndex === 0}
                  onClick={() => setQIndex((i) => i - 1)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={qIndex >= questions.length - 1}
                  onClick={() => setQIndex((i) => i + 1)}
                  className="rounded-xl bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        <aside className="space-y-3">
          <ExamProctor
            enabled={!finished && data.exam.requireCamera}
            faceDetect={data.exam.requireFaceDetect}
            enforceFullscreen
            onViolation={onViolation}
            onLookAwayWarning={onLookAwayWarning}
            initialLookAwayCount={data.attempt.faceViolations || 0}
          />
          <div className="rounded-xl border border-[#1E4A85]/12 bg-white p-3 shadow-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#1E4A85]/70">
              Navigator
            </p>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-4 lg:grid-cols-5">
              {questions.map((q, i) => {
                const done = (answers[q.id] || []).length > 0;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setQIndex(i)}
                    className={cn(
                      "flex h-8 items-center justify-center rounded-lg text-xs font-bold",
                      i === qIndex && "ring-2 ring-[#C4A35A]",
                      done
                        ? "bg-[#1E4A85] text-white"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
