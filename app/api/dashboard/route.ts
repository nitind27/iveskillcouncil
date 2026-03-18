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

    const searchParams = request.nextUrl.searchParams;
    let franchiseId: string | null = searchParams.get('franchiseId');
    if (user.roleId === ROLES.SUB_ADMIN && user.franchiseId) {
      franchiseId = user.franchiseId;
    }

    // Check cache
    const cacheKey = cacheKeys.dashboard(franchiseId ? parseInt(franchiseId) : undefined);
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
    };

    // Cache the result
    cache.set(cacheKey, dashboardData, 5 * 60 * 1000); // 5 minutes

    return successResponse(dashboardData);
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return errorResponse(error.message || 'Failed to fetch dashboard data', 500);
  }
}

