import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt';
import { successResponse, unauthorizedResponse, rateLimitResponse } from '@/lib/api-response';
import { rateLimiter, rateLimitConfig, getClientIdentifier } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.auth.maxRequests, rateLimitConfig.auth.windowMs)) {
      return rateLimitResponse();
    }

    // Get refresh token from cookies using Next.js cookies() API
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return unauthorizedResponse();
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return unauthorizedResponse();
    }

    // Get user from database using userId from refresh token payload
    const userData = await prisma.user.findUnique({
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
    });

    if (!userData || userData.status !== 'ACTIVE') {
      return unauthorizedResponse();
    }

    const user = {
      id: userData.id.toString(),
      email: userData.email,
      fullName: userData.fullName,
      roleId: userData.roleId,
      roleName: userData.role.name,
      franchiseId: userData.franchiseId?.toString(),
      franchise: userData.franchise ? {
        id: userData.franchise.id.toString(),
        name: userData.franchise.name,
        status: userData.franchise.status,
      } : null,
    };

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      roleId: user.roleId,
      franchiseId: user.franchiseId,
      email: user.email,
    });

    // Create response with new token
    const response = successResponse(
      {
        user,
      },
      'Token refreshed successfully'
    );

    // Set new access token cookie
    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return unauthorizedResponse();
  }
}

