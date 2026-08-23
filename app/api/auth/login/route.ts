import { NextRequest } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { successResponse, errorResponse, rateLimitResponse } from '@/lib/api-response';
import { rateLimiter, rateLimitConfig, rateLimitKey } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for auth endpoints
    const clientId = rateLimitKey("login", request);
    if (!rateLimiter.check(clientId, rateLimitConfig.login.maxRequests, rateLimitConfig.login.windowMs)) {
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
    let authResult;
    try {
      authResult = await authenticateUser({ email, password });
    } catch (authError: unknown) {
      const msg = authError instanceof Error ? authError.message : String(authError);
      const name = (authError as { name?: string })?.name;
      if (
        msg === 'DATABASE_UNAVAILABLE' ||
        name === 'DatabaseUnavailableError' ||
        msg.includes("Can't reach database server") ||
        msg.includes('ECONNREFUSED')
      ) {
        console.error('❌ Database unreachable during login for:', email);
        return errorResponse(
          'Database unreachable. Run npm run dev (starts DB proxy on port 3307), wait ~5s, then retry.',
          503
        );
      }
      throw authError;
    }

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
    const { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE, getAuthCookieOptions } = await import('@/lib/auth-cookies');
    const cookieOptions = getAuthCookieOptions();

    response.cookies.set('accessToken', authResult.accessToken, {
      ...cookieOptions,
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    response.cookies.set('refreshToken', authResult.refreshToken, {
      ...cookieOptions,
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    return response;
  } catch (error: any) {
    console.error('❌ Login API error:', error);
    return errorResponse(error.message || 'Login failed', 500);
  }
}

