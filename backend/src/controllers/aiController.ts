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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      expenses,
      incomes,
      unpaidBills,
      lowStockGroceries,
      pendingTasks,
      appliances,
      settings
    ] = await Promise.all([
      prisma.expense.findMany({ where: { householdId, softDelete: false } }),
      prisma.income.findMany({ where: { householdId, softDelete: false } }),
      prisma.bill.findMany({ where: { householdId, status: 'UNPAID', softDelete: false }, orderBy: { dueDate: 'asc' } }),
      prisma.groceryItem.findMany({ where: { householdId, quantity: { lte: 2 }, softDelete: false } }),
      prisma.task.findMany({ where: { householdId, status: 'PENDING', softDelete: false } }),
      prisma.appliance.findMany({ where: { householdId, softDelete: false } }),
      prisma.setting.findFirst({ where: { householdId } })
    ]);

    // Live Metrics Calculations
    const monthlyExpenses = expenses
      .filter(e => new Date(e.date) >= startOfMonth)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const monthlyIncome = incomes
      .filter(i => new Date(i.date) >= startOfMonth)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const overallExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const overallIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);

    // Expense Category Summary
    const categoryMap: Record<string, number> = {};
    expenses.forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });

    const currencySymbol = settings?.currency === 'INR' ? '₹' : (settings?.currency === 'EUR' ? '€' : (settings?.currency === 'GBP' ? '£' : '$'));

    const context = {
      currencySymbol,
      currency: settings?.currency || 'USD',
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
      overallIncome,
      overallExpenses,
      overallSavings: overallIncome - overallExpenses,
      categoryBreakdown: categoryMap,
      unpaidBills: unpaidBills.map(b => ({
        title: b.title,
        amount: b.amount,
        category: b.category,
        dueDate: new Date(b.dueDate).toLocaleDateString()
      })),
      unpaidBillsTotal: unpaidBills.reduce((acc, curr) => acc + curr.amount, 0),
      lowStockItems: lowStockGroceries.map(g => `${g.name} (${g.quantity} ${g.unit})`),
      pendingTasks: pendingTasks.map(t => t.title),
      appliancesCount: appliances.length,
      expensesCount: expenses.length,
      incomesCount: incomes.length
    };

    const response = await aiClient.processChatQuery(query, context);
    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
