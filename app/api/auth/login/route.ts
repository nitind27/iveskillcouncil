import { NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { successResponse, errorResponse, rateLimitResponse } from '@/lib/api-response';
import { rateLimiter, rateLimitConfig, getClientIdentifier } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for auth endpoints
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.auth.maxRequests, rateLimitConfig.auth.windowMs)) {
      return rateLimitResponse();
    }

    const body = await request.json();
    const { email, password } = body;

    console.log('🔐 Login attempt for:', email);

    // Validate input
    if (!email || !password) {
      console.error('❌ Missing email or password');
      return errorResponse('Email and password are required', 400);
    }

    // Authenticate user
    const authResult = await authenticateUser({ email, password });

    if (!authResult) {
      console.error('❌ Authentication failed for:', email);
      return errorResponse('Invalid email or password', 401);
    }

    console.log('✅ Authentication successful for:', email);
    
    // Verify JWT secret is set
    if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET === 'your-access-token-secret-change-in-production') {
      console.error('❌ JWT_ACCESS_SECRET is not set or using default value!');
      return errorResponse('Server configuration error', 500);
    }

    // Create response with tokens in HTTP-only cookies
    const response = successResponse(
      {
        user: authResult.user,
      },
      'Login successful'
    );

    // Set HTTP-only cookies with proper settings
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };

    // Set access token cookie
    response.cookies.set('accessToken', authResult.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60, // 15 minutes
    });

    // Set refresh token cookie
    response.cookies.set('refreshToken', authResult.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.log('✅ Cookies set for user:', email);
    console.log('📝 Cookie settings:', {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: '15m (access), 7d (refresh)'
    });
    
    return response;
  } catch (error: any) {
    console.error('❌ Login API error:', error);
    return errorResponse(error.message || 'Login failed', 500);
  }
}

