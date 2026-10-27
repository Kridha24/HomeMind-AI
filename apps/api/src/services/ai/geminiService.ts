import { config } from '../../config';
import { ToolExecutor, ToolResult } from './tools/executor';

export interface GeminiHouseholdChatResponse {
  answer: string;
  toolCallsExecuted: ToolResult[];
  suggestions: string[];
}

export class GeminiService {
  public static isConfigured(): boolean {
    return Boolean(config.geminiApiKey && config.geminiApiKey.trim().length > 10);
  }

  /**
   * Process a message using Google Gemini 1.5 Flash Generative AI with Function Calling
   */
  public static async processMessage(params: {
    message: string;
    householdId: string;
    userId: string;
    userName: string;
    currencySymbol: string;
    householdContextSummary?: string;
    history?: Array<{ role: 'user' | 'model'; text: string }>;
  }): Promise<GeminiHouseholdChatResponse | null> {
    const apiKey = config.geminiApiKey;
    if (!apiKey) return null;

    const { message, householdId, userId, userName, currencySymbol, householdContextSummary, history } = params;

    const execCtx = {
      householdId,
      userId,
      userName,
      currencySymbol,
    };

    const systemInstruction = `You are HomeMind Copilot — an empathetic, articulate, and deeply knowledgeable personal AI companion for Indian families and homes. Think of yourself as an intelligent family friend, financial advisor, domestic organizer, life guide, and conversational partner.

YOUR CORE IDENTITY & CAPABILITIES:
1. FULL, UNRESTRICTED INTELLIGENCE:
   - Answer ANY question the user asks. You are NOT a restricted bot. Answer whatever they ask, howsoever they ask it.
   - Explain thoroughly, thoughtfully, and clearly whenever asked (financial advice, budgeting strategies, domestic routines, recipes, life questions, explanations of concepts, comparisons, general knowledge, or casual friendly conversations).
   - If the user asks you to explain something (e.g. "aajka kharcha explain kro", "budgeting kaise kare", "egg se kya banaye", "how to save electricity"), break it down in detail with clear reasoning, examples, and warm encouragement.
   - Match the user's natural language and tone: friendly Hinglish, Hindi, or English. Use clean bullet points, emojis, and clear formatting to make your answers easy to read.

2. LIVE HOUSEHOLD DATA ACCESS:
   - You have live, real-time access to the user's household data (shown below).
   - When asked about expenses, spending, bills, tasks, groceries, or household status, ALWAYS use the exact real-time data from below (amounts, item names, dates, categories). Never make up fake data or give robotic templates.
   - For queries like "aaj ka kharcha explain kro", list the exact items spent today, amounts, and categories with friendly commentary.

3. SMART ACTIONS & TOOL EXECUTION:
   - ONLY call functions (add_expense, add_shopping_item, create_task) when the user explicitly instructs to ADD, RECORD, or SCHEDULE something new:
     • 'add_expense': When user logs a purchase (e.g. "egg 207 rs add krdo", "dosto ke sath 1200 ka dinner", "petrol 500"). Intelligently assign the right category: "Food & Dining", "Groceries", "Transportation", "Utilities", "Health & Medicine", "Shopping", "Housing & Rent", "Bills & Recharge", "Entertainment", "General".
     • 'add_shopping_item': When user wants an item added to the grocery/shopping checklist (e.g. "add milk to shopping", "bread le aana").
     • 'create_task': When user wants to set a chore or reminder (e.g. "remind me to pay rent", "clean AC filter on Sunday").
   - For all other questions, explanations, discussions, advice, or general conversation, DO NOT call functions — answer directly, helpfully, and conversationally!

User's Name: ${userName}
Currency: ${currencySymbol}

=== LIVE HOUSEHOLD CONTEXT ===
${householdContextSummary || 'Active family household'}
==============================`;

    const toolDeclarations = [
      {
        name: 'add_expense',
        description: 'Records an expense for the household with accurate category.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Item or merchant description (e.g. Eggs, Dinner with Friends, Petrol)' },
            amount: { type: 'NUMBER', description: 'Numeric cost in currency (e.g. 207)' },
            category: {
              type: 'STRING',
              enum: [
                'Food & Dining',
                'Groceries',
                'Transportation',
                'Utilities',
                'Health & Medicine',
                'Shopping',
                'Entertainment',
                'Housing & Rent',
                'Bills & Recharge',
                'General',
              ],
              description: 'Appropriate category based on the item purchased.',
            },
          },
          required: ['title', 'amount', 'category'],
        },
      },
      {
        name: 'add_shopping_item',
        description: 'Adds an item to the household grocery/pantry shopping checklist.',
        parameters: {
          type: 'OBJECT',
          properties: {
            name: { type: 'STRING', description: 'Name of the item (e.g. Milk, Brown Bread)' },
            quantity: { type: 'NUMBER', description: 'Quantity needed (default 1)' },
            unit: { type: 'STRING', description: 'Unit (pcs, kg, L, pkt)' },
          },
          required: ['name'],
        },
      },
      {
        name: 'create_task',
        description: 'Creates a domestic task or chore reminder for the household.',
        parameters: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING', description: 'Task title (e.g. Clean water purifier, Pay maid salary)' },
            dueDaysFromNow: { type: 'NUMBER', description: 'Days from now when task is due (0 for today, 1 for tomorrow, etc.)' },
            priority: { type: 'STRING', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          },
          required: ['title'],
        },
      },
    ];

    try {
      const modelNames = ['gemini-3.5-flash', 'gemini-3.5-flash-lite'];
      let res: Response | null = null;

      const normalizedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      const rawHistory = (history || []).filter((h) => h.text && h.text.trim().length > 0);

      for (const h of rawHistory) {
        const last = normalizedContents[normalizedContents.length - 1];
        if (last && last.role === h.role) {
          last.parts[0].text += `\n${h.text}`;
        } else {
          normalizedContents.push({
            role: h.role,
            parts: [{ text: h.text }],
          });
        }
      }

      const last = normalizedContents[normalizedContents.length - 1];
      if (last && last.role === 'user') {
        last.parts[0].text += `\n${message}`;
      } else {
        normalizedContents.push({
          role: 'user',
          parts: [{ text: message }],
        });
      }

      if (normalizedContents.length > 0 && normalizedContents[0].role !== 'user') {
        normalizedContents.shift();
      }

      const requestBody = {
        contents: normalizedContents,
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        tools: [
          {
            functionDeclarations: toolDeclarations,
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1500,
        },
      };

      for (const model of modelNames) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const attempt = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(6000),
          });

          if (attempt.ok) {
            res = attempt;
            break;
          } else {
            console.warn(`[GeminiService] model ${model} attempt failed status=${attempt.status}`);
          }
        } catch (fetchErr: any) {
          console.warn(`[GeminiService] model ${model} fetch error: ${fetchErr?.message || fetchErr}`);
        }
      }

      if (!res || !res.ok) {
        console.warn(`[GeminiService] all gemini models returned error, falling back to local engine`);
        return null;
      }

      const data = await res.json();
      const candidate = data?.candidates?.[0];
      if (!candidate) return null;

      const toolCallsExecuted: ToolResult[] = [];
      const parts = candidate.content?.parts || [];
      let initialAnswer = '';

      for (const part of parts) {
        if (part.text) {
          initialAnswer += part.text;
        }

        // Process function calls
        if (part.functionCall) {
          const fnName = part.functionCall.name;
          const fnArgs = part.functionCall.args || {};
          console.log(`[GeminiService] executing tool: ${fnName}`, fnArgs);

          try {
            const toolResult = await ToolExecutor.execute(fnName, fnArgs, execCtx);
            toolCallsExecuted.push(toolResult);

            if (!initialAnswer) {
              if (fnName === 'add_expense') {
                initialAnswer = `Done bhai! Recorded **${currencySymbol}${fnArgs.amount}** for **"${fnArgs.title}"** under **${fnArgs.category}** 🛒✨`;
              } else if (fnName === 'add_shopping_item') {
                initialAnswer = `Added **"${fnArgs.name}"** to your household grocery checklist! 📝`;
              } else if (fnName === 'create_task') {
                initialAnswer = `Scheduled task **"${fnArgs.title}"** for you! ⏰`;
              } else if (toolResult.message) {
                initialAnswer = toolResult.message;
              }
            }
          } catch (toolErr) {
            console.error(`[GeminiService] tool execution failed for ${fnName}:`, toolErr);
          }
        }
      }

      return {
        answer: initialAnswer || "Haanji! Main ready hoon. Aap mujhse ghar ke kharche, budgeting tips, domestic planning ya koi bhi sawal pooch sakte hain!",
        toolCallsExecuted,
        suggestions: [
          'Show my spending this month',
          'Show upcoming bills',
          'What is on my shopping list?',
        ],
      };
    } catch (err) {
      console.error('[GeminiService] Unexpected error:', err);
      return null;
    }
  }
}
