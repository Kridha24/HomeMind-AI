import { prisma } from '../../repositories/db';
import { ExpenseService } from '../finance/expenses/expense.service';
import { IncomeService } from '../finance/income/income.service';
import { BillService } from '../bills/bill.service';
import { AnalyticsService } from '../analytics/analytics.service';
import {
  CopilotToolName,
  CopilotExecutionContext,
  CopilotToolResult,
  ActionCardData,
} from './copilot.types';

export class ActionExecutor {
  /**
   * Safe Audit Logger
   * Never logs raw private prompts. Only logs structured action, entity, and sanitized metadata.
   */
  private static async logAudit(
    householdId: string,
    userId: string,
    action: string,
    entity: string,
    detailsObj: Record<string, any>
  ) {
    try {
      await prisma.auditLog.create({
        data: {
          householdId,
          performedBy: userId,
          action,
          entity,
          details: JSON.stringify(detailsObj),
        },
      });
    } catch (e) {
      console.warn('[Copilot Audit] Failed to record audit log:', e);
    }
  }

  /**
   * Idempotency Guard
   */
  public static async executeWithIdempotency(
    toolName: CopilotToolName,
    args: Record<string, any>,
    ctx: CopilotExecutionContext
  ): Promise<CopilotToolResult> {
    const { householdId, idempotencyKey } = ctx;

    if (idempotencyKey) {
      const existing = await prisma.idempotencyRecord.findUnique({
        where: { householdId_key: { householdId, key: idempotencyKey } },
      });

      if (existing && existing.status === 'COMPLETED' && existing.responseBody) {
        try {
          return JSON.parse(existing.responseBody) as CopilotToolResult;
        } catch {
          // Fall through to execute if parse fails
        }
      }

      if (!existing) {
        await prisma.idempotencyRecord.create({
          data: {
            householdId,
            key: idempotencyKey,
            requestHash: `${toolName}:${JSON.stringify(args)}`,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours TTL
          },
        });
      }
    }

    const result = await this.execute(toolName, args, ctx);

    if (idempotencyKey) {
      try {
        await prisma.idempotencyRecord.update({
          where: { householdId_key: { householdId, key: idempotencyKey } },
          data: {
            status: result.success ? 'COMPLETED' : 'FAILED',
            responseCode: result.success ? 200 : 400,
            responseBody: JSON.stringify(result),
          },
        });
      } catch (e) {
        console.warn('[Copilot Idempotency] Failed to update idempotency record:', e);
      }
    }

    return result;
  }

  /**
   * Core Tool Execution Dispatcher
   */
  public static async execute(
    toolName: CopilotToolName,
    args: Record<string, any>,
    ctx: CopilotExecutionContext
  ): Promise<CopilotToolResult> {
    const { householdId, userId, currencySymbol } = ctx;

    try {
      switch (toolName) {
        // ==========================================
        // 1. EXPENSES
        // ==========================================
        case 'createExpense': {
          const amount = parseFloat(args.amount);
          if (!amount || amount <= 0) {
            return {
              tool: toolName,
              success: false,
              message: 'Invalid expense amount.',
            };
          }

          const title = (args.title || 'General Expense').trim();
          const category = args.category || 'General';
          const date = args.date ? new Date(args.date) : new Date();

          // Execute via canonical ExpenseService
          const expense = await ExpenseService.createExpense(householdId, userId, {
            title,
            amount,
            category,
            date,
          });

          await this.logAudit(householdId, userId, 'CREATE', 'Expense', {
            id: expense.id,
            amount,
            category,
            title,
          });

          const card: ActionCardData = {
            type: 'expense',
            title,
            amount,
            formattedAmount: `${currencySymbol}${amount.toLocaleString()}`,
            category,
            date: date.toISOString().split('T')[0],
            status: 'Recorded',
            linkUrl: '/expenses',
            linkText: 'View Expense',
          };

          return {
            tool: toolName,
            success: true,
            message: `Recorded expense of ${currencySymbol}${amount.toLocaleString()} for "${title}" in ${category}.`,
            data: expense,
            card,
            invalidatedKeys: ['expenses', 'finance', 'analytics', 'dashboard'],
          };
        }

        case 'updateExpense': {
          const id = args.id;
          const amount = args.amount !== undefined ? parseFloat(args.amount) : undefined;
          const title = args.title;

          let targetId = id;
          if (!targetId) {
            // Find most recent expense in household created by this user
            const recent = await prisma.expense.findFirst({
              where: { householdId, userId, softDelete: false },
              orderBy: { createdAt: 'desc' },
            });
            if (recent) targetId = recent.id;
          }

          if (!targetId) {
            return {
              tool: toolName,
              success: false,
              message: 'Could not find a recent expense to update.',
            };
          }

          const updated = await ExpenseService.updateExpense(targetId, householdId, {
            amount,
            title,
          });

          await this.logAudit(householdId, userId, 'UPDATE', 'Expense', {
            id: targetId,
            newAmount: amount,
          });

          const card: ActionCardData = {
            type: 'expense',
            title: updated.title,
            amount: updated.amount,
            formattedAmount: `${currencySymbol}${updated.amount.toLocaleString()}`,
            category: updated.category,
            status: 'Updated',
            linkUrl: '/expenses',
            linkText: 'View Expense',
          };

          return {
            tool: toolName,
            success: true,
            message: `Updated expense "${updated.title}" amount to ${currencySymbol}${updated.amount.toLocaleString()}.`,
            data: updated,
            card,
            invalidatedKeys: ['expenses', 'finance', 'analytics', 'dashboard'],
          };
        }

        case 'deleteExpense': {
          let targetId = args.id;
          if (!targetId && args.amount) {
            const match = await prisma.expense.findFirst({
              where: { householdId, amount: parseFloat(args.amount), softDelete: false },
              orderBy: { createdAt: 'desc' },
            });
            if (match) targetId = match.id;
          }

          if (!targetId) {
            return {
              tool: toolName,
              success: false,
              message: 'Could not find the specified expense to delete.',
            };
          }

          const deleted = await ExpenseService.deleteExpense(targetId, householdId);
          await this.logAudit(householdId, userId, 'DELETE', 'Expense', { id: targetId });

          return {
            tool: toolName,
            success: true,
            message: `Deleted expense "${deleted.title}" (${currencySymbol}${deleted.amount}).`,
            data: deleted,
            invalidatedKeys: ['expenses', 'finance', 'analytics', 'dashboard'],
          };
        }

        // ==========================================
        // 2. INCOME
        // ==========================================
        case 'createIncome': {
          const amount = parseFloat(args.amount);
          if (!amount || amount <= 0) {
            return {
              tool: toolName,
              success: false,
              message: 'Invalid income amount.',
            };
          }

          const title = (args.title || 'Income Received').trim();
          const source = args.source || 'Other';
          const date = args.date ? new Date(args.date) : new Date();

          const income = await IncomeService.createIncome(householdId, userId, {
            title,
            amount,
            source,
            date,
          });

          await this.logAudit(householdId, userId, 'CREATE', 'Income', {
            id: income.id,
            amount,
            source,
            title,
          });

          const card: ActionCardData = {
            type: 'income',
            title,
            amount,
            formattedAmount: `+${currencySymbol}${amount.toLocaleString()}`,
            category: source,
            date: date.toISOString().split('T')[0],
            status: 'Credited',
            linkUrl: '/finance',
            linkText: 'View Income',
          };

          return {
            tool: toolName,
            success: true,
            message: `Recorded income of ${currencySymbol}${amount.toLocaleString()} from ${source}.`,
            data: income,
            card,
            invalidatedKeys: ['income', 'finance', 'analytics', 'dashboard'],
          };
        }

        // ==========================================
        // 3. BILLS
        // ==========================================
        case 'createBill': {
          const amount = parseFloat(args.amount) || 0;
          const title = (args.title || 'Household Bill').trim();
          const category = args.category || 'Utilities';
          const dueDate = args.dueDate ? new Date(args.dueDate) : new Date();

          const bill = await BillService.createBill(householdId, userId, {
            title,
            amount,
            category,
            dueDate,
          });

          await this.logAudit(householdId, userId, 'CREATE', 'Bill', {
            id: bill.id,
            title,
            amount,
          });

          const card: ActionCardData = {
            type: 'bill',
            title,
            amount,
            formattedAmount: `${currencySymbol}${amount.toLocaleString()}`,
            category,
            date: dueDate.toISOString().split('T')[0],
            status: 'Scheduled',
            linkUrl: '/bills',
            linkText: 'View Bill',
          };

          return {
            tool: toolName,
            success: true,
            message: `Created bill "${title}" for ${currencySymbol}${amount.toLocaleString()} due on ${dueDate.toLocaleDateString()}.`,
            data: bill,
            card,
            invalidatedKeys: ['bills', 'analytics', 'dashboard'],
          };
        }

        case 'markBillPaid': {
          const query = (args.query || '').toLowerCase().trim();

          // Find candidate bills in active household
          const matchingBills = await prisma.bill.findMany({
            where: {
              householdId,
              softDelete: false,
              status: 'UNPAID',
              OR: [
                { title: { contains: query } },
                { category: { contains: query } },
              ],
            },
            orderBy: { dueDate: 'asc' },
          });

          if (matchingBills.length === 0) {
            // Check if already paid
            const paidBill = await prisma.bill.findFirst({
              where: {
                householdId,
                softDelete: false,
                status: 'PAID',
                title: { contains: query },
              },
            });
            if (paidBill) {
              return {
                tool: toolName,
                success: true,
                message: `Bill "${paidBill.title}" is already marked as PAID.`,
                card: {
                  type: 'bill',
                  title: paidBill.title,
                  amount: paidBill.amount,
                  status: 'PAID',
                  linkUrl: '/bills',
                  linkText: 'View Bills',
                },
              };
            }

            return {
              tool: toolName,
              success: false,
              message: `Could not find an unpaid bill matching "${query}".`,
            };
          }

          // If multiple matches, do not guess!
          if (matchingBills.length > 1) {
            const options = matchingBills.map((b) => ({
              label: `${b.title} (${currencySymbol}${b.amount}, Due: ${b.dueDate.toISOString().split('T')[0]})`,
              text: `Mark "${b.title}" paid`,
              action: b.id,
            }));

            return {
              tool: toolName,
              success: false,
              message: `Multiple matching bills found for "${query}". Which bill would you like to mark as paid?`,
              card: {
                type: 'clarification',
                title: 'Select Bill to Pay',
                options,
              },
            };
          }

          // Exactly one match found
          const targetBill = matchingBills[0];
          const updated = await BillService.markBillPaid(targetBill.id, householdId, userId, {
            amount: targetBill.amount,
            paidDate: new Date(),
          });

          await this.logAudit(householdId, userId, 'UPDATE', 'Bill', {
            id: targetBill.id,
            status: 'PAID',
          });

          const card: ActionCardData = {
            type: 'bill',
            title: updated.title,
            amount: updated.amount,
            formattedAmount: `${currencySymbol}${updated.amount.toLocaleString()}`,
            category: updated.category,
            status: 'PAID',
            linkUrl: '/bills',
            linkText: 'View Bills',
          };

          return {
            tool: toolName,
            success: true,
            message: `Marked "${updated.title}" (${currencySymbol}${updated.amount.toLocaleString()}) as PAID.`,
            data: updated,
            card,
            invalidatedKeys: ['bills', 'expenses', 'finance', 'analytics', 'dashboard'],
          };
        }

        // ==========================================
        // 4. TASKS
        // ==========================================
        case 'createTask': {
          const title = (args.title || 'Household Task').trim();
          const priority = args.priority || 'MEDIUM';
          const dueDate = args.dueDate ? new Date(args.dueDate) : new Date();

          // Household Isolation: Verify assignee belongs to the same household
          let assigneeId: string | null = null;
          if (args.assigneeId) {
            const member = await prisma.user.findFirst({
              where: { id: args.assigneeId, householdId, isActive: true },
            });
            if (member) assigneeId = member.id;
          }

          const task = await prisma.task.create({
            data: {
              householdId,
              creatorId: userId,
              assigneeId,
              title,
              priority,
              status: 'PENDING',
              dueDate,
            },
            include: {
              assignee: { select: { id: true, name: true } },
            },
          });

          await this.logAudit(householdId, userId, 'CREATE', 'Task', {
            id: task.id,
            title,
            assigneeId,
          });

          const card: ActionCardData = {
            type: 'task',
            title,
            subtitle: task.assignee ? `Assigned to ${task.assignee.name}` : 'Unassigned',
            date: dueDate.toISOString().split('T')[0],
            status: 'PENDING',
            linkUrl: '/tasks',
            linkText: 'View Task',
          };

          return {
            tool: toolName,
            success: true,
            message: `Created task "${title}" due on ${dueDate.toLocaleDateString()}${task.assignee ? ` (Assigned to ${task.assignee.name})` : ''}.`,
            data: task,
            card,
            invalidatedKeys: ['tasks', 'analytics', 'dashboard'],
          };
        }

        case 'completeTask': {
          const query = (args.query || '').toLowerCase().trim();
          const task = await prisma.task.findFirst({
            where: {
              householdId,
              softDelete: false,
              status: 'PENDING',
              OR: [
                { id: args.query },
                { title: { contains: query } },
              ],
            },
          });

          if (!task) {
            return {
              tool: toolName,
              success: false,
              message: `Could not find an active task matching "${query}".`,
            };
          }

          const updated = await prisma.task.update({
            where: { id: task.id },
            data: { status: 'COMPLETED' },
          });

          await this.logAudit(householdId, userId, 'UPDATE', 'Task', {
            id: task.id,
            status: 'COMPLETED',
          });

          const card: ActionCardData = {
            type: 'task',
            title: updated.title,
            status: 'COMPLETED',
            linkUrl: '/tasks',
            linkText: 'View Tasks',
          };

          return {
            tool: toolName,
            success: true,
            message: `Marked task "${updated.title}" as completed.`,
            data: updated,
            card,
            invalidatedKeys: ['tasks', 'analytics', 'dashboard'],
          };
        }

        case 'deleteTask': {
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
            return {
              tool: toolName,
              success: false,
              message: `Could not find task matching "${args.taskTitleOrId}".`,
            };
          }

          await prisma.task.update({
            where: { id: task.id },
            data: { softDelete: true },
          });

          await this.logAudit(householdId, userId, 'DELETE', 'Task', { id: task.id });

          return {
            tool: toolName,
            success: true,
            message: `Deleted task "${task.title}".`,
            data: { id: task.id },
            invalidatedKeys: ['tasks', 'analytics', 'dashboard'],
          };
        }

        // ==========================================
        // 5. GROCERIES (Supports single or multi-item)
        // ==========================================
        case 'addGroceryItem': {
          const itemsInput: Array<{ name: string; quantity?: number; unit?: string; category?: string }> =
            args.items || [{ name: args.name, quantity: args.quantity, unit: args.unit, category: args.category }];

          const createdItems: any[] = [];
          for (const item of itemsInput) {
            if (!item.name || item.name.trim().length === 0) continue;
            const cleanName = item.name.trim();

            const existing = await prisma.groceryItem.findFirst({
              where: {
                householdId,
                name: { equals: cleanName },
                softDelete: false,
              },
            });

            if (existing) {
              const updated = await prisma.groceryItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + (item.quantity || 1) },
              });
              createdItems.push(updated);
            } else {
              const newItem = await prisma.groceryItem.create({
                data: {
                  householdId,
                  name: cleanName,
                  category: item.category || 'Pantry Items',
                  quantity: item.quantity || 1,
                  unit: item.unit || 'pcs',
                  minThreshold: 1,
                },
              });
              createdItems.push(newItem);
            }
          }

          await this.logAudit(householdId, userId, 'CREATE', 'GroceryItem', {
            count: createdItems.length,
            names: createdItems.map((i) => i.name),
          });

          const itemNames = createdItems.map((i) => i.name);
          const card: ActionCardData = {
            type: 'grocery',
            title: createdItems.length === 1 ? createdItems[0].name : `${createdItems.length} Grocery Items`,
            items: itemNames,
            status: 'Added to List',
            linkUrl: '/groceries',
            linkText: 'View Groceries',
          };

          return {
            tool: toolName,
            success: true,
            message:
              createdItems.length === 1
                ? `Added "${createdItems[0].name}" to your grocery list.`
                : `Added ${createdItems.length} items (${itemNames.join(', ')}) to your grocery list.`,
            data: createdItems,
            card,
            invalidatedKeys: ['groceries', 'analytics', 'dashboard'],
          };
        }

        // ==========================================
        // 6. QUERIES (Read-Only Live Household DB)
        // ==========================================
        case 'getFinanceSummary': {
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

          return {
            tool: toolName,
            success: true,
            message: `This month: Income ${currencySymbol}${monthlyIncome.toLocaleString()}, Expenses ${currencySymbol}${monthlyExpenses.toLocaleString()}, Net Savings ${currencySymbol}${(monthlyIncome - monthlyExpenses).toLocaleString()}.`,
            data: {
              monthlyIncome,
              monthlyExpenses,
              netSavings: monthlyIncome - monthlyExpenses,
              unpaidBillsTotal: unpaidTotal,
              unpaidBillsCount: unpaidBills.length,
            },
          };
        }

        case 'getBills': {
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
              amount: `${currencySymbol}${b.amount.toLocaleString()}`,
              status: b.status,
              dueDate: b.dueDate.toISOString().split('T')[0],
            })),
          };
        }

        case 'getTasks': {
          const whereClause: any = { householdId, softDelete: false };
          if (args.status && args.status !== 'ALL') {
            whereClause.status = args.status;
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

        case 'getGroceries': {
          const items = await prisma.groceryItem.findMany({
            where: { householdId, softDelete: false },
            orderBy: { name: 'asc' },
          });

          const lowStock = items.filter((i) => i.quantity <= (i.minThreshold || 1));
          const list = args.onlyLowStock ? lowStock : items;

          return {
            tool: toolName,
            success: true,
            message: `Found ${list.length} grocery items (${lowStock.length} low in stock).`,
            data: list.map((i) => ({
              id: i.id,
              name: i.name,
              quantity: i.quantity,
              unit: i.unit,
              isLowStock: i.quantity <= (i.minThreshold || 1),
            })),
          };
        }

        case 'getAnalytics': {
          const analytics = await AnalyticsService.getHouseholdAnalytics(householdId, {
            period: 'month',
          });

          return {
            tool: toolName,
            success: true,
            message: `Monthly savings rate: ${analytics.finance.savingsRate !== null ? `${analytics.finance.savingsRate}%` : 'N/A'}. Top category: ${analytics.categories.expenses[0]?.category || 'None'}.`,
            data: analytics,
          };
        }

        default:
          return {
            tool: toolName,
            success: false,
            message: `Tool "${toolName}" is not registered or supported.`,
          };
      }
    } catch (err: any) {
      console.error(`[ActionExecutor] Error executing ${toolName}:`, err);
      return {
        tool: toolName,
        success: false,
        message: `Couldn't complete action. Reason: ${err.message || 'Service failure'}`,
      };
    }
  }
}
