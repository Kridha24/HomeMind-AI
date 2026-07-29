import { Response } from 'express';
import { prisma } from '../repositories/db';
import { AuthenticatedRequest } from '../middleware/auth';
import { aiClient } from '../services/aiClient';

export const getAIForecasts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    // Fetch electricity and expense history
    const expenses = await prisma.expense.findMany({
      where: { householdId, category: 'Utilities' },
      take: 6,
      orderBy: { date: 'desc' }
    });

    const historical = expenses.map(e => e.amount);
    const forecastResult = await aiClient.forecastUtilityBill('Electricity', historical.length ? historical : [120, 135, 110, 145, 150]);

    res.json({ forecast: forecastResult });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const scanReceiptOrPantry = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const { imageBase64, isShelf } = req.body;
    const result = await aiClient.parseReceiptOrShelf(imageBase64, isShelf);

    // Auto-ingest into inventory if items detected
    if (result.detected_items && Array.isArray(result.detected_items)) {
      for (const item of result.detected_items) {
        await prisma.groceryItem.create({
          data: {
            householdId,
            name: item.name,
            category: item.category || 'Household Items',
            quantity: parseFloat(item.quantity) || 1,
            unit: item.unit || 'pcs',
            expiryDate: new Date(Date.now() + (item.expiryDays || 7) * 24 * 60 * 60 * 1000)
          }
        });
      }
    }

    res.json({ result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getRecipeRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const groceryItems = await prisma.groceryItem.findMany({
      where: { householdId },
      select: { name: true }
    });

    const ingredientNames = groceryItems.map(g => g.name);
    const recipes = await aiClient.recommendRecipes(ingredientNames);

    res.json({ recipes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const chatWithAI = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(400).json({ error: 'Household context missing' });

    const { query } = req.body;

    const [totalExp, nextBill, groceryLow] = await Promise.all([
      prisma.expense.aggregate({ where: { householdId }, _sum: { amount: true } }),
      prisma.bill.findFirst({ where: { householdId, status: 'UNPAID' }, orderBy: { dueDate: 'asc' } }),
      prisma.groceryItem.count({ where: { householdId, quantity: { lte: 2 } } })
    ]);

    const context = {
      totalExpenseMonth: totalExp._sum.amount || 1420,
      nextBillAmount: nextBill?.amount || 120,
      nextBillDueDate: nextBill?.dueDate ? nextBill.dueDate.toISOString().split('T')[0] : 'Aug 5, 2026',
      lowStockCount: groceryLow
    };

    const response = await aiClient.processChatQuery(query, context);
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
