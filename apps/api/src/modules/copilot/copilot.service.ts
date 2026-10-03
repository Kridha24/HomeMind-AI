import { randomUUID } from 'crypto';
import { prisma } from '../../repositories/db';
import { ContextManager } from '../../services/ai/context/contextManager';
import { IntentExtractor } from './intentExtractor';
import { ActionExecutor } from './actionExecutor';
import {
  CopilotProcessRequest,
  CopilotResponse,
  CopilotExecutionContext,
  CopilotToolResult,
  PendingActionConfirmation,
  ActionCardData,
} from './copilot.types';

// In-memory pending confirmations map (with 5 minute TTL)
const pendingConfirmations = new Map<string, PendingActionConfirmation & { householdId: string; userId: string }>();

export class CopilotService {
  /**
   * Main Natural Language Processing Entrypoint
   */
  public static async processMessage(req: CopilotProcessRequest): Promise<CopilotResponse> {
    const { householdId, userId, message, threadId, idempotencyKey } = req;

    // 1. Live Household Context (always authenticated server-side)
    const ctx = await ContextManager.getHouseholdContext(householdId, userId);
    const members = await prisma.user.findMany({
      where: { householdId, isActive: true },
      select: { id: true, name: true },
    });

    const execCtx: CopilotExecutionContext = {
      householdId,
      userId,
      userName: ctx.userName,
      userRole: req.userRole || 'MEMBER',
      currencySymbol: ctx.currencySymbol || '₹',
      idempotencyKey,
    };

    // 2. Fetch last executed action for contextual follow-ups ("Actually make it ₹500")
    let previousAction: any = undefined;
    if (threadId) {
      const lastMsg = await prisma.aIMessage.findFirst({
        where: { threadId, role: 'assistant', toolCalls: { not: null } },
        orderBy: { createdAt: 'desc' },
      });
      if (lastMsg && lastMsg.toolCalls) {
        try {
          const parsed = JSON.parse(lastMsg.toolCalls);
          if (Array.isArray(parsed) && parsed.length > 0) {
            previousAction = {
              tool: parsed[0].tool,
              entityId: parsed[0].data?.id,
              entityTitle: parsed[0].data?.title,
              amount: parsed[0].data?.amount,
            };
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    // Fallback: Check last created expense in household audit log by this user
    if (!previousAction) {
      const lastAudit = await prisma.auditLog.findFirst({
        where: { householdId, performedBy: userId, action: 'CREATE', entity: 'Expense' },
        orderBy: { createdAt: 'desc' },
      });
      if (lastAudit && lastAudit.details) {
        try {
          const d = JSON.parse(lastAudit.details);
          previousAction = {
            tool: 'createExpense',
            entityId: d.id,
            amount: d.amount,
            entityTitle: d.title,
          };
        } catch {}
      }
    }

    // 3. Multi-Action Handling
    const compoundParts = IntentExtractor.splitCompoundActions(message);
    const actionsExecuted: CopilotToolResult[] = [];
    const cards: ActionCardData[] = [];
    const invalidatedDomains = new Set<string>();
    let pendingConfirmation: PendingActionConfirmation | undefined = undefined;
    let clarificationRequired: CopilotResponse['clarificationRequired'] = undefined;
    let answer = '';

    for (const part of compoundParts) {
      const intent = IntentExtractor.extract(part, members, previousAction);

      if (!intent) {
        continue;
      }

      // 4. Ambiguity Detection (e.g. "bhaiya se 4000 liya")
      if (intent.isAmbiguous && intent.clarificationQuestion) {
        clarificationRequired = {
          question: intent.clarificationQuestion,
          options: intent.clarificationOptions || [],
        };
        answer = intent.clarificationQuestion;
        break;
      }

      // 5. High-Risk Action Confirmation Required
      if (intent.riskLevel === 'HIGH') {
        const confId = randomUUID();
        const confObj: PendingActionConfirmation = {
          confirmationId: confId,
          tool: intent.tool,
          args: intent.args,
          preview: {
            actionName: intent.tool,
            summary: intent.previewPrompt || 'Destructive action requested',
            riskLevel: 'HIGH',
          },
          prompt: intent.previewPrompt || 'Are you sure you want to proceed with this high-risk action?',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        };

        pendingConfirmations.set(confId, { ...confObj, householdId, userId });
        pendingConfirmation = confObj;
        answer = confObj.prompt;
        break;
      }

      // 6. Execute Action via Verified Domain Service
      const result = await ActionExecutor.executeWithIdempotency(intent.tool, intent.args, execCtx);
      actionsExecuted.push(result);

      if (result.card) {
        cards.push(result.card);
      }

      if (result.invalidatedKeys) {
        result.invalidatedKeys.forEach((k) => invalidatedDomains.add(k));
      }
    }

    // 7. Compose Human Response If Not Already Set
    if (!answer) {
      if (actionsExecuted.length === 0) {
        // Fallback friendly conversation / help
        answer = `I understood your message, but didn't detect an authorized household command. You can say things like:\n` +
          `• *"450 mess expense add karo"*\n` +
          `• *"4000 income me add kar do, bhaiya se liya tha"*\n` +
          `• *"Kal cylinder lene ka task bana do"*\n` +
          `• *"Milk grocery list me add karo"*\n` +
          `• *"PG rent paid mark kar do"*`;
      } else {
        const successCount = actionsExecuted.filter((a) => a.success).length;
        const failCount = actionsExecuted.length - successCount;

        if (failCount === 0) {
          answer = actionsExecuted.map((a) => `✓ ${a.message}`).join('\n\n');
        } else if (successCount > 0) {
          answer = `Partially completed:\n` +
            actionsExecuted.map((a) => (a.success ? `✓ ${a.message}` : `❌ ${a.message}`)).join('\n');
        } else {
          answer = `Couldn't complete requested actions:\n` +
            actionsExecuted.map((a) => `❌ ${a.message}`).join('\n');
        }
      }
    }

    // 8. Generate Relevant Contextual Suggestions
    const suggestions: string[] = [];
    if (invalidatedDomains.has('expenses') || invalidatedDomains.has('finance')) {
      suggestions.push('Is month kitna kharcha hua?', 'Sabse bada expense kya hai?');
    }
    if (invalidatedDomains.has('tasks')) {
      suggestions.push('Aaj ke tasks kya hain?', 'Show all pending tasks');
    }
    if (invalidatedDomains.has('groceries')) {
      suggestions.push('Show grocery list', 'What items are low in stock?');
    }
    if (invalidatedDomains.has('bills')) {
      suggestions.push('Kitne bills pending hain?', 'Show upcoming bills');
    }
    if (suggestions.length === 0) {
      suggestions.push('Plan my day', 'Show household summary', 'Is month kitna kharcha hua?');
    }

    // 9. Persist Thread & Message Safely
    let activeThreadId = threadId;
    try {
      if (activeThreadId) {
        const existing = await prisma.aIThread.findUnique({ where: { id: activeThreadId } });
        if (!existing) {
          const thread = await prisma.aIThread.create({
            data: {
              id: activeThreadId,
              householdId,
              userId,
              title: message.slice(0, 45) + (message.length > 45 ? '...' : ''),
            },
          });
          activeThreadId = thread.id;
        }
      } else {
        const thread = await prisma.aIThread.create({
          data: {
            householdId,
            userId,
            title: message.slice(0, 45) + (message.length > 45 ? '...' : ''),
          },
        });
        activeThreadId = thread.id;
      }

      await prisma.aIMessage.create({
        data: {
          threadId: activeThreadId,
          role: 'user',
          content: message,
        },
      });

      await prisma.aIMessage.create({
        data: {
          threadId: activeThreadId,
          role: 'assistant',
          content: answer,
          toolCalls: actionsExecuted.length > 0 ? JSON.stringify(actionsExecuted) : null,
        },
      });
    } catch (e) {
      console.warn('[CopilotService] Failed to persist thread message:', e);
    }

    return {
      threadId: activeThreadId || 'thread-active',
      answer,
      actionsExecuted,
      pendingConfirmation,
      clarificationRequired,
      cards,
      suggestions: suggestions.slice(0, 4),
      invalidatedDomains: Array.from(invalidatedDomains),
    };
  }

  /**
   * Execute an Explicitly Confirmed Action
   */
  public static async executeConfirmation(params: {
    confirmationId?: string;
    tool?: string;
    args?: Record<string, any>;
    householdId: string;
    userId: string;
    userRole?: string;
  }): Promise<CopilotToolResult> {
    const { confirmationId, householdId, userId, userRole } = params;

    let targetTool = params.tool;
    let targetArgs = params.args || {};

    if (confirmationId) {
      const pending = pendingConfirmations.get(confirmationId);
      if (!pending) {
        throw new Error('Confirmation expired or invalid. Please repeat the command.');
      }
      if (pending.householdId !== householdId) {
        throw new Error('Cross-household confirmation forbidden.');
      }
      targetTool = pending.tool;
      targetArgs = pending.args;
      pendingConfirmations.delete(confirmationId);
    }

    if (!targetTool) {
      throw new Error('Tool to execute was not specified.');
    }

    const ctx = await ContextManager.getHouseholdContext(householdId, userId);
    const execCtx: CopilotExecutionContext = {
      householdId,
      userId,
      userName: ctx.userName,
      userRole: userRole || 'MEMBER',
      currencySymbol: ctx.currencySymbol || '₹',
    };

    return ActionExecutor.execute(targetTool as any, targetArgs, execCtx);
  }
}
