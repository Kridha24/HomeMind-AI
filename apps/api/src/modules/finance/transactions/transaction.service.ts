import { TransactionRepository } from './transaction.repository';
import { parserRegistry } from './parsers';
import { generateTransactionFingerprint } from '../../../utils/transactionFingerprint';
import { TransactionCategorizer } from '../../../services/transactionCategorizer';
import { invalidateHouseholdDashboard } from '../../../infrastructure/redis/redisClient';
import { prisma } from '../../../repositories/db';
import {
  ImportSmsTransactionDto,
  IngestRawSmsDto,
  UpdateTransactionDto,
  GetTransactionsQuery,
} from './transaction.types';
import {
  TransactionNotFoundError,
  UnauthorizedTransactionAccessError,
} from './transaction.errors';

export class TransactionService {
  /**
   * Import pre-parsed SMS transaction with atomic writes and Outbox persistence.
   */
  public static async importSmsTransaction(
    userId: string,
    householdId: string,
    dto: ImportSmsTransactionDto
  ) {
    const occurredAt = new Date(dto.occurredAt);
    const validOccurredAt = isNaN(occurredAt.getTime()) ? new Date() : occurredAt;

    // 1. Generate or verify sourceHash for duplicate prevention
    const sourceHash =
      dto.sourceHash && dto.sourceHash.length === 64
        ? dto.sourceHash
        : generateTransactionFingerprint({
            sender: dto.rawSender || dto.bankName || undefined,
            amount: dto.amount,
            type: dto.type,
            reference: dto.reference || undefined,
            accountLast4: dto.accountLast4 || undefined,
            occurredAt: validOccurredAt,
          });

    // 2. Check for duplicate transaction
    const existing = await TransactionRepository.findBySourceHash(sourceHash, householdId);
    if (existing) {
      await prisma.auditLog.create({
        data: {
          householdId,
          action: 'SMS_TRANSACTION_DUPLICATE',
          entity: 'Transaction',
          details: `Duplicate SMS transaction detected (hash: ${sourceHash.substring(0, 16)}..., amount: ${dto.amount})`,
          performedBy: userId,
        },
      });

      return {
        success: true,
        duplicate: true,
        message: 'Transaction already imported',
        transaction: existing,
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
      finalStatus = confidence >= 0.85 ? 'CONFIRMED' : 'NEEDS_REVIEW';
    }

    // 5. Atomic database write (Expense/Income + Transaction + OutboxEvent)
    const transaction = await TransactionRepository.createAtomicTransaction({
      userId,
      householdId,
      dto,
      sourceHash,
      finalCategory,
      finalStatus,
      occurredAt: validOccurredAt,
      confidence,
    });

    // 6. Invalidate dashboard cache
    await invalidateHouseholdDashboard(householdId);

    return {
      success: true,
      duplicate: false,
      transaction,
    };
  }

  /**
   * Ingest raw SMS by passing through the multi-bank parser registry,
   * privacy filter, and then persisting safely.
   */
  public static async ingestRawSms(
    userId: string,
    householdId: string,
    dto: IngestRawSmsDto
  ) {
    const parsed = parserRegistry.parse(dto.sender || '', dto.body);
    if (!parsed) {
      return {
        success: false,
        skipped: true,
        message: 'Message skipped: non-financial or does not meet privacy filter.',
      };
    }

    const importDto: ImportSmsTransactionDto = {
      amount: parsed.amount,
      currency: parsed.currency,
      type: parsed.direction,
      merchant: parsed.merchant,
      accountLast4: parsed.accountMasked,
      bankName: parsed.provider,
      reference: parsed.externalReference,
      occurredAt: parsed.occurredAt,
      parserConfidence: parsed.confidence,
      rawSender: dto.sender,
      paymentMethod: parsed.provider.includes('UPI') ? 'UPI' : 'BANK',
    };

    return this.importSmsTransaction(userId, householdId, importDto);
  }

  public static async getTransactions(
    householdId: string,
    userId: string,
    role: string,
    query: GetTransactionsQuery
  ) {
    return TransactionRepository.findMany(householdId, userId, role, query);
  }

  public static async updateTransaction(
    householdId: string,
    userId: string,
    role: string,
    id: string,
    dto: UpdateTransactionDto
  ) {
    const existing = await TransactionRepository.findById(id, householdId);
    if (!existing) {
      throw new TransactionNotFoundError(id);
    }

    if (role === 'MEMBER' && existing.userId !== userId) {
      throw new UnauthorizedTransactionAccessError();
    }

    const updated = await TransactionRepository.update(id, dto);
    await invalidateHouseholdDashboard(householdId);
    return updated;
  }

  public static async deleteTransaction(
    householdId: string,
    userId: string,
    role: string,
    id: string
  ) {
    const existing = await TransactionRepository.findById(id, householdId);
    if (!existing) {
      throw new TransactionNotFoundError(id);
    }

    if (role === 'MEMBER' && existing.userId !== userId) {
      throw new UnauthorizedTransactionAccessError();
    }

    const deleted = await TransactionRepository.softDelete(id);
    await invalidateHouseholdDashboard(householdId);
    return deleted;
  }

  public static async getStats(householdId: string, userId: string, role: string) {
    return TransactionRepository.getStats(householdId, userId, role);
  }
}
