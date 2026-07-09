import { Request, Response, NextFunction } from 'express';
import { ensureDbLoaded, readDb } from '../db.js';
import { verifyFirebaseIdToken } from './verifyToken.js';
import { User } from '../../src/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Middleware to authenticate requests using a Firebase ID Token.
 * This is 100% serverless-safe, cold-start compatible, and verifies real Google signatures.
 */
export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required (Bearer token)' });
    }

    // 1. Verify the ID token directly via Google's secure Firebase API
    const decoded = await verifyFirebaseIdToken(token);
    if (!decoded || !decoded.uid) {
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    // 2. Ensure database is loaded (this is optimized & cached)
    const db = await ensureDbLoaded(req.path);
    const user = db.users.find(u => u.id === decoded.uid);

    if (!user) {
      return res.status(404).json({ error: 'User account profile not found in database' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'This account has been suspended by an administrator.' });
    }

    // 3. Attach full profile to req.user for subsequent middlewares and handlers
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email || decoded.email,
      phone: user.phone,
      role: user.role,
      balance: user.balance,
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      vipLevel: user.vipLevel,
      vipPoints: user.vipPoints,
      isBlocked: user.isBlocked,
      avatarUrl: user.avatarUrl,
      fullName: user.fullName,
      createdAt: user.createdAt
    };

    next();
  } catch (err: any) {
    console.error('[AUTH-MIDDLEWARE] Authentication error:', err);
    return res.status(401).json({ error: err.message || 'Authentication failed.' });
  }
}
