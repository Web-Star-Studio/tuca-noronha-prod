import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}

// Simple API key authentication
// You can replace this with JWT or other auth methods
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedApiKey = process.env.API_KEY;

  // Skip auth in test mode for easier development
  if (process.env.NODE_ENV === 'development' && !expectedApiKey) {
    logger.warn('API_KEY not set, skipping authentication (dev mode only)');
    req.user = { id: 'dev-user', role: 'admin' };
    return next();
  }

  if (!apiKey) {
    logger.warn('Missing API key in request');
    return res.status(401).json({ error: 'API key required' });
  }

  if (apiKey !== expectedApiKey) {
    logger.warn('Invalid API key attempt');
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // You can decode JWT here and extract user info if needed
  // For now, we'll just set a basic user object
  req.user = {
    id: 'api-user',
    role: 'service'
  };

  next();
};

// Optional: Role-based access control
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (roles.length && !roles.includes(req.user.role || '')) {
      logger.warn('Insufficient permissions', { 
        userId: req.user.id, 
        role: req.user.role,
        requiredRoles: roles 
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
