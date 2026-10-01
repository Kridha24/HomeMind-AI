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

  public static async findMany(
    householdId: string,
    userId: string,
    role: string,
    query: GetTransactionsQuery
  ) {
    const isMember = role === 'MEMBER';
    const where: any = {
      householdId,
      softDelete: false,
    };

    if (isMember) {
      where.userId = userId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      where.OR = [
        { merchant: { contains: query.search } },
        { category: { contains: query.search } },
        { bankName: { contains: query.search } },
        { reference: { contains: query.search } },
      ];
    }

    const limit = Math.min(query.limit || 50, 100);
    const offset = query.offset || 0;

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
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
    return prisma.transaction.update({
      where: { id },
      data,
      include: { expense: true, income: true },
    });
  }

  public static async softDelete(id: string) {
    return prisma.transaction.update({
      where: { id },
      data: { softDelete: true },
    });
  }

  public static async getStats(householdId: string, userId: string, role: string) {
    const isMember = role === 'MEMBER';
    const where: any = { householdId, softDelete: false };
    if (isMember) {
      where.userId = userId;
    }

    const [allTxns, debitAggregate, creditAggregate] = await Promise.all([
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

    return {
      totalCount,
      confirmedCount,
      needsReviewCount,
      ignoredCount,
      totalDebitSum: debitAggregate._sum.amount || 0,
      totalCreditSum: creditAggregate._sum.amount || 0,
    };
  }
}
