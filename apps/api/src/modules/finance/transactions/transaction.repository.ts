import { prisma } from '../../../repositories/db';
import { OutboxService } from '../../../infrastructure/outbox/outboxService';
import { EventType } from '@homemind/shared';
import { GetTransactionsQuery, ImportSmsTransactionDto } from './transaction.types';

export class TransactionRepository {
  public static async findBySourceHash(sourceHash: string, householdId: string) {
    return prisma.transaction.findFirst({
      where: { sourceHash, householdId },
      include: { expense: true, income: true },
    });
  }

  public static async findById(id: string, householdId: string) {
    return prisma.transaction.findFirst({
      where: { id, householdId, softDelete: false },
      include: { expense: true, income: true },
    });
  }

  /**
   * Atomic Transactional Write:
   * 1. Creates linked Expense or Income (if CONFIRMED)
   * 2. Creates Transaction record
   * 3. Creates OutboxEvent record
   * All wrapped in a single database transaction.
   */
  public static async createAtomicTransaction(params: {
    userId: string;
    householdId: string;
    dto: ImportSmsTransactionDto;
    sourceHash: string;
    finalCategory: string;
    finalStatus: 'CONFIRMED' | 'NEEDS_REVIEW' | 'IGNORED';
    occurredAt: Date;
    confidence: number;
  }) {
    const { userId, householdId, dto, sourceHash, finalCategory, finalStatus, occurredAt, confidence } = params;

    return prisma.$transaction(async (tx) => {
      let linkedExpenseId: string | null = null;
      let linkedIncomeId: string | null = null;

      // 1. Linked Expense or Income if confirmed
      if (finalStatus === 'CONFIRMED') {
        if (dto.type === 'DEBIT') {
          const title = dto.merchant?.trim() || (dto.bankName ? `${dto.bankName} Debit` : 'Bank Debit');
          const expense = await tx.expense.create({
            data: {
              householdId,
              userId,
              title,
              amount: dto.amount,
              category: finalCategory || 'Other',
              date: occurredAt,
              isRecurring: false,
              createdBy: userId,
            },
          });
          linkedExpenseId = expense.id;

          // Outbox event for Expense
          await OutboxService.recordEvent(tx, {
            eventType: EventType.EXPENSE_CREATED,
            aggregateType: 'Expense',
            aggregateId: expense.id,
            householdId,
            data: {
              id: expense.id,
              householdId,
              userId,
              title,
              amount: dto.amount,
              category: finalCategory,
              date: occurredAt.toISOString(),
            },
          });
        } else {
          const title = dto.merchant?.trim() || (dto.bankName ? `${dto.bankName} Credit` : 'Bank Deposit');
          const income = await tx.income.create({
            data: {
              householdId,
              title,
              amount: dto.amount,
              source: finalCategory || 'Deposit',
              date: occurredAt,
              createdBy: userId,
            },
          });
          linkedIncomeId = income.id;

          // Outbox event for Income
          await OutboxService.recordEvent(tx, {
            eventType: EventType.INCOME_CREATED,
            aggregateType: 'Income',
            aggregateId: income.id,
            householdId,
            data: {
              id: income.id,
              householdId,
              userId,
              title,
              amount: dto.amount,
              source: finalCategory,
              date: occurredAt.toISOString(),
            },
          });
        }
      }

      // 2. Create Transaction
      const transaction = await tx.transaction.create({
        data: {
          householdId,
          userId,
          amount: dto.amount,
          currency: dto.currency || 'INR',
          type: dto.type,
          merchant: dto.merchant?.trim() || null,
          category: finalCategory,
          paymentMethod: dto.paymentMethod || 'UPI',
          accountLast4: dto.accountLast4 || null,
          bankName: dto.bankName || null,
          reference: dto.reference || null,
          source: 'SMS',
          sourceHash,
          parserConfidence: confidence,
          status: finalStatus,
          expenseId: linkedExpenseId,
          incomeId: linkedIncomeId,
          occurredAt,
          rawSender: dto.rawSender || null,
        },
        include: {
          expense: true,
          income: true,
        },
      });

      // 3. Outbox Event for Transaction
      await OutboxService.recordEvent(tx, {
        eventType: EventType.TRANSACTION_CREATED,
        aggregateType: 'Transaction',
        aggregateId: transaction.id,
        householdId,
        data: {
          id: transaction.id,
          householdId,
          userId,
          amount: dto.amount,
          currency: transaction.currency,
          type: transaction.type,
          merchant: transaction.merchant,
          category: finalCategory,
          status: finalStatus,
          occurredAt: occurredAt.toISOString(),
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          householdId,
          action: 'SMS_TRANSACTION_IMPORTED',
          entity: 'Transaction',
          details: `Imported ${dto.type} ₹${dto.amount} (${transaction.merchant || transaction.bankName || 'SMS'}) with status: ${finalStatus}`,
          performedBy: userId,
        },
      });

      return transaction;
    });
  }

  public static async syncLegacyRecords(householdId: string) {
    try {
      const expensesWithoutTx = await prisma.expense.findMany({
        where: { householdId, transaction: null, softDelete: false },
        take: 200,
      });

      for (const exp of expensesWithoutTx) {
        try {
          await prisma.transaction.create({
            data: {
              householdId: exp.householdId,
              userId: exp.userId,
              amount: exp.amount,
              currency: 'INR',
              type: 'DEBIT',
              merchant: exp.title,
              category: exp.category,
              paymentMethod: 'MANUAL',
              source: 'MANUAL',
              status: 'CONFIRMED',
              occurredAt: exp.date,
              expenseId: exp.id,
              softDelete: exp.softDelete,
            },
          });
        } catch {
          // ignore unique collision if concurrent
        }
      }

      const incomesWithoutTx = await prisma.income.findMany({
        where: { householdId, transaction: null, softDelete: false },
        take: 200,
      });

      for (const inc of incomesWithoutTx) {
        try {
          await prisma.transaction.create({
            data: {
              householdId: inc.householdId,
              userId: inc.createdBy || inc.householdId,
              amount: inc.amount,
              currency: 'INR',
              type: 'CREDIT',
              merchant: inc.title,
              category: inc.source,
              paymentMethod: 'MANUAL',
              source: 'MANUAL',
              status: 'CONFIRMED',
              occurredAt: inc.date,
              incomeId: inc.id,
              softDelete: inc.softDelete,
            },
          });
        } catch {
          // ignore unique collision
        }
      }
    } catch (err: any) {
      console.warn('[TransactionRepository.syncLegacyRecords] Sync notice:', err.message);
    }
  }

  public static async findMany(
    householdId: string,
    userId: string,
    role: string,
    query: GetTransactionsQuery
  ) {
    // Keep legacy records unified
    await this.syncLegacyRecords(householdId);

    const isMember = role === 'MEMBER';
    const where: any = {
      householdId,
      softDelete: false,
    };

    if (isMember) {
      where.userId = userId;
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.type && query.type !== 'ALL') {
      where.type = query.type;
    }

    if (query.category && query.category !== 'ALL') {
      where.category = query.category;
    }

    if (query.source && query.source !== 'ALL') {
      where.source = query.source;
    }

    if (query.paymentMethod && query.paymentMethod !== 'ALL') {
      where.paymentMethod = query.paymentMethod;
    }

    if (query.startDate || query.endDate) {
      where.occurredAt = {};
      if (query.startDate) where.occurredAt.gte = new Date(query.startDate);
      if (query.endDate) where.occurredAt.lte = new Date(query.endDate);
    }

    if (query.minAmount !== undefined || query.maxAmount !== undefined) {
      where.amount = {};
      if (query.minAmount !== undefined) where.amount.gte = Number(query.minAmount);
      if (query.maxAmount !== undefined) where.amount.lte = Number(query.maxAmount);
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { merchant: { contains: term } },
        { category: { contains: term } },
        { bankName: { contains: term } },
        { reference: { contains: term } },
      ];
    }

    const limit = Math.min(query.limit || 50, 100);
    const offset = query.offset || 0;

    const sortBy = query.sortBy || 'occurredAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: any = {};
    if (sortBy === 'amount') orderBy.amount = sortOrder;
    else if (sortBy === 'merchant') orderBy.merchant = sortOrder;
    else orderBy.occurredAt = sortOrder;

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          expense: true,
          income: true,
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
    ]);

    return { total, limit, offset, transactions };
  }

  public static async update(id: string, data: any) {
    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.merchant !== undefined) updateData.merchant = data.merchant;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.occurredAt !== undefined) updateData.occurredAt = new Date(data.occurredAt);

    const tx = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: { expense: true, income: true },
    });

    // Mirror updates to linked Expense or Income
    if (tx.expenseId) {
      const expUpdate: any = {};
      if (data.category !== undefined) expUpdate.category = data.category;
      if (data.merchant !== undefined) expUpdate.title = data.merchant;
      if (data.amount !== undefined) expUpdate.amount = data.amount;
      if (data.occurredAt !== undefined) expUpdate.date = new Date(data.occurredAt);
      if (Object.keys(expUpdate).length > 0) {
        await prisma.expense.update({ where: { id: tx.expenseId }, data: expUpdate }).catch(() => {});
      }
    }

    if (tx.incomeId) {
      const incUpdate: any = {};
      if (data.category !== undefined) incUpdate.source = data.category;
      if (data.merchant !== undefined) incUpdate.title = data.merchant;
      if (data.amount !== undefined) incUpdate.amount = data.amount;
      if (data.occurredAt !== undefined) incUpdate.date = new Date(data.occurredAt);
      if (Object.keys(incUpdate).length > 0) {
        await prisma.income.update({ where: { id: tx.incomeId }, data: incUpdate }).catch(() => {});
      }
    }

    return tx;
  }

  public static async softDelete(id: string) {
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (tx?.expenseId) {
      await prisma.expense.update({ where: { id: tx.expenseId }, data: { softDelete: true } }).catch(() => {});
    }
    if (tx?.incomeId) {
      await prisma.income.update({ where: { id: tx.incomeId }, data: { softDelete: true } }).catch(() => {});
    }
    return prisma.transaction.update({
      where: { id },
      data: { softDelete: true },
    });
  }

  public static async getStats(householdId: string, userId: string, role: string) {
    await this.syncLegacyRecords(householdId);

    const isMember = role === 'MEMBER';
    const where: any = { householdId, softDelete: false };
    if (isMember) {
      where.userId = userId;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthWhere = {
      ...where,
      occurredAt: { gte: startOfMonth, lte: endOfMonth },
    };

    const [
      allTxns,
      debitAggregate,
      creditAggregate,
      monthDebitAggregate,
      monthCreditAggregate,
      largestExpenseTx,
      categoryGroups,
    ] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'DEBIT', status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'CREDIT', status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...monthWhere, type: 'DEBIT', status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...monthWhere, type: 'CREDIT', status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      prisma.transaction.findFirst({
        where: { ...monthWhere, type: 'DEBIT', status: 'CONFIRMED' },
        orderBy: { amount: 'desc' },
        select: { amount: true, merchant: true },
      }),
      prisma.transaction.groupBy({
        by: ['category'],
        where: { ...monthWhere, type: 'DEBIT', status: 'CONFIRMED' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    let totalCount = 0;
    let confirmedCount = 0;
    let needsReviewCount = 0;
    let ignoredCount = 0;

    for (const group of allTxns) {
      totalCount += group._count._all;
      if (group.status === 'CONFIRMED') confirmedCount = group._count._all;
      else if (group.status === 'NEEDS_REVIEW') needsReviewCount = group._count._all;
      else if (group.status === 'IGNORED') ignoredCount = group._count._all;
    }

    const thisMonthSpent = monthDebitAggregate._sum.amount || 0;
    const thisMonthIncome = monthCreditAggregate._sum.amount || 0;
    const netCashFlow = thisMonthIncome - thisMonthSpent;

    let largestExpense = largestExpenseTx
      ? { amount: largestExpenseTx.amount, merchant: largestExpenseTx.merchant || 'Expense' }
      : null;

    if (!largestExpense) {
      const allTimeLargest = await prisma.transaction.findFirst({
        where: { ...where, type: 'DEBIT', status: 'CONFIRMED' },
        orderBy: { amount: 'desc' },
        select: { amount: true, merchant: true },
      });
      if (allTimeLargest) {
        largestExpense = { amount: allTimeLargest.amount, merchant: allTimeLargest.merchant || 'Expense' };
      }
    }

    const categoryBreakdown = categoryGroups
      .map((g) => {
        const catAmount = g._sum.amount || 0;
        const percentage = thisMonthSpent > 0 ? Math.round((catAmount / thisMonthSpent) * 100) : 0;
        return {
          category: g.category || 'Other',
          amount: catAmount,
          count: g._count._all,
          percentage,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return {
      totalCount,
      confirmedCount,
      needsReviewCount,
      ignoredCount,
      totalDebitSum: debitAggregate._sum.amount || 0,
      totalCreditSum: creditAggregate._sum.amount || 0,
      thisMonthSpent,
      thisMonthIncome,
      netCashFlow,
      largestExpense,
      categoryBreakdown,
    };
  }
}
