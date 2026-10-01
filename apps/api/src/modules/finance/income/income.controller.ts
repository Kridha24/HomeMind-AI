import { Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { IncomeService } from './income.service';

export class IncomeController {
  public static async getIncomes(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;
      const role = req.user?.role || 'MEMBER';

      if (!householdId || !userId) {
        return res.status(400).json({ error: 'Household context missing' });
      }

      const incomes = await IncomeService.getIncomes(householdId, userId, role);
      return res.json(incomes);
    } catch (err: any) {
      console.error('[IncomeController.getIncomes] Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch incomes.' });
    }
  }

  public static async createIncome(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;

      if (!householdId || !userId) {
        return res.status(400).json({ error: 'Missing context' });
      }

      const income = await IncomeService.createIncome(householdId, userId, req.body);
      return res.status(201).json(income);
    } catch (err: any) {
      console.error('[IncomeController.createIncome] Error:', err.message);
      return res.status(400).json({ error: err.message || 'Failed to create income.' });
    }
  }

  public static async updateIncome(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const { id } = req.params;

      if (!householdId) {
        return res.status(400).json({ error: 'Missing context' });
      }

      const updated = await IncomeService.updateIncome(id, householdId, req.body);
      return res.json(updated);
    } catch (err: any) {
      console.error('[IncomeController.updateIncome] Error:', err.message);
      const status = err.message.includes('not found') ? 404 : 400;
      return res.status(status).json({ error: err.message || 'Failed to update income.' });
    }
  }

  public static async deleteIncome(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const { id } = req.params;

      if (!householdId) {
        return res.status(400).json({ error: 'Missing context' });
      }

      await IncomeService.deleteIncome(id, householdId);
      return res.json({ message: 'Income deleted successfully.' });
    } catch (err: any) {
      console.error('[IncomeController.deleteIncome] Error:', err.message);
      const status = err.message.includes('not found') ? 404 : 500;
      return res.status(status).json({ error: err.message || 'Failed to delete income.' });
    }
  }
}
