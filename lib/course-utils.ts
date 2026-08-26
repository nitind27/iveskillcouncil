/** Shared course helpers */

export function slugifyCourseName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150);
}

export const AWARD_CATEGORIES = [
  "Skill Development",
  "Vocational Education",
  "Technical Training",
  "Professional Certification",
  "Computer Education",
  "Language & Soft Skills",
  "Other",
] as const;

export const CERTIFICATE_TYPES = ["CERTIFICATE", "DIPLOMA"] as const;
export const DURATION_UNITS = ["Days", "Months", "Years"] as const;
export const COURSE_PLAN_TYPES = ["SILVER", "GOLD", "DIAMOND"] as const;

export type ExamFeeByPlan = { plan: string; examFee: number };

export function durationToMonths(value: number, unit: string): number {
  const v = Math.max(0, Number(value) || 0);
  const u = (unit || "Months").toLowerCase();
  if (u.startsWith("day")) return Math.max(1, Math.ceil(v / 30));
  if (u.startsWith("year")) return Math.max(1, Math.round(v * 12));
  return Math.max(1, Math.round(v) || 1);
}

export function parseTags(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parseTags(parsed);
    } catch {
      /* comma-separated */
    }
    return raw
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function parseExamFeesByPlan(raw: unknown): ExamFeeByPlan[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const plan = String(r.plan || "").toUpperCase();
      const examFee = Number(r.examFee ?? r.fee ?? 0);
      if (!plan) return null;
      return { plan, examFee: Number.isFinite(examFee) ? examFee : 0 };
    })
    .filter(Boolean) as ExamFeeByPlan[];
}

export function serializeCourse(c: {
  id: bigint;
  name: string;
  slug?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  imageUrl?: string | null;
  type: string;
  category?: string | null;
  level?: string | null;
  mode?: string | null;
  baseFee: unknown;
  durationMonths: number;
  lectures?: number | null;
  videos?: number | null;
  notes?: string | null;
  highlights?: string | null;
  status?: string;
  franchiseId?: bigint | null;
  awardCategory?: string | null;
  certificateType?: string | null;
  coursePreposition?: string | null;
  mrp?: unknown;
  displayOrder?: number | null;
  durationValue?: number | null;
  durationUnit?: string | null;
  previewVideoUrl?: string | null;
  practicalMarks?: number | null;
  objectiveMarks?: number | null;
  examFeesByPlan?: unknown;
  syllabus?: string | null;
  eligibility?: string | null;
  certificateSubject?: string | null;
  tags?: unknown;
  isPopular?: boolean | null;
  isRecommended?: boolean | null;
  isMrpVisible?: boolean | null;
  hideExamResult?: boolean | null;
}) {
  return {
    id: c.id.toString(),
    name: c.name,
    slug: c.slug ?? null,
    description: c.description ?? null,
    shortDescription: c.shortDescription ?? null,
    imageUrl: c.imageUrl ?? null,
    type: c.type,
    category: c.category ?? null,
    level: c.level ?? "BEGINNER",
    mode: c.mode ?? "OFFLINE",
    baseFee: Number(c.baseFee),
    durationMonths: c.durationMonths,
    lectures: c.lectures ?? 0,
    videos: c.videos ?? 0,
    notes: c.notes ?? null,
    highlights: c.highlights ?? null,
    status: c.status ?? "ACTIVE",
    franchiseId: c.franchiseId?.toString() ?? null,
    awardCategory: c.awardCategory ?? null,
    certificateType: c.certificateType ?? "CERTIFICATE",
    coursePreposition: c.coursePreposition ?? "In",
    mrp: c.mrp != null ? Number(c.mrp) : null,
    displayOrder: c.displayOrder ?? 0,
    durationValue: c.durationValue ?? c.durationMonths ?? null,
    durationUnit: c.durationUnit ?? "Months",
    previewVideoUrl: c.previewVideoUrl ?? null,
    practicalMarks: c.practicalMarks ?? null,
    objectiveMarks: c.objectiveMarks ?? null,
    examFeesByPlan: parseExamFeesByPlan(c.examFeesByPlan),
    syllabus: c.syllabus ?? null,
    eligibility: c.eligibility ?? null,
    certificateSubject: c.certificateSubject ?? null,
    tags: parseTags(c.tags),
    isPopular: Boolean(c.isPopular),
    isRecommended: Boolean(c.isRecommended),
    isMrpVisible: c.isMrpVisible !== false,
    hideExamResult: Boolean(c.hideExamResult),
  };
}

export function parseHighlights(raw: unknown): string | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const lines = raw.map((x) => String(x).trim()).filter(Boolean);
    return lines.length ? lines.join("\n") : null;
  }
  const s = String(raw).trim();
  return s || null;
}

/** Build Prisma create/update payload from API body (shared by POST/PATCH). */
export function coursePayloadFromBody(body: Record<string, unknown>) {
  const durationValue =
    body.durationValue != null
      ? Number(body.durationValue)
      : body.durationMonths != null
        ? Number(body.durationMonths)
        : null;
  const durationUnit = body.durationUnit
    ? String(body.durationUnit)
    : "Months";
  const durationMonths =
    durationValue != null
      ? durationToMonths(durationValue, durationUnit)
      : body.durationMonths != null
        ? Number(body.durationMonths)
        : undefined;

  const tags = parseTags(body.tags);
  const examFeesByPlan = parseExamFeesByPlan(body.examFeesByPlan);

  return {
    name: body.name != null ? String(body.name).trim() : undefined,
    slug: body.slug !== undefined ? body.slug : undefined,
    description:
      body.description !== undefined
        ? body.description
          ? String(body.description).trim()
          : null
        : undefined,
    shortDescription:
      body.shortDescription !== undefined
        ? body.shortDescription
          ? String(body.shortDescription).trim()
          : null
        : undefined,
    imageUrl:
      body.imageUrl !== undefined
        ? body.imageUrl
          ? String(body.imageUrl).trim()
          : null
        : undefined,
    type: body.type != null ? body.type : undefined,
    category:
      body.category !== undefined
        ? body.category
          ? String(body.category).trim()
          : null
        : undefined,
    level: body.level != null ? body.level : undefined,
    mode: body.mode != null ? body.mode : undefined,
    baseFee: body.baseFee != null ? Number(body.baseFee) : undefined,
    durationMonths,
    lectures: body.lectures != null ? Number(body.lectures) || 0 : undefined,
    videos: body.videos != null ? Number(body.videos) || 0 : undefined,
    notes:
      body.notes !== undefined
        ? body.notes
          ? String(body.notes).trim()
          : null
        : undefined,
    highlights:
      body.highlights !== undefined ? parseHighlights(body.highlights) : undefined,
    status: body.status != null ? body.status : undefined,
    awardCategory:
      body.awardCategory !== undefined
        ? body.awardCategory
          ? String(body.awardCategory).trim()
          : null
        : undefined,
    certificateType:
      body.certificateType !== undefined
        ? body.certificateType
          ? String(body.certificateType).toUpperCase()
          : null
        : undefined,
    coursePreposition:
      body.coursePreposition !== undefined
        ? body.coursePreposition
          ? String(body.coursePreposition).trim()
          : "In"
        : undefined,
    mrp:
      body.mrp !== undefined
        ? body.mrp === "" || body.mrp == null
          ? null
          : Number(body.mrp)
        : undefined,
    displayOrder:
      body.displayOrder != null ? Number(body.displayOrder) || 0 : undefined,
    durationValue: durationValue ?? undefined,
    durationUnit: body.durationUnit != null || body.durationValue != null ? durationUnit : undefined,
    previewVideoUrl:
      body.previewVideoUrl !== undefined
        ? body.previewVideoUrl
          ? String(body.previewVideoUrl).trim()
          : null
        : undefined,
    practicalMarks:
      body.practicalMarks !== undefined
        ? body.practicalMarks === "" || body.practicalMarks == null
          ? null
          : Number(body.practicalMarks)
        : undefined,
    objectiveMarks:
      body.objectiveMarks !== undefined
        ? body.objectiveMarks === "" || body.objectiveMarks == null
          ? null
          : Number(body.objectiveMarks)
        : undefined,
    examFeesByPlan:
      body.examFeesByPlan !== undefined ? examFeesByPlan : undefined,
    syllabus:
      body.syllabus !== undefined
        ? body.syllabus
          ? String(body.syllabus).trim()
          : null
        : undefined,
    eligibility:
      body.eligibility !== undefined
        ? body.eligibility
          ? String(body.eligibility).trim()
          : null
        : undefined,
    certificateSubject:
      body.certificateSubject !== undefined
        ? body.certificateSubject
          ? String(body.certificateSubject).trim()
          : null
        : undefined,
    tags: body.tags !== undefined ? tags : undefined,
    isPopular:
      body.isPopular !== undefined ? Boolean(body.isPopular) : undefined,
    isRecommended:
      body.isRecommended !== undefined ? Boolean(body.isRecommended) : undefined,
    isMrpVisible:
      body.isMrpVisible !== undefined ? Boolean(body.isMrpVisible) : undefined,
    hideExamResult:
      body.hideExamResult !== undefined ? Boolean(body.hideExamResult) : undefined,
  };
}
