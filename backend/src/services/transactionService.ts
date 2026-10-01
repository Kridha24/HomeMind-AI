import { prisma } from '../repositories/db';
import { generateTransactionFingerprint } from '../utils/transactionFingerprint';
import { TransactionCategorizer } from './transactionCategorizer';

export interface ImportSmsTransactionDto {
  amount: number;
  currency?: string;
  type: 'DEBIT' | 'CREDIT';
  merchant?: string | null;
  category?: string | null;
  paymentMethod?: string | null;
  accountLast4?: string | null;
  bankName?: string | null;
  reference?: string | null;
  occurredAt: string | Date;
  sourceHash?: string | null;
  parserConfidence?: number | null;
  rawSender?: string | null;
  status?: 'CONFIRMED' | 'NEEDS_REVIEW' | 'IGNORED';
}

export class TransactionService {
  /**
   * Import a normalized SMS transaction with deduplication, audit logging,
   * and auto-sync with HomeMind Expense / Income models.
   */
  static async importSmsTransaction(
    userId: string,
    householdId: string,
    dto: ImportSmsTransactionDto
  ) {
    const occurredAt = new Date(dto.occurredAt);
    const validOccurredAt = isNaN(occurredAt.getTime()) ? new Date() : occurredAt;

    // 1. Compute or verify deterministic sourceHash for duplicate prevention
    const sourceHash = dto.sourceHash && dto.sourceHash.length === 64
      ? dto.sourceHash
      : generateTransactionFingerprint({
          sender: dto.rawSender || dto.bankName || undefined,
          amount: dto.amount,
          type: dto.type,
          reference: dto.reference || undefined,
          accountLast4: dto.accountLast4 || undefined,
          occurredAt: validOccurredAt
        });

    // 2. Check for duplicate transaction
    const existing = await prisma.transaction.findFirst({
      where: { sourceHash, householdId }
    });

    if (existing) {
      // Audit log the duplicate detection
      await prisma.auditLog.create({
        data: {
          householdId,
          action: 'SMS_TRANSACTION_DUPLICATE',
          entity: 'Transaction',
          details: `Duplicate SMS transaction detected (hash: ${sourceHash.substring(0, 16)}..., amount: ${dto.amount})`,
          performedBy: userId
        }
      });

      return {
        success: true,
        duplicate: true,
        message: 'Transaction already imported',
        transaction: existing
      };
    }

    // 3. Determine category
    let finalCategory = dto.category?.trim();
    if (!finalCategory || finalCategory === 'Other') {
      finalCategory = TransactionCategorizer.categorize(
        dto.merchant,
        dto.paymentMethod,
        dto.type
      );
    }

    // 4. Determine confirmation status based on confidence threshold
    const confidence = dto.parserConfidence ?? 0.85;
    let finalStatus: 'CONFIRMED' | 'NEEDS_REVIEW' | 'IGNORED' = dto.status || 'CONFIRMED';

    if (!dto.status) {
      if (confidence >= 0.85) {
        finalStatus = 'CONFIRMED';
      } else if (confidence >= 0.60) {
        finalStatus = 'NEEDS_REVIEW';
      } else {
        finalStatus = 'NEEDS_REVIEW';
      }
    }

    // 5. If confirmed, generate corresponding Expense or Income record
    let linkedExpenseId: string | null = null;
    let linkedIncomeId: string | null = null;

    if (finalStatus === 'CONFIRMED') {
      if (dto.type === 'DEBIT') {
        const title = dto.merchant?.trim() || (dto.bankName ? `${dto.bankName} Debit` : 'Bank Debit');
        const expense = await prisma.expense.create({
          data: {
            householdId,
            userId,
            title,
            amount: dto.amount,
            category: finalCategory || 'Other',
            date: validOccurredAt,
            isRecurring: false,
            createdBy: userId
          }
        });
        linkedExpenseId = expense.id;
      } else {
        const title = dto.merchant?.trim() || (dto.bankName ? `${dto.bankName} Credit` : 'Bank Deposit');
        const income = await prisma.income.create({
          data: {
            householdId,
            title,
            amount: dto.amount,
            source: finalCategory || 'Deposit',
            date: validOccurredAt,
            createdBy: userId
          }
        });
        linkedIncomeId = income.id;
      }
    }

    // 6. Create Transaction in Database
    const transaction = await prisma.transaction.create({
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
        occurredAt: validOccurredAt,
        rawSender: dto.rawSender || null
      },
      include: {
        expense: true,
        income: true
      }
    });

    // 7. Security Audit Log
    await prisma.auditLog.create({
      data: {
        householdId,
        action: 'SMS_TRANSACTION_IMPORTED',
        entity: 'Transaction',
        details: `Imported ${dto.type} ₹${dto.amount} (${transaction.merchant || transaction.bankName || 'SMS'}) with status: ${finalStatus}`,
        performedBy: userId
      }
    });

    return {
      success: true,
      duplicate: false,
      transaction
    };
  }

  /**
   * Fetch household transactions with search, pagination, and role-based filtering
   */
  static async getTransactions(
    householdId: string,
    userId: string,
    role: string,
    query: {
      status?: string;
      type?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const isMember = role === 'MEMBER';
    const where: any = {
      householdId,
      softDelete: false
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
        { reference: { contains: query.search } }
      ];
    }

    const take = query.limit ? Math.min(Number(query.limit), 100) : 50;
    const skip = query.offset ? Number(query.offset) : 0;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take,
        skip,
        include: {
          expense: true,
          income: true,
          user: { select: { id: true, name: true, email: true } }
        }
      }),
      prisma.transaction.count({ where })
    ]);

    return { transactions, total, take, skip };
  }

  /**
   * Update transaction details (e.g. user confirms a review, edits merchant or category)
   */
  static async updateTransaction(
    householdId: string,
    userId: string,
    role: string,
    transactionId: string,
    updates: {
      merchant?: string | null;
      category?: string | null;
      amount?: number;
      status?: 'CONFIRMED' | 'NEEDS_REVIEW' | 'IGNORED';
    }
  ) {
    const existing = await prisma.transaction.findFirst({
      where: { id: transactionId, householdId, softDelete: false }
    });

    if (!existing) {
      throw new Error('Transaction not found');
    }

    if (role === 'MEMBER' && existing.userId !== userId) {
      throw new Error('Forbidden: You can only edit your own transactions');
    }

    const newStatus = updates.status || existing.status;
    const newMerchant = updates.merchant !== undefined ? updates.merchant : existing.merchant;
    const newCategory = updates.category !== undefined ? updates.category : existing.category;
    const newAmount = updates.amount !== undefined ? updates.amount : existing.amount;

    let expenseId = existing.expenseId;
    let incomeId = existing.incomeId;

    // Transition: from NEEDS_REVIEW / IGNORED to CONFIRMED
    if (newStatus === 'CONFIRMED') {
      if (existing.type === 'DEBIT') {
        if (expenseId) {
          // Update linked expense
          await prisma.expense.update({
            where: { id: expenseId },
            data: {
              title: newMerchant || (existing.bankName ? `${existing.bankName} Debit` : 'Bank Debit'),
              category: newCategory || 'Other',
              amount: newAmount
            }
          });
        } else {
          // Create linked expense
          const createdExpense = await prisma.expense.create({
            data: {
              householdId,
              userId: existing.userId,
              title: newMerchant || (existing.bankName ? `${existing.bankName} Debit` : 'Bank Debit'),
              category: newCategory || 'Other',
              amount: newAmount,
              date: existing.occurredAt,
              isRecurring: false,
              createdBy: userId
            }
          });
          expenseId = createdExpense.id;
        }
      } else if (existing.type === 'CREDIT') {
        if (incomeId) {
          // Update linked income
          await prisma.income.update({
            where: { id: incomeId },
            data: {
              title: newMerchant || (existing.bankName ? `${existing.bankName} Credit` : 'Bank Deposit'),
              source: newCategory || 'Deposit',
              amount: newAmount
            }
          });
        } else {
          // Create linked income
          const createdIncome = await prisma.income.create({
            data: {
              householdId,
              title: newMerchant || (existing.bankName ? `${existing.bankName} Credit` : 'Bank Deposit'),
              source: newCategory || 'Deposit',
              amount: newAmount,
              date: existing.occurredAt,
              createdBy: userId
            }
          });
          incomeId = createdIncome.id;
        }
      }
    } else if (newStatus === 'IGNORED') {
      // If user marks ignored, remove or soft delete linked expense/income
      if (expenseId) {
        await prisma.expense.update({
          where: { id: expenseId },
          data: { softDelete: true }
        });
      }
      if (incomeId) {
        await prisma.income.update({
          where: { id: incomeId },
          data: { softDelete: true }
        });
      }
    }

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        merchant: newMerchant,
        category: newCategory,
        amount: newAmount,
        status: newStatus,
        expenseId,
        incomeId
      },
      include: {
        expense: true,
        income: true
      }
    });

    return updated;
  }

  /**
   * Delete transaction and its linked expense/income
   */
  static async deleteTransaction(
    householdId: string,
    userId: string,
    role: string,
    transactionId: string
  ) {
    const existing = await prisma.transaction.findFirst({
      where: { id: transactionId, householdId }
    });

    if (!existing) {
      throw new Error('Transaction not found');
    }

    if (role === 'MEMBER' && existing.userId !== userId) {
      throw new Error('Forbidden: You can only delete your own transactions');
    }

    if (existing.expenseId) {
      await prisma.expense.delete({ where: { id: existing.expenseId } }).catch(() => {});
    }

    if (existing.incomeId) {
      await prisma.income.delete({ where: { id: existing.incomeId } }).catch(() => {});
    }

    await prisma.transaction.delete({ where: { id: transactionId } });

    await prisma.auditLog.create({
      data: {
        householdId,
        action: 'SMS_TRANSACTION_DELETED',
        entity: 'Transaction',
        details: `Deleted transaction: ${existing.merchant || existing.bankName || 'SMS'} (₹${existing.amount})`,
        performedBy: userId
      }
    });

    return { success: true };
  }

  /**
   * Get transaction tracking statistics for the household
   */
  static async getStats(householdId: string) {
    const [totalDetected, needsReview, autoImported, lastTransaction] = await Promise.all([
      prisma.transaction.count({
        where: { householdId, softDelete: false }
      }),
      prisma.transaction.count({
        where: { householdId, status: 'NEEDS_REVIEW', softDelete: false }
      }),
      prisma.transaction.count({
        where: { householdId, status: 'CONFIRMED', softDelete: false }
      }),
      prisma.transaction.findFirst({
        where: { householdId, softDelete: false },
        orderBy: { occurredAt: 'desc' },
        select: { occurredAt: true }
      })
    ]);

    return {
      totalDetected,
      needsReview,
      autoImported,
      lastTransactionAt: lastTransaction?.occurredAt || null
    };
  }
}
