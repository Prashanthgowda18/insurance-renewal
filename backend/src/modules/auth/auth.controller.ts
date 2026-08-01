import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../utils/db';
import { logActivity } from '../logs/audit.service';
import { authLogger, errorLogger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_me';

// Zod Input Validations
const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
});

export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !password) {
      res.status(400).json({ error: { message: 'Username and password are required' } });
      return;
    }

    const userEmail = email && email.includes('@') ? email.toLowerCase().trim() : `${name.toLowerCase().replace(/\s+/g, '')}@agency.com`;

    const existing = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: userEmail },
          { name: { equals: name } },
        ],
      },
    });

    if (existing) {
      res.status(400).json({ error: { message: 'An account with this username or email already exists.' } });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: {
        name,
        email: userEmail,
        passwordHash,
        role: 'admin',
      },
    });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await logActivity(
      admin.id,
      'create',
      'auth',
      `Registered new admin account: ${admin.name}`,
      req.ip
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error: any) {
    errorLogger.error('Register controller execution failed', error);
    res.status(500).json({ error: { message: error.message || 'Internal server error' } });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    const identifier = (username || email || '').trim();

    if (!identifier || !password) {
      res.status(400).json({ error: { message: 'Username and password are required' } });
      return;
    }

    // Fetch user details by email or name
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { name: { equals: identifier } },
        ],
      },
    });

    if (!admin) {
      authLogger.warn(`Failed login attempt: username not found (${identifier})`);
      res.status(401).json({ error: { message: 'Invalid username or password' } });
      return;
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      authLogger.warn(`Failed login attempt: incorrect password (${identifier})`);
      res.status(401).json({ error: { message: 'Invalid username or password' } });
      return;
    }

    // Generate JWT Access Token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Write audit log entry
    await logActivity(
      admin.id,
      'login',
      'auth',
      'Administrator logged in successfully',
      req.ip
    );

    authLogger.info(`Successful login: ${admin.email}`);

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error: any) {
    errorLogger.error('Login controller execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

export const forgotPassword = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Forgot password is a Version 1 stub, to be wired with template link delivery
    res.status(200).json({
      message: 'Password reset link sent (mock). If this account exists, an email has been sent.',
    });
  } catch (error: any) {
    errorLogger.error('Forgot password controller execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }

    const validationResult = changePasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: {
          message: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Retrieve active database entry to verify current password
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
    });

    if (!admin) {
      res.status(404).json({ error: { message: 'Administrator account not found' } });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isPasswordValid) {
      res.status(400).json({ error: { message: 'Current password provided is incorrect' } });
      return;
    }

    // Update password hash
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash: newPasswordHash },
    });

    // Write audit log entry
    await logActivity(
      admin.id,
      'update',
      'auth',
      'Administrator changed their account password',
      req.ip
    );

    authLogger.info(`Password changed successfully for admin: ${admin.email}`);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error: any) {
    errorLogger.error('Change password controller execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};
