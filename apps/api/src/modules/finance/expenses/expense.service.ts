import { ExpenseRepository } from './expense.repository';
import { invalidateHouseholdDashboard } from '../../../infrastructure/redis/redisClient';
import { CreateExpenseDto, UpdateExpenseDto } from './expense.types';
import { canViewHouseholdFinancials, canViewOtherMemberFinancials } from '../../../utils/permissions';

export class ExpenseService {
  public static async getExpenses(householdId: string, userId: string, role: string) {
    const isRestricted = !canViewHouseholdFinancials(role);
    return ExpenseRepository.findMany(householdId, userId, isRestricted);
  }

  public static async createExpense(
    householdId: string,
    userId: string,
    dto: CreateExpenseDto
  ) {
    if (!dto.title || dto.amount === undefined || !dto.category) {
      throw new Error('Title, amount, and category are required.');
    }

    const expense = await ExpenseRepository.createAtomic(householdId, userId, dto);

    // Invalidate cached dashboard for this household
    await invalidateHouseholdDashboard(householdId);

    return expense;
  }

  public static async updateExpense(
    id: string,
    householdId: string,
    dto: UpdateExpenseDto,
    userId?: string,
    role?: string
  ) {
    const existing = await ExpenseRepository.findById(id, householdId);
    if (!existing) {
      throw new Error('Expense not found.');
    }

    // Role-based privacy enforcement (Part 35)
    if (role && !canViewOtherMemberFinancials(role) && existing.userId !== userId) {
      throw new Error('Forbidden: Cannot modify another member expense.');
    }

    const updated = await ExpenseRepository.updateAtomic(id, householdId, dto);
    await invalidateHouseholdDashboard(householdId);
    return updated;
  }

  public static async deleteExpense(
    id: string,
    householdId: string,
    userId?: string,
    role?: string
  ) {
    const existing = await ExpenseRepository.findById(id, householdId);
    if (!existing) {
      throw new Error('Expense not found.');
    }

    // Role-based privacy enforcement (Part 35)
    if (role && !canViewOtherMemberFinancials(role) && existing.userId !== userId) {
      throw new Error('Forbidden: Cannot delete another member expense.');
    }

    const deleted = await ExpenseRepository.deleteAtomic(id, householdId);
    await invalidateHouseholdDashboard(householdId);
    return deleted;
  }
}
