import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../utils/db';
import { errorLogger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me';

// Verify JWT from Authorization Header
export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: { message: 'Authentication token required (Bearer token)' } });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token signature and expiration
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };

    // Fetch administrative details from database
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!admin) {
      res.status(401).json({ error: { message: 'Admin account not found or has been disabled' } });
      return;
    }

    // Attach admin details to request context
    req.admin = admin;
    next();
  } catch (error: any) {
    errorLogger.error('JWT authentication middleware check failed', error);
    
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: { message: 'Authentication token has expired, please log in again' } });
      return;
    }
    
    res.status(401).json({ error: { message: 'Invalid authentication token signature' } });
  }
};

// Role check middleware guard
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ error: { message: 'Authentication required' } });
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      res.status(403).json({ error: { message: 'Access denied: insufficient permissions' } });
      return;
    }

    next();
  };
};
