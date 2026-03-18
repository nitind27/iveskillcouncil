import { prisma } from './prisma';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, type TokenPayload } from './jwt';
import bcrypt from 'bcryptjs';
import { getEffectivePermissions } from './get-effective-permissions';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    roleId: number;
    roleName: string;
    franchiseId?: string;
    permissions: string[];
  };
  accessToken: string;
  refreshToken: string;
}

// Verify password
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Authenticate user
export async function authenticateUser(credentials: LoginCredentials): Promise<AuthResult | null> {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      include: {
        role: true,
      },
    });

    if (!user) {
      console.error('User not found:', credentials.email);
      return null;
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      console.error('User not active:', credentials.email, 'Status:', user.status);
      return null;
    }

    // Verify password
    const isValidPassword = await verifyPassword(credentials.password, user.password);
    if (!isValidPassword) {
      console.error('Invalid password for user:', credentials.email);
      return null;
    }

    const permissions = await getEffectivePermissions(
      user.roleId,
      user.franchiseId?.toString()
    );

    const tokenPayload: TokenPayload = {
      userId: user.id.toString(),
      roleId: user.roleId,
      franchiseId: user.franchiseId?.toString(),
      email: user.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({
      userId: user.id.toString(),
      tokenId: `${user.id}-${Date.now()}`,
    });

    return {
      user: {
        id: user.id.toString(),
        email: user.email,
        fullName: user.fullName,
        roleId: user.roleId,
        roleName: user.role.name,
        franchiseId: user.franchiseId?.toString(),
        permissions,
      },
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Get user from token
export async function getUserFromToken(token: string) {
  const payload = verifyAccessToken(token);
  if (!payload) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
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

    if (!user || user.status !== 'ACTIVE') {
      return null;
    }

    const permissions = await getEffectivePermissions(
      user.roleId,
      user.franchiseId?.toString()
    );

    return {
      id: user.id.toString(),
      email: user.email,
      fullName: user.fullName,
      roleId: user.roleId,
      roleName: user.role.name,
      franchiseId: user.franchiseId?.toString(),
      franchise: user.franchise ? {
        id: user.franchise.id.toString(),
        name: user.franchise.name,
        status: user.franchise.status,
      } : null,
      permissions,
    };
  } catch (error) {
    console.error('Get user from token error:', error);
    return null;
  }
}

