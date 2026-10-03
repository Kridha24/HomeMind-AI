import { Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { ExpenseService } from './expense.service';

export class ExpenseController {
  public static async getExpenses(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;
      const role = req.user?.role || 'MEMBER';

      if (!householdId || !userId) {
        return res.status(400).json({ error: 'Household context missing' });
      }

      const result = await ExpenseService.getExpenses(householdId, userId, role);
      return res.json(result);
    } catch (err: any) {
      console.error('[ExpenseController.getExpenses] Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch expenses.' });
    }
  }

  public static async createExpense(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;

      if (!householdId || !userId) {
        return res.status(400).json({ error: 'Missing context' });
      }

      const expense = await ExpenseService.createExpense(householdId, userId, req.body);
      return res.status(201).json(expense);
    } catch (err: any) {
      console.error('[ExpenseController.createExpense] Error:', err.message);
      return res.status(400).json({ error: err.message || 'Failed to create expense.' });
    }
  }

  public static async updateExpense(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;
      const role = req.user?.role || 'MEMBER';
      const { id } = req.params;

      if (!householdId) {
        return res.status(400).json({ error: 'Missing context' });
      }

      const updated = await ExpenseService.updateExpense(id, householdId, req.body, userId, role);
      return res.json(updated);
    } catch (err: any) {
      console.error('[ExpenseController.updateExpense] Error:', err.message);
      if (err.message.includes('Forbidden')) {
        return res.status(403).json({ error: err.message });
      }
      const status = err.message.includes('not found') ? 404 : 400;
      return res.status(status).json({ error: err.message || 'Failed to update expense.' });
    }
  }

  public static async deleteExpense(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;
      const role = req.user?.role || 'MEMBER';
      const { id } = req.params;

      if (!householdId) {
        return res.status(400).json({ error: 'Missing context' });
      }

      const deleted = await ExpenseService.deleteExpense(id, householdId, userId, role);
      return res.json(deleted);
    } catch (err: any) {
      console.error('[ExpenseController.deleteExpense] Error:', err.message);
      if (err.message.includes('Forbidden')) {
        return res.status(403).json({ error: err.message });
      }
      const status = err.message.includes('not found') ? 404 : 400;
      return res.status(status).json({ error: err.message || 'Failed to delete expense.' });
    }
  }
}
