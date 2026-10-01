import { IncomeRepository } from './income.repository';
import { invalidateHouseholdDashboard } from '../../../infrastructure/redis/redisClient';
import { CreateIncomeDto, UpdateIncomeDto } from './income.types';

export class IncomeService {
  public static async getIncomes(householdId: string, userId: string, role: string) {
    const isMember = role === 'MEMBER';
    return IncomeRepository.findMany(householdId, userId, isMember);
  }

  public static async createIncome(
    householdId: string,
    userId: string,
    dto: CreateIncomeDto
  ) {
    if (!dto.title || dto.amount === undefined || !dto.source) {
      throw new Error('Title, amount, and source are required.');
    }

    const income = await IncomeRepository.createAtomic(householdId, userId, dto);
    await invalidateHouseholdDashboard(householdId);
    return income;
  }

  public static async updateIncome(
    id: string,
    householdId: string,
    dto: UpdateIncomeDto
  ) {
    const existing = await IncomeRepository.findById(id, householdId);
    if (!existing) {
      throw new Error('Income not found.');
    }

    const updated = await IncomeRepository.updateAtomic(id, householdId, dto);
    await invalidateHouseholdDashboard(householdId);
    return updated;
  }

  public static async deleteIncome(id: string, householdId: string) {
    const existing = await IncomeRepository.findById(id, householdId);
    if (!existing) {
      throw new Error('Income not found.');
    }

    const deleted = await IncomeRepository.deleteAtomic(id, householdId);
    await invalidateHouseholdDashboard(householdId);
    return deleted;
  }
}
