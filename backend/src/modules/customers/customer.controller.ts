import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../utils/db';
import { logActivity } from '../logs/audit.service';
import { errorLogger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { saveBase64File } from '../../utils/upload';

// Zod validation schemas
const policySchema = z.object({
  insuranceCompany: z.string().min(1, 'Insurance company is required'),
  policyNumber: z.string().min(1, 'Policy number is required'),
  insuranceType: z.string().min(1, 'Insurance type is required'),
  startDate: z.string().transform((val) => new Date(val)),
  expiryDate: z.string().transform((val) => new Date(val)),
  renewalAmount: z.number().min(0, 'Renewal amount must be positive'),
  policyDocumentBase64: z.string().optional(),
  rcBookBase64: z.string().optional(),
  otherDocsBase64: z.string().optional(),
  reminderSchedule: z.array(z.string()).optional(),
});

const vehicleSchema = z.object({
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  vehicleType: z.string().min(1, 'Vehicle type is required'),
  make: z.string().optional(),
  model: z.string().optional(),
  manufacturingYear: z.number().optional(),
  fuelType: z.string().optional(),
  photoBase64: z.string().optional(),
  policy: policySchema.optional(),
});

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  mobile: z.string().regex(/^(?:\+91|91|0)?[6-9]\d{9}$/, 'Invalid Indian mobile number format. Must be 10 digits starting with 6-9 (optionally with +91 prefix)'),
  altMobile: z.string().regex(/^(?:\+91|91|0)?[6-9]\d{9}$/, 'Invalid Indian mobile number format').optional().or(z.literal('')),
  email: z.string().email('Invalid email address format').optional().or(z.literal('')),
  address: z.string().optional(),
  preferredNotificationChannel: z.string().default('whatsapp'),
  preferredLanguage: z.string().default('en'),
  notes: z.string().optional(),
  vehicles: z.array(vehicleSchema).default([]),
});

export const createCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }

    const validationResult = createCustomerSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        error: {
          message: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const data = validationResult.data;

    // Check duplicate mobile number
    const existingCustomer = await prisma.customer.findUnique({
      where: { mobile: data.mobile },
    });

    if (existingCustomer) {
      res.status(400).json({ error: { message: 'A customer with this mobile number already exists.' } });
      return;
    }

    // Pre-check duplicate vehicle numbers and policy numbers
    for (const vData of data.vehicles) {
      if (vData.vehicleNumber) {
        const vNumUpper = vData.vehicleNumber.toUpperCase();
        const existingVehicle = await prisma.vehicle.findUnique({
          where: { vehicleNumber: vNumUpper },
        });
        if (existingVehicle) {
          res.status(400).json({
            error: { message: `Vehicle number '${vNumUpper}' is already registered in the system.` },
          });
          return;
        }
      }

      if (vData.policy?.policyNumber) {
        const pNumUpper = vData.policy.policyNumber.toUpperCase();
        const existingPolicy = await prisma.insurancePolicy.findUnique({
          where: { policyNumber: pNumUpper },
        });
        if (existingPolicy) {
          res.status(400).json({
            error: { message: `Policy number '${pNumUpper}' already exists in the system.` },
          });
          return;
        }
      }
    }

    // Process base64 file uploads if present
    const allowedDocTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    const allowedPhotoTypes = ['image/png', 'image/jpeg'];

    // Run creation inside a single transactional block
    const customer = await prisma.$transaction(async (tx) => {
      // 1. Create Customer
      const createdCustomer = await tx.customer.create({
        data: {
          agencyId: req.admin?.agencyId || null,
          name: data.name,
          mobile: data.mobile,
          altMobile: data.altMobile || null,
          email: data.email || null,
          address: data.address || null,
          preferredNotificationChannel: data.preferredNotificationChannel,
          preferredLanguage: data.preferredLanguage,
          notes: data.notes || null,
          customerStatus: 'active',
        },
      });

      // 2. Loop and Create Vehicles and associated Policies
      for (const vData of data.vehicles) {
        // Handle photo upload
        if (vData.photoBase64) {
          await saveBase64File(vData.photoBase64, 'vehicles', allowedPhotoTypes);
        }

        // Create Vehicle
        const createdVehicle = await tx.vehicle.create({
          data: {
            customerId: createdCustomer.id,
            vehicleNumber: vData.vehicleNumber.toUpperCase(),
            vehicleType: vData.vehicleType,
            make: vData.make || null,
            model: vData.model || null,
            manufacturingYear: vData.manufacturingYear || null,
            fuelType: vData.fuelType || null,
          },
        });

        // Handle nested policy if present
        if (vData.policy) {
          const pData = vData.policy;

          // Process policy file uploads
          let policyDocUrl: string | null = null;
          if (pData.policyDocumentBase64) {
            const uploadResult = await saveBase64File(pData.policyDocumentBase64, 'policies', allowedDocTypes);
            policyDocUrl = uploadResult.url;
          }

          // Create Policy
          const createdPolicy = await tx.insurancePolicy.create({
            data: {
              vehicleId: createdVehicle.id,
              insuranceCompany: pData.insuranceCompany,
              policyNumber: pData.policyNumber.toUpperCase(),
              insuranceType: pData.insuranceType,
              startDate: pData.startDate,
              expiryDate: pData.expiryDate,
              status: pData.expiryDate > new Date() ? 'active' : 'expired',
              renewalStatus: 'pending',
              policyDocumentUrl: policyDocUrl,
              renewalAmount: pData.renewalAmount,
            },
          });

          // Create reminder schedule lines if configured
          const schedules = pData.reminderSchedule || ['30d', '15d', '7d', '3d', '1d', 'expiry'];
          for (const type of schedules) {
            let offsetDays = 0;
            if (type === '30d') offsetDays = 30;
            else if (type === '15d') offsetDays = 15;
            else if (type === '7d') offsetDays = 7;
            else if (type === '3d') offsetDays = 3;
            else if (type === '1d') offsetDays = 1;

            const scheduledDate = new Date(pData.expiryDate);
            scheduledDate.setDate(scheduledDate.getDate() - offsetDays);

            await tx.reminderSchedule.create({
              data: {
                policyId: createdPolicy.id,
                reminderType: type,
                scheduledDate,
                sent: false,
              },
            });
          }
        }
      }

      return createdCustomer;
    });

    // Write audit log entry
    await logActivity(
      req.admin.id,
      'create',
      'customers',
      `Created customer ${customer.name} with ${data.vehicles.length} vehicle(s).`,
      req.ip
    );

    res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (error: any) {
    errorLogger.error('Create customer transactional controller execution failed', error);

    if (error.code === 'P2002') {
      const targets = error.meta?.target || [];
      const targetStr = Array.isArray(targets) ? targets.join(', ') : String(targets);

      if (targetStr.includes('vehicle_number')) {
        res.status(400).json({ error: { message: 'A vehicle with this registration number is already registered in the system.' } });
        return;
      }
      if (targetStr.includes('policy_number')) {
        res.status(400).json({ error: { message: 'A policy with this policy number already exists in the system.' } });
        return;
      }
      if (targetStr.includes('mobile')) {
        res.status(400).json({ error: { message: 'A customer with this mobile number already exists.' } });
        return;
      }
      res.status(400).json({ error: { message: `Duplicate entry error (${targetStr})` } });
      return;
    }

    res.status(500).json({ error: { message: error.message || 'Internal server error' } });
  }
};

export const listCustomers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string;
    const status = req.query.status as string;

    const where: any = {};

    if (status) {
      where.customerStatus = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { mobile: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        vehicles: {
          include: {
            policies: {
              select: {
                id: true,
                insuranceCompany: true,
                policyNumber: true,
                expiryDate: true,
                status: true,
                renewalStatus: true,
              },
              orderBy: { expiryDate: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map aggregates for list display (e.g. number of vehicles, active policies count)
    const formattedCustomers = customers.map((c) => {
      let activePolicies = 0;
      let worstRenewalStatus = 'pending';

      c.vehicles.forEach((v) => {
        v.policies.forEach((p) => {
          if (p.status === 'active') {
            activePolicies++;
          }
          if (p.renewalStatus !== 'pending') {
            worstRenewalStatus = p.renewalStatus;
          }
        });
      });

      const primaryVehicle = c.vehicles[0];
      const primaryPolicy = primaryVehicle?.policies[0];

      return {
        id: c.id,
        name: c.name,
        mobile: c.mobile,
        email: c.email,
        address: c.address,
        vehiclesCount: c.vehicles.length,
        activePolicies,
        renewalStatus: worstRenewalStatus,
        customerStatus: c.customerStatus,
        primaryVehicleNumber: primaryVehicle?.vehicleNumber || null,
        primaryVehicleType: primaryVehicle?.vehicleType || null,
        primaryInsuranceCompany: primaryPolicy?.insuranceCompany || null,
        primaryPolicyNumber: primaryPolicy?.policyNumber || null,
        primaryExpiryDate: primaryPolicy?.expiryDate || null,
      };
    });

    res.status(200).json(formattedCustomers);
  } catch (error: any) {
    errorLogger.error('List customers controller execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

export const getCustomerDetail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: {
          include: {
            policies: {
              include: {
                renewals: true,
                reminders: {
                  include: {
                    notifications: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ error: { message: 'Customer not found' } });
      return;
    }

    res.status(200).json(customer);
  } catch (error: any) {
    errorLogger.error('Get customer detail controller execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

export const updateCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }

    const { id } = req.params;

    const updateCustomerSchema = z.object({
      name: z.string().min(1, 'Customer name is required').optional(),
      mobile: z.string().regex(/^(?:\+91|91|0)?[6-9]\d{9}$/, 'Invalid Indian mobile number format').optional(),
      altMobile: z.string().regex(/^(?:\+91|91|0)?[6-9]\d{9}$/, 'Invalid Indian mobile number format').optional().nullable(),
      email: z.string().email('Invalid email address format').optional().or(z.literal('')).nullable(),
      address: z.string().optional().nullable(),
      preferredNotificationChannel: z.string().optional(),
      preferredLanguage: z.string().optional(),
      customerStatus: z.string().optional(),
      notes: z.string().optional().nullable(),
    });

    const validationResult = updateCustomerSchema.safeParse(req.body);
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

    // Filter null inputs and prepare write queries
    const updateData: any = {};
    Object.entries(updates).forEach(([key, val]) => {
      if (val !== undefined) {
        updateData[key] = val === '' ? null : val;
      }
    });

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    await logActivity(
      req.admin.id,
      'update',
      'customers',
      `Updated customer profile details for ${customer.name}`,
      req.ip
    );

    res.status(200).json({ message: 'Customer updated successfully', customer });
  } catch (error: any) {
    errorLogger.error('Update customer controller execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

export const deleteCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: { message: 'Unauthorized' } });
      return;
    }

    const { id } = req.params;

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      res.status(404).json({ error: { message: 'Customer not found' } });
      return;
    }

    // SQLite cascade delete handled via prisma schema relation definitions (onDelete: Cascade)
    await prisma.customer.delete({ where: { id } });

    await logActivity(
      req.admin.id,
      'delete',
      'customers',
      `Deleted customer record ${customer.name}`,
      req.ip
    );

    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (error: any) {
    errorLogger.error('Delete customer controller execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

export const getCustomerTimeline = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: {
          include: {
            policies: {
              include: {
                renewals: true,
                reminders: {
                  include: {
                    notifications: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ error: { message: 'Customer not found' } });
      return;
    }

    // Assemble timeline log entries
    const events: any[] = [];

    // 1. Customer registration event
    events.push({
      type: 'registration',
      title: 'Customer Added',
      description: `Customer account was registered with preferred alerts via ${customer.preferredNotificationChannel.toUpperCase()}.`,
      timestamp: customer.createdAt,
    });

    customer.vehicles.forEach((v) => {
      // 2. Vehicle addition event
      events.push({
        type: 'vehicle_added',
        title: 'Vehicle Registered',
        description: `Vehicle ${v.vehicleNumber} (${v.make || ''} ${v.model || ''}) was added to owner profile.`,
        timestamp: v.createdAt,
      });

      v.policies.forEach((p) => {
        // 3. Policy created event
        events.push({
          type: 'policy_added',
          title: 'Insurance Policy Added',
          description: `Policy ${p.policyNumber} (${p.insuranceCompany}) was registered for vehicle ${v.vehicleNumber}.`,
          timestamp: p.createdAt,
        });

        // 4. Renewal events
        p.renewals.forEach((r) => {
          events.push({
            type: 'policy_renewed',
            title: 'Policy Renewed',
            description: `Policy was renewed up to ${new Date(r.newExpiryDate).toLocaleDateString()} by ${r.renewedBy}. Remarks: ${r.remarks || 'None'}`,
            timestamp: r.createdAt,
          });
        });

        // 5. Notification alerts sent history
        p.reminders.forEach((rem) => {
          rem.notifications.forEach((notif) => {
            if (notif.status === 'sent') {
              events.push({
                type: 'reminder_sent',
                title: 'Alert Dispatched',
                description: `Reminder alert (${rem.reminderType}) sent to customer via ${notif.channel.toUpperCase()}.`,
                timestamp: notif.sentAt || notif.createdAt,
              });
            }
          });
        });
      });
    });

    // Sort events from newest to oldest
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.status(200).json(events);
  } catch (error: any) {
    errorLogger.error('Get customer timeline controller execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};
