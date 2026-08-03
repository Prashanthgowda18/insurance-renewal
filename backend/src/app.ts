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

// Load environment variables (backend/.env first, then project root as fallback)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

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

// Real-Time Event Sync SSE Endpoint
import { syncService } from './services/sync.service';
import { pushService } from './services/push.service';

app.get('/api/sync/stream', (_req: Request, res: Response) => {
  syncService.subscribeClient(res);
});

app.post('/api/notifications/push-token', (req: Request, res: Response) => {
  const { token } = req.body;
  if (token) pushService.registerToken(token);
  res.json({ success: true, message: 'Push token registered successfully' });
});

// Register Router Modules
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/policies', policyRoutes);

import documentReaderRoutes from './modules/documentReader/documentReader.routes';
app.use('/api/document-reader', documentReaderRoutes);

import aiExtractorRoutes from './modules/aiExtractor/aiExtractor.routes';
app.use('/api/ai-extractor', aiExtractorRoutes);



// Base API routes placeholder
app.get('/api', (_req: Request, res: Response) => {
  res.json({ message: 'Welcome to Shield Insurance Renewal System API.' });
});

// Standard Health Check API Routes (/health and /api/health)
const healthHandler = async (_req: Request, res: Response) => {
  let dbStatus = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error: any) {
    dbStatus = 'disconnected';
    errorLogger.error('Health check failed: database connectivity issue', error);
  }

  const isHealthy = dbStatus === 'connected';
  res.status(isHealthy ? 200 : 500).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    database: dbStatus,
    storage: 'connected',
    ai: 'connected',
    version: '1.0.0'
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Centralized Error-Handling Middleware (User-Friendly & Descriptive Error Reporting)
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  let userMessage = err.message || 'Unexpected Server Error';

  if (userMessage.includes('Prisma') || userMessage.includes('database') || userMessage.includes('EACCES') || userMessage.includes('connect')) {
    userMessage = 'Database Connection Failed';
  } else if (userMessage.includes('429') || userMessage.includes('quota') || userMessage.includes('Gemini')) {
    userMessage = 'AI Extraction Quota Exceeded';
  } else if (userMessage.includes('jwt') || userMessage.includes('token') || userMessage.includes('unauthorized')) {
    userMessage = 'Authentication Failed';
  } else if (userMessage.includes('file') || userMessage.includes('upload')) {
    userMessage = 'File Upload Failed';
  }

  // Detailed server log for development and diagnostic tracing
  errorLogger.error({
    message: err.message || 'Runtime Exception',
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    statusCode,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message: userMessage,
      status: statusCode,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    },
  });
});

// Boot the Express Server (only when running standalone server, not on Vercel serverless)
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    systemLogger.info(`Server successfully bootstrapped in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
