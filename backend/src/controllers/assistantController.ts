import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../repositories/db';
import { AIOrchestrator } from '../services/ai/orchestrator';
import { ToolExecutor } from '../services/ai/tools/executor';
import { ContextManager } from '../services/ai/context/contextManager';

export const chat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const userId = req.user?.userId;
    if (!householdId || !userId) {
      return res.status(401).json({ error: 'Unauthorized: Household context missing' });
    }

    const { message, threadId } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message string is required.' });
    }

    const response = await AIOrchestrator.processMessage({
      householdId,
      userId,
      message: message.trim(),
      threadId,
    });

    res.json(response);
  } catch (err: any) {
    console.error('Assistant chat error:', err);
    res.status(500).json({ error: 'Internal AI assistant processing error' });
  }
};

export const streamChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const userId = req.user?.userId;
    if (!householdId || !userId) {
      return res.status(401).json({ error: 'Unauthorized: Household context missing' });
    }

    const { message, threadId } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message string is required.' });
    }

    // Configure SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'start', message: 'Analyzing household intent...' })}\n\n`);

    const result = await AIOrchestrator.processMessage({
      householdId,
      userId,
      message: message.trim(),
      threadId,
    });

    // Send tool calls events
    if (result.toolCallsExecuted && result.toolCallsExecuted.length > 0) {
      for (const tool of result.toolCallsExecuted) {
        res.write(`data: ${JSON.stringify({ type: 'tool', tool: tool.tool, success: tool.success, message: tool.message })}\n\n`);
      }
    }

    // Stream the final answer tokens in chunks for natural typing animation
    const words = result.answer.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(' ') + ' ';
      res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
      await new Promise((r) => setTimeout(r, 25));
    }

    // Send completion event with full payload
    res.write(
      `data: ${JSON.stringify({
        type: 'done',
        threadId: result.threadId,
        answer: result.answer,
        toolCalls: result.toolCallsExecuted,
        pendingConfirmation: result.pendingConfirmation,
        suggestions: result.suggestions,
      })}\n\n`
    );

    res.end();
  } catch (err: any) {
    console.error('Assistant stream error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Stream error' })}\n\n`);
    res.end();
  }
};

export const getDailySummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const userId = req.user?.userId;
    if (!householdId || !userId) {
      return res.status(401).json({ error: 'Unauthorized: Household context missing' });
    }

    const ctx = await ContextManager.getHouseholdContext(householdId, userId);

    let insight = '';
    if (ctx.unpaidBills.length > 0) {
      insight = `You have ${ctx.unpaidBills.length} unpaid bill(s) due soon (${ctx.currencySymbol}${ctx.unpaidBillsTotal.toLocaleString()}). Prioritize ${ctx.unpaidBills[0].title}.`;
    } else if (ctx.lowStockGroceries.length > 0) {
      insight = `Pantry is running low on ${ctx.lowStockGroceries.length} item(s): ${ctx.lowStockGroceries.map((g) => g.name).slice(0, 2).join(', ')}.`;
    } else if (ctx.pendingTasks.length > 0) {
      insight = `You have ${ctx.pendingTasks.length} pending task(s) scheduled for this week.`;
    } else {
      insight = `Your household is operating smoothly with all bills paid and pantry stocked!`;
    }

    res.json({
      greeting: `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${ctx.userName}`,
      householdName: ctx.householdName,
      metrics: {
        pendingTasksCount: ctx.pendingTasks.length,
        unpaidBillsCount: ctx.unpaidBills.length,
        unpaidBillsTotal: `${ctx.currencySymbol}${ctx.unpaidBillsTotal.toLocaleString()}`,
        lowStockItemsCount: ctx.lowStockGroceries.length,
        monthlySavings: `${ctx.currencySymbol}${ctx.monthlySavings.toLocaleString()}`,
      },
      insight,
    });
  } catch (err: any) {
    console.error('[Assistant] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

export const getThreads = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const userId = req.user?.userId;
    if (!householdId || !userId) return res.status(401).json({ error: 'Unauthorized' });

    const threads = await prisma.aIThread.findMany({
      where: { householdId, userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json({ threads });
  } catch (err: any) {
    console.error('[Assistant] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

export const getThreadMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const { threadId } = req.params;
    if (!householdId) return res.status(401).json({ error: 'Unauthorized' });

    const messages = await prisma.aIMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ messages });
  } catch (err: any) {
    console.error('[Assistant] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

export const deleteThread = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const { threadId } = req.params;
    if (!householdId) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.aIThread.deleteMany({
      where: { id: threadId, householdId },
    });

    res.json({ success: true, message: 'Thread cleared.' });
  } catch (err: any) {
    console.error('[Assistant] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

export const getMemories = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    if (!householdId) return res.status(401).json({ error: 'Unauthorized' });

    const memories = await prisma.aIMemory.findMany({
      where: { householdId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ memories });
  } catch (err: any) {
    console.error('[Assistant] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

export const createMemory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const userId = req.user?.userId;
    if (!householdId || !userId) return res.status(401).json({ error: 'Unauthorized' });

    const { content, type, importance } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required.' });

    const memory = await prisma.aIMemory.create({
      data: {
        householdId,
        userId,
        content: content.trim(),
        type: type || 'PREFERENCE',
        importance: importance || 'MEDIUM',
        source: 'MANUAL',
        isActive: true,
      },
    });

    res.json({ memory });
  } catch (err: any) {
    console.error('[Assistant] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

export const deleteMemory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const { id } = req.params;
    if (!householdId) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.aIMemory.updateMany({
      where: { id, householdId },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'Memory removed.' });
  } catch (err: any) {
    console.error('[Assistant] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

export const executeConfirmedAction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const householdId = req.user?.householdId;
    const userId = req.user?.userId;
    if (!householdId || !userId) return res.status(401).json({ error: 'Unauthorized' });

    const { tool, args } = req.body;
    if (!tool) return res.status(400).json({ error: 'Tool name is required.' });

    const ctx = await ContextManager.getHouseholdContext(householdId, userId);
    const execCtx = {
      householdId,
      userId,
      userName: ctx.userName,
      currencySymbol: ctx.currencySymbol,
    };

    const result = await ToolExecutor.execute(tool, args, execCtx);
    res.json(result);
  } catch (err: any) {
    console.error('[Assistant] Error:', err.message);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};
