import { Prisma, StudentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const FEE_FILTERS = ["ALL", "PENDING", "PAID", "UNPAID"] as const;
export type FeeFilter = (typeof FEE_FILTERS)[number];

export const SORT_OPTIONS = ["admission_desc", "admission_asc", "name", "pending_desc", "course"] as const;
export type StudentReportSort = (typeof SORT_OPTIONS)[number];

export type StudentReportFilters = {
  franchiseId: string | null;
  /** "" = all courses, "none" = students without a course */
  courseId: string;
  status: "ALL" | StudentStatus;
  fee: FeeFilter;
  gender: "ALL" | "MALE" | "FEMALE" | "OTHER";
  from: string | null;
  to: string | null;
  search: string;
  sort: StudentReportSort;
};

export type StudentReportRow = {
  studentCode: string;
  fullName: string;
  phone: string;
  courseName: string;
  franchiseName: string;
  admissionDate: string;
  gender: string;
  status: StudentStatus;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
};

export type FeeTotals = {
  students: number;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  pendingStudents: number;
};

export type StudentReportGroupRow = FeeTotals & { id: string; name: string };

export type StudentReport = {
  summary: FeeTotals & {
    active: number;
    completed: number;
    dropped: number;
    fullyPaid: number;
    collectionPercent: number;
  };
  courses: StudentReportGroupRow[];
  franchises: StudentReportGroupRow[];
  rows: StudentReportRow[];
  truncated: boolean;
};

const MAX_ROWS = 20000;
const NO_COURSE = "No course assigned";

const round2 = (n: number) => Math.round(n * 100) / 100;

function parseDate(value: string | null, endOfDay = false): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
}

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  const v = String(value || "").toUpperCase();
  return (allowed.find((a) => a.toUpperCase() === v) ?? fallback) as T;
}

export function parseStudentReportFilters(sp: URLSearchParams, franchiseId: string | null): StudentReportFilters {
  const courseId = sp.get("courseId") || "";
  return {
    franchiseId,
    courseId: courseId === "none" || /^\d+$/.test(courseId) ? courseId : "",
    status: pick(sp.get("status"), ["ALL", "ACTIVE", "COMPLETED", "DROPPED"] as const, "ALL"),
    fee: pick(sp.get("fee"), FEE_FILTERS, "ALL"),
    gender: pick(sp.get("gender"), ["ALL", "MALE", "FEMALE", "OTHER"] as const, "ALL"),
    from: parseDate(sp.get("from")) ? sp.get("from") : null,
    to: parseDate(sp.get("to")) ? sp.get("to") : null,
    search: (sp.get("search") || "").trim().slice(0, 80),
    sort: (SORT_OPTIONS as readonly string[]).includes(sp.get("sort") || "")
      ? (sp.get("sort") as StudentReportSort)
      : "admission_desc",
  };
}

function buildWhere(f: StudentReportFilters): Prisma.StudentWhereInput {
  const and: Prisma.StudentWhereInput[] = [];
  if (f.franchiseId) and.push({ franchiseId: BigInt(f.franchiseId) });
  if (f.courseId === "none") and.push({ courseId: null });
  else if (f.courseId) and.push({ courseId: BigInt(f.courseId) });
  if (f.status !== "ALL") and.push({ status: f.status });
  if (f.gender !== "ALL") and.push({ gender: f.gender });

  const from = parseDate(f.from);
  const to = parseDate(f.to, true);
  if (from || to) and.push({ admissionDate: { ...(from && { gte: from }), ...(to && { lte: to }) } });

  const fields = prisma.student.fields;
  if (f.fee === "PENDING") and.push({ totalFee: { gt: fields.paidFee } });
  if (f.fee === "PAID") and.push({ totalFee: { gt: 0, lte: fields.paidFee } });
  if (f.fee === "UNPAID") and.push({ totalFee: { gt: 0 }, paidFee: { lte: 0 } });

  if (f.search) {
    and.push({
      OR: [
        { studentCode: { contains: f.search } },
        { alternateMobile: { contains: f.search } },
        { user: { OR: [{ fullName: { contains: f.search } }, { email: { contains: f.search } }, { phone: { contains: f.search } }] } },
      ],
    });
  }
  return and.length ? { AND: and } : {};
}

function emptyTotals(): FeeTotals {
  return { students: 0, totalFee: 0, paidFee: 0, pendingFee: 0, pendingStudents: 0 };
}

function addTo(t: FeeTotals, r: StudentReportRow) {
  t.students += 1;
  t.totalFee += r.totalFee;
  t.paidFee += r.paidFee;
  if (r.pendingFee > 0) {
    t.pendingFee += r.pendingFee;
    t.pendingStudents += 1;
  }
}

function finishGroups(map: Map<string, StudentReportGroupRow>): StudentReportGroupRow[] {
  return Array.from(map.values())
    .map((g) => ({ ...g, totalFee: round2(g.totalFee), paidFee: round2(g.paidFee), pendingFee: round2(g.pendingFee) }))
    .sort((a, b) => b.students - a.students || b.pendingFee - a.pendingFee);
}

function sortRows(rows: StudentReportRow[], sort: StudentReportSort) {
  const byName = (a: StudentReportRow, b: StudentReportRow) => a.fullName.localeCompare(b.fullName);
  const cmp: Record<StudentReportSort, (a: StudentReportRow, b: StudentReportRow) => number> = {
    admission_desc: (a, b) => b.admissionDate.localeCompare(a.admissionDate) || byName(a, b),
    admission_asc: (a, b) => a.admissionDate.localeCompare(b.admissionDate) || byName(a, b),
    name: byName,
    pending_desc: (a, b) => b.pendingFee - a.pendingFee || byName(a, b),
    course: (a, b) => a.courseName.localeCompare(b.courseName) || byName(a, b),
  };
  return rows.sort(cmp[sort]);
}

export async function buildStudentReport(filters: StudentReportFilters): Promise<StudentReport> {
  const students = await prisma.student.findMany({
    where: buildWhere(filters),
    take: MAX_ROWS + 1,
    orderBy: { admissionDate: "desc" },
    select: {
      studentCode: true,
      firstName: true,
      surname: true,
      gender: true,
      alternateMobile: true,
      admissionDate: true,
      status: true,
      totalFee: true,
      paidFee: true,
      courseId: true,
      franchiseId: true,
      user: { select: { fullName: true, phone: true } },
      course: { select: { name: true } },
      franchise: { select: { name: true } },
    },
  });

  const truncated = students.length > MAX_ROWS;
  const summary = { ...emptyTotals(), active: 0, completed: 0, dropped: 0, fullyPaid: 0, collectionPercent: 0 };
  const courses = new Map<string, StudentReportGroupRow>();
  const franchises = new Map<string, StudentReportGroupRow>();

  const rows = students.slice(0, MAX_ROWS).map((s) => {
    const totalFee = Number(s.totalFee);
    const paidFee = Number(s.paidFee);
    const row: StudentReportRow = {
      studentCode: s.studentCode,
      fullName: s.user.fullName || [s.firstName, s.surname].filter(Boolean).join(" "),
      phone: s.user.phone || s.alternateMobile || "",
      courseName: s.course?.name ?? NO_COURSE,
      franchiseName: s.franchise.name,
      admissionDate: s.admissionDate.toISOString().slice(0, 10),
      gender: s.gender || "",
      status: s.status,
      totalFee,
      paidFee,
      pendingFee: round2(Math.max(0, totalFee - paidFee)),
    };

    addTo(summary, row);
    if (s.status === "ACTIVE") summary.active += 1;
    if (s.status === "COMPLETED") summary.completed += 1;
    if (s.status === "DROPPED") summary.dropped += 1;
    if (totalFee > 0 && row.pendingFee <= 0) summary.fullyPaid += 1;

    const courseKey = s.courseId?.toString() ?? "none";
    const c = courses.get(courseKey) ?? { id: courseKey, name: row.courseName, ...emptyTotals() };
    addTo(c, row);
    courses.set(courseKey, c);

    const franchiseKey = s.franchiseId.toString();
    const fr = franchises.get(franchiseKey) ?? { id: franchiseKey, name: row.franchiseName, ...emptyTotals() };
    addTo(fr, row);
    franchises.set(franchiseKey, fr);

    return row;
  });

  summary.totalFee = round2(summary.totalFee);
  summary.paidFee = round2(summary.paidFee);
  summary.pendingFee = round2(summary.pendingFee);
  summary.collectionPercent = summary.totalFee > 0 ? Math.round((summary.paidFee / summary.totalFee) * 1000) / 10 : 0;

  return {
    summary,
    courses: finishGroups(courses),
    franchises: finishGroups(franchises),
    rows: sortRows(rows, filters.sort),
    truncated,
  };
}

/** Courses that have students in the franchise scope, for the filter dropdown. */
export async function getStudentReportCourseOptions(franchiseId: string | null) {
  const groups = await prisma.student.groupBy({
    by: ["courseId"],
    where: franchiseId ? { franchiseId: BigInt(franchiseId) } : {},
    _count: { _all: true },
  });
  const ids = groups.flatMap((g) => (g.courseId ? [g.courseId] : []));
  const courses = ids.length
    ? await prisma.course.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(courses.map((c) => [c.id.toString(), c.name]));
  return groups
    .map((g) => ({
      id: g.courseId?.toString() ?? "none",
      name: g.courseId ? nameById.get(g.courseId.toString()) ?? `Course #${g.courseId}` : NO_COURSE,
      students: g._count._all,
    }))
    .sort((a, b) => (a.id === "none" ? 1 : b.id === "none" ? -1 : a.name.localeCompare(b.name)));
}
