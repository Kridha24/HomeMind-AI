import { prisma } from '../../../repositories/db';
import { OutboxService } from '../../../infrastructure/outbox/outboxService';
import { EventType, roundMoney } from '@homemind/shared';
import { CreateExpenseDto, UpdateExpenseDto } from './expense.types';

export class ExpenseRepository {
  public static async findMany(householdId: string, userId: string, isMember: boolean) {
    const expenseWhereClause = isMember
      ? { householdId, userId, softDelete: false }
      : { householdId, softDelete: false };

    const incomeWhereClause = isMember
      ? { householdId, createdBy: userId, softDelete: false }
      : { householdId, softDelete: false };

    const [expenses, incomes, budgets] = await Promise.all([
      prisma.expense.findMany({
        where: expenseWhereClause,
        orderBy: { date: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.income.findMany({
        where: incomeWhereClause,
        orderBy: { date: 'desc' },
      }),
      prisma.budget.findMany({
        where: { householdId },
      }),
    ]);

    return { expenses, incomes, budgets };
  }

  public static async findById(id: string, householdId: string) {
    return prisma.expense.findFirst({
      where: { id, householdId, softDelete: false },
    });
  }

  public static async createAtomic(
    householdId: string,
    userId: string,
    dto: CreateExpenseDto
  ) {
    const roundedAmount = roundMoney(Number(dto.amount));
    const expenseDate = dto.date ? new Date(dto.date) : new Date();

    return prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          householdId,
          userId,
          title: dto.title,
          amount: roundedAmount,
          category: dto.category,
          date: expenseDate,
          isRecurring: dto.isRecurring || false,
          receiptUrl: dto.receiptUrl || null,
          createdBy: userId,
        },
      });

      await tx.transaction.create({
        data: {
          householdId,
          userId,
          amount: roundedAmount,
          currency: 'INR',
          type: 'DEBIT',
          merchant: dto.title,
          category: dto.category,
          paymentMethod: 'MANUAL',
          source: 'MANUAL',
          status: 'CONFIRMED',
          occurredAt: expenseDate,
          expenseId: expense.id,
        },
      });

      await OutboxService.recordEvent(tx, {
        eventType: EventType.EXPENSE_CREATED,
        aggregateType: 'Expense',
        aggregateId: expense.id,
        householdId,
        data: {
          id: expense.id,
          householdId,
          userId,
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          date: expense.date.toISOString(),
        },
      });

      return expense;
    });
  }

  public static async updateAtomic(
    id: string,
    householdId: string,
    dto: UpdateExpenseDto
  ) {
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.amount !== undefined) data.amount = roundMoney(Number(dto.amount));
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.date !== undefined) data.date = new Date(dto.date);
    if (dto.isRecurring !== undefined) data.isRecurring = dto.isRecurring;
    if (dto.receiptUrl !== undefined) data.receiptUrl = dto.receiptUrl;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.expense.update({
        where: { id },
        data,
      });

      // Mirror to linked Transaction if exists
      const txUpdate: any = {};
      if (dto.title !== undefined) txUpdate.merchant = dto.title;
      if (dto.amount !== undefined) txUpdate.amount = roundMoney(Number(dto.amount));
      if (dto.category !== undefined) txUpdate.category = dto.category;
      if (dto.date !== undefined) txUpdate.occurredAt = new Date(dto.date);
      if (Object.keys(txUpdate).length > 0) {
        await tx.transaction.updateMany({
          where: { expenseId: id },
          data: txUpdate,
        });
      }

      await OutboxService.recordEvent(tx, {
        eventType: EventType.EXPENSE_UPDATED,
        aggregateType: 'Expense',
        aggregateId: updated.id,
        householdId,
        data: {
          id: updated.id,
          householdId,
          title: updated.title,
          amount: updated.amount,
          category: updated.category,
        },
      });

      return updated;
    });
  }

  public static async deleteAtomic(id: string, householdId: string) {
    return prisma.$transaction(async (tx) => {
      // Soft-delete linked transaction if present
      await tx.transaction.updateMany({
        where: { expenseId: id },
        data: { softDelete: true },
      });

      const deleted = await tx.expense.delete({
        where: { id },
      });

      await OutboxService.recordEvent(tx, {
        eventType: EventType.EXPENSE_DELETED,
        aggregateType: 'Expense',
        aggregateId: id,
        householdId,
        data: { id, householdId },
      });

      return deleted;
    });
  }
}
