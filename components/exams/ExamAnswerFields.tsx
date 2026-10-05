"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { isSinglePick, isWrittenQuestion } from "@/lib/exam-question-types";

export interface ExamChoice {
  id: string;
  text: string;
}

export function ExamAnswerFields({
  questionId,
  type,
  options,
  optionIds,
  text,
  onPick,
  onText,
}: {
  questionId: string;
  type: string;
  options: ExamChoice[];
  optionIds: string[];
  text: string;
  onPick: (optionIds: string[]) => void;
  onText: (value: string) => void;
}) {
  const [draft, setDraft] = useState(text);
  const seenId = useRef(questionId);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    if (seenId.current === questionId) return;
    seenId.current = questionId;
    setDraft(text);
  }, [questionId, text]);

  useEffect(() => {
    if (!isWrittenQuestion(type) || draft === text) return;
    const timer = window.setTimeout(() => onTextRef.current(draft), 450);
    return () => window.clearTimeout(timer);
  }, [draft, text, type]);

  if (isWrittenQuestion(type)) {
    const paragraph = type === "PARAGRAPH";
    return (
      <div className="mt-4">
        <p className="mb-2 text-[11px] text-muted-foreground">
          {paragraph ? "Write your answer in your own words." : "Type a short answer."}
        </p>
        {paragraph ? (
          <textarea
            value={draft}
            rows={6}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => onText(draft)}
            placeholder="Write your answer here"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
          />
        ) : (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => onText(draft)}
            placeholder="Your answer"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#1E4A85] focus:ring-2 focus:ring-[#1E4A85]/15"
          />
        )}
      </div>
    );
  }

  const single = isSinglePick(type);
  return (
    <div className="mt-4">
      <p className="mb-2 text-[11px] text-muted-foreground">
        {type === "TRUE_FALSE"
          ? "Choose True or False"
          : single
            ? "Select one answer"
            : "Select every correct answer"}
      </p>
      <div className="space-y-2">
        {options.map((opt) => {
          const selected = optionIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                if (single) {
                  onPick([opt.id]);
                  return;
                }
                onPick(
                  selected ? optionIds.filter((id) => id !== opt.id) : [...optionIds, opt.id]
                );
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
                  single ? "rounded-full" : "rounded",
                  selected ? "border-[#1E4A85] bg-[#1E4A85]" : "border-slate-300"
                )}
              >
                {selected &&
                  (single ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : (
                    <span className="text-[10px] font-bold leading-none text-white">✓</span>
                  ))}
              </span>
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
