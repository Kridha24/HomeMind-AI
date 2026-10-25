import { BillRepository } from './bill.repository';
import { invalidateHouseholdDashboard } from '../../infrastructure/redis/redisClient';
import { CreateBillDto, UpdateBillDto, MarkBillPaidDto } from './bill.types';

export class BillService {
  public static async getBills(householdId: string, userId: string, role: string) {
    const isMember = role === 'MEMBER';
    return BillRepository.findMany(householdId, userId, isMember);
  }

  public static async createBill(householdId: string, userId: string, dto: CreateBillDto) {
    if (!dto.title || !dto.category || dto.amount === undefined || !dto.dueDate) {
      throw new Error('Title, category, amount, and due date are required.');
    }

    const bill = await BillRepository.createAtomic(householdId, userId, dto);
    await invalidateHouseholdDashboard(householdId);

    // Dispatch Bills reminder notification to household members (actor excluded)
    import('../../modules/notifications/notificationDispatcher')
      .then(({ NotificationDispatcher }) => {
        NotificationDispatcher.dispatchEvent({
          householdId,
          actorId: userId,
          category: 'BILLS',
          title: 'Upcoming Bill Added',
          body: `"${dto.title}" has been scheduled in upcoming bills`,
          link: '/bills',
          dedupKey: `bill-created-${bill.id}`,
        }).catch(() => {});
      })
      .catch(() => {});

    return bill;
  }

  public static async updateBill(id: string, householdId: string, dto: UpdateBillDto) {
    const existing = await BillRepository.findById(id, householdId);
    if (!existing) {
      throw new Error('Bill not found');
    }

    const updated = await BillRepository.update(id, dto);
    await invalidateHouseholdDashboard(householdId);
    return updated;
  }

  public static async deleteBill(id: string, householdId: string) {
    const existing = await BillRepository.findById(id, householdId);
    if (!existing) {
      throw new Error('Bill not found');
    }

    await BillRepository.delete(id);
    await invalidateHouseholdDashboard(householdId);
    return { success: true, id };
  }

  public static async markBillPaid(
    id: string,
    householdId: string,
    userId: string,
    payload?: MarkBillPaidDto
  ) {
    const existing = await BillRepository.findById(id, householdId);
    if (!existing) {
      throw new Error('Bill not found');
    }

    const result = await BillRepository.markPaidAtomic(id, householdId, userId, payload);
    await invalidateHouseholdDashboard(householdId);

    // Dispatch notification to household members
    import('../../modules/notifications/notificationDispatcher')
      .then(({ NotificationDispatcher }) => {
        NotificationDispatcher.dispatchEvent({
          householdId,
          actorId: userId,
          category: 'BILLS',
          title: 'Bill Paid',
          body: `"${existing.title}" was marked as paid`,
          link: '/bills',
          dedupKey: `bill-paid-${id}`,
        }).catch(() => {});
      })
      .catch(() => {});

    return result.bill;
  }
}
