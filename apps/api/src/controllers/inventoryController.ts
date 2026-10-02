import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { emitGroceryUpdate } from '../services/realtimeGateway';

export const getInventory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const { category, search, status } = req.query as {
      category?: string;
      search?: string;
      status?: string;
    };

    const whereClause: any = {
      householdId,
      softDelete: false,
    };

    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    if (search && search.trim()) {
      whereClause.name = {
        contains: search.trim(),
      };
    }

    if (status === 'purchased') {
      whereClause.purchaseDate = { not: null };
    } else if (status === 'pending' || status === 'need_to_buy') {
      whereClause.purchaseDate = null;
    }

    const items = await prisma.groceryItem.findMany({
      where: whereClause,
      orderBy: [
        { purchaseDate: 'asc' }, // Pending (null) first
        { updatedAt: 'desc' },
      ],
    });

    res.json({ items });
  } catch (err: any) {
    console.error('[getInventory] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch inventory.' });
  }
};

export const createGroceryItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const {
      name,
      category,
      quantity,
      unit,
      minThreshold,
      expiryDate,
      purchaseDate,
      barcode,
      dailyConsumption,
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const item = await prisma.groceryItem.create({
      data: {
        householdId,
        name: name.trim(),
        category: category && category.trim() ? category.trim() : 'Other',
        quantity: quantity !== undefined && !isNaN(parseFloat(quantity)) ? parseFloat(quantity) : 1,
        unit: unit && unit.trim() ? unit.trim() : 'pcs',
        minThreshold: minThreshold !== undefined && !isNaN(parseFloat(minThreshold)) ? parseFloat(minThreshold) : 1,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        barcode: barcode ? String(barcode) : null,
        dailyConsumption: dailyConsumption && !isNaN(parseFloat(dailyConsumption)) ? parseFloat(dailyConsumption) : 0.1,
        createdBy: req.user?.userId || 'Household Member',
        softDelete: false,
      },
    });

    emitGroceryUpdate(householdId, { action: 'CREATED', item });

    res.status(201).json({ item });
  } catch (err: any) {
    console.error('[createGroceryItem] Error:', err.message);
    res.status(500).json({ error: 'Failed to create inventory item.' });
  }
};

export const updateGroceryItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const {
      name,
      category,
      quantity,
      unit,
      minThreshold,
      expiryDate,
      purchaseDate,
      barcode,
      dailyConsumption,
    } = req.body;

    const existing = await prisma.groceryItem.findFirst({ where: { id, householdId } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    let nextPurchaseDate = existing.purchaseDate;
    if (purchaseDate !== undefined) {
      nextPurchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    }

    const updated = await prisma.groceryItem.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        category: category !== undefined ? category.trim() : existing.category,
        quantity: quantity !== undefined ? parseFloat(quantity) : existing.quantity,
        unit: unit !== undefined ? unit.trim() : existing.unit,
        minThreshold: minThreshold !== undefined ? parseFloat(minThreshold) : existing.minThreshold,
        expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : existing.expiryDate,
        purchaseDate: nextPurchaseDate,
        barcode: barcode !== undefined ? barcode : existing.barcode,
        dailyConsumption: dailyConsumption !== undefined ? parseFloat(dailyConsumption) : existing.dailyConsumption,
        updatedBy: req.user?.userId || 'Household Member',
      },
    });

    emitGroceryUpdate(householdId, { action: 'UPDATED', item: updated });

    res.json({ success: true, item: updated });
  } catch (err: any) {
    console.error('[updateGroceryItem] Error:', err.message);
    res.status(500).json({ error: 'Failed to update grocery item.' });
  }
};

export const togglePurchase = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const existing = await prisma.groceryItem.findFirst({ where: { id, householdId } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const { purchased, purchaseDate } = req.body;

    // If purchased is explicitly boolean, use it. Otherwise toggle existing status.
    const isPurchasing = purchased !== undefined ? Boolean(purchased) : !existing.purchaseDate;
    const resolvedPurchaseDate = isPurchasing
      ? purchaseDate
        ? new Date(purchaseDate)
        : new Date()
      : null;

    const updated = await prisma.groceryItem.update({
      where: { id },
      data: {
        purchaseDate: resolvedPurchaseDate,
        updatedBy: req.user?.userId || 'Household Member',
      },
    });

    emitGroceryUpdate(householdId, { action: 'PURCHASE_TOGGLED', item: updated, purchased: isPurchasing });

    res.json({ success: true, item: updated });
  } catch (err: any) {
    console.error('[togglePurchase] Error:', err.message);
    res.status(500).json({ error: 'Failed to update purchase status.' });
  }
};

export const updateQuantity = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const householdId = req.user?.householdId;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const existing = await prisma.groceryItem.findFirst({ where: { id, householdId } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const parsedQty = Math.max(0, parseFloat(quantity));

    const item = await prisma.groceryItem.update({
      where: { id },
      data: {
        quantity: parsedQty,
        updatedBy: req.user?.userId || 'Household Member',
      },
    });

    emitGroceryUpdate(householdId, { action: 'QUANTITY_UPDATED', item });

    res.json({ item });
  } catch (err: any) {
    console.error('[updateQuantity] Error:', err.message);
    res.status(500).json({ error: 'Failed to update item quantity.' });
  }
};

export const deleteGroceryItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const householdId = req.user?.householdId;

    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const existing = await prisma.groceryItem.findFirst({ where: { id, householdId } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    await prisma.groceryItem.delete({ where: { id } });

    emitGroceryUpdate(householdId, { action: 'DELETED', id });

    res.json({ success: true, id });
  } catch (err: any) {
    console.error('[deleteGroceryItem] Error:', err.message);
    res.status(500).json({ error: 'Failed to delete grocery item.' });
  }
};
