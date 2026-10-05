"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { ExamLinkPanel } from "@/components/exams/ExamLinkPanel";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { showConfirm, showError, showSuccess } from "@/lib/toast";
import {
  asQuestionType,
  isWrittenQuestion,
  validateQuestionDraft,
  type ExamQuestionTypeId,
} from "@/lib/exam-question-types";
import { cn } from "@/lib/utils";
import {
  AlignLeft,
  ArrowLeft,
  Check,
  CircleDot,
  ListChecks,
  Loader2,
  Plus,
  Save,
  Send,
  TextCursorInput,
  ToggleLeft,
  Trash2,
} from "lucide-react";

interface OptionDraft {
  id?: string;
  text: string;
  isCorrect: boolean;
}
interface QuestionDraft {
  id?: string;
  text: string;
  type: ExamQuestionTypeId;
  marks: number;
  options: OptionDraft[];
}

interface ExamDetail {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  passPercent: number;
  status: string;
  accessMode?: string;
  linkToken?: string | null;
  linkActive?: boolean;
  batchLabel: string | null;
  requireCamera: boolean;
  requireFaceDetect: boolean;
  maxFaceViolations: number;
  shuffleQuestions: boolean;
  attemptCount?: number;
  targets?: { franchiseId: string; courseId: string }[];
  questions: QuestionDraft[];
}

type Step = "details" | "questions" | "audience" | "publish";

const STEPS: { id: Step; n: string; label: string; hint: string }[] = [
  { id: "details", n: "1", label: "Details", hint: "Time, pass mark, camera" },
  { id: "questions", n: "2", label: "Questions", hint: "MCQ and correct answers" },
  { id: "audience", n: "3", label: "Audience", hint: "Tablet link or a course" },
  { id: "publish", n: "4", label: "Publish", hint: "Go live and open results" },
];

const inputCls =
  "w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1E4A85]/15 disabled:bg-slate-50";

const TYPE_CHOICES: {
  id: ExamQuestionTypeId;
  label: string;
  hint: string;
  icon: typeof CircleDot;
}[] = [
  { id: "SINGLE_CHOICE", label: "Radio", hint: "One answer", icon: CircleDot },
  { id: "MULTIPLE_CHOICE", label: "Checkbox", hint: "Many answers", icon: ListChecks },
  { id: "TRUE_FALSE", label: "True / False", hint: "Two choices", icon: ToggleLeft },
  { id: "SHORT_ANSWER", label: "Short", hint: "One line", icon: TextCursorInput },
  { id: "PARAGRAPH", label: "Paragraph", hint: "Many lines", icon: AlignLeft },
];

function blankQuestion(type: ExamQuestionTypeId = "SINGLE_CHOICE"): QuestionDraft {
  return {
    text: "",
    type,
    marks: 1,
    options: optionsForType(type),
  };
}

function TypePicker({
  value,
  disabled,
  onChange,
}: {
  value: ExamQuestionTypeId;
  disabled?: boolean;
  onChange: (type: ExamQuestionTypeId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {TYPE_CHOICES.map((choice) => {
        const Icon = choice.icon;
        const active = value === choice.id;
        return (
          <button
            key={choice.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(choice.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-left text-xs font-semibold disabled:opacity-50",
              active
                ? "border-[#1E4A85] bg-[#1E4A85] text-white"
                : "border-[#1E4A85]/15 bg-white text-[#1E4A85] hover:bg-[#1E4A85]/5"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{choice.label}</span>
            <span className={cn("font-medium", active ? "text-white/75" : "text-slate-400")}>
              {choice.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function optionsForType(type: ExamQuestionTypeId): OptionDraft[] {
  if (type === "TRUE_FALSE") {
    return [
      { text: "True", isCorrect: true },
      { text: "False", isCorrect: false },
    ];
  }
  if (type === "SHORT_ANSWER" || type === "PARAGRAPH") {
    return [{ text: "", isCorrect: true }];
  }
  return [
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
  ];
}

function questionError(questions: QuestionDraft[]): string | null {
  if (!questions.length) return "Add at least one question";
  for (let i = 0; i < questions.length; i++) {
    const problem = validateQuestionDraft(questions[i], i);
    if (problem) return problem;
  }
  return null;
}

export default function ExamDetailPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const { user } = useAuth();
  const canManage =
    Number(user?.roleId) === ROLES.SUPER_ADMIN || Number(user?.roleId) === ROLES.ADMIN;

  const { data, isLoading, mutate } = useSWR<ExamDetail>(id ? `/api/exams/${id}` : null, fetcher);
  const { data: franchises } = useSWR<{ id: string; name: string }[]>(
    canManage ? "/api/franchises?limit=200" : null,
    async (url: string) => {
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json();
      const items = json?.data?.items ?? json?.data ?? [];
      return (Array.isArray(items) ? items : []).map((f: { id: string; name: string }) => ({
        id: String(f.id),
        name: f.name,
      }));
    }
  );
  const { data: courses } = useSWR<{ id: string; name: string }[]>(
    canManage ? "/api/courses?limit=200" : null,
    async (url: string) => {
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json();
      const items = json?.data?.items ?? json?.data ?? [];
      return (Array.isArray(items) ? items : []).map((c: { id: string; name: string }) => ({
        id: String(c.id),
        name: c.name,
      }));
    }
  );

  const [step, setStep] = useState<Step>("details");
  const [meta, setMeta] = useState({
    title: "",
    description: "",
    durationMinutes: 60,
    passPercent: 40,
    batchLabel: "",
    requireCamera: true,
    requireFaceDetect: true,
    maxFaceViolations: 3,
    shuffleQuestions: true,
  });
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [addCount, setAddCount] = useState(1);
  const [addType, setAddType] = useState<ExamQuestionTypeId>("SINGLE_CHOICE");
  const [audience, setAudience] = useState({
    accessMode: "LINK" as "LINK" | "ASSIGNED",
    franchiseId: "",
    courseId: "",
  });
  const [dirty, setDirty] = useState<"details" | "questions" | "audience" | null>(null);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingQ, setSavingQ] = useState(false);
  const [savingAudience, setSavingAudience] = useState(false);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("step");
    if (s === "details" || s === "questions" || s === "audience" || s === "publish") {
      setStep(s);
    }
  }, []);

  useEffect(() => {
    if (!data) return;
    setMeta({
      title: data.title,
      description: data.description || "",
      durationMinutes: data.durationMinutes,
      passPercent: data.passPercent,
      batchLabel: data.batchLabel || "",
      requireCamera: data.requireCamera,
      requireFaceDetect: data.requireFaceDetect,
      maxFaceViolations: data.maxFaceViolations,
      shuffleQuestions: data.shuffleQuestions !== false,
    });
    setQuestions(
      data.questions?.length
        ? data.questions.map((q) => ({
            ...q,
            type: asQuestionType(q.type),
            options: q.options.map((o) => ({ ...o })),
          }))
        : [blankQuestion()]
    );
    const target = data.targets?.[0];
    setAudience({
      accessMode: data.accessMode === "ASSIGNED" ? "ASSIGNED" : "LINK",
      franchiseId: target?.franchiseId || "",
      courseId: target?.courseId || "",
    });
    setDirty(null);
  }, [data]);

  const savedQuestionCount = data?.questions?.length ?? 0;
  const questionsLocked = (data?.status === "PUBLISHED" && (data?.attemptCount ?? 0) > 0) || false;
  const totalMarks = useMemo(
    () => questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0),
    [questions]
  );

  const checks = {
    details: (data?.title || "").trim().length >= 3 && (data?.durationMinutes || 0) >= 5,
    questions: savedQuestionCount > 0,
    audience:
      data?.accessMode === "LINK" ||
      (data?.accessMode === "ASSIGNED" && (data?.targets?.length ?? 0) > 0),
    published: data?.status === "PUBLISHED",
  };

  const addQuestions = (count: number, type: ExamQuestionTypeId) => {
    const n = Math.min(50, Math.max(1, Math.round(count) || 1));
    const start = questions.length;
    setQuestions((current) => [
      ...current,
      ...Array.from({ length: n }, () => blankQuestion(type)),
    ]);
    setDirty("questions");
    window.setTimeout(() => {
      document.getElementById(`exam-q-${start}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 40);
  };

  const goStep = async (next: Step) => {
    if (next === step) return;
    if (dirty && dirty === step) {
      const ok = await showConfirm("Unsaved changes", "Leave this step without saving?");
      if (!ok.isConfirmed) return;
    }
    setStep(next);
    const url = new URL(window.location.href);
    url.searchParams.set("step", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  };

  const patchExam = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/exams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Save failed");
    return json;
  };

  const saveMeta = async () => {
    setSavingMeta(true);
    try {
      await patchExam({
        title: meta.title,
        description: meta.description || null,
        durationMinutes: meta.durationMinutes,
        passPercent: meta.passPercent,
        batchLabel: meta.batchLabel || null,
        requireCamera: meta.requireCamera,
        requireFaceDetect: meta.requireFaceDetect,
        maxFaceViolations: meta.maxFaceViolations,
        shuffleQuestions: meta.shuffleQuestions,
      });
      await showSuccess("Saved", "Exam details updated");
      setDirty(null);
      mutate();
    } catch (e) {
      await showError("Error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingMeta(false);
    }
  };

  const saveQuestions = async () => {
    const problem = questionError(questions);
    if (problem) {
      await showError("Check questions", problem);
      return;
    }
    setSavingQ(true);
    try {
      const res = await fetch(`/api/exams/${id}/questions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ questions }),
      });
      const json = await res.json();
      if (!res.ok) {
        await showError("Error", json.error || "Save failed");
        return;
      }
      await showSuccess("Saved", "Questions saved");
      setDirty(null);
      mutate();
    } finally {
      setSavingQ(false);
    }
  };

  const saveAudience = async () => {
    if (audience.accessMode === "ASSIGNED" && (!audience.franchiseId || !audience.courseId)) {
      await showError("Audience", "Select a franchise and a course");
      return;
    }
    setSavingAudience(true);
    try {
      await patchExam({
        accessMode: audience.accessMode,
        targets:
          audience.accessMode === "ASSIGNED"
            ? [{ franchiseId: audience.franchiseId, courseId: audience.courseId }]
            : [],
      });
      await showSuccess(
        "Saved",
        audience.accessMode === "LINK"
          ? "This exam uses a walk-in link"
          : "Students of this course will see the exam on My Exams"
      );
      setDirty(null);
      mutate();
    } catch (e) {
      await showError("Error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingAudience(false);
    }
  };

  const publish = async () => {
    try {
      await patchExam({ status: "PUBLISHED" });
      await showSuccess(
        "Published",
        data?.accessMode === "LINK"
          ? "Activate the walk-in link when the tablet is ready"
          : "Students can open this exam from My Exams"
      );
      mutate();
    } catch (e) {
      await showError("Cannot publish", e instanceof Error ? e.message : "Publish failed");
    }
  };

  const unpublish = async () => {
    try {
      await patchExam({ status: "DRAFT" });
      await showSuccess("Unpublished", "New starts are closed until you publish again");
      mutate();
    } catch (e) {
      await showError("Error", e instanceof Error ? e.message : "Failed");
    }
  };

  const regenerateLink = async () => {
    const ok = await showConfirm("New link?", "The current link will stop working.");
    if (!ok.isConfirmed) return;
    try {
      await patchExam({ regenerateLink: true });
      await showSuccess("New link", "Copy the new link below. It starts deactivated.");
      mutate();
    } catch (e) {
      await showError("Error", e instanceof Error ? e.message : "Failed");
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Breadcrumb />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/exams"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1E4A85]/15 bg-white text-[#1E4A85]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#1E4A85] sm:text-2xl">{data.title}</h1>
            <p className="text-xs text-muted-foreground">
              {data.status === "PUBLISHED" ? "Published" : "Draft"}
              {" · "}
              {data.accessMode === "LINK" ? "Walk-in link" : "Student portal"}
              {" · "}
              {savedQuestionCount} questions
              {" · "}
              {data.attemptCount ?? 0} attempts
            </p>
          </div>
        </div>
        <Link
          href={`/exams/${id}/results`}
          className="rounded-xl border border-[#C4A35A]/30 px-3 py-2 text-xs font-semibold text-[#8a6f2e] hover:bg-[#C4A35A]/10"
        >
          Results
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STEPS.map((s) => {
          const done =
            (s.id === "details" && checks.details) ||
            (s.id === "questions" && checks.questions) ||
            (s.id === "audience" && checks.audience) ||
            (s.id === "publish" && checks.published);
          const active = step === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goStep(s.id)}
              className={cn(
                "rounded-2xl border px-3 py-2.5 text-left transition",
                active
                  ? "border-[#1E4A85] bg-[#1E4A85] text-white shadow-sm"
                  : "border-[#1E4A85]/12 bg-white text-[#0B1F3A] hover:border-[#1E4A85]/30"
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-bold">
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                    active
                      ? "bg-white text-[#1E4A85]"
                      : done
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                  )}
                >
                  {done && !active ? <Check className="h-3 w-3" /> : s.n}
                </span>
                {s.label}
              </span>
              <span className={cn("mt-1 block text-[11px]", active ? "text-white/80" : "text-muted-foreground")}>
                {s.hint}
              </span>
            </button>
          );
        })}
      </div>

      {step === "details" && (
        <section className="rounded-2xl border border-[#1E4A85]/12 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-foreground">Exam details</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            These settings apply when a student starts. Camera rules can stay on for both walk-in and portal exams.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Title</label>
              <input
                disabled={!canManage}
                value={meta.title}
                onChange={(e) => {
                  setMeta((m) => ({ ...m, title: e.target.value }));
                  setDirty("details");
                }}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Description</label>
              <textarea
                disabled={!canManage}
                value={meta.description}
                onChange={(e) => {
                  setMeta((m) => ({ ...m, description: e.target.value }));
                  setDirty("details");
                }}
                rows={2}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Duration (min)</label>
              <input
                type="number"
                min={5}
                max={600}
                disabled={!canManage}
                value={meta.durationMinutes}
                onChange={(e) => {
                  setMeta((m) => ({ ...m, durationMinutes: Number(e.target.value) }));
                  setDirty("details");
                }}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Pass %</label>
              <input
                type="number"
                min={0}
                max={100}
                disabled={!canManage}
                value={meta.passPercent}
                onChange={(e) => {
                  setMeta((m) => ({ ...m, passPercent: Number(e.target.value) }));
                  setDirty("details");
                }}
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Batch label</label>
              <input
                disabled={!canManage}
                value={meta.batchLabel}
                onChange={(e) => {
                  setMeta((m) => ({ ...m, batchLabel: e.target.value }));
                  setDirty("details");
                }}
                placeholder="Optional, shown on the exam card"
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={!canManage}
                checked={meta.requireCamera}
                onChange={(e) => {
                  setMeta((m) => ({ ...m, requireCamera: e.target.checked }));
                  setDirty("details");
                }}
              />
              Require camera
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={!canManage}
                checked={meta.requireFaceDetect}
                onChange={(e) => {
                  setMeta((m) => ({ ...m, requireFaceDetect: e.target.checked }));
                  setDirty("details");
                }}
              />
              Face detection
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                disabled={!canManage}
                checked={meta.shuffleQuestions}
                onChange={(e) => {
                  setMeta((m) => ({ ...m, shuffleQuestions: e.target.checked }));
                  setDirty("details");
                }}
              />
              Shuffle questions
            </label>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
                Max violations before auto-submit
              </label>
              <input
                type="number"
                min={1}
                max={10}
                disabled={!canManage}
                value={meta.maxFaceViolations}
                onChange={(e) => {
                  setMeta((m) => ({ ...m, maxFaceViolations: Number(e.target.value) }));
                  setDirty("details");
                }}
                className={inputCls}
              />
            </div>
          </div>
          {canManage && (
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => goStep("questions")}
                className="rounded-xl px-4 py-2 text-sm font-medium text-[#1E4A85]"
              >
                Next: questions
              </button>
              <button
                type="button"
                onClick={saveMeta}
                disabled={savingMeta}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save details
              </button>
            </div>
          )}
        </section>
      )}

      {step === "questions" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-foreground">Questions</h2>
              <p className="text-xs text-muted-foreground">
                {questions.length} on this screen · {totalMarks} marks · radio, checkbox, true/false, short answer, or paragraph
              </p>
            </div>
          </div>

          {questionsLocked && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Students have already started this exam, so questions stay locked. Unpublish only stops new starts.
            </p>
          )}

          {questions.map((q, qi) => (
            <div
              id={`exam-q-${qi}`}
              key={q.id || `new-${qi}`}
              className="scroll-mt-24 rounded-2xl border border-[#1E4A85]/12 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-[#1E4A85] px-2 py-0.5 text-[10px] font-bold text-white">
                  Q{qi + 1}
                </span>
                <label className="flex items-center gap-1 text-xs">
                  Marks
                  <input
                    type="number"
                    min={1}
                    disabled={!canManage || questionsLocked}
                    value={q.marks}
                    onChange={(e) => {
                      setDirty("questions");
                      setQuestions((all) =>
                        all.map((item, i) =>
                          i === qi ? { ...item, marks: Number(e.target.value) || 1 } : item
                        )
                      );
                    }}
                    className="w-14 rounded-lg border border-slate-200 px-1.5 py-1 text-xs"
                  />
                </label>
                {canManage && !questionsLocked && questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDirty("questions");
                      setQuestions((all) => all.filter((_, i) => i !== qi));
                    }}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="mt-3">
                <TypePicker
                  value={q.type}
                  disabled={!canManage || questionsLocked}
                  onChange={(type) => {
                    setDirty("questions");
                    setQuestions((all) =>
                      all.map((item, i) =>
                        i === qi ? { ...item, type, options: optionsForType(type) } : item
                      )
                    );
                  }}
                />
              </div>
              <textarea
                disabled={!canManage || questionsLocked}
                value={q.text}
                onChange={(e) => {
                  setDirty("questions");
                  setQuestions((all) =>
                    all.map((item, i) => (i === qi ? { ...item, text: e.target.value } : item))
                  );
                }}
                placeholder="Question text"
                rows={2}
                className={cn(inputCls, "mt-3")}
              />
              <p className="mb-2 mt-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {q.type === "SHORT_ANSWER"
                  ? "Accepted answers — any one line is correct"
                  : q.type === "PARAGRAPH"
                    ? "Keywords — the paragraph must include every line"
                    : q.type === "MULTIPLE_CHOICE"
                      ? "Tick every correct option"
                      : "Mark the one correct option"}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const written = isWrittenQuestion(q.type);
                  const lockedText = q.type === "TRUE_FALSE";
                  return (
                    <div key={oi} className="flex items-center gap-2">
                      {!written && (
                        <input
                          type={q.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}
                          name={`q-${qi}-correct`}
                          checked={opt.isCorrect}
                          disabled={!canManage || questionsLocked}
                          onChange={() => {
                            setDirty("questions");
                            setQuestions((all) =>
                              all.map((item, i) => {
                                if (i !== qi) return item;
                                if (item.type === "MULTIPLE_CHOICE") {
                                  return {
                                    ...item,
                                    options: item.options.map((o, j) =>
                                      j === oi ? { ...o, isCorrect: !o.isCorrect } : o
                                    ),
                                  };
                                }
                                return {
                                  ...item,
                                  options: item.options.map((o, j) => ({ ...o, isCorrect: j === oi })),
                                };
                              })
                            );
                          }}
                          title="Correct answer"
                        />
                      )}
                      <input
                        disabled={!canManage || questionsLocked || lockedText}
                        value={opt.text}
                        onChange={(e) => {
                          setDirty("questions");
                          setQuestions((all) =>
                            all.map((item, i) =>
                              i === qi
                                ? {
                                    ...item,
                                    options: item.options.map((o, j) =>
                                      j === oi ? { ...o, text: e.target.value } : o
                                    ),
                                  }
                                : item
                            )
                          );
                        }}
                        placeholder={
                          written
                            ? q.type === "PARAGRAPH"
                              ? `Keyword ${oi + 1}`
                              : `Accepted answer ${oi + 1}`
                            : `Option ${oi + 1}`
                        }
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-1.5 text-sm",
                          opt.isCorrect || written
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-slate-200"
                        )}
                      />
                      {canManage && !questionsLocked && !lockedText && q.options.length > (written ? 1 : 2) && (
                        <button
                          type="button"
                          onClick={() => {
                            setDirty("questions");
                            setQuestions((all) =>
                              all.map((item, i) =>
                                i === qi
                                  ? { ...item, options: item.options.filter((_, j) => j !== oi) }
                                  : item
                              )
                            );
                          }}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
                {canManage && !questionsLocked && q.type !== "TRUE_FALSE" && (
                  <button
                    type="button"
                    onClick={() => {
                      setDirty("questions");
                      setQuestions((all) =>
                        all.map((item, i) =>
                          i === qi
                            ? {
                                ...item,
                                options: [
                                  ...item.options,
                                  { text: "", isCorrect: isWrittenQuestion(item.type) },
                                ],
                              }
                            : item
                        )
                      );
                    }}
                    className="text-xs font-semibold text-[#1E4A85]"
                  >
                    {isWrittenQuestion(q.type) ? "+ Add another accepted line" : "+ Add option"}
                  </button>
                )}
              </div>
            </div>
          ))}

          {canManage && !questionsLocked && (
            <div className="sticky bottom-3 z-20 rounded-2xl border border-[#1E4A85]/15 bg-white p-3 shadow-lg">
              <p className="text-xs font-semibold text-[#1E4A85]">Add questions</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Pick a type, enter how many, and they appear ready to fill. No need to scroll up.
              </p>
              <div className="mt-2">
                <TypePicker value={addType} onChange={setAddType} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  How many
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={addCount}
                    onChange={(e) => setAddCount(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
                    className="w-16 rounded-lg border border-[#1E4A85]/20 px-2 py-1.5 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => addQuestions(addCount, addType)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163a6b]"
                >
                  <Plus className="h-4 w-4" />
                  Add {addCount} {addCount === 1 ? "question" : "questions"}
                </button>
              </div>
            </div>
          )}

          {canManage && !questionsLocked && (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => goStep("audience")}
                className="rounded-xl px-4 py-2 text-sm font-medium text-[#1E4A85]"
              >
                Next: audience
              </button>
              <button
                type="button"
                onClick={saveQuestions}
                disabled={savingQ}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingQ ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save questions
              </button>
            </div>
          )}
        </section>
      )}

      {step === "audience" && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#1E4A85]/12 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-foreground">Who can take this exam</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Walk-in stays off the student portal. Portal exams show on My Exams for students of the selected course.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    id: "LINK" as const,
                    title: "Walk-in link",
                    body: "Open on a centre tablet. Student enters an enrollment number.",
                  },
                  {
                    id: "ASSIGNED" as const,
                    title: "Student portal",
                    body: "Only students of one franchise course see it under My Exams.",
                  },
                ]
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  disabled={!canManage}
                  onClick={() => {
                    setAudience((a) => ({ ...a, accessMode: mode.id }));
                    setDirty("audience");
                  }}
                  className={cn(
                    "rounded-2xl border p-4 text-left",
                    audience.accessMode === mode.id
                      ? "border-[#1E4A85] bg-[#1E4A85]/5"
                      : "border-slate-200 bg-white"
                  )}
                >
                  <p className="text-sm font-bold text-[#1E4A85]">{mode.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{mode.body}</p>
                </button>
              ))}
            </div>

            {audience.accessMode === "ASSIGNED" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Franchise</label>
                  <select
                    disabled={!canManage}
                    value={audience.franchiseId}
                    onChange={(e) => {
                      setAudience((a) => ({ ...a, franchiseId: e.target.value }));
                      setDirty("audience");
                    }}
                    className={inputCls}
                  >
                    <option value="">Select franchise</option>
                    {(franchises ?? []).map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Course</label>
                  <select
                    disabled={!canManage}
                    value={audience.courseId}
                    onChange={(e) => {
                      setAudience((a) => ({ ...a, courseId: e.target.value }));
                      setDirty("audience");
                    }}
                    className={inputCls}
                  >
                    <option value="">Select course</option>
                    {(courses ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {canManage && (
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => goStep("publish")}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-[#1E4A85]"
                >
                  Next: publish
                </button>
                <button
                  type="button"
                  onClick={saveAudience}
                  disabled={savingAudience}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingAudience ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save audience
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {step === "publish" && (
        <section className="space-y-4">
          <div className="rounded-2xl border border-[#1E4A85]/12 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-foreground">Ready to publish</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                { ok: checks.details, label: "Details saved" },
                { ok: checks.questions, label: `${savedQuestionCount} question${savedQuestionCount === 1 ? "" : "s"} saved` },
                {
                  ok: checks.audience,
                  label:
                    data.accessMode === "LINK"
                      ? "Walk-in link ready"
                      : checks.audience
                        ? "Franchise course assigned"
                        : "Assign a franchise and course",
                },
              ].map((row) => (
                <li key={row.label} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full",
                      row.ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                    )}
                  >
                    {row.ok ? <Check className="h-3 w-3" /> : "!"}
                  </span>
                  {row.label}
                </li>
              ))}
            </ul>
            {canManage && (
              <div className="mt-5 flex flex-wrap gap-2">
                {data.status !== "PUBLISHED" ? (
                  <button
                    type="button"
                    onClick={publish}
                    disabled={!checks.details || !checks.questions || !checks.audience}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Publish exam
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={unpublish}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Unpublish
                  </button>
                )}
                <Link
                  href={`/exams/${id}/results`}
                  className="rounded-xl border border-[#C4A35A]/30 px-4 py-2 text-sm font-semibold text-[#8a6f2e]"
                >
                  View results
                </Link>
              </div>
            )}
          </div>

          {canManage && data.accessMode === "LINK" && (
            <div className="space-y-2">
              <ExamLinkPanel
                examId={id}
                linkToken={data.linkToken}
                linkActive={!!data.linkActive}
                published={data.status === "PUBLISHED"}
                onUpdated={() => mutate()}
              />
              <button
                type="button"
                onClick={regenerateLink}
                className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-[#1E4A85] hover:underline"
              >
                Regenerate link (the old URL stops working)
              </button>
            </div>
          )}

          {data.accessMode !== "LINK" && data.status === "PUBLISHED" && (
            <p className="rounded-2xl border border-[#1E4A85]/12 bg-white px-4 py-3 text-sm text-muted-foreground">
              Students of the assigned course open this from <strong>My Exams</strong>, confirm their
              photo, then start. Results land on the Results page.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
