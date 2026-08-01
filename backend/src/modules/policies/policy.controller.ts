import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/db';
import { logActivity } from '../logs/audit.service';
import { errorLogger, notificationLogger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getNotificationProvider } from '../../services/notification.service';

export const listPolicies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string;
    const renewalStatus = req.query.renewalStatus as string;

    const where: any = {};
    if (renewalStatus) {
      where.renewalStatus = renewalStatus;
    }

    if (search) {
      where.OR = [
        { policyNumber: { contains: search } },
        { insuranceCompany: { contains: search } },
        { vehicle: { vehicleNumber: { contains: search } } },
        { vehicle: { customer: { name: { contains: search } } } },
      ];
    }

    const policies = await prisma.insurancePolicy.findMany({
      where,
      include: {
        vehicle: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                mobile: true,
              },
            },
          },
        },
      },
      orderBy: { expiryDate: 'asc' }, // Show nearest expiry dates first
    });

    // Format list mapping dates and status calculations
    const formattedPolicies = policies.map((p) => {
      const diffTime = new Date(p.expiryDate).getTime() - new Date().getTime();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: p.id,
        policyNumber: p.policyNumber,
        insuranceCompany: p.insuranceCompany,
        insuranceType: p.insuranceType,
        startDate: p.startDate,
        expiryDate: p.expiryDate,
        status: p.status,
        renewalStatus: p.renewalStatus,
        renewalAmount: Number(p.renewalAmount),
        daysRemaining,
        customerName: p.vehicle.customer ? p.vehicle.customer.name : 'Unknown',
        customerMobile: p.vehicle.customer ? p.vehicle.customer.mobile : '',
        vehicleNumber: p.vehicle.vehicleNumber,
        vehicleType: p.vehicle.vehicleType,
      };
    });

    res.status(200).json(formattedPolicies);
  } catch (error: any) {
    errorLogger.error('List policies controller execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const renewPolicySchema = z.object({
  startDate: z.string().transform((val) => new Date(val)),
  expiryDate: z.string().transform((val) => new Date(val)),
  renewalAmount: z.number().min(0, 'Renewal amount must be positive'),
  remarks: z.string().optional(),
});

export const renewPolicy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }

    const { id } = req.params;

    const validationResult = renewPolicySchema.safeParse(req.body);
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

    // Fetch existing policy details
    const policy = await prisma.insurancePolicy.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });

    if (!policy) {
      res.status(404).json({ error: { message: 'Insurance policy not found' } });
      return;
    }

    // Execute updates inside single database transactional block
    await prisma.$transaction(async (tx) => {
      // 1. Update Policy dates, amount, and reset states
      await tx.insurancePolicy.update({
        where: { id: policy.id },
        data: {
          startDate: updates.startDate,
          expiryDate: updates.expiryDate,
          renewalAmount: updates.renewalAmount,
          status: 'active',
          renewalStatus: 'renewed',
          lastReminderDate: null,
          nextReminderDate: null,
        },
      });

      // 2. Write Renewal history entry
      await tx.renewal.create({
        data: {
          policyId: policy.id,
          newExpiryDate: updates.expiryDate,
          renewedBy: req.admin?.email || 'admin@example.com',
          remarks: updates.remarks || null,
        },
      });

      // 3. Reset all ReminderSchedule items relative to new expiry date
      const schedules = await tx.reminderSchedule.findMany({
        where: { policyId: policy.id },
      });

      for (const sched of schedules) {
        let offsetDays = 0;
        if (sched.reminderType === '30d') offsetDays = 30;
        else if (sched.reminderType === '15d') offsetDays = 15;
        else if (sched.reminderType === '7d') offsetDays = 7;
        else if (sched.reminderType === '3d') offsetDays = 3;
        else if (sched.reminderType === '1d') offsetDays = 1;

        const scheduledDate = new Date(updates.expiryDate);
        scheduledDate.setDate(scheduledDate.getDate() - offsetDays);

        await tx.reminderSchedule.update({
          where: { id: sched.id },
          data: {
            scheduledDate,
            sent: false,
          },
        });
      }
    });

    // Audit log
    await logActivity(
      req.admin.id,
      'update',
      'policies',
      `Renewed policy ${policy.policyNumber} for vehicle ${policy.vehicle.vehicleNumber}. Expiry: ${updates.expiryDate.toLocaleDateString()}`,
      req.ip
    );

    res.status(200).json({ message: 'Policy renewed successfully' });
  } catch (error: any) {
    errorLogger.error('Renew policy transactional execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

export const triggerReminders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }

    // 1. Fetch system settings details to personalize templates
    const rawSettings = await prisma.settings.findMany();
    const settingsMap: Record<string, string> = {};
    rawSettings.forEach((item) => {
      settingsMap[item.key] = item.value;
    });

    const companyName = settingsMap['company_name'] || 'Shield Insurance';
    const companyPhone = settingsMap['company_contact_number'] || '+1-555-0100';

    // 2. Fetch due schedules
    const dueSchedules = await prisma.reminderSchedule.findMany({
      where: {
        scheduledDate: { lte: new Date() },
        sent: false,
        policy: {
          status: 'active',
        },
      },
      include: {
        policy: {
          include: {
            vehicle: {
              include: {
                customer: true,
              },
            },
          },
        },
      },
    });

    let processedCount = 0;

    // 3. Process each schedule row
    for (const sched of dueSchedules) {
      const customer = sched.policy.vehicle.customer;
      const vehicle = sched.policy.vehicle;
      const policy = sched.policy;

      if (!customer) continue;

      // Formatting warning message body according to official WhatsApp Business template
      let timeLabel = '';
      if (sched.reminderType === '30d') timeLabel = 'in 30 days';
      else if (sched.reminderType === '15d') timeLabel = 'in 15 days';
      else if (sched.reminderType === '7d') timeLabel = 'in 7 days';
      else if (sched.reminderType === '3d') timeLabel = 'in 3 days';
      else if (sched.reminderType === '1d') timeLabel = 'tomorrow';
      else timeLabel = 'TODAY';

      const expiryDateFormatted = new Date(policy.expiryDate).toLocaleDateString();
      const messageBody = `Hello ${customer.name}

Your ${vehicle.vehicleType} insurance for vehicle ${vehicle.vehicleNumber} will expire ${timeLabel} on ${expiryDateFormatted}.

Insurance Company:
${policy.insuranceCompany}

Policy Number:
${policy.policyNumber}

Please renew your insurance before the expiry date to avoid interruption in coverage.

For assistance contact:

${companyName}

Phone:
${companyPhone}

Thank you.`;

      // Split preferred notification channels (comma-separated selection)
      const preferredChannels = customer.preferredNotificationChannel
        ? customer.preferredNotificationChannel.split(',').map((c) => c.trim().toLowerCase())
        : ['whatsapp'];

      let dispatchSuccess = false;

      // Loop through each preferred channel
      for (const channel of preferredChannels) {
        let recipientAddress = '';
        if (channel === 'whatsapp' || channel === 'sms') {
          recipientAddress = customer.mobile;
        } else if (channel === 'email') {
          recipientAddress = customer.email || '';
        }

        if (!recipientAddress) {
          // If customer has no contact info for selected channel, record failure
          await prisma.notificationHistory.create({
            data: {
              reminderId: sched.id,
              recipientType: 'customer',
              channel,
              status: 'failed',
              deliveryResult: `Missing recipient contact detail for channel: ${channel.toUpperCase()}`,
            },
          });
          continue;
        }

        // Get matching provider and dispatch
        const provider = getNotificationProvider(channel, settingsMap);
        const result = await provider.send(recipientAddress, messageBody, settingsMap);

        // Record history log entry
        await prisma.notificationHistory.create({
          data: {
            reminderId: sched.id,
            recipientType: 'customer',
            channel,
            status: result.status,
            deliveryResult: result.deliveryResult || result.errorMessage,
            sentAt: result.status === 'sent' ? new Date() : null,
          },
        });

        if (result.status === 'sent') {
          dispatchSuccess = true;
          notificationLogger.info(`[${channel.toUpperCase()}] Sent to ${customer.name} (${recipientAddress}):\n${messageBody}`);
        }
      }

      // Final status update of schedule and policy
      await prisma.$transaction(async (tx) => {
        await tx.reminderSchedule.update({
          where: { id: sched.id },
          data: { sent: true },
        });

        if (dispatchSuccess) {
          await tx.insurancePolicy.update({
            where: { id: policy.id },
            data: {
              lastReminderDate: new Date(),
            },
          });
        }
      });

      processedCount++;
    }

    // Write activity audit log
    await logActivity(
      req.admin.id,
      'update',
      'policies',
      `Triggered automated reminder schedule checks. Processed ${processedCount} schedules.`,
      req.ip
    );

    res.status(200).json({
      message: `Reminders triggered successfully! Evaluated schedules and dispatched ${processedCount} alert queue(s).`,
      count: processedCount,
    });
  } catch (error: any) {
    errorLogger.error('Trigger reminders engine execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

export const getNotificationHistories = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const list = await prisma.notificationHistory.findMany({
      include: {
        reminder: {
          include: {
            policy: {
              include: {
                vehicle: {
                  include: {
                    customer: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const formatted = list.map((item) => {
      const policy = item.reminder?.policy;
      const customer = policy?.vehicle?.customer;
      return {
        id: item.id,
        recipient: customer ? customer.name : 'Unknown',
        vehicleNumber: policy?.vehicle?.vehicleNumber || '—',
        policyNumber: policy?.policyNumber || '—',
        channel: item.channel,
        status: item.status,
        deliveryResult: item.deliveryResult,
        sentAt: item.sentAt || item.createdAt,
        createdAt: item.createdAt,
      };
    });

    res.status(200).json(formatted);
  } catch (error: any) {
    errorLogger.error('Failed to list notification histories', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

export const sendTestNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }

    const { recipient, channel } = req.body;
    if (!recipient || !channel) {
      res.status(400).json({ error: { message: 'Recipient and channel are required' } });
      return;
    }

    const rawSettings = await prisma.settings.findMany();
    const settingsMap: Record<string, string> = {};
    rawSettings.forEach((item) => {
      settingsMap[item.key] = item.value;
    });

    const companyName = settingsMap['company_name'] || 'Shield Insurance';
    const companyPhone = settingsMap['company_contact_number'] || '+1-555-0100';

    const testMessage = `Hello Tester,

This is a live test notification from ${companyName} to verify that your notification connection setup is fully operational.

For assistance contact:
${companyName}

Phone:
${companyPhone}

Thank you.`;

    const provider = getNotificationProvider(channel, settingsMap);
    const result = await provider.send(recipient, testMessage, settingsMap);

    res.status(200).json({
      success: result.status === 'sent',
      deliveryResult: result.deliveryResult || result.errorMessage || 'Sent simulation log recorded.',
    });
  } catch (error: any) {
    errorLogger.error('Test notification dispatch failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

export const extractPolicy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fileBase64, filename } = req.body;
    if (!fileBase64) {
      res.status(400).json({ error: { message: 'Document file (fileBase64) is required.' } });
      return;
    }

    const { saveBase64File } = await import('../../utils/upload');
    const { parsePolicyDocument } = await import('../../services/policyExtractor.service');

    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    const savedFile = await saveBase64File(fileBase64, 'policies', allowedMimeTypes);

    // Extract buffer from base64 string
    const base64Data = fileBase64.replace(/^data:[a-zA-Z0-9-+\/]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const mimeType = fileBase64.match(/^data:([a-zA-Z0-9-+\/]+);base64,/)?.[1] || 'application/pdf';

    const extractedData = await parsePolicyDocument(buffer, mimeType, filename || savedFile.filename);
    extractedData.documentUrl = savedFile.url;

    res.status(200).json({
      message: 'Policy document extracted successfully',
      extractedData,
      documentUrl: savedFile.url,
    });
  } catch (error: any) {
    errorLogger.error('Extract policy controller failed', error);
    res.status(400).json({ error: { message: error.message || 'Failed to extract policy document' } });
  }
};

export const importExtractedPolicy = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = req.body;

    const custMobile = data.customer?.mobile?.replace(/\D/g, '').slice(-10);
    if (!custMobile || !/^[6-9]\d{9}$/.test(custMobile)) {
      res.status(400).json({ error: { message: 'Valid 10-digit customer mobile number starting with 6-9 is required.' } });
      return;
    }

    const vNum = data.vehicle?.registrationNumber?.toUpperCase();
    if (!vNum) {
      res.status(400).json({ error: { message: 'Vehicle registration number is required.' } });
      return;
    }

    const pNum = data.insurance?.policyNumber?.toUpperCase();
    if (!pNum) {
      res.status(400).json({ error: { message: 'Policy number is required.' } });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or Create Customer
      let customer = await tx.customer.findUnique({ where: { mobile: custMobile } });
      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: data.customer.name || 'Customer',
            mobile: custMobile,
            email: data.customer.email || null,
            address: data.customer.address ? `${data.customer.address}, ${data.customer.city || ''} ${data.customer.state || ''} ${data.customer.pincode || ''}`.trim() : null,
            customerStatus: 'active',
          },
        });
      }

      // 2. Find or Create Vehicle
      let vehicle = await tx.vehicle.findUnique({ where: { vehicleNumber: vNum } });
      if (!vehicle) {
        vehicle = await tx.vehicle.create({
          data: {
            customerId: customer.id,
            vehicleNumber: vNum,
            vehicleType: data.vehicle.vehicleType || 'car',
            make: data.vehicle.manufacturer || null,
            model: data.vehicle.model || null,
            manufacturingYear: Number(data.vehicle.manufacturingYear) || new Date().getFullYear(),
            fuelType: data.vehicle.fuelType || 'petrol',
          },
        });
      }

      // 3. Check existing policy
      const existingPol = await tx.insurancePolicy.findUnique({ where: { policyNumber: pNum } });
      if (existingPol) {
        throw new Error(`Policy number '${pNum}' is already registered in the system.`);
      }

      // 4. Create Insurance Policy
      const startDate = new Date(data.insurance.startDate || new Date());
      const expiryDate = new Date(data.insurance.expiryDate || new Date(Date.now() + 365 * 24 * 3600 * 1000));

      const policy = await tx.insurancePolicy.create({
        data: {
          vehicleId: vehicle.id,
          insuranceCompany: data.insurance.companyName || 'Insurance Provider',
          policyNumber: pNum,
          insuranceType: data.insurance.policyType || 'comprehensive',
          startDate,
          expiryDate,
          status: expiryDate > new Date() ? 'active' : 'expired',
          renewalStatus: 'pending',
          policyDocumentUrl: data.documentUrl || null,
          renewalAmount: Number(data.insurance.premiumAmount) || 0,
        },
      });

      // 5. Generate 6-stage Reminder Schedule (30d, 15d, 7d, 3d, 1d, 0d)
      const stages = [
        { type: '30d', days: 30 },
        { type: '15d', days: 15 },
        { type: '7d', days: 7 },
        { type: '3d', days: 3 },
        { type: '1d', days: 1 },
        { type: 'expiry', days: 0 },
      ];

      for (const s of stages) {
        const scheduledDate = new Date(expiryDate);
        scheduledDate.setDate(scheduledDate.getDate() - s.days);
        await tx.reminderSchedule.create({
          data: {
            policyId: policy.id,
            reminderType: s.type,
            scheduledDate,
            sent: false,
          },
        });
      }

      return { customer, vehicle, policy };
    });

    if (req.admin) {
      await logActivity(
        req.admin.id,
        'create',
        'policies',
        `Extracted and imported policy ${result.policy.policyNumber} for customer ${result.customer.name}`,
        req.ip
      );
    }

    res.status(201).json({
      message: 'Insurance policy imported and saved successfully',
      ...result,
    });
  } catch (error: any) {
    errorLogger.error('Import extracted policy failed', error);
    res.status(400).json({ error: { message: error.message || 'Failed to import extracted policy.' } });
  }
};
