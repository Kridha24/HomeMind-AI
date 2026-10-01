import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';

export interface TokenPayload {
  userId: string;
  email?: string;
  phoneNumber?: string;
  role: string;
  householdId: string;
}

/**
 * Generates a 15-minute Access Token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '15m' });
};

/**
 * Generates a 30-day Refresh Token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '30d' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
};

/**
 * Hashes a refresh token string for secure database storage
 */
export const hashToken = async (token: string): Promise<string> => {
  return bcrypt.hash(token, 10);
};

/**
 * Compares a raw token string with a stored bcrypt hash
 */
export const compareToken = async (rawToken: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(rawToken, hash);
};
