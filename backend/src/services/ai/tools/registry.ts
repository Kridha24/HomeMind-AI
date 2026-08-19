export interface ToolDefinition {
  name: string;
  description: string;
  category: 'tasks' | 'calendar' | 'shopping' | 'finance' | 'family' | 'household' | 'reminders' | 'memory';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  // ==========================================
  // TASKS TOOLS
  // ==========================================
  get_tasks: {
    name: 'get_tasks',
    description: 'Retrieve pending or completed household tasks and chores.',
    category: 'tasks',
    riskLevel: 'LOW',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Filter by status', enum: ['PENDING', 'COMPLETED', 'ALL'] },
        priority: { type: 'string', description: 'Filter by priority', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
      },
      required: [],
    },
  },
  create_task: {
    name: 'create_task',
    description: 'Create a new household task or chore.',
    category: 'tasks',
    riskLevel: 'MEDIUM',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title or chore description' },
        priority: { type: 'string', description: 'Priority level', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
        dueDaysFromNow: { type: 'number', description: 'Days from today when the task is due (e.g. 0 for today, 1 for tomorrow, 7 for next week)' },
      },
      required: ['title'],
    },
  },
  update_task_status: {
    name: 'update_task_status',
    description: 'Mark a task as COMPLETED or PENDING by title or ID.',
    category: 'tasks',
    riskLevel: 'MEDIUM',
    parameters: {
      type: 'object',
      properties: {
        taskTitleOrId: { type: 'string', description: 'Title or ID of the task to update' },
        status: { type: 'string', description: 'New status', enum: ['COMPLETED', 'PENDING'] },
      },
      required: ['taskTitleOrId', 'status'],
    },
  },
  delete_task: {
    name: 'delete_task',
    description: 'Delete a task from the household.',
    category: 'tasks',
    riskLevel: 'HIGH',
    parameters: {
      type: 'object',
      properties: {
        taskTitleOrId: { type: 'string', description: 'Title or ID of the task to delete' },
      },
      required: ['taskTitleOrId'],
    },
  },

  // ==========================================
  // SHOPPING & GROCERY TOOLS
  // ==========================================
  get_shopping_list: {
    name: 'get_shopping_list',
    description: 'Retrieve grocery pantry items and items that are low in stock.',
    category: 'shopping',
    riskLevel: 'LOW',
    parameters: {
      type: 'object',
      properties: {
        onlyLowStock: { type: 'boolean', description: 'If true, only returns items whose quantity is at or below minimum threshold' },
      },
      required: [],
    },
  },
  add_shopping_item: {
    name: 'add_shopping_item',
    description: 'Add a new grocery item or restock request to household inventory.',
    category: 'shopping',
    riskLevel: 'MEDIUM',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the item (e.g. Whole Milk, Brown Bread, Basmati Rice)' },
        category: { type: 'string', description: 'Category (e.g. Milk, Bread, Vegetables, Fruits, Snacks, Cleaning, Personal Care)' },
        quantity: { type: 'number', description: 'Quantity (default 1)' },
        unit: { type: 'string', description: 'Unit (e.g. kg, L, pcs, pack)' },
      },
      required: ['name'],
    },
  },
  update_grocery_quantity: {
    name: 'update_grocery_quantity',
    description: 'Update the quantity of a grocery item in stock.',
    category: 'shopping',
    riskLevel: 'MEDIUM',
    parameters: {
      type: 'object',
      properties: {
        itemName: { type: 'string', description: 'Name of the grocery item' },
        quantity: { type: 'number', description: 'New quantity' },
      },
      required: ['itemName', 'quantity'],
    },
  },

  // ==========================================
  // FINANCE & BILLS TOOLS
  // ==========================================
  get_spending_summary: {
    name: 'get_spending_summary',
    description: 'Get total income, total expenses, net savings, and category breakdown for the month or overall.',
    category: 'finance',
    riskLevel: 'LOW',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  get_expenses: {
    name: 'get_expenses',
    description: 'Retrieve recent household expenses.',
    category: 'finance',
    riskLevel: 'LOW',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of recent expenses to fetch' },
      },
      required: [],
    },
  },
  add_expense: {
    name: 'add_expense',
    description: 'Record a new expense in the household budget.',
    category: 'finance',
    riskLevel: 'MEDIUM',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Expense description or merchant name' },
        amount: { type: 'number', description: 'Amount spent' },
        category: { type: 'string', description: 'Category (e.g. Groceries, Utilities, Dining, Transport, Entertainment, Shopping)' },
      },
      required: ['title', 'amount'],
    },
  },
  add_income: {
    name: 'add_income',
    description: 'Record a new income entry in the household budget.',
    category: 'finance',
    riskLevel: 'MEDIUM',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Income title / source' },
        amount: { type: 'number', description: 'Amount earned' },
        source: { type: 'string', description: 'Source (e.g. Salary, Freelance, Investment, Rent)' },
      },
      required: ['title', 'amount'],
    },
  },
  get_bills: {
    name: 'get_bills',
    description: 'Retrieve unpaid and paid household utility bills and rent dues.',
    category: 'finance',
    riskLevel: 'LOW',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'UNPAID, PAID, or ALL', enum: ['UNPAID', 'PAID', 'ALL'] },
      },
      required: [],
    },
  },
  mark_bill_paid: {
    name: 'mark_bill_paid',
    description: 'Mark a bill as PAID.',
    category: 'finance',
    riskLevel: 'HIGH',
    parameters: {
      type: 'object',
      properties: {
        billTitleOrId: { type: 'string', description: 'Title or ID of the bill' },
      },
      required: ['billTitleOrId'],
    },
  },

  // ==========================================
  // NOTIFICATIONS & REMINDERS
  // ==========================================
  create_reminder: {
    name: 'create_reminder',
    description: 'Create a household reminder or notification alert.',
    category: 'reminders',
    riskLevel: 'MEDIUM',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Reminder title' },
        message: { type: 'string', description: 'Reminder details' },
        type: { type: 'string', description: 'Notification type', enum: ['AI_ALERT', 'BILL_DUE', 'LOW_STOCK', 'MEDICINE_REMINDER', 'MAINTENANCE_DUE'] },
      },
      required: ['title', 'message'],
    },
  },
  get_reminders: {
    name: 'get_reminders',
    description: 'Get active household reminders and alerts.',
    category: 'reminders',
    riskLevel: 'LOW',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // ==========================================
  // HOUSEHOLD & FAMILY TOOLS
  // ==========================================
  get_household_summary: {
    name: 'get_household_summary',
    description: 'Get comprehensive status of the entire household including members, pending tasks, unpaid bills, low stock groceries, and appliances.',
    category: 'household',
    riskLevel: 'LOW',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  get_family_members: {
    name: 'get_family_members',
    description: 'Get the list of family members registered in the household.',
    category: 'family',
    riskLevel: 'LOW',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  get_appliances: {
    name: 'get_appliances',
    description: 'Retrieve household appliances, brands, and warranty status.',
    category: 'household',
    riskLevel: 'LOW',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  get_medicines: {
    name: 'get_medicines',
    description: 'Retrieve household medicines, dosages, and schedules.',
    category: 'household',
    riskLevel: 'LOW',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // ==========================================
  // MEMORY TOOLS
  // ==========================================
  save_memory: {
    name: 'save_memory',
    description: 'Remember a persistent household fact, preference, routine, or rule for future assistance.',
    category: 'memory',
    riskLevel: 'MEDIUM',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The fact or preference to remember (e.g. "We usually buy groceries on Saturday mornings", "Mihir is vegetarian")' },
        type: { type: 'string', description: 'Memory type', enum: ['PREFERENCE', 'ROUTINE', 'HOUSEHOLD_RULE', 'NOTE'] },
        importance: { type: 'string', description: 'Importance level', enum: ['LOW', 'MEDIUM', 'HIGH'] },
      },
      required: ['content'],
    },
  },
  get_memories: {
    name: 'get_memories',
    description: 'Retrieve stored AI memories and preferences for this household.',
    category: 'memory',
    riskLevel: 'LOW',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
};
