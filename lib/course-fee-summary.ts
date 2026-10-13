import { prisma } from "@/lib/prisma";

export const GST_RATE = 0.18;

/** Certificate royalty per student, before GST. Matched on course duration in months. */
export const ROYALTY_SLABS = [
  { months: 3, label: "3 months", amount: 270 },
  { months: 6, label: "6 months", amount: 699 },
  { months: 12, label: "1 year", amount: 799 },
  { months: 18, label: "18 months", amount: 1599 },
] as const;

export function royaltySlab(months: number) {
  return ROYALTY_SLABS.find((slab) => slab.months === months) ?? null;
}

function durationLabel(months: number) {
  return royaltySlab(months)?.label ?? `${months} month${months === 1 ? "" : "s"}`;
}

export type CourseFeeRow = {
  courseId: string;
  courseName: string;
  category: string | null;
  students: number;
  /** Course fee per student (franchise custom fee when scoped to one franchise, else base fee). */
  feePerStudent: number;
  /** Fees charged to the course's students (student total fee; course fee when a student has none). */
  totalAmount: number;
  gst: number;
  totalWithGst: number;
  durationMonths: number;
  durationLabel: string;
  /** Certificate royalty per student for this course duration; null when that duration has no rate. */
  royaltyPerStudent: number | null;
  royalty: number;
  royaltyGst: number;
  /** Students on a course duration that has no royalty rate. */
  royaltyMissing: number;
};

export type RoyaltySlabTotal = {
  months: number;
  label: string;
  amount: number;
  students: number;
  royalty: number;
  royaltyGst: number;
  total: number;
};

export type CourseFeeSummary = {
  gstRate: number;
  rows: CourseFeeRow[];
  slabs: RoyaltySlabTotal[];
  totals: Omit<CourseFeeRow, "courseId" | "courseName" | "category" | "feePerStudent" | "royaltyPerStudent" | "durationMonths" | "durationLabel"> & {
    courses: number;
  };
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function getCourseFeeSummary(franchiseId: string | null): Promise<CourseFeeSummary> {
  const scope = franchiseId ? { franchiseId: BigInt(franchiseId) } : {};

  const groups = await prisma.student.groupBy({
    by: ["courseId", "franchiseId"],
    where: { ...scope, courseId: { not: null } },
    _count: { _all: true },
    _sum: { totalFee: true },
  });
  const zeroFeeGroups = await prisma.student.groupBy({
    by: ["courseId", "franchiseId"],
    where: { ...scope, courseId: { not: null }, totalFee: { lte: 0 } },
    _count: { _all: true },
  });

  const courseIds = Array.from(new Set(groups.map((g) => g.courseId!.toString()))).map((id) => BigInt(id));
  const franchiseIds = Array.from(new Set(groups.map((g) => g.franchiseId.toString()))).map((id) => BigInt(id));

  const [courses, customFees] = await Promise.all([
    prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, name: true, category: true, baseFee: true, durationMonths: true },
    }),
    prisma.franchiseCourseFee.findMany({
      where: { courseId: { in: courseIds }, franchiseId: { in: franchiseIds } },
      select: { franchiseId: true, courseId: true, customFee: true },
    }),
  ]);

  const courseById = new Map(courses.map((c) => [c.id.toString(), c]));
  const customFeeByKey = new Map(customFees.map((f) => [`${f.courseId}|${f.franchiseId}`, Number(f.customFee)]));
  const zeroFeeByKey = new Map(zeroFeeGroups.map((g) => [`${g.courseId}|${g.franchiseId}`, g._count._all]));

  const byCourse = new Map<string, CourseFeeRow & { royaltyRates: Set<number> }>();

  for (const g of groups) {
    const courseKey = g.courseId!.toString();
    const course = courseById.get(courseKey);
    if (!course) continue;
    const key = `${courseKey}|${g.franchiseId}`;
    const count = g._count._all;
    const fee = customFeeByKey.get(key) ?? Number(course.baseFee);
    const amount = Number(g._sum.totalFee ?? 0) + (zeroFeeByKey.get(key) ?? 0) * fee;

    const slab = royaltySlab(course.durationMonths);

    const row =
      byCourse.get(courseKey) ??
      {
        courseId: courseKey,
        courseName: course.name,
        category: course.category,
        students: 0,
        feePerStudent: franchiseId ? fee : Number(course.baseFee),
        totalAmount: 0,
        gst: 0,
        totalWithGst: 0,
        durationMonths: course.durationMonths,
        durationLabel: durationLabel(course.durationMonths),
        royaltyPerStudent: null,
        royalty: 0,
        royaltyGst: 0,
        royaltyMissing: 0,
        royaltyRates: new Set<number>(),
      };
    row.students += count;
    row.totalAmount += amount;
    if (slab) {
      row.royalty += slab.amount * count;
      row.royaltyRates.add(slab.amount);
    } else {
      row.royaltyMissing += count;
    }
    byCourse.set(courseKey, row);
  }

  const rows: CourseFeeRow[] = Array.from(byCourse.values())
    .map(({ royaltyRates, ...r }) => {
      const gst = r.totalAmount * GST_RATE;
      const royaltyGst = r.royalty * GST_RATE;
      return {
        ...r,
        totalAmount: round2(r.totalAmount),
        gst: round2(gst),
        totalWithGst: round2(r.totalAmount + gst),
        royaltyPerStudent: royaltyRates.size === 1 && r.royaltyMissing === 0 ? Array.from(royaltyRates)[0] : null,
        royalty: round2(r.royalty),
        royaltyGst: round2(royaltyGst),
      };
    })
    .sort((a, b) => b.students - a.students || a.courseName.localeCompare(b.courseName));

  const slabs: RoyaltySlabTotal[] = ROYALTY_SLABS.map((slab) => {
    const matched = rows.filter((row) => row.durationMonths === slab.months);
    const royalty = matched.reduce((sum, row) => sum + row.royalty, 0);
    const royaltyGst = royalty * GST_RATE;
    return {
      months: slab.months,
      label: slab.label,
      amount: slab.amount,
      students: matched.reduce((sum, row) => sum + row.students, 0),
      royalty: round2(royalty),
      royaltyGst: round2(royaltyGst),
      total: round2(royalty + royaltyGst),
    };
  });

  const totals = rows.reduce(
    (acc, r) => ({
      courses: acc.courses + 1,
      students: acc.students + r.students,
      totalAmount: acc.totalAmount + r.totalAmount,
      gst: acc.gst + r.gst,
      totalWithGst: acc.totalWithGst + r.totalWithGst,
      royalty: acc.royalty + r.royalty,
      royaltyGst: acc.royaltyGst + r.royaltyGst,
      royaltyMissing: acc.royaltyMissing + r.royaltyMissing,
    }),
    { courses: 0, students: 0, totalAmount: 0, gst: 0, totalWithGst: 0, royalty: 0, royaltyGst: 0, royaltyMissing: 0 }
  );

  return {
    gstRate: GST_RATE,
    rows,
    slabs,
    totals: {
      ...totals,
      totalAmount: round2(totals.totalAmount),
      gst: round2(totals.gst),
      totalWithGst: round2(totals.totalWithGst),
      royalty: round2(totals.royalty),
      royaltyGst: round2(totals.royaltyGst),
    },
  };
}
