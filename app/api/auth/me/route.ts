import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import { getUserFromToken } from '@/lib/auth';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies using Next.js cookies() API
    const cookieStore = cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      return unauthorizedResponse();
    }

    // Verify and get user
    const user = await getUserFromToken(token);

    if (!user) {
      return unauthorizedResponse();
    }

    return successResponse(user, 'User retrieved successfully');
  } catch (error: any) {
    console.error('Get user error:', error);
    return unauthorizedResponse();
  }
}

