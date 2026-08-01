import * as winston from 'winston';
import * as path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
  })
);

// Helper to create logging configurations per category
const createCategoryLogger = (_categoryName: string, filename: string) => {
  const logFilePath = path.join(process.cwd(), 'logs', filename);
  
  return winston.createLogger({
    level: 'info',
    format: logFormat,
    transports: [
      new winston.transports.File({ filename: logFilePath, level: 'info' }),
      ...(process.env.NODE_ENV !== 'production'
        ? [new winston.transports.Console({ format: consoleFormat })]
        : [])
    ],
  });
};

// Segregated Logger Instances
export const authLogger = createCategoryLogger('auth', 'auth.log');
export const reminderLogger = createCategoryLogger('reminders', 'reminders.log');
export const notificationLogger = createCategoryLogger('notifications', 'notifications.log');
export const cronLogger = createCategoryLogger('cron', 'cron.log');
export const systemLogger = createCategoryLogger('system', 'system.log');
export const apiLogger = createCategoryLogger('api', 'api.log');
export const errorLogger = createCategoryLogger('errors', 'errors.log');
export const activityLogger = createCategoryLogger('activity', 'activity.log');
