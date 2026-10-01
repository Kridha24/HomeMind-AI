import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { TransactionService } from '../services/transactionService';

/**
 * Import a financial SMS transaction detected on the Android device
 * POST /api/v1/transactions/import/sms
 */
export const importSmsTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const userId = req.user?.userId;

    if (!householdId || !userId) {
      return res.status(401).json({ error: 'Authentication and household context required' });
    }

    const result = await TransactionService.importSmsTransaction(
      userId,
      householdId,
      req.body
    );

    const statusCode = result.duplicate ? 200 : 201;
    return res.status(statusCode).json(result);
  } catch (err: any) {
    console.error('[importSmsTransaction] Error:', err.message);
    return res.status(500).json({ error: err.message || 'Failed to import transaction' });
  }
};

/**
 * Get all detected transactions for the household
 * GET /api/v1/transactions
 */
export const getTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const userId = req.user?.userId;
    const role = req.user?.role || 'MEMBER';

    if (!householdId || !userId) {
      return res.status(401).json({ error: 'Authentication and household context required' });
    }

    const result = await TransactionService.getTransactions(
      householdId,
      userId,
      role,
      {
        status: req.query.status as string,
        type: req.query.type as string,
        search: req.query.search as string,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined
      }
    );

    return res.json(result);
  } catch (err: any) {
    console.error('[getTransactions] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

/**
 * Update transaction (e.g. user review confirmation, category/merchant edits)
 * PUT /api/v1/transactions/:id
 */
export const updateTransaction = async (req: AuthenticatedRequest, res: Response) => {
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
    console.error('[updateTransaction] Error:', err.message);
    const status = err.message.includes('Forbidden') ? 403 : err.message.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: err.message });
  }
};

/**
 * Delete transaction
 * DELETE /api/v1/transactions/:id
 */
export const deleteTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const userId = req.user?.userId;
    const role = req.user?.role || 'MEMBER';
    const { id } = req.params;

    if (!householdId || !userId) {
      return res.status(401).json({ error: 'Authentication and household context required' });
    }

    const result = await TransactionService.deleteTransaction(
      householdId,
      userId,
      role,
      id
    );

    return res.json(result);
  } catch (err: any) {
    console.error('[deleteTransaction] Error:', err.message);
    const status = err.message.includes('Forbidden') ? 403 : err.message.includes('not found') ? 404 : 500;
    return res.status(status).json({ error: err.message });
  }
};

/**
 * Get tracking statistics (detected, needs review, auto-imported)
 * GET /api/v1/transactions/stats
 */
export const getTransactionStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) {
      return res.status(401).json({ error: 'Authentication and household context required' });
    }

    const stats = await TransactionService.getStats(householdId);
    return res.json({ success: true, stats });
  } catch (err: any) {
    console.error('[getTransactionStats] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch transaction stats' });
  }
};
