import { Router } from 'express';
import { authorize } from '../../middleware/auth';
import { idempotency } from '../../middleware/idempotency';
import { BillController } from './bill.controller';

const router = Router();

router.get(
  '/',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  BillController.getBills
);

router.post(
  '/',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  idempotency({ required: false }),
  BillController.createBill
);

router.put(
  '/:id',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  BillController.updateBill
);

router.delete(
  '/:id',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN']),
  BillController.deleteBill
);

router.put(
  '/:id/pay',
  authorize(['OWNER', 'CO-OWNER', 'ADMIN', 'MEMBER']),
  idempotency({ required: false }),
  BillController.markBillPaid
);

export default router;
