import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../repositories/db';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  compareToken
} from '../utils/jwt';
import { verifyGoogleIdToken } from '../services/googleAuthService';
import { generateCryptographicOTP, sendMobileSMS } from '../services/smsService';
import { emailService } from '../services/emailService';
import { AuthenticatedRequest } from '../middleware/auth';
import { normalizePhone, phoneLookupVariants } from '../utils/phone';

/**
 * 1. Real Google OAuth Authentication Endpoint
 * Body: { idToken, email, name, googleId, avatar, age, country, currency }
 */
export const googleLogin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { idToken, token, age, country, currency } = req.body;
    const rawToken = idToken || token;
    const userAgent = (req.headers['user-agent'] as string) || 'Unknown Browser';
    const device = userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    // Fail closed: token is mandatory. We never trust client-supplied user data.
    if (!rawToken) {
      return res.status(401).json({ error: 'Google OAuth ID token is required' });
    }

    // Verify the token cryptographically against Google's servers.
    // Any failure (expired, invalid signature, wrong audience) results in 401.
    let googleUser;
    try {
      googleUser = await verifyGoogleIdToken(rawToken);
    } catch (err: any) {
      console.warn('[Google Auth] Token verification failed:', err.message);
      return res.status(401).json({ error: 'Invalid Google session. Please sign in with your Google account again.' });
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId: googleUser.googleId }, { email: googleUser.email }],
        softDelete: false
      },
      include: { household: true }
    });

    let household;
    let isNewRegistration = false;

    if (!user) {
      isNewRegistration = true;
      const inviteCode = 'HM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      household = await prisma.household.create({
        data: {
          name: googleUser.name ? `${googleUser.name}'s Home` : 'Home Residence',
          inviteCode
        }
      });

      await prisma.setting.create({
        data: {
          householdId: household.id,
          country: country || 'IN',
          currency: currency || 'INR',
          timeZone: 'Asia/Kolkata',
          theme: 'dark'
        }
      });

      await prisma.dashboardConfig.create({
        data: {
          householdId: household.id,
          layout: JSON.stringify({ widgets: ['expenses', 'bills', 'groceries', 'appliances'] })
        }
      });

      user = await prisma.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          age: age ? parseInt(age, 10) : undefined,
          provider: 'GOOGLE',
          googleId: googleUser.googleId,
          avatar: googleUser.avatar,
          role: 'OWNER',
          householdId: household.id,
          isVerified: googleUser.emailVerified,
          isActive: true,
          lastLogin: new Date()
        },
        include: { household: true }
      });
    } else {
      household = user.household;
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date(),
          name: (googleUser.name && googleUser.name !== googleUser.email) ? googleUser.name : user.name,
          avatar: googleUser.avatar || user.avatar
        },
        include: { household: true }
      });

      // Ensure household setting has INR and IN if not yet configured
      const existingSetting = await prisma.setting.findFirst({ where: { householdId: household.id } });
      if (existingSetting && existingSetting.currency === 'USD') {
        await prisma.setting.update({
          where: { id: existingSetting.id },
          data: { currency: 'INR', country: 'IN', timeZone: 'Asia/Kolkata' }
        });
      }
    }

    const payload = {
      userId: user.id,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber || undefined,
      role: user.role,
      householdId: user.householdId
    };

    const accessToken = generateAccessToken(payload);
    const refreshTokenStr = generateRefreshToken(payload);
    const hashedRefresh = await hashToken(refreshTokenStr);

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashedRefresh,
        userId: user.id,
        device,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      isNewRegistration,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        age: user.age,
        provider: user.provider,
        avatar: user.avatar,
        role: user.role,
        householdId: user.householdId,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      },
      household,
      accessToken,
      refreshToken: refreshTokenStr
    });
  } catch (err: any) {
    console.error('[Auth] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

/**
 * 2. Email & Password Manual Registration Endpoint
 * Body: { name, email, password, country, currency }
 */
export const register = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, country, currency } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findFirst({
      where: { email: cleanEmail, softDelete: false }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in instead.' });
    }

    const userAgent = (req.headers['user-agent'] as string) || 'Unknown Browser';
    const device = userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const inviteCode = 'HM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const household = await prisma.household.create({
      data: {
        name: `${name}'s Home`,
        inviteCode
      }
    });

    await prisma.setting.create({
      data: {
        householdId: household.id,
        country: country || 'IN',
        currency: currency || 'INR',
        theme: 'dark'
      }
    });

    await prisma.dashboardConfig.create({
      data: {
        householdId: household.id,
        layout: JSON.stringify({ widgets: ['expenses', 'bills', 'groceries', 'appliances'] })
      }
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`;

    const user = await prisma.user.create({
      data: {
        name,
        email: cleanEmail,
        passwordHash,
        provider: 'PASSWORD',
        avatar,
        role: 'OWNER',
        householdId: household.id,
        isVerified: true,
        isActive: true,
        lastLogin: new Date()
      },
      include: { household: true }
    });

    const payload = {
      userId: user.id,
      email: user.email || undefined,
      role: user.role,
      householdId: user.householdId
    };

    const accessToken = generateAccessToken(payload);
    const refreshTokenStr = generateRefreshToken(payload);
    const hashedRefresh = await hashToken(refreshTokenStr);

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashedRefresh,
        userId: user.id,
        device,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.status(201).json({
      isNewRegistration: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        age: user.age,
        provider: user.provider,
        avatar: user.avatar,
        role: user.role,
        householdId: user.householdId,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      },
      household,
      accessToken,
      refreshToken: refreshTokenStr
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
};

/**
 * 3. Email & Password Manual Login Endpoint
 * Body: { email, password }
 */
export const login = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail, softDelete: false },
      include: { household: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'No account found with this email. Please sign up first.' });
    }

    if (user.passwordHash) {
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password. Please check and try again.' });
      }
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });
    }

    const userAgent = (req.headers['user-agent'] as string) || 'Unknown Browser';
    const device = userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
      include: { household: true }
    });

    const payload = {
      userId: updatedUser.id,
      email: updatedUser.email || undefined,
      role: updatedUser.role,
      householdId: updatedUser.householdId
    };

    const accessToken = generateAccessToken(payload);
    const refreshTokenStr = generateRefreshToken(payload);
    const hashedRefresh = await hashToken(refreshTokenStr);

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashedRefresh,
        userId: updatedUser.id,
        device,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      isNewRegistration: false,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        age: updatedUser.age,
        provider: updatedUser.provider,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        householdId: updatedUser.householdId,
        isVerified: updatedUser.isVerified,
        isActive: updatedUser.isActive,
        lastLogin: updatedUser.lastLogin
      },
      household: updatedUser.household,
      accessToken,
      refreshToken: refreshTokenStr
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
};

/**
 * 4. Send Mobile Phone SMS OTP Endpoint
 */
export const requestPhoneOTP = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number is required' });

    const identifier = normalizePhone(phoneNumber);
    if (!identifier) {
      return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });
    }
    const realOtp = generateCryptographicOTP();
    const otpHash = await bcrypt.hash(realOtp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const existingOTP = await prisma.oTPVerification.findUnique({ where: { identifier } });
    if (existingOTP && existingOTP.createdAt.getTime() > Date.now() - 20 * 1000) {
      const waitSecs = Math.ceil((existingOTP.createdAt.getTime() + 20 * 1000 - Date.now()) / 1000);
      return res.status(429).json({ error: `Please wait ${waitSecs} seconds before requesting another SMS OTP.` });
    }

    await prisma.oTPVerification.upsert({
      where: { identifier },
      update: {
        phoneNumber: identifier,
        otpHash,
        attempts: 0,
        expiresAt,
        createdAt: new Date()
      },
      create: {
        identifier,
        phoneNumber: identifier,
        otpHash,
        attempts: 0,
        expiresAt
      }
    });

    const smsResult = await sendMobileSMS(identifier, realOtp);

    if (!smsResult.success) {
      // Roll back the stored OTP record — do not claim success if delivery failed.
      await prisma.oTPVerification.delete({ where: { identifier } }).catch(() => {});
      return res.status(503).json({ error: 'Failed to send verification code. Please try again in a moment.' });
    }

    res.json({
      success: true,
      message: `SMS verification code sent to ${identifier}. Valid for 5 minutes.`,
      provider: smsResult.provider
    });
  } catch (err: any) {
    console.error('[requestPhoneOTP] Error:', err.message);
    res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
};

/**
 * 3. Verify Mobile Phone OTP Endpoint
 */
export const verifyPhoneOTP = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { phoneNumber, otp, name, age, country, currency } = req.body;
    const userAgent = (req.headers['user-agent'] as string) || 'Unknown Mobile Browser';
    const device = userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP code are required' });
    }

    const identifier = normalizePhone(phoneNumber);
    if (!identifier) {
      return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });
    }
    const otpRecord = await prisma.oTPVerification.findUnique({ where: { identifier } });

    if (!otpRecord) {
      return res.status(400).json({ error: 'No OTP request found for this phone number. Please request a new OTP.' });
    }

    if (otpRecord.expiresAt < new Date()) {
      await prisma.oTPVerification.delete({ where: { identifier } }).catch(() => {});
      return res.status(400).json({ error: 'OTP has expired after 5 minutes. Please request a new OTP.' });
    }

    if (otpRecord.attempts >= 5) {
      await prisma.oTPVerification.delete({ where: { identifier } }).catch(() => {});
      return res.status(429).json({ error: 'Maximum 5 verification attempts exceeded. Please request a new OTP.' });
    }

    const isValidOtp = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isValidOtp) {
      await prisma.oTPVerification.update({
        where: { identifier },
        data: { attempts: { increment: 1 } }
      });
      return res.status(400).json({ error: `Invalid OTP code. ${4 - otpRecord.attempts} attempts remaining.` });
    }

    await prisma.oTPVerification.delete({ where: { identifier } }).catch(() => {});

    const currentUserId = req.user?.userId;
    let user;
    let household;
    let isNewRegistration = false;

    if (currentUserId) {
      // User is authenticated (e.g. from Onboarding modal or Profile), link phone number directly
      const existingWithPhone = await prisma.user.findFirst({
        where: { phoneNumber: { in: phoneLookupVariants(identifier) }, NOT: { id: currentUserId } }
      });
      if (existingWithPhone) {
        // Clear phone from duplicate record to prevent constraint conflict
        await prisma.user.update({
          where: { id: existingWithPhone.id },
          data: { phoneNumber: null }
        }).catch(() => {});
      }

      user = await prisma.user.update({
        where: { id: currentUserId },
        data: {
          phoneNumber: identifier,
          isVerified: true,
          lastLogin: new Date()
        },
        include: { household: true }
      });
      household = user.household;
    } else {
      user = await prisma.user.findFirst({
        where: { phoneNumber: { in: phoneLookupVariants(identifier) }, softDelete: false },
        include: { household: true }
      });

      if (!user) {
        isNewRegistration = true;
        const inviteCode = 'HM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        household = await prisma.household.create({
          data: {
            name: name ? `${name}'s Home` : 'My Household',
            inviteCode
          }
        });

        await prisma.setting.create({
          data: {
            householdId: household.id,
            country: country || 'IN',
            currency: currency || 'INR',
            theme: 'dark'
          }
        });

        await prisma.dashboardConfig.create({
          data: {
            householdId: household.id,
            layout: JSON.stringify({ widgets: ['expenses', 'bills', 'groceries', 'appliances'] })
          }
        });

        user = await prisma.user.create({
          data: {
            name: name || 'Household Owner',
            phoneNumber: identifier,
            age: age ? parseInt(age, 10) : undefined,
            provider: 'PHONE',
            role: 'OWNER',
            householdId: household.id,
            isVerified: true,
            isActive: true,
            lastLogin: new Date()
          },
          include: { household: true }
        });
      } else {
        household = user.household;
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });
      }
    }

    const payload = {
      userId: user.id,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber || undefined,
      role: user.role,
      householdId: user.householdId
    };

    const accessToken = generateAccessToken(payload);
    const refreshTokenStr = generateRefreshToken(payload);
    const hashedRefresh = await hashToken(refreshTokenStr);

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashedRefresh,
        userId: user.id,
        device,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      isNewRegistration,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        age: user.age,
        provider: user.provider,
        avatar: user.avatar,
        role: user.role,
        householdId: user.householdId,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      },
      household,
      accessToken,
      refreshToken: refreshTokenStr
    });
  } catch (err: any) {
    console.error('[verifyPhoneOTP] Error:', err.message);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

/**
 * 3.1 Send Email Verification OTP Endpoint
 */
export const requestEmailOTP = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email address is required' });

    const identifier = email.toLowerCase().trim();
    const realOtp = generateCryptographicOTP();
    const otpHash = await bcrypt.hash(realOtp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const existingOTP = await prisma.oTPVerification.findUnique({ where: { identifier } });
    if (existingOTP && existingOTP.createdAt.getTime() > Date.now() - 20 * 1000) {
      const waitSecs = Math.ceil((existingOTP.createdAt.getTime() + 20 * 1000 - Date.now()) / 1000);
      return res.status(429).json({ error: `Please wait ${waitSecs} seconds before requesting another Email OTP.` });
    }

    await prisma.oTPVerification.upsert({
      where: { identifier },
      update: {
        email: identifier,
        otpHash,
        attempts: 0,
        expiresAt,
        createdAt: new Date()
      },
      create: {
        identifier,
        email: identifier,
        otpHash,
        attempts: 0,
        expiresAt
      }
    });

    // Log OTP dispatch first (so OTP code is never in logs — only destination)
    const emailResult = await emailService.sendOTP(identifier, realOtp);

    if (!emailResult.success) {
      // Roll back the stored OTP record — do not claim success if delivery failed.
      await prisma.oTPVerification.delete({ where: { identifier } }).catch(() => {});
      return res.status(503).json({ error: 'Failed to send verification code. Please check your email configuration.' });
    }

    res.json({
      success: true,
      message: `Verification code sent to ${identifier}. Valid for 10 minutes.`,
    });
  } catch (err: any) {
    console.error('[requestEmailOTP] Error:', err.message);
    res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
};

/**
 * 3.2 Verify Email OTP Endpoint
 */
export const verifyEmailOTP = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, otp, name, age, country, currency } = req.body;
    const userAgent = (req.headers['user-agent'] as string) || 'Unknown Browser';
    const device = userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Browser';
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required' });
    }

    const identifier = email.toLowerCase().trim();
    const otpRecord = await prisma.oTPVerification.findUnique({ where: { identifier } });

    if (!otpRecord) {
      return res.status(400).json({ error: 'No OTP request found for this email. Please request a new OTP.' });
    }

    if (otpRecord.expiresAt < new Date()) {
      await prisma.oTPVerification.delete({ where: { identifier } }).catch(() => {});
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    if (otpRecord.attempts >= 5) {
      await prisma.oTPVerification.delete({ where: { identifier } }).catch(() => {});
      return res.status(429).json({ error: 'Maximum 5 verification attempts exceeded. Please request a new OTP.' });
    }

    const isValidOtp = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isValidOtp) {
      await prisma.oTPVerification.update({
        where: { identifier },
        data: { attempts: { increment: 1 } }
      });
      return res.status(400).json({ error: `Invalid OTP code. ${4 - otpRecord.attempts} attempts remaining.` });
    }

    await prisma.oTPVerification.delete({ where: { identifier } }).catch(() => {});

    let user = await prisma.user.findFirst({
      where: { email: identifier, softDelete: false },
      include: { household: true }
    });

    let household;
    let isNewRegistration = false;

    if (!user) {
      isNewRegistration = true;
      const inviteCode = 'HM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      household = await prisma.household.create({
        data: {
          name: name ? `${name}'s Home` : 'My Household',
          inviteCode
        }
      });

      await prisma.setting.create({
        data: {
          householdId: household.id,
          country: country || 'IN',
          currency: currency || 'INR',
          theme: 'dark'
        }
      });

      await prisma.dashboardConfig.create({
        data: {
          householdId: household.id,
          layout: JSON.stringify({ widgets: ['expenses', 'bills', 'groceries', 'appliances'] })
        }
      });

      user = await prisma.user.create({
        data: {
          name: name || identifier.split('@')[0],
          email: identifier,
          age: age ? parseInt(age, 10) : undefined,
          provider: 'EMAIL',
          role: 'OWNER',
          householdId: household.id,
          isVerified: true,
          isActive: true,
          lastLogin: new Date()
        },
        include: { household: true }
      });
    } else {
      household = user.household;
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
    }

    const payload = {
      userId: user.id,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber || undefined,
      role: user.role,
      householdId: user.householdId
    };

    const accessToken = generateAccessToken(payload);
    const refreshTokenStr = generateRefreshToken(payload);
    const hashedRefresh = await hashToken(refreshTokenStr);

    await prisma.refreshToken.create({
      data: {
        tokenHash: hashedRefresh,
        userId: user.id,
        device,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      isNewRegistration,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        age: user.age,
        provider: user.provider,
        avatar: user.avatar,
        role: user.role,
        householdId: user.householdId,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      },
      household,
      accessToken,
      refreshToken: refreshTokenStr
    });
  } catch (err: any) {
    console.error('[Auth] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

/**
 * 4. Update Profile & Onboarding Data Endpoint
 * Body: { name, age, country, currency }
 */
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const householdId = req.user?.householdId;
    if (!userId || !householdId) return res.status(401).json({ error: 'Unauthenticated' });

    const { name, age, email, phoneNumber, avatar, country, currency } = req.body;

    if (phoneNumber) {
      const conflict = await prisma.user.findFirst({
        where: { phoneNumber, NOT: { id: userId } }
      });
      if (conflict) {
        await prisma.user.update({
          where: { id: conflict.id },
          data: { phoneNumber: null }
        }).catch(() => {});
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name !== undefined ? name : undefined,
        age: age ? parseInt(age, 10) : undefined,
        email: email !== undefined ? email : undefined,
        phoneNumber: phoneNumber !== undefined ? phoneNumber : undefined,
        avatar: avatar !== undefined ? avatar : undefined
      },
      include: { household: true }
    });

    if (country || currency) {
      let setting = await prisma.setting.findFirst({ where: { householdId, softDelete: false } });
      if (setting) {
        await prisma.setting.update({
          where: { id: setting.id },
          data: {
            country: country || setting.country,
            currency: currency || setting.currency
          }
        });
      }
    }

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        age: updatedUser.age,
        avatar: updatedUser.avatar,
        provider: updatedUser.provider,
        role: updatedUser.role,
        householdId: updatedUser.householdId,
        lastLogin: updatedUser.lastLogin
      }
    });
  } catch (err: any) {
    console.error('[Auth] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

/**
 * 5. Token Rotation Endpoint
 */
export const refresh = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = verifyRefreshToken(refreshToken);

    const userTokens = await prisma.refreshToken.findMany({
      where: {
        userId: decoded.userId,
        expiresAt: { gt: new Date() }
      }
    });

    let matchedTokenRecord = null;
    for (const record of userTokens) {
      const isMatch = await compareToken(refreshToken, record.tokenHash);
      if (isMatch) {
        matchedTokenRecord = record;
        break;
      }
    }

    if (!matchedTokenRecord) {
      return res.status(403).json({ error: 'Invalid or revoked refresh token' });
    }

    await prisma.refreshToken.delete({ where: { id: matchedTokenRecord.id } });

    const payload = {
      userId: decoded.userId,
      email: decoded.email,
      phoneNumber: decoded.phoneNumber,
      role: decoded.role,
      householdId: decoded.householdId
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshTokenStr = generateRefreshToken(payload);
    const newHashedRefresh = await hashToken(newRefreshTokenStr);

    await prisma.refreshToken.create({
      data: {
        tokenHash: newHashedRefresh,
        userId: decoded.userId,
        device: matchedTokenRecord.device,
        ipAddress: matchedTokenRecord.ipAddress,
        userAgent: matchedTokenRecord.userAgent,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenStr
    });
  } catch (err: any) {
    res.status(403).json({ error: 'Expired or invalid refresh token' });
  }
};

/**
 * 6. Logout Single Device Session
 */
export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      try {
        const decoded = verifyRefreshToken(refreshToken);
        const userTokens = await prisma.refreshToken.findMany({ where: { userId: decoded.userId } });

        for (const record of userTokens) {
          const isMatch = await compareToken(refreshToken, record.tokenHash);
          if (isMatch) {
            await prisma.refreshToken.delete({ where: { id: record.id } });
            break;
          }
        }
      } catch (e) {}
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    console.error('[Auth] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

/**
 * 7. Logout All Device Sessions
 */
export const logoutAllDevices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated request' });

    await prisma.refreshToken.deleteMany({ where: { userId } });

    await prisma.auditLog.create({
      data: {
        householdId: req.user?.householdId || '',
        action: 'LOGOUT_ALL',
        entity: 'User',
        details: 'User invalidated all active device refresh tokens',
        performedBy: userId
      }
    });

    res.json({ success: true, message: 'Successfully logged out from all active device sessions' });
  } catch (err: any) {
    console.error('[Auth] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

/**
 * 8. Get Authenticated User Profile
 */
export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const user = await prisma.user.findFirst({
      where: { id: userId, softDelete: false },
      include: {
        household: {
          include: {
            members: {
              where: { softDelete: false },
              select: { id: true, name: true, email: true, phoneNumber: true, age: true, role: true, avatar: true }
            }
          }
        }
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const activeSessionsCount = await prisma.refreshToken.count({
      where: { userId, expiresAt: { gt: new Date() } }
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        age: user.age,
        provider: user.provider,
        avatar: user.avatar,
        role: user.role,
        householdId: user.householdId,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      },
      household: user.household,
      activeSessionsCount
    });
  } catch (err: any) {
    console.error('[Auth] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};
