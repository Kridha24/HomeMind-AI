import { Router } from 'express';
import { authorize } from '../middleware/auth';
import { validate } from '../middleware/validator';
import { smsImportLimiter } from '../middleware/rateLimiter';
import { importSmsTransactionSchema, updateTransactionSchema } from '../utils/validators';
import * as transactionController from '../controllers/transactionController';

const router = Router();

// Automatic SMS Transaction Import (Rate-limited, validated, RBAC)
router.post(
  '/import/sms',
  smsImportLimiter,
  validate(importSmsTransactionSchema),
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  transactionController.importSmsTransaction
);

// Transaction stats for tracking UI
router.get(
  '/stats',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  transactionController.getTransactionStats
);

// Fetch transactions with pagination, filters, and role-based scoping
router.get(
  '/',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  transactionController.getTransactions
);

// Update/Confirm transaction (e.g. user review)
router.put(
  '/:id',
  validate(updateTransactionSchema),
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  transactionController.updateTransaction
);

// Delete transaction
router.delete(
  '/:id',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  transactionController.deleteTransaction
);

export default router;
