import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getAppliances = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const appliances = await prisma.appliance.findMany({
      where: { householdId },
      include: { maintenanceLogs: { orderBy: { serviceDate: 'desc' } } }
    });

    res.json({ appliances });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createAppliance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const { name, brand, modelNumber, purchaseDate, warrantyYears } = req.body;
    const pDate = new Date(purchaseDate);
    const nextDueDate = new Date(pDate.getTime() + 180 * 24 * 60 * 60 * 1000); // default 6 month service interval

    const appliance = await prisma.appliance.create({
      data: {
        householdId,
        name,
        brand,
        modelNumber,
        purchaseDate: pDate,
        warrantyYears: parseInt(warrantyYears) || 1,
        nextServiceDueDate: nextDueDate
      }
    });

    res.status(201).json({ appliance });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const logMaintenance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { cost, description, technician } = req.body;

    const log = await prisma.applianceMaintenance.create({
      data: {
        applianceId: id,
        cost: parseFloat(cost),
        description,
        serviceDate: new Date(),
        technician
      }
    });

    const nextDueDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    await prisma.appliance.update({
      where: { id },
      data: {
        lastServicedDate: new Date(),
        nextServiceDueDate: nextDueDate
      }
    });

    res.status(201).json({ log });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
