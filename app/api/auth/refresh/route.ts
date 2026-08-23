import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/jwt';
import { successResponse, unauthorizedResponse, rateLimitResponse, errorResponse } from '@/lib/api-response';
import { rateLimiter, rateLimitConfig, rateLimitKey } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE, getAuthCookieOptions } from '@/lib/auth-cookies';
import { randomUUID } from 'crypto';
import { DatabaseUnavailableError, isDbUnavailableError, withDbRetry } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const clientId = rateLimitKey("refresh", request);
    if (!rateLimiter.check(clientId, rateLimitConfig.authRefresh.maxRequests, rateLimitConfig.authRefresh.windowMs)) {
      return rateLimitResponse();
    }

    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return unauthorizedResponse();
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return unauthorizedResponse();
    }

    const userData = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { id: BigInt(payload.userId) },
        include: {
          role: true,
          franchise: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      })
    );

    if (!userData || userData.status !== 'ACTIVE') {
      return unauthorizedResponse();
    }

    const user = {
      id: userData.id.toString(),
      email: userData.email,
      fullName: userData.fullName,
      phone: userData.phone,
      roleId: userData.roleId,
      roleName: userData.role.name,
      franchiseId: userData.franchiseId?.toString(),
      franchise: userData.franchise ? {
        id: userData.franchise.id.toString(),
        name: userData.franchise.name,
        status: userData.franchise.status,
      } : null,
    };

    const newAccessToken = generateAccessToken({
      userId: user.id,
      roleId: user.roleId,
      franchiseId: user.franchiseId,
      email: user.email,
    });

    // Sliding refresh — extend session while user stays active
    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      tokenId: randomUUID(),
    });

    const response = successResponse({ user }, 'Token refreshed successfully');
    const cookieOptions = getAuthCookieOptions();

    response.cookies.set('accessToken', newAccessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    response.cookies.set('refreshToken', newRefreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    return response;
  } catch (error: unknown) {
    console.error('Refresh token error:', error);
    if (error instanceof DatabaseUnavailableError || isDbUnavailableError(error)) {
      return errorResponse(
        'Database temporarily unreachable. Keep npm run dev running (includes DB proxy).',
        503
      );
    }
    return unauthorizedResponse();
  }
}

