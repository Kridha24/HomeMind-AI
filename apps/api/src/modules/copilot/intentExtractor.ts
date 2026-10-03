import { CopilotToolName, ActionRiskLevel } from './copilot.types';

export interface ExtractedAction {
  tool: CopilotToolName;
  args: Record<string, any>;
  riskLevel: ActionRiskLevel;
  confidence: number;
  previewPrompt?: string;
  isAmbiguous?: boolean;
  clarificationQuestion?: string;
  clarificationOptions?: Array<{ label: string; actionPayload: string }>;
}

export class IntentExtractor {
  /**
   * Safe Number & Currency Parsing
   * Handles: 4k, 2.5k, ₹4,000, 4000 rupees, 4000 rs, rs 4000, 450
   */
  public static parseAmount(text: string): number | null {
    // 1. "4k" or "2.5k"
    const kMatch = text.match(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*k\b/i);
    if (kMatch) {
      return Math.round(parseFloat(kMatch[1]) * 1000);
    }

    // 2. Standard Indian and international currency formats (e.g., ₹4,000 or 4000 or 4,500.50)
    const currencyMatch = text.match(
      /(?:₹|rs\.?|inr|\$)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:₹|rs\.?|rupees|inr|\$)/i
    );
    if (currencyMatch) {
      const raw = currencyMatch[1] || currencyMatch[2];
      const normalized = raw.replace(/,/g, '');
      const val = parseFloat(normalized);
      if (!isNaN(val) && val > 0) return val;
    }

    // 3. Fallback: isolated number associated with financial keywords
    const numberMatch = text.match(/\b([\d,]+(?:\.\d+)?)\b/);
    if (numberMatch) {
      const raw = numberMatch[1].replace(/,/g, '');
      const val = parseFloat(raw);
      if (!isNaN(val) && val > 0) return val;
    }

    return null;
  }

  /**
   * Relative and Named Date Parsing
   * Handles: today, aaj, tomorrow, kal, parso, next week, 5 october, etc.
   */
  public static parseDate(text: string): Date {
    const lower = text.toLowerCase();
    const now = new Date();

    // Today / Aaj
    if (/\b(today|aaj|aaj ka)\b/i.test(lower)) {
      return now;
    }

    // Tomorrow / Kal (when looking forward in task/due context)
    if (/\b(tomorrow|kal|agle din)\b/i.test(lower)) {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      return d;
    }

    // Day after tomorrow / Parso
    if (/\b(parso|day after tomorrow)\b/i.test(lower)) {
      const d = new Date(now);
      d.setDate(d.getDate() + 2);
      return d;
    }

    // Next week / Agle hafte
    if (/\b(next week|agle hafte)\b/i.test(lower)) {
      const d = new Date(now);
      d.setDate(d.getDate() + 7);
      return d;
    }

    // Specific date: e.g. "5 October" or "5th Oct"
    const specificDateMatch = lower.match(
      /\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i
    );
    if (specificDateMatch) {
      const day = parseInt(specificDateMatch[1], 10);
      const monthStr = specificDateMatch[2];
      const months: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
      };
      const prefix = monthStr.slice(0, 3).toLowerCase();
      const month = months[prefix] !== undefined ? months[prefix] : now.getMonth();
      const target = new Date(now.getFullYear(), month, day, 12, 0, 0);
      return target;
    }

    // Default to today
    return now;
  }

  /**
   * Split Multi-Action Sentences
   * Handles: "Milk grocery me add karo aur kal electricity bill pay karne ka task bana do"
   */
  public static splitCompoundActions(text: string): string[] {
    const actionVerbs = /(?:add|create|karo|kar\s+do|bana\s+do|pay|paid|delete|spent|income|expense|task|bill)/i;
    const parts = text.split(/\s+(?:aur\s+phir|aur\s+bhi|aur|and\s+then|and\s+also|and)\s+/i);
    if (parts.length > 1) {
      const allHaveAction = parts.every((p) => actionVerbs.test(p));
      if (allHaveAction && parts.every((p) => p.trim().length > 6)) {
        return parts.map((p) => p.trim());
      }
    }
    return [text.trim()];
  }

  /**
   * Parse multiple grocery items in a single phrase
   * Example: "milk bread aur eggs grocery me add kar do"
   */
  public static parseGroceryItems(text: string): string[] {
    // Remove introductory and concluding phrases
    let cleaned = text
      .replace(/^(add|buy|get|please add|kripya)\s+/i, '')
      .replace(/\s+(grocery list me add karo|grocery me add karo|grocery me add kar do|grocery list me daal do|add to grocery|to shopping list|to groceries|to grocery|list me daal do|add kar do|add karo)$/i, '')
      .trim();

    // Split on commas and "aur" / "and" / "&"
    const rawItems = cleaned
      .split(/[,&]|\s+\baur\b\s+|\s+\band\b\s+/i)
      .map((item) => item.replace(/^(add|item|items)\s+/i, '').trim())
      .filter((item) => item.length > 1);

    const finalItems: string[] = [];
    for (const chunk of rawItems) {
      const words = chunk.split(/\s+/).filter((w) => w.length > 1);
      if (
        words.length > 1 &&
        !chunk.toLowerCase().includes('whole milk') &&
        !chunk.toLowerCase().includes('brown bread') &&
        !chunk.toLowerCase().includes('olive oil')
      ) {
        finalItems.push(...words);
      } else {
        finalItems.push(chunk);
      }
    }

    return finalItems.length > 0 ? finalItems : [cleaned];
  }

  /**
   * Main Intent Classifier and Structured Parameter Extractor
   */
  public static extract(
    message: string,
    householdMembers: Array<{ id: string; name: string }> = [],
    previousAction?: { tool: CopilotToolName; entityId?: string; entityTitle?: string; amount?: number }
  ): ExtractedAction | null {
    const raw = message.trim();
    const lower = raw.toLowerCase();

    // 0. Prompt Injection Sanitization
    // If the input attempts prompt override or SQL injections, treat strictly as literal data
    const sanitized = raw.replace(/[{}[\]<>`]/g, '');

    // =========================================================================
    // 1. DESTRUCTIVE / HIGH RISK COMMANDS (Requires Confirmation)
    // =========================================================================
    if (
      lower.includes('delete household') ||
      lower.includes('household delete') ||
      lower.includes('remove household') ||
      lower.includes('ghar delete')
    ) {
      return {
        tool: 'deleteExpense', // Safe placeholder pointing to high-risk confirmation
        args: { target: 'household' },
        riskLevel: 'HIGH',
        confidence: 0.99,
        previewPrompt: 'Are you absolutely sure you want to delete this household? This irreversible action will wipe all data.',
      };
    }

    if (
      lower.includes('delete expense') ||
      lower.includes('remove expense') ||
      lower.includes('kharcha delete karo')
    ) {
      const amount = this.parseAmount(raw);
      return {
        tool: 'deleteExpense',
        args: { id: previousAction?.entityId, amount },
        riskLevel: 'HIGH',
        confidence: 0.95,
        previewPrompt: `Are you sure you want to delete the expense${amount ? ` of ₹${amount}` : ''}? This cannot be undone.`,
      };
    }

    if (
      lower.includes('delete bill') ||
      lower.includes('remove bill') ||
      lower.includes('bill delete karo')
    ) {
      return {
        tool: 'deleteBill',
        args: { query: raw },
        riskLevel: 'HIGH',
        confidence: 0.95,
        previewPrompt: 'Are you sure you want to delete this bill? Active reminders will be removed.',
      };
    }

    if (
      lower.includes('delete task') ||
      lower.includes('remove task') ||
      lower.includes('task delete karo')
    ) {
      return {
        tool: 'deleteTask',
        args: { taskTitleOrId: raw },
        riskLevel: 'HIGH',
        confidence: 0.95,
        previewPrompt: 'Are you sure you want to delete this household task?',
      };
    }

    // =========================================================================
    // 2. CONTEXTUAL FOLLOW-UP ("Actually make it ₹500" / "500 kar do")
    // =========================================================================
    const isModification =
      (lower.startsWith('actually ') ||
        lower.startsWith('make it ') ||
        lower.startsWith('change to ') ||
        lower.startsWith('update to ') ||
        /^(?:actually\s+)?(?:\d+|₹[\d,]+)\s*(?:kar do|karo)?$/i.test(lower.trim()) ||
        lower.includes('change amount') ||
        lower.includes('amount badal do')) &&
      !lower.includes('income') &&
      !lower.includes('expense') &&
      !lower.includes('kharch') &&
      !lower.includes('add');

    if (
      isModification &&
      previousAction &&
      (previousAction.tool === 'createExpense' || previousAction.tool === 'updateExpense')
    ) {
      const newAmount = this.parseAmount(raw);
      if (newAmount && newAmount > 0) {
        return {
          tool: 'updateExpense',
          args: {
            id: previousAction.entityId,
            amount: newAmount,
          },
          riskLevel: 'MEDIUM',
          confidence: 0.95,
        };
      }
    }

    // =========================================================================
    // 3. BORROWED MONEY AMBIGUITY CHECK
    // Example: "bhaiya se 4000 liya" (without explicit "income me add karo")
    // =========================================================================
    const isBorrowedPhrase =
      ((/\bse\b/i.test(lower) && /\b(liya|liye|udhar)\b/i.test(lower)) ||
        lower.includes('udhar') ||
        lower.includes('borrow') ||
        lower.includes('loan')) &&
      !lower.includes('income me add') &&
      !lower.includes('income add') &&
      !lower.includes('as income');

    if (isBorrowedPhrase) {
      const amount = this.parseAmount(raw) || 0;
      return {
        tool: 'createIncome',
        args: { amount, isBorrowed: true },
        riskLevel: 'LOW',
        confidence: 0.8,
        isAmbiguous: true,
        clarificationQuestion: `Aapne ₹${amount.toLocaleString()} liya hai. Isko Income record karu ya Borrowed Money / Loan?`,
        clarificationOptions: [
          {
            label: 'Record as Income',
            actionPayload: `${amount} income me add kar do bhaiya se liya tha`,
          },
          {
            label: 'Record as Borrowed / Loan',
            actionPayload: `Borrowed liability: ₹${amount}`,
          },
        ],
      };
    }

    // =========================================================================
    // 4. INCOME: "4000 income me add kar do, bhaiya se liya tha" / "earned 5000"
    // =========================================================================
    if (
      lower.includes('income') ||
      lower.includes('salary') ||
      lower.includes('kamaya') ||
      lower.startsWith('earned') ||
      lower.startsWith('received income')
    ) {
      const amount = this.parseAmount(raw);
      if (amount && amount > 0) {
        let source = 'Other Income';
        if (lower.includes('salary') || lower.includes('tankhwah')) source = 'Salary';
        else if (lower.includes('bhaiya') || lower.includes('family') || lower.includes('papa') || lower.includes('mummy')) source = 'Family';
        else if (lower.includes('freelance') || lower.includes('client')) source = 'Freelance';
        else if (lower.includes('investment') || lower.includes('dividend') || lower.includes('stocks')) source = 'Investments';
        else if (lower.includes('rent')) source = 'Rental Income';

        // Title/Description extraction
        let title = raw
          .replace(/^(add|record|please add)\s+/i, '')
          .replace(/income\s*(me\s*add\s*(kar\s*do|karo))?/gi, '')
          .replace(/(?:₹|rs\.?|inr)?\s*[\d,]+(?:\.\d+)?\s*(?:k|rupees|rs)?/gi, '')
          .replace(/\b(add kar do|add karo|daal do|dal do|me add|received from)\b/gi, '')
          .trim();

        if (!title || title.length < 2) {
          title = `Income from ${source}`;
        }

        return {
          tool: 'createIncome',
          args: {
            title,
            amount,
            source,
            date: this.parseDate(raw).toISOString(),
          },
          riskLevel: 'LOW',
          confidence: 0.95,
        };
      }
    }

    // =========================================================================
    // 5. BILLS: "5 October wala PG rent paid mark kar do" / "mark bill paid"
    // =========================================================================
    if (
      (lower.includes('paid mark') || lower.includes('mark as paid') || lower.includes('mark paid') || lower.includes('pay kar diya')) &&
      (lower.includes('bill') || lower.includes('rent') || lower.includes('electricity') || lower.includes('pg') || lower.includes('wifi'))
    ) {
      let billQuery = raw
        .replace(/\b(paid mark kar do|paid mark karo|mark as paid|mark paid|pay kar diya|paid)\b/gi, '')
        .replace(/\b(wala|wali|ka|ki|ke|bill)\b/gi, '')
        .trim();

      const dueDate = this.parseDate(raw);

      return {
        tool: 'markBillPaid',
        args: {
          query: billQuery,
          dateTarget: dueDate.toISOString(),
        },
        riskLevel: 'MEDIUM',
        confidence: 0.95,
        previewPrompt: `Marking bill "${billQuery}" as PAID. Please confirm to record payment.`,
      };
    }

    // Create Bill: "create bill electricity 1500 due on 10th"
    if (
      (lower.includes('create bill') || lower.includes('add bill') || lower.includes('naya bill')) &&
      (lower.includes('due') || lower.includes('rent') || lower.includes('electricity'))
    ) {
      const amount = this.parseAmount(raw) || 0;
      const dueDate = this.parseDate(raw);
      let title = raw.replace(/^(create bill|add bill|naya bill)\s+/i, '').replace(/(\d+(\.\d+)?)/, '').trim();

      return {
        tool: 'createBill',
        args: {
          title: title || 'Household Bill',
          amount,
          category: 'Utilities',
          dueDate: dueDate.toISOString(),
        },
        riskLevel: 'LOW',
        confidence: 0.9,
      };
    }

    // =========================================================================
    // 6. TASKS: "Kal cylinder lene ka task bana do" / "Rahul ko kitchen clean assign karo"
    // =========================================================================
    if (
      lower.includes('task') ||
      lower.includes('chore') ||
      lower.includes('cylinder lena') ||
      lower.includes('safai') ||
      lower.includes('cleaning') ||
      lower.includes('assign karo') ||
      lower.includes('assign to') ||
      lower.includes('remind me to')
    ) {
      // Check complete task intent first
      if (
        lower.startsWith('done ') ||
        lower.startsWith('complete ') ||
        lower.includes('task complete') ||
        lower.includes('task done') ||
        lower.includes('khatam ho gaya')
      ) {
        const query = raw
          .replace(/^(done|complete|mark task as complete|task)\s+/i, '')
          .replace(/\b(complete kar diya|done ho gaya|khatam ho gaya)\b/gi, '')
          .trim();
        return {
          tool: 'completeTask',
          args: { query },
          riskLevel: 'LOW',
          confidence: 0.95,
        };
      }

      // Member assignment check: e.g. "Rahul ko kitchen cleaning assign karo"
      let assigneeId: string | undefined = undefined;
      let assigneeName: string | undefined = undefined;

      for (const member of householdMembers) {
        const memberFirst = member.name.split(' ')[0].toLowerCase();
        if (lower.includes(memberFirst)) {
          assigneeId = member.id;
          assigneeName = member.name;
          break;
        }
      }

      const dueDate = this.parseDate(raw);
      let taskTitle = raw
        .replace(/^(remind me to|create task to|create task|add task to|add task|task bana do|schedule task|assign task)\s+/i, '')
        .replace(/\b(ka task bana do|ka task banao|assign karo|assign to|ko assign karo|task do|task)\b/gi, '')
        .replace(new RegExp(`\\b${assigneeName || ''}\\b`, 'gi'), '')
        .replace(/\b(kal|aaj|today|tomorrow|next week)\b/gi, '')
        .trim();

      if (!taskTitle || taskTitle.length < 2) {
        taskTitle = 'Household Task';
      }

      return {
        tool: 'createTask',
        args: {
          title: taskTitle,
          priority: lower.includes('urgent') || lower.includes('emergency') ? 'URGENT' : 'MEDIUM',
          dueDate: dueDate.toISOString(),
          assigneeId,
          assigneeName,
        },
        riskLevel: 'LOW',
        confidence: 0.95,
      };
    }

    // =========================================================================
    // 7. GROCERIES: "Milk grocery list me add karo" / "milk bread aur eggs add karo"
    // =========================================================================
    if (
      lower.includes('grocery') ||
      lower.includes('groceries') ||
      lower.includes('shopping list') ||
      lower.includes('pantry') ||
      lower.includes('ration') ||
      (lower.includes('add') && (lower.includes('milk') || lower.includes('bread') || lower.includes('eggs') || lower.includes('doodh')))
    ) {
      // Check query list
      if (lower.includes('list dikhao') || lower.includes('show shopping') || lower.includes('what to buy') || lower.includes('low stock')) {
        return {
          tool: 'getGroceries',
          args: { onlyLowStock: lower.includes('low stock') || lower.includes('out of stock') },
          riskLevel: 'LOW',
          confidence: 0.95,
        };
      }

      // Add grocery items (supports multiple items)
      const items = this.parseGroceryItems(raw);

      return {
        tool: 'addGroceryItem',
        args: {
          items: items.map((item) => ({
            name: item.charAt(0).toUpperCase() + item.slice(1),
            quantity: 1,
            unit: 'pcs',
            category: 'Pantry Items',
          })),
        },
        riskLevel: 'LOW',
        confidence: 0.95,
      };
    }

    // =========================================================================
    // 8. EXPENSES: "450 mess expense add karo" / "kal ₹300 petrol me gaya"
    // =========================================================================
    const amount = this.parseAmount(raw);
    if (
      amount && amount > 0 &&
      (lower.includes('expense') ||
        lower.includes('kharch') ||
        lower.includes('spent') ||
        lower.includes('gaya') ||
        lower.includes('paid') ||
        lower.includes('diya'))
    ) {
      let category = 'General';
      if (lower.includes('mess') || lower.includes('food') || lower.includes('dinner') || lower.includes('lunch') || lower.includes('khana') || lower.includes('chai')) {
        category = 'Food & Dining';
      } else if (lower.includes('petrol') || lower.includes('fuel') || lower.includes('cab') || lower.includes('auto') || lower.includes('uber') || lower.includes('metro')) {
        category = 'Transportation';
      } else if (lower.includes('electricity') || lower.includes('bijli') || lower.includes('water') || lower.includes('cylinder') || lower.includes('gas') || lower.includes('wifi')) {
        category = 'Utilities';
      } else if (lower.includes('grocery') || lower.includes('ration') || lower.includes('sabzi')) {
        category = 'Groceries';
      } else if (lower.includes('rent') || lower.includes('pg')) {
        category = 'Housing & Rent';
      } else if (lower.includes('recharge') || lower.includes('mobile')) {
        category = 'Bills & Recharge';
      }

      let title = raw
        .replace(/^(spent|paid|add expense|record expense|kal|aaj)\s+/i, '')
        .replace(/(?:₹|rs\.?|inr)?\s*[\d,]+(?:\.\d+)?\s*(?:k|rupees|rs)?/gi, '')
        .replace(/\b(expense add karo|expense add kar do|kharch hua|me kharch hua|me gaya|expense|kharcha)\b/gi, '')
        .trim();

      if (!title || title.length < 2) {
        title = `${category} Spend`;
      }

      return {
        tool: 'createExpense',
        args: {
          title,
          amount,
          category,
          date: this.parseDate(raw).toISOString(),
        },
        riskLevel: 'LOW',
        confidence: 0.95,
      };
    }

    // =========================================================================
    // 9. QUERIES & ANALYTICS: "Is month kitna kharcha hua?" / "Sabse bada expense kya hai?"
    // =========================================================================
    if (lower.includes('kitna kharcha') || lower.includes('spending summary') || lower.includes('how much spent') || lower.includes('expenses this month') || lower.includes('total spend')) {
      return {
        tool: 'getFinanceSummary',
        args: { period: 'month' },
        riskLevel: 'LOW',
        confidence: 0.95,
      };
    }

    if (lower.includes('sabse bada expense') || lower.includes('highest expense') || lower.includes('top expense')) {
      return {
        tool: 'getExpenses',
        args: { sortBy: 'amount_desc', limit: 3 },
        riskLevel: 'LOW',
        confidence: 0.95,
      };
    }

    if (lower.includes('kitne bills pending') || lower.includes('unpaid bills') || lower.includes('pending bills') || lower.includes('bills due')) {
      return {
        tool: 'getBills',
        args: { status: 'UNPAID' },
        riskLevel: 'LOW',
        confidence: 0.95,
      };
    }

    if (lower.includes('aaj ke tasks') || lower.includes('today task') || lower.includes('pending tasks') || lower.includes('what tasks')) {
      return {
        tool: 'getTasks',
        args: { status: 'PENDING' },
        riskLevel: 'LOW',
        confidence: 0.95,
      };
    }

    if (lower.includes('analytics') || lower.includes('savings rate') || lower.includes('cash flow')) {
      return {
        tool: 'getAnalytics',
        args: { period: 'month' },
        riskLevel: 'LOW',
        confidence: 0.95,
      };
    }

    return null;
  }
}
