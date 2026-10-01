import { prisma } from '../../../repositories/db';

export interface HouseholdAIContext {
  userName: string;
  householdName: string;
  currencySymbol: string;
  currencyCode: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  unpaidBillsTotal: number;
  unpaidBills: Array<{ title: string; amount: number; dueDate: string; category: string }>;
  pendingTasks: Array<{ id: string; title: string; priority: string; dueDate: string }>;
  lowStockGroceries: Array<{ name: string; quantity: number; unit: string }>;
  familyMembers: Array<{ name: string; role: string }>;
  activeMemories: Array<{ type: string; content: string }>;
  appliancesCount: number;
  medicinesCount: number;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  SGD: 'S$',
  AED: 'د.إ',
  SAR: '﷼',
  CHF: 'CHF',
  CNY: '¥',
};

export class ContextManager {
  static async getHouseholdContext(householdId: string, userId: string): Promise<HouseholdAIContext> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      user,
      household,
      settings,
      expenses,
      incomes,
      bills,
      groceries,
      tasks,
      members,
      memories,
      appliancesCount,
      medicinesCount,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.household.findUnique({ where: { id: householdId } }),
      prisma.setting.findFirst({ where: { householdId, softDelete: false } }),
      prisma.expense.findMany({ where: { householdId, softDelete: false } }),
      prisma.income.findMany({ where: { householdId, softDelete: false } }),
      prisma.bill.findMany({ where: { householdId, softDelete: false } }),
      prisma.groceryItem.findMany({ where: { householdId, softDelete: false } }),
      prisma.task.findMany({ where: { householdId, softDelete: false, status: 'PENDING' }, orderBy: { dueDate: 'asc' } }),
      prisma.user.findMany({ where: { householdId, isActive: true }, select: { name: true, role: true } }),
      prisma.aIMemory.findMany({ where: { householdId, isActive: true }, select: { type: true, content: true } }),
      prisma.appliance.count({ where: { householdId, softDelete: false } }),
      prisma.medicine.count({ where: { householdId, softDelete: false } }),
    ]);

    const monthlyExpenses = expenses
      .filter((e) => new Date(e.date) >= startOfMonth)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const monthlyIncome = incomes
      .filter((i) => new Date(i.date) >= startOfMonth)
      .reduce((acc, curr) => acc + curr.amount, 0);

    const unpaidBills = bills.filter((b) => b.status === 'UNPAID');
    const unpaidBillsTotal = unpaidBills.reduce((acc, curr) => acc + curr.amount, 0);

    const lowStockGroceries = groceries
      .filter((g) => g.quantity <= (g.minThreshold || 1))
      .map((g) => ({ name: g.name, quantity: g.quantity, unit: g.unit }));

    const currencyCode = settings?.currency || 'USD';
    const currencySymbol = CURRENCY_SYMBOLS[currencyCode] || '$';

    return {
      userName: user?.name || 'Household User',
      householdName: household?.name || 'HomeMind Household',
      currencySymbol,
      currencyCode,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
      unpaidBillsTotal,
      unpaidBills: unpaidBills.map((b) => ({
        title: b.title,
        amount: b.amount,
        dueDate: b.dueDate.toISOString().split('T')[0],
        category: b.category,
      })),
      pendingTasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate.toISOString().split('T')[0],
      })),
      lowStockGroceries,
      familyMembers: members,
      activeMemories: memories,
      appliancesCount,
      medicinesCount,
    };
  }

  static formatContextForPrompt(ctx: HouseholdAIContext): string {
    const memoryLines = ctx.activeMemories.length
      ? ctx.activeMemories.map((m) => `• [${m.type}]: ${m.content}`).join('\n')
      : 'None recorded yet.';

    const tasksList = ctx.pendingTasks.length
      ? ctx.pendingTasks.map((t) => `• [${t.priority}] ${t.title} (Due: ${t.dueDate})`).join('\n')
      : 'All tasks completed.';

    const billsList = ctx.unpaidBills.length
      ? ctx.unpaidBills.map((b) => `• ${b.title} (${b.category}): ${ctx.currencySymbol}${b.amount.toLocaleString()} (Due: ${b.dueDate})`).join('\n')
      : 'No unpaid bills.';

    const groceryList = ctx.lowStockGroceries.length
      ? ctx.lowStockGroceries.map((g) => `• ${g.name}: ${g.quantity} ${g.unit}`).join('\n')
      : 'All pantry items in sufficient stock.';

    return `
HOUSEHOLD TELEMETRY & LIVE STATE:
- User: ${ctx.userName}
- Household: ${ctx.householdName}
- Currency: ${ctx.currencySymbol} (${ctx.currencyCode})
- Monthly Financials: Income ${ctx.currencySymbol}${ctx.monthlyIncome.toLocaleString()} | Expenses ${ctx.currencySymbol}${ctx.monthlyExpenses.toLocaleString()} | Net Savings ${ctx.currencySymbol}${ctx.monthlySavings.toLocaleString()}
- Total Unpaid Dues: ${ctx.currencySymbol}${ctx.unpaidBillsTotal.toLocaleString()}
- Active Appliances: ${ctx.appliancesCount} | Active Prescriptions: ${ctx.medicinesCount}

PENDING TASKS:
${tasksList}

UNPAID BILLS:
${billsList}

LOW STOCK PANTRY ITEMS:
${groceryList}

AI MEMORIES & RULES:
${memoryLines}
`.trim();
  }
}
