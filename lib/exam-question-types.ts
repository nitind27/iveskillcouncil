export const EXAM_QUESTION_TYPES = [
  "SINGLE_CHOICE",
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
  "PARAGRAPH",
] as const;

export type ExamQuestionTypeId = (typeof EXAM_QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<ExamQuestionTypeId, string> = {
  SINGLE_CHOICE: "Radio — one answer",
  MULTIPLE_CHOICE: "Checkbox — more than one",
  TRUE_FALSE: "True / False",
  SHORT_ANSWER: "Short answer — one line",
  PARAGRAPH: "Paragraph — multiple lines",
};

export function asQuestionType(value: unknown): ExamQuestionTypeId {
  const raw = String(value || "");
  return (EXAM_QUESTION_TYPES as readonly string[]).includes(raw)
    ? (raw as ExamQuestionTypeId)
    : "SINGLE_CHOICE";
}

export function isWrittenQuestion(type: string) {
  return type === "SHORT_ANSWER" || type === "PARAGRAPH";
}

export function isSinglePick(type: string) {
  return type === "SINGLE_CHOICE" || type === "TRUE_FALSE";
}

export function normalizeAnswer(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Short answer: any accepted line matches. Paragraph: every keyword must appear. */
export function writtenAnswerMatches(type: string, given: string, accepted: string[]) {
  const answer = normalizeAnswer(given);
  const keys = accepted.map(normalizeAnswer).filter(Boolean);
  if (!answer || keys.length === 0) return false;
  if (type === "PARAGRAPH") return keys.every((key) => answer.includes(key));
  return keys.some((key) => key === answer);
}

export type QuestionDraftInput = {
  text?: string;
  type?: string;
  options?: Array<{ text?: string; isCorrect?: boolean }>;
};

export function validateQuestionDraft(question: QuestionDraftInput, index: number): string | null {
  const n = index + 1;
  const text = String(question.text || "").trim();
  if (!text) return `Question ${n}: text is required`;
  const type = asQuestionType(question.type);
  const options = Array.isArray(question.options) ? question.options : [];

  if (type === "TRUE_FALSE") {
    const correct = options.filter((o) => o.isCorrect);
    if (options.length !== 2 || correct.length !== 1) {
      return `Question ${n}: True / False needs exactly one correct choice`;
    }
    return null;
  }

  if (isWrittenQuestion(type)) {
    const accepted = options.map((o) => String(o.text || "").trim()).filter(Boolean);
    if (!accepted.length) {
      return type === "PARAGRAPH"
        ? `Question ${n}: add at least one keyword the paragraph must contain`
        : `Question ${n}: add at least one accepted answer`;
    }
    return null;
  }

  if (options.length < 2) return `Question ${n}: add at least 2 options`;
  if (options.some((o) => !String(o.text || "").trim())) {
    return `Question ${n}: every option needs text`;
  }
  const correct = options.filter((o) => o.isCorrect);
  if (!correct.length) return `Question ${n}: mark the correct option`;
  if (type === "SINGLE_CHOICE" && correct.length !== 1) {
    return `Question ${n}: radio needs exactly one correct option`;
  }
  return null;
}
