import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';

export const getInventory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const items = await prisma.groceryItem.findMany({
      where: { householdId },
      orderBy: { expiryDate: 'asc' }
    });

    res.json({ items });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createGroceryItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const { name, category, quantity, unit, minThreshold, expiryDate, dailyConsumption } = req.body;

    const item = await prisma.groceryItem.create({
      data: {
        householdId,
        name,
        category,
        quantity: parseFloat(quantity),
        unit,
        minThreshold: minThreshold ? parseFloat(minThreshold) : 1,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        dailyConsumption: dailyConsumption ? parseFloat(dailyConsumption) : 0.1
      }
    });

    res.status(201).json({ item });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateQuantity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const item = await prisma.groceryItem.update({
      where: { id },
      data: { quantity: parseFloat(quantity) }
    });

    res.json({ item });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteGroceryItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.groceryItem.delete({ where: { id } });
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
