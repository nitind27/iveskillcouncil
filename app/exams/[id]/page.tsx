"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Breadcrumb } from "@/components/common";
import { ExamLinkPanel } from "@/components/exams/ExamLinkPanel";
import { fetcher } from "@/lib/fetcher";
import { useAuth } from "@/contexts/AuthContext";
import { ROLES } from "@/lib/permissions";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Save,
  Send,
  GripVertical,
} from "lucide-react";

interface OptionDraft {
  id?: string;
  text: string;
  isCorrect: boolean;
}
interface QuestionDraft {
  id?: string;
  text: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
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
  questions: QuestionDraft[];
}

export default function ExamDetailPage() {
  const params = useParams();
  const id = String(params.id || "");
  const { user } = useAuth();
  const canManage =
    Number(user?.roleId) === ROLES.SUPER_ADMIN || Number(user?.roleId) === ROLES.ADMIN;

  const { data, isLoading, mutate } = useSWR<ExamDetail>(
    id ? `/api/exams/${id}` : null,
    fetcher
  );

  const [meta, setMeta] = useState({
    title: "",
    description: "",
    durationMinutes: 60,
    passPercent: 40,
    batchLabel: "",
    status: "DRAFT",
  });
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingQ, setSavingQ] = useState(false);

  useEffect(() => {
    if (!data) return;
    setMeta({
      title: data.title,
      description: data.description || "",
      durationMinutes: data.durationMinutes,
      passPercent: data.passPercent,
      batchLabel: data.batchLabel || "",
      status: data.status,
    });
    setQuestions(
      data.questions?.length
        ? data.questions.map((q) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            marks: q.marks,
            options: q.options.map((o) => ({
              id: o.id,
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          }))
        : [
            {
              text: "",
              type: "SINGLE_CHOICE",
              marks: 1,
              options: [
                { text: "", isCorrect: true },
                { text: "", isCorrect: false },
              ],
            },
          ]
    );
  }, [data]);

  const saveMeta = async () => {
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/exams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: meta.title,
          description: meta.description || null,
          durationMinutes: meta.durationMinutes,
          passPercent: meta.passPercent,
          batchLabel: meta.batchLabel || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        await showError("Error", json.error || "Save failed");
        return;
      }
      await showSuccess("Saved", "Exam details updated");
      mutate();
    } finally {
      setSavingMeta(false);
    }
  };

  const saveQuestions = async () => {
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
      mutate();
    } finally {
      setSavingQ(false);
    }
  };

  const publish = async () => {
    const res = await fetch(`/api/exams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "PUBLISHED" }),
    });
    const json = await res.json();
    if (!res.ok) {
      await showError("Error", json.error || "Publish failed");
      return;
    }
    await showSuccess("Published", "Exam published — activate the walk-in link when ready on site");
    mutate();
  };

  const regenerateLink = async () => {
    if (!confirm("Generate a new link? The old link will stop working.")) return;
    const res = await fetch(`/api/exams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ regenerateLink: true }),
    });
    const json = await res.json();
    if (!res.ok) {
      await showError("Error", json.error || "Failed");
      return;
    }
    await showSuccess("New link", "Old link deactivated. Copy the new link below.");
    mutate();
  };

  const convertToWalkIn = async () => {
    if (!confirm("Convert this exam to a walk-in link? It will hide from franchise & student portals."))
      return;
    const res = await fetch(`/api/exams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ convertToLink: true }),
    });
    const json = await res.json();
    if (!res.ok) {
      await showError("Error", json.error || "Failed");
      return;
    }
    await showSuccess("Converted", "Walk-in link is ready — copy and activate when on site");
    mutate();
  };

  const unpublish = async () => {
    const res = await fetch(`/api/exams/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "DRAFT" }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      await showError("Error", json.error || "Failed");
      return;
    }
    mutate();
  };

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E4A85]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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
              Status: <span className="font-semibold">{data.status}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/exams/${id}/results`}
            className="rounded-xl border border-[#C4A35A]/30 px-3 py-2 text-xs font-semibold text-[#8a6f2e] hover:bg-[#C4A35A]/10"
          >
            Results
          </Link>
          {canManage && data.status !== "PUBLISHED" && (
            <button
              type="button"
              onClick={publish}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
            >
              <Send className="h-3.5 w-3.5" />
              Publish
            </button>
          )}
          {canManage && data.status === "PUBLISHED" && (
            <button
              type="button"
              onClick={unpublish}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
            >
              Unpublish
            </button>
          )}
        </div>
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
            Regenerate link (invalidates old URL)
          </button>
        </div>
      )}

      {canManage && data.accessMode !== "LINK" && (
        <div className="rounded-2xl border border-dashed border-[#1E4A85]/25 bg-slate-50 px-4 py-4">
          <p className="text-sm font-semibold text-[#1E4A85]">Portal-assigned exam</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Currently shown on student My Exams. Convert to a walk-in tablet link to hide it from
            franchise &amp; student portals.
          </p>
          <button
            type="button"
            onClick={convertToWalkIn}
            className="mt-3 rounded-xl bg-[#1E4A85] px-3.5 py-2 text-xs font-bold text-white"
          >
            Convert to walk-in link
          </button>
        </div>
      )}

      {/* Meta */}
      <section className="rounded-2xl border border-[#1E4A85]/12 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-foreground">Exam settings</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Title</label>
            <input
              disabled={!canManage}
              value={meta.title}
              onChange={(e) => setMeta((m) => ({ ...m, title: e.target.value }))}
              className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
              Description
            </label>
            <textarea
              disabled={!canManage}
              value={meta.description}
              onChange={(e) => setMeta((m) => ({ ...m, description: e.target.value }))}
              rows={2}
              className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
              Duration (min)
            </label>
            <input
              type="number"
              disabled={!canManage}
              value={meta.durationMinutes}
              onChange={(e) =>
                setMeta((m) => ({ ...m, durationMinutes: Number(e.target.value) }))
              }
              className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">Pass %</label>
            <input
              type="number"
              disabled={!canManage}
              value={meta.passPercent}
              onChange={(e) =>
                setMeta((m) => ({ ...m, passPercent: Number(e.target.value) }))
              }
              className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-[#1E4A85]">
              Batch label
            </label>
            <input
              disabled={!canManage}
              value={meta.batchLabel}
              onChange={(e) => setMeta((m) => ({ ...m, batchLabel: e.target.value }))}
              className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </div>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={saveMeta}
            disabled={savingMeta}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingMeta ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save settings
          </button>
        )}
      </section>

      {/* Questions builder */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Questions (MCQ)</h2>
          {canManage && (
            <button
              type="button"
              onClick={() =>
                setQuestions((q) => [
                  ...q,
                  {
                    text: "",
                    type: "SINGLE_CHOICE",
                    marks: 1,
                    options: [
                      { text: "", isCorrect: true },
                      { text: "", isCorrect: false },
                    ],
                  },
                ])
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#1E4A85]/15 px-3 py-1.5 text-xs font-semibold text-[#1E4A85]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add question
            </button>
          )}
        </div>

        {questions.map((q, qi) => (
          <div
            key={qi}
            className="rounded-2xl border border-[#1E4A85]/12 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="mb-3 flex items-start gap-2">
              <GripVertical className="mt-2 h-4 w-4 text-slate-300" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-[#1E4A85] px-2 py-0.5 text-[10px] font-bold text-white">
                    Q{qi + 1}
                  </span>
                  <select
                    disabled={!canManage}
                    value={q.type}
                    onChange={(e) => {
                      const type = e.target.value as QuestionDraft["type"];
                      setQuestions((all) =>
                        all.map((item, i) =>
                          i === qi
                            ? {
                                ...item,
                                type,
                                options:
                                  type === "SINGLE_CHOICE"
                                    ? item.options.map((o, oi) => ({
                                        ...o,
                                        isCorrect: oi === 0,
                                      }))
                                    : item.options,
                              }
                            : item
                        )
                      );
                    }}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  >
                    <option value="SINGLE_CHOICE">Single answer</option>
                    <option value="MULTIPLE_CHOICE">Multiple answers</option>
                  </select>
                  <label className="flex items-center gap-1 text-xs">
                    Marks
                    <input
                      type="number"
                      min={1}
                      disabled={!canManage}
                      value={q.marks}
                      onChange={(e) =>
                        setQuestions((all) =>
                          all.map((item, i) =>
                            i === qi ? { ...item, marks: Number(e.target.value) || 1 } : item
                          )
                        )
                      }
                      className="w-14 rounded-lg border border-slate-200 px-1.5 py-1 text-xs"
                    />
                  </label>
                  {canManage && questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setQuestions((all) => all.filter((_, i) => i !== qi))}
                      className="ml-auto text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <textarea
                  disabled={!canManage}
                  value={q.text}
                  onChange={(e) =>
                    setQuestions((all) =>
                      all.map((item, i) =>
                        i === qi ? { ...item, text: e.target.value } : item
                      )
                    )
                  }
                  placeholder="Question text…"
                  rows={2}
                  className="w-full rounded-xl border border-[#1E4A85]/15 px-3 py-2 text-sm disabled:bg-slate-50"
                />
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type={q.type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                        name={`q-${qi}-correct`}
                        checked={opt.isCorrect}
                        disabled={!canManage}
                        onChange={() => {
                          setQuestions((all) =>
                            all.map((item, i) => {
                              if (i !== qi) return item;
                              if (item.type === "SINGLE_CHOICE") {
                                return {
                                  ...item,
                                  options: item.options.map((o, j) => ({
                                    ...o,
                                    isCorrect: j === oi,
                                  })),
                                };
                              }
                              return {
                                ...item,
                                options: item.options.map((o, j) =>
                                  j === oi ? { ...o, isCorrect: !o.isCorrect } : o
                                ),
                              };
                            })
                          );
                        }}
                        title="Mark as correct"
                      />
                      <input
                        disabled={!canManage}
                        value={opt.text}
                        onChange={(e) =>
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
                          )
                        }
                        placeholder={`Option ${oi + 1}`}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-1.5 text-sm",
                          opt.isCorrect
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-slate-200"
                        )}
                      />
                      {canManage && q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setQuestions((all) =>
                              all.map((item, i) =>
                                i === qi
                                  ? {
                                      ...item,
                                      options: item.options.filter((_, j) => j !== oi),
                                    }
                                  : item
                              )
                            )
                          }
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() =>
                        setQuestions((all) =>
                          all.map((item, i) =>
                            i === qi
                              ? {
                                  ...item,
                                  options: [
                                    ...item.options,
                                    { text: "", isCorrect: false },
                                  ],
                                }
                              : item
                          )
                        )
                      }
                      className="text-xs font-semibold text-[#1E4A85]"
                    >
                      + Add option
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {canManage && (
          <button
            type="button"
            onClick={saveQuestions}
            disabled={savingQ}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1E4A85] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {savingQ ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save all questions
          </button>
        )}
      </section>
    </div>
  );
}
