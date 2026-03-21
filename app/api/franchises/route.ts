import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { cache, cacheKeys } from '@/lib/cache';
import { rateLimiter, rateLimitConfig, getClientIdentifier } from '@/lib/rate-limit';
import { successResponse, errorResponse, rateLimitResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response';
import { getCurrentUser, requireSuperAdmin, requireSuperAdminOrAdmin } from '@/lib/api-auth';
import { hashPassword } from '@/lib/auth';
import { ROLES } from '@/lib/permissions';
import { sendFranchiseCredentialsEmail } from '@/lib/email';
import { generateFranchiseCredentialsPdf } from '@/lib/franchise-credentials-pdf';

const SUB_ADMIN_ROLE_ID = ROLES.SUB_ADMIN;

/** Generate cryptographically secure random password (12 chars: alphanumeric, no ambiguous chars). */
function generatePassword(length = 12): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(length);
  let s = '';
  for (let i = 0; i < length; i++) s += chars[bytes[i]! % chars.length];
  return s;
}

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.api.maxRequests, rateLimitConfig.api.windowMs)) {
      return rateLimitResponse();
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const planId = searchParams.get('planId');

    // Check cache
    const cacheKey = cacheKeys.franchises(page, limit);
    const cached = cache.get<{ franchises: unknown[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(cacheKey);
    if (cached && !search && !status && !planId) {
      return successResponse(cached.franchises, 'Franchises retrieved from cache', cached.pagination);
    }

    const user = await getCurrentUser();
    if (!user) return (await import('@/lib/api-response')).unauthorizedResponse();

    const where: any = {};
    if (user.roleId === ROLES.SUB_ADMIN && user.franchiseId) {
      where.id = BigInt(user.franchiseId);
    }
    if (status) {
      where.status = status;
    }
    if (planId) {
      const planIdNum = parseInt(planId, 10);
      if (!isNaN(planIdNum)) where.planId = planIdNum;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
        { state: { contains: search } },
        { owner: { email: { contains: search } } },
        { owner: { fullName: { contains: search } } },
      ];
    }

    // Fetch franchises with pagination
    const [franchises, total] = await Promise.all([
      prisma.franchise.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          plan: {
            select: {
              name: true,
              price: true,
            },
          },
          _count: {
            select: {
              students: true,
              staff: true,
            },
          },
        },
      }),
      prisma.franchise.count({ where }),
    ]);

    const formattedFranchises = franchises.map((franchise) => ({
      id: franchise.id.toString(),
      name: franchise.name,
      owner: {
        id: franchise.owner.id.toString(),
        name: franchise.owner.fullName,
        email: franchise.owner.email,
      },
      plan: {
        name: franchise.plan.name,
        price: franchise.plan.price.toString(),
      },
      subscriptionStart: franchise.subscriptionStart,
      subscriptionEnd: franchise.subscriptionEnd,
      status: franchise.status,
      rejectionReason: (franchise as { rejectionReason?: string | null }).rejectionReason ?? undefined,
      address: franchise.address,
      city: franchise.city,
      state: franchise.state,
      pincode: franchise.pincode,
      stats: {
        students: franchise._count.students,
        staff: franchise._count.staff,
      },
      createdAt: franchise.createdAt,
      updatedAt: franchise.updatedAt,
    }));

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    const response = {
      franchises: formattedFranchises,
      pagination,
    };

    // Cache only if no search/filter
    if (!search && !status) {
      cache.set(cacheKey, response, 2 * 60 * 1000); // 2 minutes
    }

    return successResponse(formattedFranchises, 'Franchises retrieved successfully', pagination);
  } catch (error: any) {
    console.error('Franchises API error:', error);
    return errorResponse(error.message || 'Failed to fetch franchises', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.api.maxRequests, rateLimitConfig.api.windowMs)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const {
      name,
      ownerId,
      ownerEmail,
      ownerName,
      ownerPhone,
      planId,
      subscriptionStart,
      subscriptionEnd,
      address,
      city,
      state,
      pincode,
    } = body;

    const createWithNewOwner = !ownerId && ownerEmail && ownerName;

    if (createWithNewOwner) {
      const admin = await requireSuperAdminOrAdmin();
      if (!admin) return forbiddenResponse();

      if (!name || !planId || !subscriptionStart || !subscriptionEnd) {
        return errorResponse('Missing required fields: name, planId, subscriptionStart, subscriptionEnd', 400);
      }

      const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });
      if (existingUser) {
        return errorResponse('A user with this email already exists', 400);
      }

      const plainPassword = generatePassword(12);
      const hashedPassword = await hashPassword(plainPassword);

      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

      // Use raw SQL to create owner with must_change_password (works when Prisma client is out of sync)
      await prisma.$executeRaw`
        INSERT INTO users (role_id, full_name, email, phone, password, must_change_password, status, created_at, updated_at)
        VALUES (${SUB_ADMIN_ROLE_ID}, ${ownerName}, ${ownerEmail}, ${ownerPhone || null}, ${hashedPassword}, 1, 'ACTIVE', NOW(), NOW())
      `;
      const [idRow] = await prisma.$queryRaw<[{ id: bigint }]>`SELECT LAST_INSERT_ID() as id`;
      const ownerId = idRow.id;

      const owner = { id: ownerId, fullName: ownerName, email: ownerEmail };

      const franchise = await prisma.franchise.create({
        data: {
          name,
          ownerId,
          planId,
          subscriptionStart: new Date(subscriptionStart),
          subscriptionEnd: new Date(subscriptionEnd),
          address,
          city,
          state,
          pincode,
          status: 'PENDING',
        },
        include: {
          owner: { select: { id: true, fullName: true, email: true } },
          plan: { select: { name: true, price: true } },
        },
      });

      await prisma.user.update({
        where: { id: ownerId },
        data: { franchiseId: franchise.id },
      });

      const loginUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`}/login`
        : 'https://example.com/login';

      const appName = process.env.APP_NAME || 'Franchise Institute';
      const subStart = subscriptionStart ? new Date(subscriptionStart).toLocaleDateString() : '';
      const subEnd = subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString() : '';

      let pdfBuffer: Buffer | undefined;
      try {
        pdfBuffer = await generateFranchiseCredentialsPdf({
          franchiseName: franchise.name,
          franchiseId: franchise.id.toString(),
          ownerName: owner.fullName,
          email: owner.email,
          phone: ownerPhone || null,
          planName: plan?.name ?? 'N/A',
          subscriptionStart: subStart,
          subscriptionEnd: subEnd,
          address,
          city,
          state,
          pincode,
          loginUrl,
          appName,
        });
      } catch (pdfErr) {
        console.warn('Franchise credentials PDF generation failed:', pdfErr);
      }

      const emailResult = await sendFranchiseCredentialsEmail(owner.email, {
        franchiseName: franchise.name,
        franchiseId: franchise.id.toString(),
        loginUrl,
        email: owner.email,
        password: plainPassword,
        planName: plan?.name ?? 'N/A',
        ownerName: owner.fullName,
        phone: ownerPhone || null,
        subscriptionStart: subStart,
        subscriptionEnd: subEnd,
        address,
        city,
        state,
        pincode,
        pdfBuffer,
        firstTimeSetup: true,
      });

      cache.delete(cacheKeys.franchises(1, 10));
      cache.delete(cacheKeys.dashboard());

      return successResponse(
        {
          id: franchise.id.toString(),
          name: franchise.name,
          owner: {
            id: franchise.owner.id.toString(),
            name: franchise.owner.fullName,
            email: franchise.owner.email,
          },
          plan: { name: franchise.plan.name, price: franchise.plan.price.toString() },
          status: franchise.status,
          emailSent: emailResult.success,
          emailError: emailResult.error,
          credentials: {
            email: owner.email,
            loginUrl,
            firstTimeSetup: true,
          },
        },
        'Franchise created. Login credentials sent by email.'
      );
    }

    if (!name || !ownerId || !planId || !subscriptionStart || !subscriptionEnd) {
      return errorResponse('Missing required fields', 400);
    }

    const franchise = await prisma.franchise.create({
      data: {
        name,
        ownerId: BigInt(ownerId),
        planId,
        subscriptionStart: new Date(subscriptionStart),
        subscriptionEnd: new Date(subscriptionEnd),
        address,
        city,
        state,
        pincode,
        status: 'PENDING',
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        plan: { select: { name: true, price: true } },
      },
    });

    cache.delete(cacheKeys.franchises(1, 10));
    cache.delete(cacheKeys.dashboard());

    return successResponse(
      {
        id: franchise.id.toString(),
        name: franchise.name,
        owner: {
          id: franchise.owner.id.toString(),
          name: franchise.owner.fullName,
          email: franchise.owner.email,
        },
        plan: { name: franchise.plan.name, price: franchise.plan.price.toString() },
        status: franchise.status,
      },
      'Franchise created successfully'
    );
  } catch (error: any) {
    console.error('Create franchise error:', error);
    return errorResponse(error.message || 'Failed to create franchise', 500);
  }
}

