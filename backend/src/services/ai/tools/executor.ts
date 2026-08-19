import { prisma } from '../../../repositories/db';

export interface ToolExecutionContext {
  householdId: string;
  userId: string;
  userName: string;
  currencySymbol: string;
}

export interface ToolResult {
  tool: string;
  success: boolean;
  message: string;
  data?: any;
}

export class ToolExecutor {
  static async execute(
    toolName: string,
    args: any = {},
    ctx: ToolExecutionContext
  ): Promise<ToolResult> {
    const { householdId, userId, currencySymbol } = ctx;

    try {
      switch (toolName) {
        // ==========================================
        // TASKS
        // ==========================================
        case 'get_tasks': {
          const whereClause: any = { householdId, softDelete: false };
          if (args.status && args.status !== 'ALL') {
            whereClause.status = args.status;
          }
          if (args.priority) {
            whereClause.priority = args.priority;
          }

          const tasks = await prisma.task.findMany({
            where: whereClause,
            orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
            take: 20,
          });

          return {
            tool: toolName,
            success: true,
            message: `Found ${tasks.length} tasks.`,
            data: tasks.map((t) => ({
              id: t.id,
              title: t.title,
              priority: t.priority,
              status: t.status,
              dueDate: t.dueDate.toISOString().split('T')[0],
            })),
          };
        }

        case 'create_task': {
          if (!args.title || typeof args.title !== 'string') {
            return { tool: toolName, success: false, message: 'Task title is required.' };
          }

          const days = typeof args.dueDaysFromNow === 'number' ? args.dueDaysFromNow : 1;
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + days);

          const task = await prisma.task.create({
            data: {
              householdId,
              creatorId: userId,
              title: args.title.trim(),
              priority: args.priority || 'MEDIUM',
              status: 'PENDING',
              dueDate,
            },
          });

          return {
            tool: toolName,
            success: true,
            message: `Created task "${task.title}" due on ${dueDate.toLocaleDateString()}.`,
            data: task,
          };
        }

        case 'update_task_status': {
          const query = (args.taskTitleOrId || '').toLowerCase().trim();
          const task = await prisma.task.findFirst({
            where: {
              householdId,
              softDelete: false,
              OR: [
                { id: args.taskTitleOrId },
                { title: { contains: query } },
              ],
            },
          });

          if (!task) {
            return { tool: toolName, success: false, message: `Could not find task matching "${args.taskTitleOrId}".` };
          }

          const updated = await prisma.task.update({
            where: { id: task.id },
            data: { status: args.status || 'COMPLETED' },
          });

          return {
            tool: toolName,
            success: true,
            message: `Marked task "${updated.title}" as ${updated.status}.`,
            data: updated,
          };
        }

        case 'delete_task': {
          const query = (args.taskTitleOrId || '').toLowerCase().trim();
          const task = await prisma.task.findFirst({
            where: {
              householdId,
              softDelete: false,
              OR: [
                { id: args.taskTitleOrId },
                { title: { contains: query } },
              ],
            },
          });

          if (!task) {
            return { tool: toolName, success: false, message: `Could not find task matching "${args.taskTitleOrId}".` };
          }

          await prisma.task.update({
            where: { id: task.id },
            data: { softDelete: true },
          });

          return {
            tool: toolName,
            success: true,
            message: `Deleted task "${task.title}".`,
            data: { id: task.id },
          };
        }

        // ==========================================
        // SHOPPING & GROCERIES
        // ==========================================
        case 'get_shopping_list': {
          const items = await prisma.groceryItem.findMany({
            where: { householdId, softDelete: false },
            orderBy: { name: 'asc' },
          });

          const lowStock = items.filter((i) => i.quantity <= (i.minThreshold || 1));
          const returnItems = args.onlyLowStock ? lowStock : items;

          return {
            tool: toolName,
            success: true,
            message: `Found ${returnItems.length} grocery items (${lowStock.length} low in stock).`,
            data: returnItems.map((i) => ({
              id: i.id,
              name: i.name,
              category: i.category,
              quantity: i.quantity,
              unit: i.unit,
              isLowStock: i.quantity <= (i.minThreshold || 1),
            })),
          };
        }

        case 'add_shopping_item': {
          if (!args.name) {
            return { tool: toolName, success: false, message: 'Item name is required.' };
          }

          const existing = await prisma.groceryItem.findFirst({
            where: {
              householdId,
              name: { equals: args.name.trim() },
              softDelete: false,
            },
          });

          if (existing) {
            const updated = await prisma.groceryItem.update({
              where: { id: existing.id },
              data: { quantity: existing.quantity + (parseFloat(args.quantity) || 1) },
            });
            return {
              tool: toolName,
              success: true,
              message: `Updated "${updated.name}" stock to ${updated.quantity} ${updated.unit}.`,
              data: updated,
            };
          }

          const item = await prisma.groceryItem.create({
            data: {
              householdId,
              name: args.name.trim(),
              category: args.category || 'Pantry Items',
              quantity: parseFloat(args.quantity) || 1,
              unit: args.unit || 'pcs',
              minThreshold: 1,
            },
          });

          return {
            tool: toolName,
            success: true,
            message: `Added "${item.name}" (${item.quantity} ${item.unit}) to shopping inventory.`,
            data: item,
          };
        }

        case 'update_grocery_quantity': {
          const query = (args.itemName || '').toLowerCase().trim();
          const item = await prisma.groceryItem.findFirst({
            where: {
              householdId,
              softDelete: false,
              name: { contains: query },
            },
          });

          if (!item) {
            return { tool: toolName, success: false, message: `Could not find grocery item "${args.itemName}".` };
          }

          const updated = await prisma.groceryItem.update({
            where: { id: item.id },
            data: { quantity: parseFloat(args.quantity) || 0 },
          });

          return {
            tool: toolName,
            success: true,
            message: `Updated "${updated.name}" quantity to ${updated.quantity} ${updated.unit}.`,
            data: updated,
          };
        }

        // ==========================================
        // FINANCE & BILLS
        // ==========================================
        case 'get_spending_summary': {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

          const [expenses, incomes, bills] = await Promise.all([
            prisma.expense.findMany({ where: { householdId, softDelete: false } }),
            prisma.income.findMany({ where: { householdId, softDelete: false } }),
            prisma.bill.findMany({ where: { householdId, softDelete: false } }),
          ]);

          const monthlyExpenses = expenses
            .filter((e) => new Date(e.date) >= startOfMonth)
            .reduce((acc, curr) => acc + curr.amount, 0);

          const monthlyIncome = incomes
            .filter((i) => new Date(i.date) >= startOfMonth)
            .reduce((acc, curr) => acc + curr.amount, 0);

          const unpaidBills = bills.filter((b) => b.status === 'UNPAID');
          const unpaidTotal = unpaidBills.reduce((acc, curr) => acc + curr.amount, 0);

          const categories: Record<string, number> = {};
          expenses
            .filter((e) => new Date(e.date) >= startOfMonth)
            .forEach((e) => {
              categories[e.category] = (categories[e.category] || 0) + e.amount;
            });

          return {
            tool: toolName,
            success: true,
            message: `Monthly income: ${currencySymbol}${monthlyIncome.toLocaleString()}, Monthly expenses: ${currencySymbol}${monthlyExpenses.toLocaleString()}, Net savings: ${currencySymbol}${(monthlyIncome - monthlyExpenses).toLocaleString()}.`,
            data: {
              monthlyIncome,
              monthlyExpenses,
              monthlySavings: monthlyIncome - monthlyExpenses,
              unpaidBillsTotal: unpaidTotal,
              unpaidBillsCount: unpaidBills.length,
              topCategories: categories,
            },
          };
        }

        case 'get_expenses': {
          const limit = typeof args.limit === 'number' ? args.limit : 10;
          const expenses = await prisma.expense.findMany({
            where: { householdId, softDelete: false },
            orderBy: { date: 'desc' },
            take: limit,
          });

          return {
            tool: toolName,
            success: true,
            message: `Retrieved ${expenses.length} recent expenses.`,
            data: expenses.map((e) => ({
              id: e.id,
              title: e.title,
              amount: `${currencySymbol}${e.amount}`,
              category: e.category,
              date: e.date.toISOString().split('T')[0],
            })),
          };
        }

        case 'add_expense': {
          if (!args.title || args.amount === undefined) {
            return { tool: toolName, success: false, message: 'Expense title and amount are required.' };
          }

          const expense = await prisma.expense.create({
            data: {
              householdId,
              userId,
              title: args.title.trim(),
              amount: parseFloat(args.amount) || 0,
              category: args.category || 'General',
              date: new Date(),
            },
          });

          return {
            tool: toolName,
            success: true,
            message: `Recorded expense: "${expense.title}" for ${currencySymbol}${expense.amount.toLocaleString()} in ${expense.category}.`,
            data: expense,
          };
        }

        case 'add_income': {
          if (!args.title || args.amount === undefined) {
            return { tool: toolName, success: false, message: 'Income title and amount are required.' };
          }

          const income = await prisma.income.create({
            data: {
              householdId,
              title: args.title.trim(),
              amount: parseFloat(args.amount) || 0,
              source: args.source || 'Salary',
              date: new Date(),
            },
          });

          return {
            tool: toolName,
            success: true,
            message: `Recorded income: "${income.title}" for ${currencySymbol}${income.amount.toLocaleString()} (${income.source}).`,
            data: income,
          };
        }

        case 'get_bills': {
          const whereClause: any = { householdId, softDelete: false };
          if (args.status && args.status !== 'ALL') {
            whereClause.status = args.status;
          }

          const bills = await prisma.bill.findMany({
            where: whereClause,
            orderBy: { dueDate: 'asc' },
          });

          return {
            tool: toolName,
            success: true,
            message: `Found ${bills.length} bills.`,
            data: bills.map((b) => ({
              id: b.id,
              title: b.title,
              category: b.category,
              amount: `${currencySymbol}${b.amount}`,
              status: b.status,
              dueDate: b.dueDate.toISOString().split('T')[0],
            })),
          };
        }

        case 'mark_bill_paid': {
          const query = (args.billTitleOrId || '').toLowerCase().trim();
          const bill = await prisma.bill.findFirst({
            where: {
              householdId,
              softDelete: false,
              OR: [
                { id: args.billTitleOrId },
                { title: { contains: query } },
              ],
            },
          });

          if (!bill) {
            return { tool: toolName, success: false, message: `Could not find bill matching "${args.billTitleOrId}".` };
          }

          const updated = await prisma.bill.update({
            where: { id: bill.id },
            data: { status: 'PAID', paidAt: new Date() },
          });

          return {
            tool: toolName,
            success: true,
            message: `Marked "${updated.title}" (${currencySymbol}${updated.amount}) as PAID.`,
            data: updated,
          };
        }

        // ==========================================
        // REMINDERS & NOTIFICATIONS
        // ==========================================
        case 'create_reminder': {
          if (!args.title || !args.message) {
            return { tool: toolName, success: false, message: 'Reminder title and message are required.' };
          }

          const notification = await prisma.notification.create({
            data: {
              householdId,
              title: args.title.trim(),
              message: args.message.trim(),
              type: args.type || 'AI_ALERT',
              isRead: false,
            },
          });

          return {
            tool: toolName,
            success: true,
            message: `Created reminder: "${notification.title}" - ${notification.message}`,
            data: notification,
          };
        }

        case 'get_reminders': {
          const notifications = await prisma.notification.findMany({
            where: { householdId, softDelete: false },
            orderBy: { createdAt: 'desc' },
            take: 10,
          });

          return {
            tool: toolName,
            success: true,
            message: `Found ${notifications.length} active reminders/alerts.`,
            data: notifications,
          };
        }

        // ==========================================
        // HOUSEHOLD & FAMILY
        // ==========================================
        case 'get_household_summary': {
          const [household, members, tasks, bills, groceries] = await Promise.all([
            prisma.household.findUnique({ where: { id: householdId } }),
            prisma.user.findMany({ where: { householdId, isActive: true }, select: { name: true, role: true } }),
            prisma.task.count({ where: { householdId, status: 'PENDING', softDelete: false } }),
            prisma.bill.count({ where: { householdId, status: 'UNPAID', softDelete: false } }),
            prisma.groceryItem.count({ where: { householdId, softDelete: false } }),
          ]);

          return {
            tool: toolName,
            success: true,
            message: `Household "${household?.name}" has ${members.length} members, ${tasks} pending tasks, ${bills} unpaid bills, and ${groceries} inventory items.`,
            data: {
              householdName: household?.name,
              members,
              pendingTasksCount: tasks,
              unpaidBillsCount: bills,
              inventoryItemsCount: groceries,
            },
          };
        }

        case 'get_family_members': {
          const members = await prisma.user.findMany({
            where: { householdId, isActive: true },
            select: { id: true, name: true, role: true, email: true, avatar: true },
          });

          return {
            tool: toolName,
            success: true,
            message: `Household has ${members.length} members.`,
            data: members,
          };
        }

        case 'get_appliances': {
          const appliances = await prisma.appliance.findMany({
            where: { householdId, softDelete: false },
          });

          return {
            tool: toolName,
            success: true,
            message: `Found ${appliances.length} registered household appliances.`,
            data: appliances.map((a) => ({
              id: a.id,
              name: a.name,
              brand: a.brand,
              warrantyYears: a.warrantyYears,
              purchaseDate: a.purchaseDate.toISOString().split('T')[0],
            })),
          };
        }

        case 'get_medicines': {
          const medicines = await prisma.medicine.findMany({
            where: { householdId, softDelete: false },
            include: { schedules: true },
          });

          return {
            tool: toolName,
            success: true,
            message: `Found ${medicines.length} medicines in the medicine cabinet.`,
            data: medicines.map((m) => ({
              id: m.id,
              name: m.name,
              dosage: m.dosage,
              stockCount: m.stockCount,
              schedules: m.schedules.map((s) => `${s.memberAssignee} at ${s.timeOfDay}`),
            })),
          };
        }

        // ==========================================
        // MEMORY
        // ==========================================
        case 'save_memory': {
          if (!args.content || typeof args.content !== 'string') {
            return { tool: toolName, success: false, message: 'Memory content is required.' };
          }

          const memory = await prisma.aIMemory.create({
            data: {
              householdId,
              userId,
              type: args.type || 'PREFERENCE',
              content: args.content.trim(),
              importance: args.importance || 'MEDIUM',
              source: 'CHAT',
              isActive: true,
            },
          });

          return {
            tool: toolName,
            success: true,
            message: `Saved memory: "${memory.content}"`,
            data: memory,
          };
        }

        case 'get_memories': {
          const memories = await prisma.aIMemory.findMany({
            where: { householdId, isActive: true },
            orderBy: { createdAt: 'desc' },
          });

          return {
            tool: toolName,
            success: true,
            message: `Retrieved ${memories.length} active household memories.`,
            data: memories.map((m) => ({
              id: m.id,
              type: m.type,
              content: m.content,
              importance: m.importance,
              createdAt: m.createdAt.toISOString().split('T')[0],
            })),
          };
        }

        default:
          return {
            tool: toolName,
            success: false,
            message: `Tool "${toolName}" is not implemented.`,
          };
      }
    } catch (error: any) {
      console.error(`Error executing tool "${toolName}":`, error);
      return {
        tool: toolName,
        success: false,
        message: `Failed to execute ${toolName}.`,
      };
    }
  }
}
