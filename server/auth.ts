/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request } from 'express';
import { User } from '../src/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Re-export new modularised middleware to preserve backwards-compatibility across the app
export { authenticateToken } from './auth/authMiddleware.js';
export { requireAdmin, requirePrimaryAdmin, requireTabAccess } from './auth/adminMiddleware.js';

// Placeholder signJwt for compat in case any old routes still try to import it, though unused in the new system
export function signJwt(payload: any): string {
  return '';
}

export function verifyJwt(token: string): any | null {
  return null;
}
