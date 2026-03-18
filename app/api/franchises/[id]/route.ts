import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache, cacheKeys } from '@/lib/cache';
import { rateLimiter, rateLimitConfig, getClientIdentifier } from '@/lib/rate-limit';
import { successResponse, errorResponse, rateLimitResponse, notFoundResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.api.maxRequests, rateLimitConfig.api.windowMs)) {
      return rateLimitResponse();
    }

    const id = BigInt(params.id);

    // Check cache
    const cacheKey = cacheKeys.franchise(Number(id));
    const cached = cache.get(cacheKey);
    if (cached) {
      return successResponse(cached, 'Franchise retrieved from cache');
    }

    const franchise = await prisma.franchise.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        plan: true,
        _count: {
          select: {
            students: true,
            staff: true,
            courses: true,
          },
        },
      },
    });

    if (!franchise) {
      return notFoundResponse();
    }

    const formatted = {
      id: franchise.id.toString(),
      name: franchise.name,
      owner: {
        id: franchise.owner.id.toString(),
        name: franchise.owner.fullName,
        email: franchise.owner.email,
        phone: franchise.owner.phone,
      },
      plan: {
        id: franchise.plan.id,
        name: franchise.plan.name,
        price: franchise.plan.price.toString(),
      },
      subscriptionStart: franchise.subscriptionStart,
      subscriptionEnd: franchise.subscriptionEnd,
      address: franchise.address,
      city: franchise.city,
      state: franchise.state,
      pincode: franchise.pincode,
      status: franchise.status,
      rejectionReason: (franchise as { rejectionReason?: string | null }).rejectionReason ?? undefined,
      stats: {
        students: franchise._count.students,
        staff: franchise._count.staff,
        courses: franchise._count.courses,
      },
      createdAt: franchise.createdAt,
      updatedAt: franchise.updatedAt,
    };

    cache.set(cacheKey, formatted, 5 * 60 * 1000); // 5 minutes

    return successResponse(formatted);
  } catch (error: any) {
    console.error('Get franchise error:', error);
    return errorResponse(error.message || 'Failed to fetch franchise', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.api.maxRequests, rateLimitConfig.api.windowMs)) {
      return rateLimitResponse();
    }

    const id = BigInt(params.id);
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      ...(body.name && { name: body.name }),
      ...(body.planId && { planId: body.planId }),
      ...(body.subscriptionStart && { subscriptionStart: new Date(body.subscriptionStart) }),
      ...(body.subscriptionEnd && { subscriptionEnd: new Date(body.subscriptionEnd) }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.state !== undefined && { state: body.state }),
      ...(body.pincode !== undefined && { pincode: body.pincode }),
      ...(body.status && { status: body.status }),
    };
    if (body.status === "REJECTED" && body.rejectionReason !== undefined) {
      updateData.rejectionReason = body.rejectionReason || null;
    }
    if (body.status === "ACTIVE") {
      updateData.rejectionReason = null;
    }

    const franchise = await prisma.franchise.update({
      where: { id },
      data: updateData as any,
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
      },
    });

    // Clear cache
    cache.delete(cacheKeys.franchise(Number(id)));
    cache.delete(cacheKeys.franchises(1, 10));
    cache.delete(cacheKeys.dashboard());

    return successResponse(
      {
        id: franchise.id.toString(),
        name: franchise.name,
        status: franchise.status,
      },
      'Franchise updated successfully'
    );
  } catch (error: any) {
    console.error('Update franchise error:', error);
    return errorResponse(error.message || 'Failed to update franchise', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.api.maxRequests, rateLimitConfig.api.windowMs)) {
      return rateLimitResponse();
    }

    const id = BigInt(params.id);

    await prisma.franchise.delete({
      where: { id },
    });

    // Clear cache
    cache.delete(cacheKeys.franchise(Number(id)));
    cache.delete(cacheKeys.franchises(1, 10));
    cache.delete(cacheKeys.dashboard());

    return successResponse(null, 'Franchise deleted successfully');
  } catch (error: any) {
    console.error('Delete franchise error:', error);
    return errorResponse(error.message || 'Failed to delete franchise', 500);
  }
}

