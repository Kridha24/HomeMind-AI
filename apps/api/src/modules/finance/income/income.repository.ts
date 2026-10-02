import { prisma } from '../../../repositories/db';
import { OutboxService } from '../../../infrastructure/outbox/outboxService';
import { EventType, roundMoney } from '@homemind/shared';
import { CreateIncomeDto, UpdateIncomeDto } from './income.types';

export class IncomeRepository {
  public static async findMany(householdId: string, userId: string, isMember: boolean) {
    const where = isMember
      ? { householdId, createdBy: userId, softDelete: false }
      : { householdId, softDelete: false };

    return prisma.income.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  public static async findById(id: string, householdId: string) {
    return prisma.income.findFirst({
      where: { id, householdId, softDelete: false },
    });
  }

  public static async createAtomic(
    householdId: string,
    userId: string,
    dto: CreateIncomeDto
  ) {
    const roundedAmount = roundMoney(Number(dto.amount));
    const incomeDate = dto.date ? new Date(dto.date) : new Date();

    return prisma.$transaction(async (tx) => {
      const income = await tx.income.create({
        data: {
          householdId,
          title: dto.title,
          amount: roundedAmount,
          source: dto.source,
          date: incomeDate,
          createdBy: userId,
        },
      });

      await tx.transaction.create({
        data: {
          householdId,
          userId,
          amount: roundedAmount,
          currency: 'INR',
          type: 'CREDIT',
          merchant: dto.title,
          category: dto.source,
          paymentMethod: 'MANUAL',
          source: 'MANUAL',
          status: 'CONFIRMED',
          occurredAt: incomeDate,
          incomeId: income.id,
        },
      });

      await OutboxService.recordEvent(tx, {
        eventType: EventType.INCOME_CREATED,
        aggregateType: 'Income',
        aggregateId: income.id,
        householdId,
        data: {
          id: income.id,
          householdId,
          userId,
          title: income.title,
          amount: income.amount,
          source: income.source,
          date: income.date.toISOString(),
        },
      });

      return income;
    });
  }

  public static async updateAtomic(
    id: string,
    householdId: string,
    dto: UpdateIncomeDto
  ) {
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.amount !== undefined) data.amount = roundMoney(Number(dto.amount));
    if (dto.source !== undefined) data.source = dto.source;
    if (dto.date !== undefined) data.date = new Date(dto.date);

    return prisma.$transaction(async (tx) => {
      const updated = await tx.income.update({
        where: { id },
        data,
      });

      // Mirror to linked Transaction if exists
      const txUpdate: any = {};
      if (dto.title !== undefined) txUpdate.merchant = dto.title;
      if (dto.amount !== undefined) txUpdate.amount = roundMoney(Number(dto.amount));
      if (dto.source !== undefined) txUpdate.category = dto.source;
      if (dto.date !== undefined) txUpdate.occurredAt = new Date(dto.date);
      if (Object.keys(txUpdate).length > 0) {
        await tx.transaction.updateMany({
          where: { incomeId: id },
          data: txUpdate,
        });
      }

      await OutboxService.recordEvent(tx, {
        eventType: EventType.INCOME_UPDATED,
        aggregateType: 'Income',
        aggregateId: updated.id,
        householdId,
        data: {
          id: updated.id,
          householdId,
          title: updated.title,
          amount: updated.amount,
          source: updated.source,
        },
      });

      return updated;
    });
  }

  public static async deleteAtomic(id: string, householdId: string) {
    return prisma.$transaction(async (tx) => {
      // Soft-delete linked transaction if present
      await tx.transaction.updateMany({
        where: { incomeId: id },
        data: { softDelete: true },
      });

      const deleted = await tx.income.delete({
        where: { id },
      });

      await OutboxService.recordEvent(tx, {
        eventType: EventType.INCOME_DELETED,
        aggregateType: 'Income',
        aggregateId: id,
        householdId,
        data: { id, householdId },
      });

      return deleted;
    });
  }
}
