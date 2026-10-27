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

Household Context:
${householdContextSummary || 'Active family household'}

Key Guidelines:
1. Speak warmly and naturally in friendly Hinglish or English (mirror the user's language).
2. When the user mentions an expense (e.g. "egg 207 rs add krdo", "dosto ke sath 1200 ka dinner kiya", "petrol 500"), DO NOT just talk about it. ALWAYS call the function 'add_expense' with the accurate category:
   - "Food & Dining": eggs, milk, dinner, lunch, breakfast, snacks, coffee, chai, restaurant, swiggy, zomato, pizza, burger, biryani.
   - "Groceries": ration, atta, rice, dal, oil, sabzi, vegetables, fruits, kirana.
   - "Transportation": petrol, diesel, cab, uber, ola, auto, metro, bus, parking, toll.
   - "Utilities": electricity, bijli, gas, cylinder, wifi, recharge, water.
   - "Health & Medicine": doctor, clinic, medicine, dawai, pharmacy.
   - "Shopping": clothes, shoes, amazon, flipkart, shopping.
   - "Housing & Rent": rent, maintenance, pg.
3. When the user wants grocery items added (e.g. "milk aur bread le aana", "add to shopping"), call 'add_shopping_item'.
4. When the user wants a reminder or task, call 'create_task'.
5. When the user asks for financial summaries or bills, call 'get_spending_summary' or 'get_bills'.
6. When the user is just casually chatting (e.g. "kaise ho", "aaj bahut thak gaya", "tips for saving"), converse warmly and casually like a caring family friend.`;

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
      {
        name: 'get_spending_summary',
        description: 'Fetches today, weekly, and monthly expense rollups and category breakdowns.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        name: 'get_bills',
        description: 'Fetches upcoming and overdue recurring utility bills.',
        parameters: {
          type: 'OBJECT',
          properties: {},
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

            if (fnName === 'add_expense') {
              initialAnswer = `Done bhai! Recorded **${currencySymbol}${fnArgs.amount}** for **"${fnArgs.title}"** under **${fnArgs.category}** 🛒✨`;
            } else if (fnName === 'add_shopping_item') {
              initialAnswer = `Added **"${fnArgs.name}"** to your household grocery checklist! 📝`;
            } else if (fnName === 'create_task') {
              initialAnswer = `Scheduled task **"${fnArgs.title}"** for you! ⏰`;
            } else if (fnName === 'get_spending_summary') {
              const d = toolResult.data || {};
              const today = d.todayExpenses || 0;
              const week = d.thisWeekExpenses || 0;
              const month = d.monthlyExpenses || 0;
              const todayCats = d.todayCategories || {};
              const topCats = d.topCategories || {};

              const lowerMsg = message.toLowerCase();
              let specificMention = '';

              if (lowerMsg.includes('grocer') || lowerMsg.includes('ration') || lowerMsg.includes('kirana')) {
                const todayGroc = todayCats['Groceries'] || 0;
                const monthGroc = topCats['Groceries'] || 0;
                specificMention = `\n• **Groceries (Aaj):** ${currencySymbol}${todayGroc.toLocaleString()}\n• **Groceries (Is Mahine):** ${currencySymbol}${monthGroc.toLocaleString()}`;
              } else if (lowerMsg.includes('food') || lowerMsg.includes('dinner') || lowerMsg.includes('lunch') || lowerMsg.includes('khana') || lowerMsg.includes('egg')) {
                const todayFood = todayCats['Food & Dining'] || 0;
                const monthFood = topCats['Food & Dining'] || 0;
                specificMention = `\n• **Food & Dining (Aaj):** ${currencySymbol}${todayFood.toLocaleString()}\n• **Food & Dining (Is Mahine):** ${currencySymbol}${monthFood.toLocaleString()}`;
              }

              let topCatList = '';
              if (Object.keys(topCats).length > 0) {
                topCatList = '\n\n**Categories Breakdown (Is Month):**\n' + Object.entries(topCats)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([cat, amt]) => `• ${cat}: ${currencySymbol}${Number(amt).toLocaleString()}`)
                  .join('\n');
              }

              initialAnswer = `Bhai, yeh raha spending summary 💰:\n\n• **Aaj ka total kharcha:** ${currencySymbol}${today.toLocaleString()}${specificMention}\n• **Is hafte ka kharcha:** ${currencySymbol}${week.toLocaleString()}\n• **Is mahine ka total:** ${currencySymbol}${month.toLocaleString()}${topCatList}`;
            } else if (fnName === 'get_bills') {
              const bills = toolResult.data || [];
              if (bills.length === 0) {
                initialAnswer = `Bhai, abhi koi upcoming ya overdue bills pending nahi hain! Sab cleared hai 🎉`;
              } else {
                initialAnswer = `Bhai, yeh hain aapke pending bills ⚡:\n\n` + bills.map((b: any) => `• **${b.title}**: ${currencySymbol}${b.amount} (Due: ${b.dueDate?.split('T')[0] || 'Soon'})`).join('\n');
              }
            } else if (toolResult.message) {
              initialAnswer = toolResult.message;
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
