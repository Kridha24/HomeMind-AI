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
  }): Promise<GeminiHouseholdChatResponse | null> {
    const apiKey = config.geminiApiKey;
    if (!apiKey) return null;

    const { message, householdId, userId, userName, currencySymbol, householdContextSummary } = params;

    const execCtx = {
      householdId,
      userId,
      userName,
      currencySymbol,
    };

    const systemInstruction = `You are HomeMind Copilot, an intelligent, empathetic household companion for Indian families.
User's Name: ${userName}
Currency: ${currencySymbol}

${householdContextSummary || 'Active family household'}

Key Guidelines:
1. Speak warmly and naturally in friendly Hinglish or English (mirror the user's language).
2. You have FULL LIVE REAL-TIME ACCESS to the user's household data in the context above.
   - When the user asks questions (e.g. "aaj ka kharcha ko explain kro ki kaha kaha paisa laga hai", "today's spending", "grocery pe kitna hua", "explain spending", "bills due", "tasks pending"), ALWAYS ANSWER DIRECTLY, CONVERSATIONALLY, AND IN DETAIL with the exact items, amounts, and categories from the Live Household Data provided above!
   - Break down the numbers clearly with friendly emoji bullets and insightful advice.
   - DO NOT give generic or repetitive canned responses. Answer their exact question!
3. ONLY call functions (add_expense, add_shopping_item, create_task) when the user explicitly wants to ADD, LOG, or SCHEDULE something new:
   - "add_expense": When user logs a purchase (e.g. "egg 207 rs add krdo", "dosto ke sath 1200 ka dinner kiya", "petrol 500"). Select the most accurate category: "Food & Dining", "Groceries", "Transportation", "Utilities", "Health & Medicine", "Shopping", "Housing & Rent", "Bills & Recharge", "General".
   - "add_shopping_item": When user says "add milk to shopping list" or "bread le aana".
   - "create_task": When user wants to schedule a chore or reminder.
4. When the user is casually chatting (e.g. "kaise ho", "aaj kafi thak gaya"), converse warmly and casually like a caring family friend.`;

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

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: message }],
          },
        ],
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        tools: [
          {
            functionDeclarations: toolDeclarations,
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 800,
        },
      };

      for (const model of modelNames) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const attempt = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(4500),
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
        answer: initialAnswer || "Bhai, main aapke ghar ke kharche, bills aur grocery manage karne ke liye ready hoon! Aap batao kya check karna hai?",
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
