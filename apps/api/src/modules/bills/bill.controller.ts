import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { BillService } from './bill.service';

export class BillController {
  public static async getBills(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;
      const role = req.user?.role || 'MEMBER';

      if (!householdId || !userId) {
        return res.status(400).json({ error: 'Household context missing' });
      }

      const bills = await BillService.getBills(householdId, userId, role);
      return res.json({ bills });
    } catch (err: any) {
      console.error('[BillController.getBills] Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch bills.' });
    }
  }

  public static async createBill(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;

      if (!householdId || !userId) {
        return res.status(400).json({ error: 'Household context missing' });
      }

      const bill = await BillService.createBill(householdId, userId, req.body);
      return res.status(201).json({ bill });
    } catch (err: any) {
      console.error('[BillController.createBill] Error:', err.message);
      return res.status(400).json({ error: err.message || 'Failed to create bill.' });
    }
  }

  public static async updateBill(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const householdId = req.user?.householdId;

      if (!householdId) {
        return res.status(400).json({ error: 'Household context missing' });
      }

      const updated = await BillService.updateBill(id, householdId, req.body);
      return res.json({ success: true, bill: updated });
    } catch (err: any) {
      console.error('[BillController.updateBill] Error:', err.message);
      const status = err.message.includes('not found') ? 404 : 400;
      return res.status(status).json({ error: err.message || 'Failed to update bill.' });
    }
  }

  public static async deleteBill(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const householdId = req.user?.householdId;

      if (!householdId) {
        return res.status(400).json({ error: 'Household context missing' });
      }

      await BillService.deleteBill(id, householdId);
      return res.json({ success: true, id });
    } catch (err: any) {
      console.error('[BillController.deleteBill] Error:', err.message);
      const status = err.message.includes('not found') ? 404 : 500;
      return res.status(status).json({ error: err.message || 'Failed to delete bill.' });
    }
  }

  public static async markBillPaid(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;

      if (!householdId || !userId) {
        return res.status(400).json({ error: 'Household context missing' });
      }

      const bill = await BillService.markBillPaid(id, householdId, userId);
      return res.json({ bill });
    } catch (err: any) {
      console.error('[BillController.markBillPaid] Error:', err.message);
      const status = err.message.includes('not found') ? 404 : 500;
      return res.status(status).json({ error: err.message || 'Failed to mark bill as paid.' });
    }
  }
}
