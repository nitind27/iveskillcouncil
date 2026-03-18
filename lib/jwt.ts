import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-token-secret-change-in-production';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-change-in-production';

export interface TokenPayload {
  userId: string;
  roleId: number;
  franchiseId?: string;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

// Generate access token (15 minutes)
export function generateAccessToken(payload: TokenPayload): string {
  if (!ACCESS_TOKEN_SECRET || ACCESS_TOKEN_SECRET === 'your-access-token-secret-change-in-production') {
    console.error("❌ JWT_ACCESS_SECRET is not set or using default value!");
    throw new Error("JWT_ACCESS_SECRET is not configured properly");
  }
  
  const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: '15m',
  });
  
  console.log("✅ Access token generated successfully");
  return token;
}

// Generate refresh token (7 days)
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: '7d',
  });
}

// Verify access token
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    if (!ACCESS_TOKEN_SECRET || ACCESS_TOKEN_SECRET === 'your-access-token-secret-change-in-production') {
      console.error("❌ JWT_ACCESS_SECRET is not set or using default value!");
      return null;
    }
    
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
    return decoded;
  } catch (error: any) {
    // Log specific error for debugging
    if (error.name === 'JsonWebTokenError') {
      console.error("❌ JWT Error: Invalid token signature");
    } else if (error.name === 'TokenExpiredError') {
      console.error("❌ JWT Error: Token expired");
    } else if (error.name === 'NotBeforeError') {
      console.error("❌ JWT Error: Token not active yet");
    } else {
      console.error("❌ JWT Verification Error:", error.message);
    }
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshTokenPayload;
  } catch (error) {
    return null;
  }
}

// Get token from request headers
export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Get token from cookies
export function getTokenFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies['accessToken'] || null;
}

