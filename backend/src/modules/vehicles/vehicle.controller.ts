import { Response } from 'express';
import { prisma } from '../../utils/db';
import { errorLogger } from '../../utils/logger';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

export const listVehicles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { vehicleNumber: { contains: search } },
        { make: { contains: search } },
        { model: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
        policies: {
          orderBy: { expiryDate: 'desc' },
          take: 1, // Get the latest policy
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format list details
    const formattedVehicles = vehicles.map((v) => {
      const latestPolicy = v.policies[0] || null;
      let daysRemaining = null;
      let policyStatus = 'none';

      if (latestPolicy) {
        const diffTime = new Date(latestPolicy.expiryDate).getTime() - new Date().getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        policyStatus = latestPolicy.status;
      }

      return {
        id: v.id,
        vehicleNumber: v.vehicleNumber,
        vehicleType: v.vehicleType,
        make: v.make,
        model: v.model,
        manufacturingYear: v.manufacturingYear,
        fuelType: v.fuelType,
        // Flat properties for frontend list table
        customerName: v.customer ? v.customer.name : null,
        customerMobile: v.customer ? v.customer.mobile : null,
        customerId: v.customer ? v.customer.id : null,
        insuranceCompany: latestPolicy ? latestPolicy.insuranceCompany : null,
        policyNumber: latestPolicy ? latestPolicy.policyNumber : null,
        expiryDate: latestPolicy ? latestPolicy.expiryDate : null,
        daysRemaining: latestPolicy ? daysRemaining : undefined,
        policyStatus: latestPolicy ? policyStatus : undefined,
        // Nested structures
        owner: v.customer ? { id: v.customer.id, name: v.customer.name, mobile: v.customer.mobile } : null,
        policy: latestPolicy ? {
          id: latestPolicy.id,
          policyNumber: latestPolicy.policyNumber,
          insuranceCompany: latestPolicy.insuranceCompany,
          expiryDate: latestPolicy.expiryDate,
          daysRemaining,
          status: policyStatus,
        } : null,
      };
    });

    res.status(200).json(formattedVehicles);
  } catch (error: any) {
    errorLogger.error('List vehicles controller execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

export const getVehicleDetail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        customer: true,
        policies: {
          include: {
            renewals: true,
          },
        },
      },
    });

    if (!vehicle) {
      res.status(404).json({ error: { message: 'Vehicle not found' } });
      return;
    }

    res.status(200).json(vehicle);
  } catch (error: any) {
    errorLogger.error('Get vehicle detail controller execution failed', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};
