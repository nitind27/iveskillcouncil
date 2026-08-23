import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/permissions";
import type { PaymentStatus, Prisma } from "@prisma/client";

export type ReportTab = "overview" | "analytics" | "activity";

export type DashboardReportFilters = {
  franchiseId?: string | null;
  from: Date;
  to: Date;
  status?: string;
  tab?: ReportTab;
};

export type AuthUserLite = {
  id: string;
  roleId: number;
  franchiseId?: string | null;
};

export type ActivityFeedItem = {
  id: string;
  type: "payment" | "support" | "enquiry" | "franchise_inquiry" | "offer" | "student" | "certificate";
  title: string;
  subtitle: string;
  meta?: string;
  amount?: number;
  status?: string;
  at: string;
  href?: string;
};

export function resolveDateRange(
  range: string | null,
  fromStr: string | null,
  toStr: string | null
): { from: Date; to: Date; rangeLabel: string } {
  const to = toStr ? new Date(toStr) : new Date();
  to.setHours(23, 59, 59, 999);

  let from: Date;
  let rangeLabel: string;

  if (range === "custom" && fromStr) {
    from = new Date(fromStr);
    from.setHours(0, 0, 0, 0);
    rangeLabel = `${from.toLocaleDateString("en-IN")} – ${to.toLocaleDateString("en-IN")}`;
  } else if (range === "all") {
    from = new Date("2020-01-01T00:00:00.000Z");
    rangeLabel = "All Time";
  } else {
    const days =
      range === "7d" ? 7 : range === "90d" ? 90 : range === "365d" ? 365 : 30;
    from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    from.setHours(0, 0, 0, 0);
    rangeLabel =
      range === "7d"
        ? "Last 7 days"
        : range === "90d"
          ? "Last 90 days"
          : range === "365d"
            ? "Last 12 months"
            : "Last 30 days";
  }

  return { from, to, rangeLabel };
}

export function resolveFranchiseId(user: AuthUserLite, requested: string | null) {
  if (user.roleId === ROLES.SUB_ADMIN && user.franchiseId) return user.franchiseId;
  return requested || null;
}

function franchiseWhere(franchiseId: string | null) {
  return franchiseId ? { franchiseId: BigInt(franchiseId) } : {};
}

/** Match payments by paymentDate or createdAt inside the selected range */
function paymentDateFilter(from: Date, to: Date): Prisma.PaymentWhereInput {
  return {
    OR: [
      { paymentDate: { gte: from, lte: to } },
      { createdAt: { gte: from, lte: to } },
    ],
  };
}

export async function buildDashboardReport(
  user: AuthUserLite,
  filters: DashboardReportFilters
) {
  const { from, to, status } = filters;
  const franchiseId = filters.franchiseId ?? null;
  const fw = franchiseWhere(franchiseId);
  const isAdmin = user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN;
  const dateRange = { gte: from, lte: to };

  const statusFilter =
    status && status !== "ALL" ? { status: status as PaymentStatus } : {};

  const paymentWhere: Prisma.PaymentWhereInput = {
    ...fw,
    ...paymentDateFilter(from, to),
    ...statusFilter,
  };

  const paymentWhereSuccess: Prisma.PaymentWhereInput = {
    ...fw,
    ...paymentDateFilter(from, to),
    status: status && status !== "ALL" ? (status as PaymentStatus) : "SUCCESS",
  };

  const [
    totalStudents,
    totalStaff,
    totalFranchises,
    activeFranchises,
    revenueAgg,
    paymentCount,
    paymentsByStatus,
    pendingFeesCount,
    pendingCertificates,
    recentPayments,
    attendanceInRange,
    studentsByStatus,
    recentStudents,
    recentCertificates,
  ] = await Promise.all([
    prisma.student.count({ where: fw }),
    prisma.staff.count({ where: fw }),
    isAdmin ? prisma.franchise.count() : Promise.resolve(0),
    isAdmin ? prisma.franchise.count({ where: { status: "ACTIVE" } }) : Promise.resolve(0),
    prisma.payment.aggregate({
      where: paymentWhereSuccess,
      _sum: { amount: true },
      _avg: { amount: true },
      _count: true,
    }),
    prisma.payment.count({ where: paymentWhere }),
    prisma.payment.groupBy({
      by: ["status"],
      where: { ...fw, ...paymentDateFilter(from, to) },
      _sum: { amount: true },
      _count: true,
    }),
    franchiseId
      ? prisma.$queryRaw<[{ c: bigint }]>`
          SELECT COUNT(*) as c FROM students
          WHERE franchise_id = ${BigInt(franchiseId)} AND (total_fee - paid_fee) > 0
        `.then((r) => Number(r[0]?.c ?? 0))
      : prisma.$queryRaw<[{ c: bigint }]>`
          SELECT COUNT(*) as c FROM students WHERE (total_fee - paid_fee) > 0
        `.then((r) => Number(r[0]?.c ?? 0)),
    prisma.certificate.count({
      where: { status: "REQUESTED", ...fw },
    }),
    prisma.payment.findMany({
      where: paymentWhere,
      take: 150,
      orderBy: { createdAt: "desc" },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        franchise: { select: { name: true } },
      },
    }),
    prisma.attendance.groupBy({
      by: ["status"],
      where: { ...fw, attendanceDate: dateRange },
      _count: true,
    }),
    prisma.student.groupBy({
      by: ["status"],
      where: fw,
      _count: true,
    }),
    prisma.student.findMany({
      where: { ...fw, createdAt: dateRange },
      take: 40,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true } },
        franchise: { select: { name: true } },
        course: { select: { name: true } },
      },
    }),
    prisma.certificate.findMany({
      where: { ...fw, createdAt: dateRange },
      take: 40,
      orderBy: { createdAt: "desc" },
      include: {
        student: { include: { user: { select: { fullName: true } } } },
        franchise: { select: { name: true } },
      },
    }),
  ]);

  const paymentsForTrend = await prisma.payment.findMany({
    where: { ...fw, status: "SUCCESS", ...paymentDateFilter(from, to) },
    select: { amount: true, createdAt: true, paymentDate: true },
  });

  const monthlyMap = new Map<string, number>();
  for (const p of paymentsForTrend) {
    const d = p.paymentDate || p.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(p.amount));
  }
  const monthlyRevenue = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  let franchiseRevenue: { name: string; amount: number; count: number }[] = [];
  if (isAdmin && !franchiseId) {
    const grouped = await prisma.payment.groupBy({
      by: ["franchiseId"],
      where: { status: "SUCCESS", ...paymentDateFilter(from, to) },
      _sum: { amount: true },
      _count: true,
    });
    const ids = grouped.map((g) => g.franchiseId).filter(Boolean) as bigint[];
    const franchises = ids.length
      ? await prisma.franchise.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true },
        })
      : [];
    const nameById = new Map(franchises.map((f) => [f.id.toString(), f.name]));
    franchiseRevenue = grouped
      .map((g) => ({
        name: g.franchiseId
          ? nameById.get(g.franchiseId.toString()) || `Franchise #${g.franchiseId}`
          : "Unknown",
        amount: Number(g._sum.amount || 0),
        count: g._count,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 15);
  }

  let supportRequests: {
    id: string;
    fullName: string;
    email: string;
    message: string;
    createdAt: string;
  }[] = [];
  let supportCount = 0;
  let courseEnquiries = 0;
  let franchiseInquiries = 0;
  let offerApplications = 0;
  let enquiryList: { id: string; fullName: string; courseName: string; email: string; phone: string; createdAt: string }[] = [];
  let franchiseInquiryList: { id: string; fullName: string; email: string; phone: string; city: string | null; createdAt: string }[] = [];
  let offerList: { id: string; fullName: string; offerTitle: string; email: string; createdAt: string }[] = [];

  if (isAdmin) {
    try {
      const [sc, supportList, enq, finq, oapp, enqRows, finqRows, offerRows] = await Promise.all([
        prisma.supportRequest.count({ where: { createdAt: dateRange } }),
        prisma.supportRequest.findMany({
          where: { createdAt: dateRange },
          take: 50,
          orderBy: { createdAt: "desc" },
        }),
        prisma.courseEnrollmentRequest.count({ where: { createdAt: dateRange } }),
        prisma.franchiseInquiry.count({ where: { createdAt: dateRange } }),
        prisma.offerApplication.count({ where: { createdAt: dateRange } }),
        prisma.courseEnrollmentRequest.findMany({
          where: { createdAt: dateRange },
          take: 40,
          orderBy: { createdAt: "desc" },
        }),
        prisma.franchiseInquiry.findMany({
          where: { createdAt: dateRange },
          take: 40,
          orderBy: { createdAt: "desc" },
        }),
        prisma.offerApplication.findMany({
          where: { createdAt: dateRange },
          take: 40,
          orderBy: { createdAt: "desc" },
        }),
      ]);
      supportCount = sc;
      supportRequests = supportList.map((r) => ({
        id: r.id.toString(),
        fullName: r.fullName,
        email: r.email,
        message: r.message,
        createdAt: r.createdAt.toISOString(),
      }));
      courseEnquiries = enq;
      franchiseInquiries = finq;
      offerApplications = oapp;
      enquiryList = enqRows.map((r) => ({
        id: r.id.toString(),
        fullName: r.fullName,
        courseName: r.courseName,
        email: r.email,
        phone: r.phone,
        createdAt: r.createdAt.toISOString(),
      }));
      franchiseInquiryList = finqRows.map((r) => ({
        id: r.id.toString(),
        fullName: r.fullName,
        email: r.email,
        phone: r.phone,
        city: r.city,
        createdAt: r.createdAt.toISOString(),
      }));
      offerList = offerRows.map((r) => ({
        id: r.id.toString(),
        fullName: r.fullName,
        offerTitle: r.offerTitle,
        email: r.email,
        createdAt: r.createdAt.toISOString(),
      }));
    } catch {
      // optional tables
    }
  }

  const attendanceStats = attendanceInRange.reduce(
    (acc, s) => {
      acc[s.status] = s._count;
      return acc;
    },
    {} as Record<string, number>
  );
  const attendanceTotal = Object.values(attendanceStats).reduce((a, b) => a + b, 0);
  const present = (attendanceStats.PRESENT || 0) + (attendanceStats.LATE || 0);
  const attendancePercent =
    attendanceTotal > 0 ? Math.round((present / attendanceTotal) * 100) : 0;

  const successRevenue =
    status && status !== "ALL" && status !== "SUCCESS"
      ? Number(revenueAgg._sum.amount || 0)
      : Number(
          paymentsByStatus.find((p) => p.status === "SUCCESS")?._sum.amount ||
            revenueAgg._sum.amount ||
            0
        );

  const paymentRows = recentPayments.map((p) => ({
    id: p.id.toString(),
    studentName: p.student.user.fullName,
    franchiseName: p.franchise?.name || "—",
    amount: Number(p.amount),
    status: p.status,
    date: (p.paymentDate || p.createdAt).toISOString(),
  }));

  const studentsInRange = recentStudents.map((s) => ({
    id: s.id.toString(),
    fullName: s.user.fullName,
    email: s.user.email,
    courseName: s.course.name,
    franchiseName: s.franchise.name,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
  }));

  const certificatesInRange = recentCertificates.map((c) => ({
    id: c.id.toString(),
    studentName: c.student.user.fullName,
    franchiseName: c.franchise.name,
    certificateNumber: c.certificateNumber,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  }));

  // Unified activity timeline
  const activityFeed: ActivityFeedItem[] = [];

  for (const p of paymentRows) {
    activityFeed.push({
      id: `pay-${p.id}`,
      type: "payment",
      title: `Payment · ${p.studentName}`,
      subtitle: `${p.franchiseName} · ${p.status}`,
      amount: p.amount,
      status: p.status,
      at: p.date,
      href: "/fees",
    });
  }
  for (const s of supportRequests) {
    activityFeed.push({
      id: `sup-${s.id}`,
      type: "support",
      title: `Support · ${s.fullName}`,
      subtitle: s.message.slice(0, 100),
      meta: s.email,
      at: s.createdAt,
      href: "/dashboard/support",
    });
  }
  for (const e of enquiryList) {
    activityFeed.push({
      id: `enq-${e.id}`,
      type: "enquiry",
      title: `Course Enquiry · ${e.fullName}`,
      subtitle: e.courseName,
      meta: e.email,
      at: e.createdAt,
      href: "/dashboard/enquiries",
    });
  }
  for (const f of franchiseInquiryList) {
    activityFeed.push({
      id: `finq-${f.id}`,
      type: "franchise_inquiry",
      title: `Franchise Inquiry · ${f.fullName}`,
      subtitle: f.city || f.phone,
      meta: f.email,
      at: f.createdAt,
      href: "/dashboard/franchise-inquiries",
    });
  }
  for (const o of offerList) {
    activityFeed.push({
      id: `off-${o.id}`,
      type: "offer",
      title: `Offer Application · ${o.fullName}`,
      subtitle: o.offerTitle,
      meta: o.email,
      at: o.createdAt,
      href: "/dashboard/offer-applications",
    });
  }
  for (const s of studentsInRange) {
    activityFeed.push({
      id: `stu-${s.id}`,
      type: "student",
      title: `New Student · ${s.fullName}`,
      subtitle: `${s.courseName} · ${s.franchiseName}`,
      meta: s.email,
      status: s.status,
      at: s.createdAt,
      href: "/students",
    });
  }
  for (const c of certificatesInRange) {
    activityFeed.push({
      id: `cert-${c.id}`,
      type: "certificate",
      title: `Certificate · ${c.studentName}`,
      subtitle: `${c.certificateNumber} · ${c.franchiseName}`,
      status: c.status,
      at: c.createdAt,
      href: "/certificates/requests",
    });
  }

  activityFeed.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return {
    filters: {
      franchiseId,
      from: from.toISOString(),
      to: to.toISOString(),
      status: status || "ALL",
    },
    totals: {
      totalStudents,
      totalStaff,
      totalFranchises,
      activeFranchises,
      revenue: successRevenue,
      paymentCount,
      avgPayment: Number(revenueAgg._avg.amount || 0),
      pendingFees: pendingFeesCount,
      pendingCertificates,
      attendancePercent,
      attendanceTotal,
      supportCount,
      courseEnquiries,
      franchiseInquiries,
      offerApplications,
      leadTotal: courseEnquiries + franchiseInquiries + offerApplications,
      studentsJoined: studentsInRange.length,
      certificatesInRange: certificatesInRange.length,
      activityCount: activityFeed.length,
    },
    paymentsByStatus: paymentsByStatus.map((p) => ({
      status: p.status,
      count: p._count,
      amount: Number(p._sum.amount || 0),
    })),
    studentsByStatus: studentsByStatus.map((s) => ({
      status: s.status,
      count: s._count,
    })),
    attendanceStats,
    monthlyRevenue,
    franchiseRevenue,
    payments: paymentRows,
    supportRequests,
    enquiryList,
    franchiseInquiryList,
    offerList,
    studentsInRange,
    certificatesInRange,
    activityFeed: activityFeed.slice(0, 120),
  };
}

export type DashboardReportData = Awaited<ReturnType<typeof buildDashboardReport>>;
