import { IncomeRepository } from './income.repository';
import { invalidateHouseholdDashboard } from '../../../infrastructure/redis/redisClient';
import { CreateIncomeDto, UpdateIncomeDto } from './income.types';
import { canViewHouseholdFinancials, canViewOtherMemberFinancials } from '../../../utils/permissions';

export class IncomeService {
  public static async getIncomes(householdId: string, userId: string, role: string) {
    const isRestricted = !canViewHouseholdFinancials(role);
    return IncomeRepository.findMany(householdId, userId, isRestricted);
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
    dto: UpdateIncomeDto,
    userId?: string,
    role?: string
  ) {
    const existing = await IncomeRepository.findById(id, householdId);
    if (!existing) {
      throw new Error('Income not found.');
    }

    // Role-based privacy enforcement (Part 35)
    if (role && !canViewOtherMemberFinancials(role) && existing.createdBy !== userId) {
      throw new Error('Forbidden: Cannot modify another member income.');
    }

    const updated = await IncomeRepository.updateAtomic(id, householdId, dto);
    await invalidateHouseholdDashboard(householdId);
    return updated;
  }

  public static async deleteIncome(
    id: string,
    householdId: string,
    userId?: string,
    role?: string
  ) {
    const existing = await IncomeRepository.findById(id, householdId);
    if (!existing) {
      throw new Error('Income not found.');
    }

    // Role-based privacy enforcement (Part 35)
    if (role && !canViewOtherMemberFinancials(role) && existing.createdBy !== userId) {
      throw new Error('Forbidden: Cannot delete another member income.');
    }

    const deleted = await IncomeRepository.deleteAtomic(id, householdId);
    await invalidateHouseholdDashboard(householdId);
    return deleted;
  }
}
