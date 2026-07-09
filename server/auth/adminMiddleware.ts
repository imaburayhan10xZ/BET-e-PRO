import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware.js';
import { readDb } from '../db.js';

/**
 * Middleware to authorize any admin role (admin, primary_admin, mod).
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  const allowedRoles = ['admin', 'primary_admin', 'mod'];
  if (!allowedRoles.includes(req.user.role || '')) {
    return res.status(403).json({ error: 'Access denied: Admin privileges required.' });
  }

  next();
}

/**
 * Middleware to authorize primary administrative roles (primary_admin).
 */
export function requirePrimaryAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  if (req.user.role !== 'primary_admin') {
    return res.status(403).json({ error: 'Access denied: Primary Admin access required.' });
  }

  next();
}

/**
 * Middleware to check specific tab-level permission for secondary admins/mods.
 */
export function requireTabAccess(tabName: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    // Primary admin always has bypass to all tabs
    if (req.user.role === 'primary_admin') {
      return next();
    }

    const db = readDb();
    const dbUser = db.users.find(u => u.id === req.user!.id);
    if (!dbUser) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const allowedTabs = dbUser.allowedTabs || [];
    if (!allowedTabs.includes(tabName)) {
      return res.status(403).json({
        error: `Access denied. You do not have permission for the '${tabName}' section.`
      });
    }

    next();
  };
}
