import { prisma } from "@/lib/prisma";

export function parseSubjectNames(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,\n]/)) {
    const name = part.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function serializeCourseSubject(s: {
  id: bigint;
  courseId: bigint;
  name: string;
  maxMarks: number;
  sortOrder: number;
}) {
  return {
    id: s.id.toString(),
    courseId: s.courseId.toString(),
    name: s.name,
    maxMarks: s.maxMarks,
    sortOrder: s.sortOrder,
  };
}

/** Replace course subjects and keep courses.certificate_subject in sync */
export async function syncCourseSubjects(
  courseId: bigint,
  subjects: { name: string; maxMarks?: number }[],
  defaultMaxMarks = 100
) {
  const cleaned: { name: string; maxMarks: number }[] = [];
  const seen = new Set<string>();
  for (const s of subjects) {
    const name = String(s?.name || "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const max =
      typeof s.maxMarks === "number" && Number.isFinite(s.maxMarks) && s.maxMarks > 0
        ? Math.round(s.maxMarks)
        : defaultMaxMarks;
    cleaned.push({ name, maxMarks: max });
  }

  await prisma.$transaction(async (tx) => {
    await tx.courseSubject.deleteMany({ where: { courseId } });
    if (cleaned.length > 0) {
      await tx.courseSubject.createMany({
        data: cleaned.map((s, i) => ({
          courseId,
          name: s.name,
          maxMarks: s.maxMarks,
          sortOrder: i + 1,
        })),
      });
    }
    await tx.course.update({
      where: { id: courseId },
      data: {
        certificateSubject: cleaned.length ? cleaned.map((s) => s.name).join(", ") : null,
      },
    });
  });

  return prisma.courseSubject.findMany({
    where: { courseId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

/** Ensure CourseSubject rows exist from legacy certificateSubject string */
export async function ensureCourseSubjectsFromLegacy(courseId: bigint) {
  const existing = await prisma.courseSubject.count({ where: { courseId } });
  if (existing > 0) return;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { certificateSubject: true, objectiveMarks: true, practicalMarks: true },
  });
  if (!course) return;

  const names = parseSubjectNames(course.certificateSubject);
  if (names.length === 0) return;

  const defaultMax = course.objectiveMarks ?? course.practicalMarks ?? 100;
  await prisma.courseSubject.createMany({
    data: names.map((name, i) => ({
      courseId,
      name,
      maxMarks: defaultMax,
      sortOrder: i + 1,
    })),
    skipDuplicates: true,
  });
}
