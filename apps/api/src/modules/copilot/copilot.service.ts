import { randomUUID } from 'crypto';
import { prisma } from '../../repositories/db';
import { ContextManager } from '../../services/ai/context/contextManager';
import { IntentExtractor } from './intentExtractor';
import { SemanticParser } from './semanticParser';
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
   * Conversational Small Talk, Greeting & Capabilities Recognizer
   */
  public static detectSmallTalk(raw: string): { isSmallTalk: boolean; reply?: string; suggestions?: string[] } {
    const text = raw.trim().toLowerCase().replace(/[!?.,:;]/g, '');

    // Safety guard: if message mentions numbers, amounts, or household entities, do not treat as pure small talk
    if (
      /\b(\d+|k|rs|rupees|₹|add|bill|task|grocery|groceries|doodh|milk|bread|egg|eggs|expense|income|kharch|kharcha|khatam|paid|spent|due|safai|clean)\b/i.test(
        raw
      )
    ) {
      return { isSmallTalk: false };
    }

    // 1. Natural Conversation / Personality Check ("can u talk normally")
    if (/\b(can (u|you) talk normally|talk normally|talk naturally|normally baat|speak normally|can we talk)\b/i.test(text)) {
      return {
        isSmallTalk: true,
        reply: "Of course 😄 You can talk to me normally. English, Hindi, ya Hinglish — jo comfortable ho. Ask me anything about your household, or let me log your expenses, groceries, bills, and tasks!",
        suggestions: [],
      };
    }

    // 2. Greetings (English, Hindi, Hinglish)
    if (/^(hi|hello|hey|hey there|good morning|good afternoon|good evening)\b/i.test(text)) {
      return {
        isSmallTalk: true,
        reply: "Hey there! 😊 How's everything going at home today? Let me know if you'd like to log an expense, check pending chores, or update groceries.",
        suggestions: ['Show my pending tasks', 'How much did I spend this month?', 'Add groceries: Milk & Bread'],
      };
    }

    if (/\b(namaste|pranam|ram ram|kem cho|vanakkam)\b|नमस्ते|प्रणाम|राम राम/i.test(text)) {
      return {
        isSmallTalk: true,
        reply: "नमस्ते! 😊 घर-परिवार के कामों में आपकी क्या मदद करूँ? आप मुझसे खर्चे, बिल, किराना या टास्क कभी भी संभाल सकते हैं।",
        suggestions: ['Show my pending tasks', 'How much did I spend this month?'],
      };
    }

    // 3. Inquiries / "How are you?" / "Kaise ho?" / "Kaise ho bhai"
    if (/\b(kaise ho bhai|kaise ho|kya haal hai|kya chal raha|sab theek|sab kaisa)\b/i.test(text)) {
      return {
        isSmallTalk: true,
        reply: "Badhiya bhai! 😊 Sab theek-thaak. Aap batao, ghar ka koi kharcha ya kaam note karna hai?",
        suggestions: ['Show my pending tasks', 'How much did I spend this month?'],
      };
    }

    if (/\b(how are you|how r u|how are things|how are you doing|what's up|whats up)\b/i.test(text)) {
      return {
        isSmallTalk: true,
        reply: "I'm doing great, thank you for asking! Ready to help you keep your household running smoothly. What would you like to take care of today?",
        suggestions: ['Show my pending tasks', 'Show upcoming bills', 'How much did I spend this month?'],
      };
    }

    // 4. Gratitude
    if (/^(thanks|thank you|thx|ty|shukriya|dhanyawad|bahut shukriya|great thanks|thank u)\b/i.test(text)) {
      return {
        isSmallTalk: true,
        reply: "You're very welcome! Always here to help with your home and family expenses. Let me know if you need anything else.",
        suggestions: ['Show my pending tasks', 'How much did I spend this month?'],
      };
    }

    // 5. Identity & Capabilities (English, Hindi, Hinglish)
    if (/\b(who are you|what can you do|tum kaun ho|aap kaun ho|kya kar sakte ho|help me|what do you do)\b|आप क्या कर सकते हो/i.test(text)) {
      return {
        isSmallTalk: true,
        reply: "I'm your HomeMind AI assistant! 🏡 You can talk to me naturally in English, Hindi, or Hinglish to record expenses, track income, manage groceries, set task reminders, or check household analytics.",
        suggestions: ['Show my pending tasks', 'How much did I spend this month?', 'Show grocery list'],
      };
    }

    // 6. Fatigue / Stress / Empathetic Casual Check
    if (/\b(aaj (bhut|bahut|kaafi) thak gya|thak gaya|thak gye|kaafi stress|bahut stress|exhausted|tired today|too much stress)\b/i.test(text)) {
      return {
        isSmallTalk: true,
        reply: "Aap thoda aaram kar lo ☕ Household tasks aur expenses main sambhal lunga. Let me know whenever you're ready or need anything done.",
        suggestions: [],
      };
    }

    return { isSmallTalk: false };
  }

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
      currencyCode: ctx.currencyCode || 'INR',
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

    // 3. Multi-Action / Intent Routing
    const compoundParts = IntentExtractor.splitCompoundActions(message);
    const parsedParts = compoundParts.map((part) => ({
      part,
      routed: SemanticParser.route(part, members, previousAction),
    }));

    const validActionParts = parsedParts.filter((p) => Boolean(p.routed.intent));

    // 4. ROUTE D: CONVERSATION LAYER (DETERMINISTIC CONVERSATIONAL RESPONDER)
    // If no clear Action, Household Query, or Ambiguous Action was detected, route to conversational responder.
    if (validActionParts.length === 0) {
      let activeThreadId = threadId;
      const smallTalk = CopilotService.detectSmallTalk(message);
      const conversationReply =
        smallTalk.reply ||
        "I'm here to help with your home! 😊 You can chat naturally with me in English, Hindi, or Hinglish, or ask me to log expenses, check chores, manage groceries, or track upcoming bills.";

      try {
        if (!activeThreadId) {
          const thread = await prisma.aIThread.create({
            data: {
              householdId,
              userId,
              title: message.slice(0, 45) + (message.length > 45 ? '...' : ''),
            },
          });
          activeThreadId = thread.id;
        }

        // Persist conversation messages
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
            content: conversationReply,
            toolCalls: null, // conversational message (does not overwrite previousAction)
          },
        });
      } catch (err: any) {
        console.warn('[CopilotService] Failed to persist conversational message:', err);
      }

      return {
        type: 'conversation',
        message: conversationReply,
        threadId: activeThreadId || threadId || randomUUID(),
        answer: conversationReply,
        actionsExecuted: [],
        cards: [],
        suggestions: smallTalk.suggestions || [], // no repetitive command spam after normal chat
        invalidatedDomains: [],
      };
    }

    // 5. ACTION / QUERY / AMBIGUITY EXECUTION PIPELINE
    const actionsExecuted: CopilotToolResult[] = [];
    const cards: ActionCardData[] = [];
    const invalidatedDomains = new Set<string>();
    let pendingConfirmation: PendingActionConfirmation | undefined = undefined;
    let clarificationRequired: CopilotResponse['clarificationRequired'] = undefined;
    let answer = '';

    for (const { routed } of validActionParts) {
      const intent = routed.intent;
      console.log(`[COPILOT] parser = ${routed.source}`);

      if (!intent) {
        continue;
      }

      // ROUTE C: AMBIGUOUS ACTION (e.g. "100 gift add kro" or "bhaiya se 4000 liya")
      if (intent.isAmbiguous && intent.clarificationQuestion) {
        clarificationRequired = {
          question: intent.clarificationQuestion,
          options: intent.clarificationOptions || [],
        };
        answer = intent.clarificationQuestion;
        break;
      }

      // HIGH-RISK CONFIRMATION
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

      console.log(`[COPILOT] intent = ${intent.tool}`);
      console.log(`[COPILOT] validation = pass`);
      console.log(`[COPILOT] tool = ${intent.tool}`);

      // ROUTE A / B: EXECUTE ACTION OR HOUSEHOLD QUERY via Verified Domain Service
      const result = await ActionExecutor.executeWithIdempotency(intent.tool, intent.args, execCtx);
      actionsExecuted.push(result);
      console.log(`[COPILOT] execution = ${result.success ? 'success' : 'failed'}`);

      if (result.card) {
        cards.push(result.card);
      }

      if (result.invalidatedKeys) {
        result.invalidatedKeys.forEach((k) => invalidatedDomains.add(k));
        console.log(`[COPILOT] cache invalidation = success`);
      }
    }


    // 7. Compose Human Response If Not Already Set
    if (!answer) {
      if (actionsExecuted.length === 0) {
        // Nothing actionable could be understood — ask for the missing detail instead of a dead end.
        answer = `I'm not fully sure what you mean yet. Can you tell me a bit more?\n\nYou can say things naturally, like:\n` +
          `• *"Add 500 for breakfast"* (or *"500 breakfast pe kharch hua"*)\n` +
          `• *"2k mummy ne diye"* (income)\n` +
          `• *"Add milk and bread to groceries"*\n` +
          `• *"Remind me to pay electricity bill tomorrow"*\n` +
          `• *"How much did I spend this month?"*`;
      } else {
        const successCount = actionsExecuted.filter((a) => a.success).length;
        const failCount = actionsExecuted.length - successCount;

        if (failCount === 0) {
          answer = actionsExecuted.length === 1
            ? actionsExecuted[0].message
            : `All set!\n` + actionsExecuted.map((a) => `• ${a.message}`).join('\n');
        } else if (successCount > 0) {
          answer = `Partially completed:\n` +
            actionsExecuted.map((a) => (a.success ? `• ${a.message}` : `• ❌ ${a.message}`)).join('\n');
        } else {
          answer = `Couldn't complete requested actions:\n` +
            actionsExecuted.map((a) => `• ❌ ${a.message}`).join('\n');
        }
      }
    }

    // 8. Generate Relevant Contextual Suggestions (All Clean English)
    const suggestions: string[] = [];
    if (invalidatedDomains.has('expenses') || invalidatedDomains.has('finance')) {
      suggestions.push('How much did I spend this month?', 'What was my highest expense?');
    }
    if (invalidatedDomains.has('tasks')) {
      suggestions.push('Show my pending tasks', 'What chores are due today?');
    }
    if (invalidatedDomains.has('groceries')) {
      suggestions.push('Show grocery list', 'What items are low in stock?');
    }
    if (invalidatedDomains.has('bills')) {
      suggestions.push('Show upcoming bills', 'What bills are unpaid?');
    }
    if (suggestions.length === 0 && /\b(help|commands|options|kya kar sakte ho)\b/i.test(message)) {
      suggestions.push('Show my pending tasks', 'How much did I spend this month?', 'Show grocery list');
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

    const isOnlyQueries = actionsExecuted.length > 0 && actionsExecuted.every((a) => a.tool.startsWith('get'));
    const responseType: CopilotResponse['type'] = pendingConfirmation
      ? 'action'
      : clarificationRequired
      ? 'clarification'
      : isOnlyQueries
      ? 'query'
      : 'action';

    return {
      type: responseType,
      message: answer,
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
      currencyCode: ctx.currencyCode || 'INR',
    };

    return ActionExecutor.execute(targetTool as any, targetArgs, execCtx);
  }
}
