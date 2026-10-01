import { Router } from 'express';
import { authorize } from '../../../middleware/auth';
import { idempotency } from '../../../middleware/idempotency';
import { IncomeController } from './income.controller';

const router = Router();

router.get(
  '/',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  IncomeController.getIncomes
);

router.post(
  '/',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  idempotency({ required: false }),
  IncomeController.createIncome
);

router.put(
  '/:id',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  IncomeController.updateIncome
);

router.delete(
  '/:id',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN']),
  IncomeController.deleteIncome
);

export default router;
