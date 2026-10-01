import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { validate } from '../../../middleware/validator';
import { idempotency } from '../../../middleware/idempotency';
import { smsImportLimiter } from '../../../middleware/rateLimiter';
import {
  importSmsTransactionSchema,
  ingestRawSmsSchema,
  updateTransactionSchema,
} from './transaction.schema';
import { TransactionController } from './transaction.controller';

const router = Router();

// Automatic SMS Transaction Import (Rate-limited, validated, RBAC, Idempotency supported)
router.post(
  '/import/sms',
  smsImportLimiter,
  idempotency({ required: false }),
  validate(importSmsTransactionSchema),
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  TransactionController.importSmsTransaction
);

// Raw SMS Ingestion with Bank Parser engine
router.post(
  '/ingest/raw',
  smsImportLimiter,
  idempotency({ required: false }),
  validate(ingestRawSmsSchema),
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  TransactionController.ingestRawSms
);

// Transaction stats for tracking UI
router.get(
  '/stats',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  TransactionController.getTransactionStats
);

// Fetch transactions with pagination, filters, and role-based scoping
router.get(
  '/',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  TransactionController.getTransactions
);

// Update/Confirm transaction (e.g. user review)
router.put(
  '/:id',
  validate(updateTransactionSchema),
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  TransactionController.updateTransaction
);

// Delete transaction
router.delete(
  '/:id',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  TransactionController.deleteTransaction
);

export default router;
