import { prisma } from '../../repositories/db';
import { OutboxService } from '../../infrastructure/outbox/outboxService';
import { EventType, roundMoney } from '@homemind/shared';
import { CreateBillDto, UpdateBillDto, MarkBillPaidDto } from './bill.types';

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
    return prisma.bill.update({
      where: { id },
      data: { softDelete: true },
    });
  }

  /**
   * Atomic Payment Transaction:
   * 1. Updates bill status to PAID + sets paidAt
   * 2. If linking existing transaction: prevents duplicate expense creation
   * 3. If no existing transaction: creates Expense + manual Transaction atomically
   * 4. Publishes outbox events
   */
  public static async markPaidAtomic(
    id: string,
    householdId: string,
    userId: string,
    payload?: MarkBillPaidDto
  ) {
    return prisma.$transaction(async (tx) => {
      const existingBill = await tx.bill.findFirst({
        where: { id, householdId, softDelete: false },
      });

      if (!existingBill) {
        throw new Error('Bill not found');
      }

      const paymentDate = payload?.paidDate ? new Date(payload.paidDate) : new Date();
      const paidAmount = payload?.amount !== undefined ? roundMoney(Number(payload.amount)) : existingBill.amount;

      let expense: any = null;
      let transaction: any = null;
      let newlyCreatedExpense = false;

      if (payload?.linkedTransactionId) {
        transaction = await tx.transaction.findFirst({
          where: {
            id: payload.linkedTransactionId,
            householdId,
            softDelete: false,
          },
        });

        if (!transaction) {
          throw new Error('Selected transaction not found or does not belong to this household');
        }

        // Check if transaction is already linked to an expense
        if (transaction.expenseId) {
          expense = await tx.expense.findUnique({
            where: { id: transaction.expenseId },
          });
        } else {
          // Link transaction to a new expense
          expense = await tx.expense.create({
            data: {
              householdId,
              userId,
              title: `Paid Bill: ${existingBill.title}`,
              amount: transaction.amount,
              category: existingBill.category,
              date: paymentDate,
              createdBy: userId,
            },
          });
          newlyCreatedExpense = true;

          await tx.transaction.update({
            where: { id: transaction.id },
            data: { expenseId: expense.id },
          });
        }
      } else {
        // No linked transaction provided -> create an Expense and a manual Transaction
        expense = await tx.expense.create({
          data: {
            householdId,
            userId,
            title: `Paid Bill: ${existingBill.title}`,
            amount: paidAmount,
            category: existingBill.category,
            date: paymentDate,
            createdBy: userId,
          },
        });
        newlyCreatedExpense = true;

        transaction = await tx.transaction.create({
          data: {
            householdId,
            userId,
            amount: paidAmount,
            currency: 'INR',
            type: 'DEBIT',
            merchant: existingBill.provider || existingBill.title,
            category: existingBill.category,
            paymentMethod: payload?.paymentMethod || 'MANUAL',
            source: 'MANUAL',
            status: 'CONFIRMED',
            expenseId: expense.id,
            occurredAt: paymentDate,
            reference: `BILL_PAYMENT:${existingBill.id}`,
          },
        });
      }

      // Update bill notes if provided
      let updatedNotes = existingBill.notes;
      if (payload?.notes) {
        updatedNotes = updatedNotes ? `${updatedNotes} | ${payload.notes}` : payload.notes;
      }
      if (payload?.paymentMethod && !payload.linkedTransactionId) {
        const methodTag = `[Paid via ${payload.paymentMethod}]`;
        if (!updatedNotes?.includes(methodTag)) {
          updatedNotes = updatedNotes ? `${updatedNotes} ${methodTag}` : methodTag;
        }
      }

      const bill = await tx.bill.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: paymentDate,
          notes: updatedNotes,
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
          amount: paidAmount,
          paidAt: bill.paidAt?.toISOString(),
          expenseId: expense?.id,
          transactionId: transaction?.id,
        },
      });

      // Outbox event for generated Expense only if newly created
      if (newlyCreatedExpense && expense) {
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
      }

      return { bill, expense, transaction };
    });
  }
}
