import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getMedicines = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const medicines = await prisma.medicine.findMany({
      where: { householdId },
      include: { schedules: true },
      orderBy: { expiryDate: 'asc' }
    });

    res.json({ medicines });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createMedicine = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const { name, dosage, stockCount, expiryDate, doctorName, timeOfDay, memberAssignee } = req.body;

    const medicine = await prisma.medicine.create({
      data: {
        householdId,
        name,
        dosage,
        stockCount: parseInt(stockCount),
        expiryDate: new Date(expiryDate),
        doctorName,
        schedules: {
          create: {
            timeOfDay: timeOfDay || '09:00',
            memberAssignee: memberAssignee || 'Self'
          }
        }
      },
      include: { schedules: true }
    });

    res.status(201).json({ medicine });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const toggleScheduleTaken = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const existing = await prisma.medicineSchedule.findUnique({ where: { id: scheduleId } });
    if (!existing) return res.status(404).json({ error: 'Schedule not found' });

    const schedule = await prisma.medicineSchedule.update({
      where: { id: scheduleId },
      data: { taken: !existing.taken }
    });

    // If taken, decrement stock by 1
    if (!existing.taken) {
      await prisma.medicine.update({
        where: { id: existing.medicineId },
        data: { stockCount: { decrement: 1 } }
      });
    }

    res.json({ schedule });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
