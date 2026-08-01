import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/db';
import { logActivity } from '../logs/audit.service';
import { errorLogger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

// Validation schema for updating configuration settings
const updateSettingsSchema = z.object({
  company_name: z.string().min(1, 'Company name cannot be empty').optional(),
  company_logo: z.string().optional(),
  company_contact_number: z.string().optional(),
  company_email: z.string().email('Invalid company email address format').optional().or(z.literal('')),
  reminder_days_config: z.array(z.number()).optional(),
  channel_toggles: z.object({
    sms: z.boolean(),
    whatsapp: z.boolean(),
    email: z.boolean(),
  }).optional(),
  notification_provider: z.string().optional(),
  twilio_account_sid: z.string().optional(),
  twilio_auth_token: z.string().optional(),
  twilio_whatsapp_number: z.string().optional(),
  twilio_phone_number: z.string().optional(),
  smtp_host: z.string().optional(),
  smtp_port: z.number().or(z.string()).optional(),
  smtp_user: z.string().optional(),
  smtp_password: z.string().optional(),
  reminder_time: z.string().optional(),
});

export const getSettings = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const rawSettings = await prisma.settings.findMany();

    // Transform database rows list into structured key-value configurations map
    const settingsMap: Record<string, any> = {};
    
    rawSettings.forEach((item) => {
      // Safely parse JSON strings (arrays or configuration objects)
      if (item.key === 'reminder_days_config' || item.key === 'channel_toggles') {
        try {
          settingsMap[item.key] = JSON.parse(item.value);
        } catch {
          settingsMap[item.key] = item.value;
        }
      } else {
        settingsMap[item.key] = item.value;
      }
    });

    res.status(200).json(settingsMap);
  } catch (error: any) {
    errorLogger.error('Get settings controller execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }

    const validationResult = updateSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: {
          message: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const updates = validationResult.data;

    // Apply multiple updates in a single database transaction
    await prisma.$transaction(
      Object.entries(updates).map(([key, value]) => {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return prisma.settings.upsert({
          where: { key },
          update: { value: stringValue },
          create: { key, value: stringValue },
        });
      })
    );

    // Audit settings modification
    await logActivity(
      req.admin.id,
      'update',
      'settings',
      `Administrator updated system settings configurations: ${Object.keys(updates).join(', ')}`,
      req.ip
    );

    res.status(200).json({ message: 'System settings updated successfully' });
  } catch (error: any) {
    errorLogger.error('Update settings controller execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};
