import { Response } from 'express';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { TransactionService } from './transaction.service';
import {
  TransactionNotFoundError,
  UnauthorizedTransactionAccessError,
} from './transaction.errors';

export class TransactionController {
  public static async importSmsTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;

      if (!householdId || !userId) {
        return res.status(401).json({ error: 'Authentication and household context required' });
      }

      const result = await TransactionService.importSmsTransaction(userId, householdId, req.body);
      const statusCode = result.duplicate ? 200 : 201;
      return res.status(statusCode).json(result);
    } catch (err: any) {
      console.error('[TransactionController.importSmsTransaction] Error:', err.message);
      return res.status(500).json({ error: err.message || 'Failed to import transaction' });
    }
  }

  public static async ingestRawSms(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;

      if (!householdId || !userId) {
        return res.status(401).json({ error: 'Authentication and household context required' });
      }

      const result = await TransactionService.ingestRawSms(userId, householdId, req.body);
      if ('skipped' in result && result.skipped) {
        return res.status(200).json(result);
      }
      const statusCode = ('duplicate' in result && result.duplicate) ? 200 : 201;
      return res.status(statusCode).json(result);

    } catch (err: any) {
      console.error('[TransactionController.ingestRawSms] Error:', err.message);
      return res.status(500).json({ error: err.message || 'Failed to ingest raw SMS' });
    }
  }

  public static async getTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;
      const role = req.user?.role || 'MEMBER';

      if (!householdId || !userId) {
        return res.status(401).json({ error: 'Authentication and household context required' });
      }

      const result = await TransactionService.getTransactions(householdId, userId, role, {
        status: req.query.status as string,
        type: req.query.type as string,
        search: req.query.search as string,
        category: req.query.category as string,
        source: req.query.source as string,
        paymentMethod: req.query.paymentMethod as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
        maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
      });

      return res.json(result);
    } catch (err: any) {
      console.error('[TransactionController.getTransactions] Error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }

  public static async updateTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;
      const role = req.user?.role || 'MEMBER';
      const { id } = req.params;

      if (!householdId || !userId) {
        return res.status(401).json({ error: 'Authentication and household context required' });
      }

      const updated = await TransactionService.updateTransaction(
        householdId,
        userId,
        role,
        id,
        req.body
      );

      return res.json({ success: true, transaction: updated });
    } catch (err: any) {
      console.error('[TransactionController.updateTransaction] Error:', err.message);
      if (err instanceof TransactionNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof UnauthorizedTransactionAccessError) {
        return res.status(403).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message || 'Failed to update transaction' });
    }
  }

  public static async deleteTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;
      const role = req.user?.role || 'MEMBER';
      const { id } = req.params;

      if (!householdId || !userId) {
        return res.status(401).json({ error: 'Authentication and household context required' });
      }

      await TransactionService.deleteTransaction(householdId, userId, role, id);
      return res.json({ success: true, message: 'Transaction removed successfully' });
    } catch (err: any) {
      console.error('[TransactionController.deleteTransaction] Error:', err.message);
      if (err instanceof TransactionNotFoundError) {
        return res.status(404).json({ error: err.message });
      }
      if (err instanceof UnauthorizedTransactionAccessError) {
        return res.status(403).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message || 'Failed to delete transaction' });
    }
  }

  public static async getTransactionStats(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;
      const role = req.user?.role || 'MEMBER';

      if (!householdId || !userId) {
        return res.status(401).json({ error: 'Authentication and household context required' });
      }

      const stats = await TransactionService.getStats(householdId, userId, role);
      return res.json(stats);
    } catch (err: any) {
      console.error('[TransactionController.getTransactionStats] Error:', err.message);
      return res.status(500).json({ error: 'Failed to calculate stats' });
    }
  }
}
