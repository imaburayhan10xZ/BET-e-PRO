/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { readDb } from './db';
import { User } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'betepro_super_secret_jwt_passphrase';

// Base64Url helper
function base64url(str: string): string {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function signJwt(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const headerStr = base64url(JSON.stringify(header));
  const payloadStr = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerStr}.${payloadStr}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  return `${headerStr}.${payloadStr}.${signature}`;
}

export function verifyJwt(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [headerStr, payloadStr, signature] = parts;
    
    // Validate signature
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerStr}.${payloadStr}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
      
    if (signature !== expectedSig) return null;
    
    const decodedPayload = Buffer.from(payloadStr, 'base64').toString('utf8');
    return JSON.parse(decodedPayload);
  } catch (error) {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Middleware to authenticate user with JWT
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>
  
  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }
  
  const payload = verifyJwt(token);
  if (!payload || !payload.id) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }
  
  const db = readDb();
  const user = db.users.find(u => u.id === payload.id);
  
  if (!user) {
    res.status(404).json({ error: 'User account not found' });
    return;
  }
  
  if (user.isBlocked) {
    res.status(403).json({ error: 'This account has been suspended by an administrator.' });
    return;
  }
  
  req.user = {
    id: user.id,
    username: user.username,
    email: user.email,
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
}

// Middleware to authorize admin/mod/primary_admin
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'mod' && req.user.role !== 'primary_admin')) {
    res.status(403).json({ error: 'Admin privileges required' });
    return;
  }
  next();
}

// Middleware to authorize primary admin only
export function requirePrimaryAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'primary_admin') {
    res.status(403).json({ error: 'Primary Admin access required' });
    return;
  }
  next();
}

// Middleware to check specific tab-level permission for secondary admins/mods
export function requireTabAccess(tabName: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (req.user.role === 'primary_admin') {
      next();
      return;
    }
    const db = readDb();
    const dbUser = db.users.find(u => u.id === req.user!.id);
    if (!dbUser) {
      res.status(404).json({ error: 'User account not found' });
      return;
    }
    const allowedTabs = dbUser.allowedTabs || [];
    if (!allowedTabs.includes(tabName)) {
      res.status(403).json({ error: `Access denied. You do not have permission for the '${tabName}' section.` });
      return;
    }
    next();
  };
}
