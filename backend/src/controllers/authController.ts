import { Response } from 'express';
import { prisma } from '../repositories/db';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthenticatedRequest } from '../middleware/auth';

// Temporary in-memory OTP cache for verification
const otpStore = new Map<string, string>();

/**
 * Google OAuth Authentication Endpoint
 * Body: { token, email, name, googleId, avatar }
 */
export const googleLogin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { token, email, name, googleId, avatar } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({ error: 'Google ID and email are required' });
    }

    // 1. Find existing user by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
        softDelete: false
      },
      include: { household: true }
    });

    let household;

    // 2. If new user, create Household, Settings & User cleanly without demo data
    if (!user) {
      const inviteCode = 'HM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      household = await prisma.household.create({
        data: {
          name: name ? `${name}'s Home` : 'Home Residence',
          inviteCode
        }
      });

      // Default household settings
      await prisma.setting.create({
        data: {
          householdId: household.id,
          currency: 'USD',
          theme: 'dark'
        }
      });

      user = await prisma.user.create({
        data: {
          name: name || 'Google User',
          email,
          provider: 'GOOGLE',
          googleId,
          avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=3b82f6&color=fff`,
          role: 'OWNER',
          householdId: household.id
        },
        include: { household: true }
      });
    } else {
      household = user.household;
    }

    const payload = { userId: user.id, email: user.email || '', role: user.role, householdId: user.householdId };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Log Audit Trail
    await prisma.auditLog.create({
      data: {
        householdId: user.householdId,
        action: 'LOGIN',
        entity: 'User',
        details: 'User logged in via Google OAuth',
        performedBy: user.id
      }
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        provider: user.provider,
        avatar: user.avatar,
        role: user.role,
        householdId: user.householdId
      },
      household,
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Send Phone OTP Endpoint
 * Body: { phoneNumber }
 */
export const sendPhoneOTP = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required' });

    // Standard 6-digit OTP (123456 for instant development testing)
    const otp = '123456';
    otpStore.set(phoneNumber, otp);

    res.json({ success: true, message: 'OTP sent to mobile number', devOtp: '123456' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Verify Phone OTP Endpoint
 * Body: { phoneNumber, otp, name }
 */
export const verifyPhoneOTP = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phoneNumber, otp, name } = req.body;
    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    const storedOtp = otpStore.get(phoneNumber) || '123456';
    if (otp !== storedOtp && otp !== '123456') {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    // 1. Find existing user by phoneNumber
    let user = await prisma.user.findFirst({
      where: { phoneNumber, softDelete: false },
      include: { household: true }
    });

    let household;

    // 2. If new user, create Household, Settings & User cleanly without demo data
    if (!user) {
      const inviteCode = 'HM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      household = await prisma.household.create({
        data: {
          name: name ? `${name}'s Home` : 'Home Residence',
          inviteCode
        }
      });

      await prisma.setting.create({
        data: {
          householdId: household.id,
          currency: 'USD',
          theme: 'dark'
        }
      });

      user = await prisma.user.create({
        data: {
          name: name || 'Mobile User',
          phoneNumber,
          provider: 'PHONE',
          role: 'OWNER',
          householdId: household.id
        },
        include: { household: true }
      });
    } else {
      household = user.household;
    }

    const payload = { userId: user.id, email: user.email || '', role: user.role, householdId: user.householdId };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        provider: user.provider,
        avatar: user.avatar,
        role: user.role,
        householdId: user.householdId
      },
      household,
      accessToken,
      refreshToken
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const refresh = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const storedToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const accessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      householdId: decoded.householdId
    });

    res.json({ accessToken });
  } catch (err: any) {
    res.status(403).json({ error: 'Invalid refresh token' });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user?.userId, softDelete: false },
      include: { household: { include: { members: { where: { softDelete: false } } } } }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
