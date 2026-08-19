import { ContextManager, HouseholdAIContext } from './context/contextManager';
import { ToolExecutor, ToolResult } from './tools/executor';
import { prisma } from '../../repositories/db';

export interface AssistantChatResponse {
  threadId?: string;
  answer: string;
  toolCallsExecuted: ToolResult[];
  pendingConfirmation?: {
    tool: string;
    args: any;
    prompt: string;
  };
  suggestions: string[];
}

export class AIOrchestrator {
  static async processMessage(params: {
    householdId: string;
    userId: string;
    message: string;
    threadId?: string;
  }): Promise<AssistantChatResponse> {
    const { householdId, userId, message, threadId } = params;

    // 1. Fetch live household context
    const ctx = await ContextManager.getHouseholdContext(householdId, userId);
    const execCtx = {
      householdId,
      userId,
      userName: ctx.userName,
      currencySymbol: ctx.currencySymbol,
    };

    const toolCallsExecuted: ToolResult[] = [];
    let pendingConfirmation: AssistantChatResponse['pendingConfirmation'] = undefined;
    let answer = '';
    const suggestions: string[] = [];

    const lower = message.toLowerCase().trim();

    // =========================================================================
    // INTENT DETECTION & TOOL ROUTING
    // =========================================================================

    // 1. Task: Complete Task
    if (lower.startsWith('done ') || lower.startsWith('complete ') || lower.includes('mark task') || (lower.includes('task') && (lower.includes('complete') || lower.includes('done') || lower.includes('finish')))) {
      const taskQuery = lower.replace(/^(done|complete|mark task as complete|mark as done|finish)\s+/i, '').replace(/task/gi, '').trim();
      const res = await ToolExecutor.execute('update_task_status', { taskTitleOrId: taskQuery, status: 'COMPLETED' }, execCtx);
      toolCallsExecuted.push(res);
      if (res.success) {
        answer = `Done! I've marked **"${res.data.title}"** as completed.`;
        suggestions.push('Show my remaining pending tasks', 'What bills are due next?');
      } else {
        answer = `I couldn't locate a pending task matching "${taskQuery}". Here are your active tasks:\n` +
          ctx.pendingTasks.map((t) => `• ${t.title} (Due: ${t.dueDate})`).join('\n');
      }
    }

    // 2. Task: Create Task / Chore
    else if (lower.startsWith('remind me to ') || lower.startsWith('add task ') || lower.startsWith('create task ') || (lower.includes('task') && (lower.includes('add') || lower.includes('create')))) {
      let title = message.replace(/^(remind me to|add task to|add task|create task to|create task|schedule task to|schedule)\s+/i, '').trim();
      let dueDays = 1;

      if (lower.includes('today')) {
        dueDays = 0;
        title = title.replace(/\btoday\b/gi, '').trim();
      } else if (lower.includes('tomorrow')) {
        dueDays = 1;
        title = title.replace(/\btomorrow\b/gi, '').trim();
      } else if (lower.includes('next week')) {
        dueDays = 7;
        title = title.replace(/\bnext week\b/gi, '').trim();
      }

      const res = await ToolExecutor.execute('create_task', { title, priority: 'MEDIUM', dueDaysFromNow: dueDays }, execCtx);
      toolCallsExecuted.push(res);
      answer = `Done. I've scheduled **"${title}"** as a task due on ${new Date(Date.now() + dueDays * 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}.`;
      suggestions.push('Show all pending tasks', 'Plan my day');
    }

    // 3. Task: Delete Task (High Risk Confirmation)
    else if (lower.startsWith('delete task ') || lower.startsWith('remove task ')) {
      const taskQuery = lower.replace(/^(delete task|remove task)\s+/i, '').trim();
      pendingConfirmation = {
        tool: 'delete_task',
        args: { taskTitleOrId: taskQuery },
        prompt: `Are you sure you want to delete the task matching "${taskQuery}"?`,
      };
      answer = `I am ready to delete the task matching **"${taskQuery}"**. Please confirm below to proceed.`;
    }

    // 4. Shopping / Grocery: Add Item
    else if (lower.startsWith('add ') && (lower.includes('grocery') || lower.includes('shopping') || lower.includes('milk') || lower.includes('bread') || lower.includes('rice') || lower.includes('oil') || lower.includes('eggs') || lower.includes('pantry') || lower.includes('to list') || lower.includes('to shopping'))) {
      const cleaned = message.replace(/^(add|buy|get)\s+/i, '').replace(/\b(to shopping list|to groceries|to grocery list|to pantry|to list)\b/gi, '').trim();
      const res = await ToolExecutor.execute('add_shopping_item', { name: cleaned, quantity: 1, unit: 'pcs' }, execCtx);
      toolCallsExecuted.push(res);
      answer = `Done! Added **"${cleaned}"** to your household shopping inventory.`;
      suggestions.push('Show my shopping list', 'What items are low in stock?');
    }

    // 5. Shopping / Grocery: Show List or Low Stock
    else if (lower.includes('shopping') || lower.includes('pantry') || lower.includes('grocery') || lower.includes('low stock') || lower.includes('out of stock')) {
      const onlyLowStock = lower.includes('low') || lower.includes('out of');
      const res = await ToolExecutor.execute('get_shopping_list', { onlyLowStock }, execCtx);
      toolCallsExecuted.push(res);
      
      if (res.data && res.data.length > 0) {
        answer = `### 🛒 ${onlyLowStock ? 'Low Stock Grocery Items' : 'Household Shopping & Pantry'}\n\n` +
          res.data.map((i: any) => `• **${i.name}**: ${i.quantity} ${i.unit} ${i.isLowStock ? '⚠️ *(Low Stock)*' : ''}`).join('\n');
      } else {
        answer = `Your household pantry is fully stocked! There are no low stock grocery items right now.`;
      }
      suggestions.push('Add milk to shopping', 'Suggest recipe based on pantry');
    }

    // 6. Finance: Add Expense
    else if (lower.startsWith('spent ') || lower.startsWith('paid ') || (lower.includes('spent') && lower.match(/\d+/)) || (lower.includes('expense') && lower.includes('add'))) {
      const amountMatch = message.match(/(\d+(\.\d+)?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
      let title = message.replace(/^(spent|paid|record expense of|add expense of)\s+/i, '').replace(/(\d+(\.\d+)?)/, '').replace(/\b(on|for|at|dollars|rupees|\$|₹)\b/gi, '').trim();
      if (!title) title = 'General Expense';

      const res = await ToolExecutor.execute('add_expense', { title, amount, category: 'General' }, execCtx);
      toolCallsExecuted.push(res);
      answer = `Done! Recorded expense of **${ctx.currencySymbol}${amount.toLocaleString()}** for **"${title}"**.`;
      suggestions.push('What is my total spending this month?', 'Show my recent expenses');
    }

    // 7. Finance: Add Income
    else if (lower.startsWith('earned ') || lower.startsWith('received income ') || (lower.includes('salary') && lower.match(/\d+/))) {
      const amountMatch = message.match(/(\d+(\.\d+)?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
      let source = message.replace(/^(earned|received income of|salary of)\s+/i, '').replace(/(\d+(\.\d+)?)/, '').trim() || 'Salary';

      const res = await ToolExecutor.execute('add_income', { title: 'Income Received', amount, source }, execCtx);
      toolCallsExecuted.push(res);
      answer = `Recorded incoming income of **${ctx.currencySymbol}${amount.toLocaleString()}** (${source}).`;
      suggestions.push('Show spending summary', 'Show upcoming bills');
    }

    // 8. Finance: Spending Summary / Balance
    else if (lower.includes('spend') || lower.includes('expense') || lower.includes('budget') || lower.includes('savings') || lower.includes('balance') || lower.includes('financial')) {
      const res = await ToolExecutor.execute('get_spending_summary', {}, execCtx);
      toolCallsExecuted.push(res);

      const d = res.data;
      answer = `### 💰 Monthly Financial Overview\n\n` +
        `• **Total Monthly Income:** ${ctx.currencySymbol}${d.monthlyIncome.toLocaleString()}\n` +
        `• **Total Monthly Expenses:** ${ctx.currencySymbol}${d.monthlyExpenses.toLocaleString()}\n` +
        `• **Net Monthly Savings:** ${ctx.currencySymbol}${d.monthlySavings.toLocaleString()}\n` +
        `• **Unpaid Dues / Bills:** ${ctx.currencySymbol}${d.unpaidBillsTotal.toLocaleString()} (${d.unpaidBillsCount} bills)\n\n` +
        (Object.keys(d.topCategories).length > 0
          ? `**Top Expense Categories:**\n` +
            Object.entries(d.topCategories)
              .sort((a: any, b: any) => b[1] - a[1])
              .slice(0, 4)
              .map(([cat, amt]) => `• ${cat}: ${ctx.currencySymbol}${Number(amt).toLocaleString()}`)
              .join('\n')
          : '');
      suggestions.push('Show unpaid bills', 'Show my recent expenses');
    }

    // 9. Bills: Due Dates & Unpaid Bills
    else if (lower.includes('bill') || lower.includes('rent') || lower.includes('due') || lower.includes('electricity') || lower.includes('utility')) {
      const res = await ToolExecutor.execute('get_bills', { status: 'UNPAID' }, execCtx);
      toolCallsExecuted.push(res);

      if (res.data && res.data.length > 0) {
        answer = `### 📋 Unpaid Bills & Dues\n\n` +
          res.data.map((b: any) => `• **${b.title}** (${b.category}): ${b.amount} — Due on **${b.dueDate}**`).join('\n') +
          `\n\n**Total Due:** ${ctx.currencySymbol}${ctx.unpaidBillsTotal.toLocaleString()}`;
        suggestions.push('How much did I spend this month?', 'Show my tasks');
      } else {
        answer = `All household utility and rent bills are currently **PAID**. There are no overdue bills!`;
        suggestions.push('Plan my day', 'Show pending tasks');
      }
    }

    // 10. Agenda / Today's Schedule: "What do I have today?", "What do I need to finish today?"
    else if (lower.includes('what do i have today') || lower.includes('what is on my schedule') || lower.includes('what is on my calendar') || lower.includes('what do i need to finish today') || lower.includes('what do i need to do today') || lower.includes('schedule for today')) {
      const [tasksRes, billsRes, shoppingRes] = await Promise.all([
        ToolExecutor.execute('get_tasks', { status: 'PENDING' }, execCtx),
        ToolExecutor.execute('get_bills', { status: 'UNPAID' }, execCtx),
        ToolExecutor.execute('get_shopping_list', { onlyLowStock: true }, execCtx),
      ]);
      toolCallsExecuted.push(tasksRes, billsRes, shoppingRes);

      const pendingTasks = tasksRes.data || [];
      const unpaidBills = billsRes.data || [];

      if (pendingTasks.length === 0 && unpaidBills.length === 0) {
        answer = `You are all caught up for today! You have no pending tasks or due bills in **${ctx.householdName}**.`;
      } else {
        answer = `### 📅 Your Household Agenda for Today\n\n` +
          (pendingTasks.length > 0
            ? `**Pending Tasks (${pendingTasks.length}):**\n` +
              pendingTasks.slice(0, 5).map((t: any) => `• **${t.title}** *(Priority: ${t.priority}, Due: ${t.dueDate})*`).join('\n') + '\n\n'
            : `✓ All household tasks are completed.\n\n`) +
          (unpaidBills.length > 0
            ? `**Upcoming Dues (${unpaidBills.length}):**\n` +
              unpaidBills.slice(0, 3).map((b: any) => `• **${b.title}**: ${b.amount} (Due: ${b.dueDate})`).join('\n')
            : `✓ All bills are paid.`);
      }
      suggestions.push('Plan my day', 'Show shopping list', 'Check my spending');
    }

    // 11. Complex Planning: "Plan my day" / "Plan my Saturday" / "Plan my weekend"
    else if (lower.includes('plan my day') || lower.includes('plan today') || lower.includes('plan my saturday') || lower.includes('plan my sunday') || lower.includes('schedule today') || lower.includes('daily plan')) {
      const [tasksRes, billsRes, shoppingRes] = await Promise.all([
        ToolExecutor.execute('get_tasks', { status: 'PENDING' }, execCtx),
        ToolExecutor.execute('get_bills', { status: 'UNPAID' }, execCtx),
        ToolExecutor.execute('get_shopping_list', { onlyLowStock: true }, execCtx),
      ]);
      toolCallsExecuted.push(tasksRes, billsRes, shoppingRes);

      const isSaturday = lower.includes('saturday');
      const dayName = isSaturday ? 'Saturday' : 'Today';

      answer = `### 📅 Suggested Intelligent Schedule for ${dayName}\n\n` +
        `**09:00 AM — Morning Routine & Pantry**\n` +
        (shoppingRes.data?.length > 0
          ? `🛒 Restock low pantry items (${shoppingRes.data.slice(0, 3).map((i: any) => i.name).join(', ')})\n\n`
          : `☕ Morning routine & kitchen check\n\n`) +
        `**11:30 AM — Priority Household Tasks**\n` +
        (tasksRes.data?.length > 0
          ? `📋 Work on priority chores: **${tasksRes.data[0]?.title}**\n\n`
          : `✨ Household chores are up to date\n\n`) +
        `**02:00 PM — Focus & Personal Time**\n` +
        `📖 Focus session & personal tasks\n\n` +
        `**06:00 PM — Family & Evening Review**\n` +
        (billsRes.data?.length > 0
          ? `💳 Review pending bill due dates (${billsRes.data[0]?.title}: ${billsRes.data[0]?.amount})\n`
          : `👨‍👩‍👧 Family dinner & evening sync\n`);

      suggestions.push('Show pending tasks', 'Show shopping list', 'Analyze spending');
    }

    // 12. Grocery Intelligence: "Should I go grocery shopping today?"
    else if (lower.includes('should i go grocery shopping') || lower.includes('do we need groceries') || lower.includes('need to buy groceries')) {
      const res = await ToolExecutor.execute('get_shopping_list', { onlyLowStock: true }, execCtx);
      toolCallsExecuted.push(res);

      if (res.data && res.data.length > 0) {
        answer = `Yes, you should! You have **${res.data.length}** item(s) running low in your pantry:\n\n` +
          res.data.map((i: any) => `• **${i.name}**: ${i.quantity} ${i.unit} remaining`).join('\n') +
          `\n\nWould you like me to add any other items before you head out?`;
      } else {
        answer = `No urgent need! All items in your household pantry are currently well-stocked above minimum thresholds.`;
      }
      suggestions.push('Show full shopping list', 'Plan my day');
    }

    // 11. Memory: Save Fact / Preference
    else if (lower.startsWith('remember that ') || lower.startsWith('remember ') || lower.startsWith('save memory ')) {
      const content = message.replace(/^(remember that|remember to|remember|save memory that|save memory)\s+/i, '').trim();
      const res = await ToolExecutor.execute('save_memory', { content, type: 'PREFERENCE', importance: 'HIGH' }, execCtx);
      toolCallsExecuted.push(res);
      answer = `Got it! I have saved this household memory:\n> *"I will remember that ${content} for future recommendations."*`;
      suggestions.push('Show all memories', 'Plan my day');
    }

    // 12. Memory: Get Memories
    else if (lower.includes('memories') || lower.includes('what do you remember') || lower.includes('my preferences')) {
      const res = await ToolExecutor.execute('get_memories', {}, execCtx);
      toolCallsExecuted.push(res);

      if (res.data && res.data.length > 0) {
        answer = `### 🧠 Stored AI Household Memories\n\n` +
          res.data.map((m: any) => `• **[${m.type}]**: ${m.content}`).join('\n');
      } else {
        answer = `I don't have any custom memories stored yet. You can tell me things like *"Remember that we buy groceries on Saturdays"* and I'll keep track!`;
      }
      suggestions.push('Remember that we prefer evening chores', 'Show household summary');
    }

    // 13. Household Summary / Overview
    else if (lower.includes('summary') || lower.includes('household') || lower.includes('overview') || lower.includes('home today') || lower.includes('status')) {
      const res = await ToolExecutor.execute('get_household_summary', {}, execCtx);
      toolCallsExecuted.push(res);

      answer = `### 🏠 ${ctx.householdName} Status Overview\n\n` +
        `• **Family Members:** ${ctx.familyMembers.map((m) => m.name).join(', ')}\n` +
        `• **Pending Tasks:** ${ctx.pendingTasks.length} tasks scheduled\n` +
        `• **Unpaid Bills:** ${ctx.unpaidBills.length} dues (${ctx.currencySymbol}${ctx.unpaidBillsTotal.toLocaleString()})\n` +
        `• **Pantry Alerts:** ${ctx.lowStockGroceries.length} items low in stock\n` +
        `• **Monthly Net Balance:** ${ctx.monthlySavings >= 0 ? `+` : ''}${ctx.currencySymbol}${ctx.monthlySavings.toLocaleString()}`;

      suggestions.push('Plan my day', 'Show unpaid bills', 'Show low stock groceries');
    }

    // 14. Tasks: Show All Tasks
    else if (lower.includes('task') || lower.includes('chore') || lower.includes('to do') || lower.includes('todo')) {
      const res = await ToolExecutor.execute('get_tasks', { status: 'PENDING' }, execCtx);
      toolCallsExecuted.push(res);

      if (res.data && res.data.length > 0) {
        answer = `### 📋 Active Household Tasks\n\n` +
          res.data.map((t: any) => `• **[${t.priority}]** ${t.title} *(Due: ${t.dueDate})*`).join('\n');
        suggestions.push('Mark task as complete', 'Add new task', 'Plan my day');
      } else {
        answer = `All household tasks are completed! You have no pending chores.`;
        suggestions.push('Add new task', 'Show shopping list');
      }
    }

    // 15. General Household AI Conversational Fallback
    else {
      answer = `I am **HomeMind**, your context-aware household agent. I can help organize tasks, manage your budget, plan your day, and automate chores for **${ctx.householdName}**.\n\n` +
        `Here is a quick snapshot of your home today:\n` +
        `• **${ctx.pendingTasks.length}** pending tasks\n` +
        `• **${ctx.unpaidBills.length}** unpaid bills (${ctx.currencySymbol}${ctx.unpaidBillsTotal.toLocaleString()})\n` +
        `• **${ctx.lowStockGroceries.length}** low stock pantry items`;

      suggestions.push(
        'Plan my day',
        'Show pending tasks',
        'Show unpaid bills',
        'Show low stock pantry items'
      );
    }

    // Record thread & message in database
    let activeThreadId = threadId;
    try {
      if (!activeThreadId) {
        const thread = await prisma.aIThread.create({
          data: {
            householdId,
            userId,
            title: message.slice(0, 40) + '...',
          },
        });
        activeThreadId = thread.id;
      }

      // Save user message
      await prisma.aIMessage.create({
        data: {
          threadId: activeThreadId,
          role: 'user',
          content: message,
        },
      });

      // Save assistant message with tool calls
      await prisma.aIMessage.create({
        data: {
          threadId: activeThreadId,
          role: 'assistant',
          content: answer,
          toolCalls: toolCallsExecuted.length ? JSON.stringify(toolCallsExecuted) : null,
        },
      });
    } catch (dbErr) {
      console.warn('AI message persistence error:', dbErr);
    }

    return {
      threadId: activeThreadId,
      answer,
      toolCallsExecuted,
      pendingConfirmation,
      suggestions: suggestions.slice(0, 4),
    };
  }
}
