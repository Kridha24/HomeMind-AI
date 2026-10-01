import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { idempotency } from '../../../middleware/idempotency';
import { ExpenseController } from './expense.controller';

const router = Router();

router.get(
  '/',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  ExpenseController.getExpenses
);

router.post(
  '/',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  idempotency({ required: false }),
  ExpenseController.createExpense
);

router.put(
  '/:id',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  ExpenseController.updateExpense
);

router.delete(
  '/:id',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN']),
  ExpenseController.deleteExpense
);

export default router;
