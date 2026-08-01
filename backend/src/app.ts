import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { prisma } from './utils/db';
import { apiLogger, errorLogger, systemLogger } from './utils/logger';
import authRoutes from './modules/auth/auth.routes';
import settingsRoutes from './modules/settings/settings.routes';
import customerRoutes from './modules/customers/customer.routes';
import vehicleRoutes from './modules/vehicles/vehicle.routes';
import policyRoutes from './modules/policies/policy.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Rate Limiting (relaxed for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Relaxed limit for dev & hot-reloading
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests, please try again later.' } },
});
app.use('/api/', limiter);

// Built-in Request Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    apiLogger.info({
      method: req.method,
      path: req.originalUrl || req.url,
      ip: req.ip,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Register Router Modules
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/policies', policyRoutes);

// Base API routes placeholder
app.get('/api', (_req: Request, res: Response) => {
  res.json({ message: 'Welcome to Shield Insurance Renewal System API.' });
});

// Standard Health Check API Route
app.get('/health', async (_req: Request, res: Response) => {
  try {
    // Attempt database query validation
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    errorLogger.error('Health check failed: database connectivity issue', error);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: error.message || 'Database connection error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Centralized Error-Handling Middleware
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred';
  
  // Log standard runtime errors with stack trace
  errorLogger.error({
    message: err.message || 'Runtime Exception',
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    statusCode,
  });

  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      details: err.details || undefined,
    },
  });
});

// Boot the Express Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    systemLogger.info(`Server successfully bootstrapped in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
