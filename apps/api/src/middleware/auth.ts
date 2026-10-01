import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../repositories/db';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload & { isVerified?: boolean; isActive?: boolean };
}

/**
 * Enterprise Authentication Middleware
 * Verifies 15-minute Bearer JWT Access Token and checks user activity status
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const payload = verifyAccessToken(token);

    // Verify user exists and is active in database
    const dbUser = await prisma.user.findFirst({
      where: { id: payload.userId, softDelete: false }
    });

    if (!dbUser || !dbUser.isActive) {
      return res.status(403).json({ error: 'Account is deactivated or invalid' });
    }

    req.user = {
      ...payload,
      role: dbUser.role,
      householdId: dbUser.householdId,
      isVerified: dbUser.isVerified,
      isActive: dbUser.isActive
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired access token', isExpired: true });
  }
};

/**
 * Household Context Attachment Middleware
 * Ensures householdId exists and attaches household details
 */
export const attachHousehold = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.householdId) {
    return res.status(400).json({ error: 'Household context missing from token' });
  }

  const household = await prisma.household.findFirst({
    where: { id: req.user.householdId, softDelete: false }
  });

  if (!household) {
    return res.status(404).json({ error: 'Household not found or inactive' });
  }

  next();
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces permissions: OWNER, ADMIN, MEMBER, GUEST
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated request' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Insufficient permissions. Required: ${allowedRoles.join(', ')}. Current: ${req.user.role}`
      });
    }

    next();
  };
};

/**
 * Session Validation Middleware
 */
export const validateSession = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.userId) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  next();
};
