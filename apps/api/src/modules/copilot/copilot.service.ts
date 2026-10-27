import { randomUUID } from 'crypto';
import { prisma } from '../../repositories/db';
import { ContextManager } from '../../services/ai/context/contextManager';
import { IntentExtractor } from './intentExtractor';
import { SemanticParser } from './semanticParser';
import { ActionExecutor } from './actionExecutor';
import { GeminiService } from '../../services/ai/geminiService';
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

    // Real Generative AI Companion: Google Gemini 1.5 Flash (Option 2)
    if (GeminiService.isConfigured()) {
      const summary = `User: ${ctx.userName}. Monthly Income: ${ctx.monthlyIncome}, Monthly Spent: ${ctx.monthlyExpenses}. Pending Tasks: ${ctx.pendingTasks.length}. Low stock items: ${ctx.lowStockGroceries.length}.`;
      const geminiRes = await GeminiService.processMessage({
        message,
        householdId,
        userId,
        userName: ctx.userName,
        currencySymbol: ctx.currencySymbol || '₹',
        householdContextSummary: summary,
      });

      if (geminiRes) {
        return {
          answer: geminiRes.answer,
          threadId: threadId || randomUUID(),
          actionsExecuted: geminiRes.toolCallsExecuted.map((t) => ({
            tool: t.tool as any,
            success: t.success,
            message: t.message,
            data: t.data,
          })),
          suggestions: geminiRes.suggestions,
          type: geminiRes.toolCallsExecuted.length > 0 ? 'action' : 'conversation',
          cards: [],
          invalidatedDomains: geminiRes.toolCallsExecuted.length > 0 ? ['finance', 'dashboard', 'groceries'] : [],
        };
      }
    }

    // 3. Multi-Action / Intent Routing
    const compoundParts = IntentExtractor.splitCompoundActions(message);
    const parsedParts = compoundParts.map((part) => ({
      part,
      routed: SemanticParser.route(part, members, previousAction),
    }));

    const validActionParts = parsedParts.filter((p) => Boolean(p.routed.intent));

    // 4. ROUTE D: INTELLIGENT CAPABILITIES & CONVERSATION LAYER
    if (validActionParts.length === 0) {
      // 4A. Salary-based Monthly Budget Planner
      if (
        /\b(monthly\s+budget|salary\s+pe\s+budget|budget\s+bna|budget\s+banao|salary\s+budget|budget\s+plan|budget\s+banake|salary\s+pe|budget\s+bana\s+do)\b/i.test(message) ||
        (/\b(budget)\b/i.test(message) && /\b(salary|in-hand|kamai|income)\b/i.test(message))
      ) {
        let salaryAmount = 0;
        const salaryMatch = message.match(/(\d+(?:\.\d+)?)\s*(k|lakh|thousand|lac)?/i);
        if (salaryMatch) {
          let num = parseFloat(salaryMatch[1]);
          const mult = (salaryMatch[2] || '').toLowerCase();
          if (mult === 'k' || mult === 'thousand') num *= 1000;
          else if (mult === 'lakh' || mult === 'lac') num *= 100000;
          if (num >= 5000) salaryAmount = num;
        }

        if (!salaryAmount) {
          try {
            const lastIncome = await prisma.income.findFirst({
              where: { householdId, softDelete: false },
              orderBy: { date: 'desc' },
            });
            if (lastIncome && Number(lastIncome.amount) > 0) {
              salaryAmount = Number(lastIncome.amount);
            }
          } catch {}
        }

        const benchmarkSalary = salaryAmount || 50000;
        const needs = Math.round(benchmarkSalary * 0.5);
        const wants = Math.round(benchmarkSalary * 0.3);
        const savings = Math.round(benchmarkSalary * 0.2);
        const dailyAllowance = Math.round(wants / 30);
        const isCustomSalary = Boolean(salaryAmount);
        const sym = ctx.currencySymbol || '₹';

        const reply =
          `📊 **Monthly Budget Plan (${sym}${benchmarkSalary.toLocaleString('en-IN')}${isCustomSalary ? '' : ' benchmark'})**\n\n` +
          `Here is your recommended **50/30/20 financial roadmap**:\n\n` +
          `1. **Essential Needs (50%) — ${sym}${needs.toLocaleString('en-IN')}**\n` +
          `   • Rent, utility bills (electricity, water, Wi-Fi)\n` +
          `   • Essential groceries, kitchen ration & healthcare\n\n` +
          `2. **Flexible Wants (30%) — ${sym}${wants.toLocaleString('en-IN')}**\n` +
          `   • Dining out, shopping, subscriptions & weekend fun\n` +
          `   • *Suggested daily discretionary limit: ${sym}${dailyAllowance.toLocaleString('en-IN')}/day*\n\n` +
          `3. **Savings & Future Security (20%) — ${sym}${savings.toLocaleString('en-IN')}**\n` +
          `   • Emergency fund & SIP / mutual funds deposits\n\n` +
          `${
            isCustomSalary
              ? `💡 *Tip: Log your daily expenses here in HomeMind to stay under your ${sym}${dailyAllowance}/day limit!*`
              : `💡 *If your monthly salary is different, just tell me e.g. "My salary is 40,000, make a budget" and I will tailor it immediately!*`
          }`;

        return await CopilotService.persistAndReturnConversational(householdId, userId, message, threadId, reply, [
          'How much did I spend this month?',
          'Show my pending tasks',
          'Add 500 to groceries',
        ]);
      }

      // 4B. Actionable Daily Routine & Chores Builder
      if (
        /\b(routine\s+bna|routine\s+banao|kaam\s+bna|kaam\s+banao|kaam\s+ya\s+routine|daily\s+routine|chores\s+routine|routine\s+chahiye|schedule\s+bna|routine\s+bna\s+de)\b/i.test(
          message
        )
      ) {
        const reply =
          `🗓️ **Actionable Household & Daily Routine**\n\n` +
          `Here is an efficient, stress-free routine designed for your home:\n\n` +
          `🌅 **Morning (7:00 AM – 9:30 AM)**\n` +
          `• Morning hydration & kitchen/breakfast prep\n` +
          `• Quick 5-min check of urgent chores & pantry items\n\n` +
          `☀️ **Afternoon (1:00 PM – 2:30 PM)**\n` +
          `• Lunch & quick walk or break\n` +
          `• Check any pending utility bill due dates\n\n` +
          `🌆 **Evening (6:30 PM – 8:30 PM)**\n` +
          `• Dinner preparation & dining\n` +
          `• Quick 10-minute tidy up of shared living spaces\n` +
          `• **Log today's daily expenses in HomeMind**\n\n` +
          `🌙 **Night (9:30 PM)**\n` +
          `• Review tomorrow's chores & family assignments\n` +
          `• Unwind & rest\n\n` +
          `💡 *Would you like me to create any of these as tasks for your family? Just say "Add task: Morning kitchen prep" or "Remind me to log expenses at 8 PM".*`;

        return await CopilotService.persistAndReturnConversational(householdId, userId, message, threadId, reply, [
          'Add task: Morning kitchen prep',
          'Add task: Evening expense logging',
          'Show my pending tasks',
        ]);
      }

      // 4C. Weekly Spending & Highest Spending Category Analysis
      if (
        /\b(week\s+me\s+kaha|weekly\s+expense|kaha\s+kaha\s+paisa|kaha\s+kharch|konse\s+section|highest\s+spending|paisa\s+kharch\s+ho\s+rha|weekly\s+spending|spending\s+breakdown|kaha\s+paisa\s+gaya)\b/i.test(
          message
        )
      ) {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 86400000);

        let recentExpenses: any[] = [];
        try {
          recentExpenses = await prisma.expense.findMany({
            where: {
              householdId,
              softDelete: false,
              date: { gte: weekAgo },
            },
            orderBy: { date: 'desc' },
          });
        } catch {}

        const sym = ctx.currencySymbol || '₹';

        if (recentExpenses.length === 0) {
          const reply =
            `📉 **Weekly Expense Summary (Last 7 Days)**\n\n` +
            `No expenses have been recorded for your household this week yet! 🎉\n\n` +
            `• Total spent this week: **${sym}0**\n` +
            `• Current budget health: **Excellent**\n\n` +
            `Whenever you spend money, simply tell me (e.g. *"Spent 350 on groceries"*) and I'll track and analyze it for you!`;

          return await CopilotService.persistAndReturnConversational(householdId, userId, message, threadId, reply, [
            'Add expense 500 for groceries',
            'How much did I spend this month?',
            'Show upcoming bills',
          ]);
        }

        let totalWeekly = 0;
        const categoryTotals: Record<string, number> = {};

        recentExpenses.forEach((exp) => {
          const amt = Math.abs(Number(exp.amount) || 0);
          totalWeekly += amt;
          const cat = exp.category || 'General';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
        });

        let highestCat = 'General';
        let highestAmt = 0;
        Object.entries(categoryTotals).forEach(([cat, amt]) => {
          if (amt > highestAmt) {
            highestAmt = amt;
            highestCat = cat;
          }
        });

        const highestPercent = totalWeekly > 0 ? Math.round((highestAmt / totalWeekly) * 100) : 0;
        const sortedCategories = Object.entries(categoryTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        const categoryIcons: Record<string, string> = {
          Food: '🍲',
          Groceries: '🛒',
          Utilities: '⚡',
          Bills: '🧾',
          Shopping: '🛍️',
          Entertainment: '🎬',
          Transport: '🚗',
          Health: '💊',
          General: '📌',
        };

        const breakdownText = sortedCategories
          .map(([cat, amt]) => {
            const icon = categoryIcons[cat] || '📌';
            const pct = Math.round((amt / totalWeekly) * 100);
            return `   ${icon} **${cat}**: ${sym}${amt.toLocaleString('en-IN')} (${pct}%)`;
          })
          .join('\n');

        const reply =
          `📊 **Weekly Spending Report (Last 7 Days)**\n\n` +
          `• **Total Spent**: ${sym}${totalWeekly.toLocaleString('en-IN')}\n` +
          `• **Highest Spending Section**: **${highestCat}** (${sym}${highestAmt.toLocaleString('en-IN')}, **${highestPercent}%** of weekly total)\n\n` +
          `**Category Breakdown:**\n` +
          `${breakdownText}\n\n` +
          `💡 *Insight: You're spending the most on **${highestCat}** this week. Setting a slight cap here will save the most money by month-end!*`;

        return await CopilotService.persistAndReturnConversational(householdId, userId, message, threadId, reply, [
          'How much did I spend this month?',
          'Show my pending tasks',
          'Show grocery list',
        ]);
      }

      // 4D. Small Talk / Capabilities fallback
      const smallTalk = CopilotService.detectSmallTalk(message);
      const conversationReply =
        smallTalk.reply ||
        "I'm here to help with your home! 😊 You can chat naturally with me in English, Hindi, or Hinglish, or ask me to log expenses, check chores, manage groceries, or track upcoming bills.";

      return await CopilotService.persistAndReturnConversational(
        householdId,
        userId,
        message,
        threadId,
        conversationReply,
        smallTalk.suggestions || []
      );
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

  /**
   * Helper to persist conversation message thread and return typed response
   */
  private static async persistAndReturnConversational(
    householdId: string,
    userId: string,
    message: string,
    threadId: string | undefined,
    reply: string,
    suggestions: string[]
  ): Promise<CopilotResponse> {
    let activeThreadId = threadId;
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
          content: reply,
          toolCalls: null,
        },
      });
    } catch (err: any) {
      console.warn('[CopilotService] Failed to persist conversational response:', err);
    }

    return {
      type: 'conversation',
      message: reply,
      threadId: activeThreadId || threadId || randomUUID(),
      answer: reply,
      actionsExecuted: [],
      cards: [],
      suggestions,
      invalidatedDomains: [],
    };
  }
}

