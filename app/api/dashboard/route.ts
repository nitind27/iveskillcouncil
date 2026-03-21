import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache, cacheKeys } from '@/lib/cache';
import { rateLimiter, rateLimitConfig, getClientIdentifier } from '@/lib/rate-limit';
import { successResponse, errorResponse, rateLimitResponse, unauthorizedResponse } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/api-auth';
import { ROLES } from '@/lib/permissions';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.api.maxRequests, rateLimitConfig.api.windowMs)) {
      return rateLimitResponse();
    }

    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    // STUDENT: return only their own personal dashboard data
    if (user.roleId === ROLES.STUDENT) {
      const cacheKey = `dashboard:student:${user.id}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return successResponse(cached, 'Student dashboard data retrieved from cache');
      }

      const student = await prisma.student.findUnique({
        where: { userId: BigInt(user.id) },
        include: {
          course: { select: { name: true, durationMonths: true } },
          franchise: { select: { name: true } },
          user: { select: { fullName: true, email: true } },
        },
      });

      if (!student) {
        return successResponse({
          studentDashboard: true,
          profile: null,
          message: 'Student record not found. Please contact your franchise.',
        });
      }

      const [recentPayments, certificate, attendanceSummary] = await Promise.all([
        prisma.payment.findMany({
          where: { studentId: student.id },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, amount: true, status: true, paymentDate: true, createdAt: true },
        }),
        prisma.certificate.findFirst({
          where: { studentId: student.id },
          orderBy: { createdAt: 'desc' },
          select: { status: true, certificateNumber: true, issueDate: true },
        }),
        prisma.attendance.groupBy({
          by: ['status'],
          where: { userId: BigInt(user.id) },
          _count: true,
        }),
      ]);

      const totalFee = Number(student.totalFee);
      const paidFee = Number(student.paidFee);
      const pendingFee = totalFee - paidFee;

      const attStats = attendanceSummary.reduce((acc, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {} as Record<string, number>);
      const totalDays = Object.values(attStats).reduce((a, b) => a + b, 0);
      const presentDays = (attStats.PRESENT ?? 0) + (attStats.LATE ?? 0);
      const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      const studentDashboardData = {
        studentDashboard: true,
        profile: {
          fullName: student.user.fullName,
          email: student.user.email,
        },
        franchise: {
          name: student.franchise.name,
        },
        course: {
          name: student.course.name,
          durationMonths: student.course.durationMonths,
          admissionDate: student.admissionDate.toISOString().split('T')[0],
          status: student.status,
        },
        fees: {
          totalFee,
          paidFee,
          pendingFee,
          percentPaid: totalFee > 0 ? Math.round((paidFee / totalFee) * 100) : 0,
        },
        attendance: {
          totalDays,
          presentDays,
          attendancePercent,
        },
        certificate: certificate
          ? {
              status: certificate.status,
              certificateNumber: certificate.certificateNumber,
              issueDate: certificate.issueDate?.toISOString().split('T')[0] ?? null,
            }
          : null,
        recentPayments: recentPayments.map((p) => ({
          id: p.id.toString(),
          amount: p.amount.toString(),
          status: p.status,
          date: (p.paymentDate || p.createdAt)?.toString?.() ?? '',
        })),
      };

      cache.set(cacheKey, studentDashboardData, 2 * 60 * 1000); // 2 min
      return successResponse(studentDashboardData);
    }

    const searchParams = request.nextUrl.searchParams;
    let franchiseId: string | null = searchParams.get('franchiseId') || null;
    if (user.roleId === ROLES.SUB_ADMIN && user.franchiseId) {
      franchiseId = user.franchiseId;
    }

    // Check cache (include roleId so superadmin gets support requests in cache)
    const cacheKey = `dashboard:${franchiseId || 'all'}:${user.roleId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return successResponse(cached, 'Dashboard data retrieved from cache');
    }

    // Fetch dashboard data
    const [
      totalFranchises,
      activeFranchises,
      totalStudents,
      totalStaff,
      totalRevenue,
      pendingFeesCount,
      pendingCertificates,
      recentPayments,
      attendanceStats,
      totalAttendanceToday,
      presentToday,
    ] = await Promise.all([
      // Total franchises
      prisma.franchise.count(),
      
      // Active franchises
      prisma.franchise.count({
        where: { status: 'ACTIVE' },
      }),
      
      // Total students
      franchiseId
        ? prisma.student.count({
            where: { franchiseId: BigInt(franchiseId) },
          })
        : prisma.student.count(),
      
      // Total staff
      franchiseId
        ? prisma.staff.count({
            where: { franchiseId: BigInt(franchiseId) },
          })
        : prisma.staff.count(),
      
      // Total revenue (last 30 days)
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paymentDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          ...(franchiseId && { franchiseId: BigInt(franchiseId) }),
        },
        _sum: {
          amount: true,
        },
      }),
      
      // Pending fees (students with total_fee > paid_fee)
      franchiseId
        ? (prisma.$queryRaw<[{ c: bigint }]>`
            SELECT COUNT(*) as c FROM students
            WHERE franchise_id = ${BigInt(franchiseId)} AND (total_fee - paid_fee) > 0
          `).then((r) => Number(r[0]?.c ?? 0))
        : (prisma.$queryRaw<[{ c: bigint }]>`
            SELECT COUNT(*) as c FROM students WHERE (total_fee - paid_fee) > 0
          `).then((r) => Number(r[0]?.c ?? 0)),
      prisma.certificate.count({
        where: {
          status: 'REQUESTED',
          ...(franchiseId && { franchiseId: BigInt(franchiseId) }),
        },
      }),
      // Recent payments
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: {
          ...(franchiseId && { franchiseId: BigInt(franchiseId) }),
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      }),
      
      prisma.attendance.groupBy({
        by: ['status'],
        where: {
          attendanceDate: new Date(),
          ...(franchiseId && { franchiseId: BigInt(franchiseId) }),
        },
        _count: true,
      }),
      prisma.attendance.count({
        where: {
          attendanceDate: new Date(),
          ...(franchiseId && { franchiseId: BigInt(franchiseId) }),
        },
      }),
      prisma.attendance.count({
        where: {
          attendanceDate: new Date(),
          status: 'PRESENT',
          ...(franchiseId && { franchiseId: BigInt(franchiseId) }),
        },
      }),
    ]);

    const totalRev = Number(totalRevenue._sum.amount || 0);
    const attendancePercent = totalAttendanceToday > 0
      ? Math.round((Number(presentToday) / Number(totalAttendanceToday)) * 100)
      : 0;

    let recentSupportRequests: { id: string; fullName: string; email: string; message: string; createdAt: string }[] = [];
    let supportRequestsCount = 0;
    if (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN) {
      try {
        const [count, recent] = await Promise.all([
          prisma.supportRequest.count(),
          prisma.supportRequest.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
          }),
        ]);
        supportRequestsCount = count;
        recentSupportRequests = recent.map((r) => ({
          id: r.id.toString(),
          fullName: r.fullName,
          email: r.email,
          message: r.message.slice(0, 80) + (r.message.length > 80 ? '...' : ''),
          createdAt: r.createdAt.toISOString(),
        }));
      } catch {
        // support_requests table may not exist
      }
    }

    // Super Admin / Admin: extra analytics
    let courseEnquiriesCount = 0;
    let franchiseInquiriesCount = 0;
    let offerApplicationsCount = 0;
    if (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN) {
      try {
        const [enq, finq, oapp] = await Promise.all([
          prisma.courseEnrollmentRequest.count(),
          prisma.franchiseInquiry.count(),
          (prisma as { offerApplication?: { count: () => Promise<number> } }).offerApplication?.count?.() ?? Promise.resolve(0),
        ]);
        courseEnquiriesCount = enq;
        franchiseInquiriesCount = finq;
        offerApplicationsCount = oapp;
      } catch {
        // tables may not exist
      }
    }

    const dashboardData = {
      stats: {
        totalFranchises,
        activeFranchises,
        totalStudents,
        totalStaff,
        totalRevenue: totalRev,
        pendingFees: pendingFeesCount,
        pendingCertificates,
        attendancePercent,
        ...((user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN) && {
          supportRequestsCount,
          courseEnquiriesCount,
          franchiseInquiriesCount,
          offerApplicationsCount,
          totalAttendanceToday,
        }),
      },
      recentPayments: recentPayments.map((payment) => ({
        id: payment.id.toString(),
        studentName: payment.student.user.fullName,
        amount: payment.amount.toString(),
        status: payment.status,
        date: payment.paymentDate || payment.createdAt,
      })),
      attendanceStats: attendanceStats.reduce(
        (acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        },
        {} as Record<string, number>
      ),
      ...((user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN) && { recentSupportRequests }),
    };

    // Cache the result
    cache.set(cacheKey, dashboardData, 5 * 60 * 1000); // 5 minutes

    return successResponse(dashboardData);
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return errorResponse(error.message || 'Failed to fetch dashboard data', 500);
  }
}

