import { prisma } from '../../repositories/db';
import { OutboxService } from '../../infrastructure/outbox/outboxService';
import { EventType, roundMoney } from '@homemind/shared';
import { CreateBillDto, UpdateBillDto } from './bill.types';

export class BillRepository {
  public static async findMany(householdId: string, userId: string, isMember: boolean) {
    const where = isMember
      ? { householdId, createdBy: userId, softDelete: false }
      : { householdId, softDelete: false };

    return prisma.bill.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
  }

  public static async findById(id: string, householdId: string) {
    return prisma.bill.findFirst({
      where: { id, householdId, softDelete: false },
    });
  }

  public static async createAtomic(householdId: string, userId: string, dto: CreateBillDto) {
    const roundedAmount = roundMoney(Number(dto.amount));
    const dueDate = new Date(dto.dueDate);

    return prisma.$transaction(async (tx) => {
      const bill = await tx.bill.create({
        data: {
          householdId,
          title: dto.title,
          category: dto.category,
          amount: roundedAmount,
          dueDate,
          provider: dto.provider || null,
          notes: dto.notes || null,
          createdBy: userId,
        },
      });

      await OutboxService.recordEvent(tx, {
        eventType: EventType.BILL_CREATED,
        aggregateType: 'Bill',
        aggregateId: bill.id,
        householdId,
        data: {
          id: bill.id,
          householdId,
          userId,
          title: bill.title,
          category: bill.category,
          amount: bill.amount,
          dueDate: bill.dueDate.toISOString(),
        },
      });

      return bill;
    });
  }

  public static async update(id: string, dto: UpdateBillDto) {
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.amount !== undefined) data.amount = roundMoney(Number(dto.amount));
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);
    if (dto.provider !== undefined) data.provider = dto.provider;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return prisma.bill.update({
      where: { id },
      data,
    });
  }

  public static async delete(id: string) {
    return prisma.bill.delete({
      where: { id },
    });
  }

  /**
   * Atomic Payment Transaction:
   * 1. Updates bill status to PAID + sets paidAt
   * 2. Creates linked Expense record
   * 3. Publishes BILL_PAID outbox event
   * 4. Publishes EXPENSE_CREATED outbox event
   */
  public static async markPaidAtomic(id: string, householdId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const bill = await tx.bill.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      const expense = await tx.expense.create({
        data: {
          householdId,
          userId,
          title: `Paid Bill: ${bill.title}`,
          amount: bill.amount,
          category: bill.category,
          date: new Date(),
          createdBy: userId,
        },
      });

      // Outbox event for Bill payment
      await OutboxService.recordEvent(tx, {
        eventType: EventType.BILL_PAID,
        aggregateType: 'Bill',
        aggregateId: bill.id,
        householdId,
        data: {
          id: bill.id,
          householdId,
          userId,
          title: bill.title,
          amount: bill.amount,
          paidAt: bill.paidAt?.toISOString(),
          expenseId: expense.id,
        },
      });

      // Outbox event for generated Expense
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

      return { bill, expense };
    });
  }
}
