import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { CopilotService } from './copilot.service';
import { prisma } from '../../repositories/db';

export class CopilotController {
  public static async processAction(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!householdId || !userId) {
        return res.status(401).json({ error: 'Unauthorized: Household context missing' });
      }

      const { message, threadId, idempotencyKey } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Valid message string is required.' });
      }

      const response = await CopilotService.processMessage({
        householdId,
        userId,
        userRole,
        message: message.trim(),
        threadId,
        idempotencyKey,
      });

      return res.json(response);
    } catch (err: any) {
      console.error('[CopilotController.processAction] Error:', err);
      return res.status(500).json({ error: err.message || 'Internal Copilot error' });
    }
  }

  public static async confirmAction(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!householdId || !userId) {
        return res.status(401).json({ error: 'Unauthorized: Household context missing' });
      }

      const { confirmationId, tool, args } = req.body;

      const result = await CopilotService.executeConfirmation({
        confirmationId,
        tool,
        args,
        householdId,
        userId,
        userRole,
      });

      return res.json(result);
    } catch (err: any) {
      console.error('[CopilotController.confirmAction] Error:', err);
      return res.status(400).json({ error: err.message || 'Confirmation failed' });
    }
  }

  public static async getActionHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const householdId = req.user?.householdId;
      if (!householdId) {
        return res.status(401).json({ error: 'Unauthorized: Household context missing' });
      }

      const logs = await prisma.auditLog.findMany({
        where: { householdId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      return res.json({ history: logs });
    } catch (err: any) {
      console.error('[CopilotController.getActionHistory] Error:', err);
      return res.status(500).json({ error: 'Failed to retrieve action history' });
    }
  }
}
