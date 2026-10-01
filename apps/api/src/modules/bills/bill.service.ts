import { BillRepository } from './bill.repository';
import { invalidateHouseholdDashboard } from '../../infrastructure/redis/redisClient';
import { CreateBillDto, UpdateBillDto } from './bill.types';

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

  public static async markBillPaid(id: string, householdId: string, userId: string) {
    const existing = await BillRepository.findById(id, householdId);
    if (!existing) {
      throw new Error('Bill not found');
    }

    const result = await BillRepository.markPaidAtomic(id, householdId, userId);
    await invalidateHouseholdDashboard(householdId);
    return result.bill;
  }
}
