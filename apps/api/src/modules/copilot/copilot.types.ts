export type ActionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type CopilotToolName =
  | 'createExpense'
  | 'updateExpense'
  | 'deleteExpense'
  | 'createIncome'
  | 'updateIncome'
  | 'deleteIncome'
  | 'createBill'
  | 'markBillPaid'
  | 'deleteBill'
  | 'createTask'
  | 'completeTask'
  | 'assignTask'
  | 'deleteTask'
  | 'addGroceryItem'
  | 'purchaseGroceryItem'
  | 'deleteGroceryItem'
  | 'getFinanceSummary'
  | 'getExpenses'
  | 'getBills'
  | 'getTasks'
  | 'getGroceries'
  | 'getAnalytics';

export interface ActionPreview {
  actionName: string;
  summary: string;
  amount?: number;
  currency?: string;
  category?: string;
  date?: string;
  entityTitle?: string;
  assigneeName?: string;
  riskLevel: ActionRiskLevel;
}

export interface PendingActionConfirmation {
  confirmationId: string;
  tool: CopilotToolName;
  args: Record<string, any>;
  preview: ActionPreview;
  prompt: string;
  expiresAt: string;
}

export interface ActionCardData {
  type: 'expense' | 'income' | 'bill' | 'task' | 'grocery' | 'analytics' | 'clarification';
  title: string;
  subtitle?: string;
  amount?: number;
  formattedAmount?: string;
  category?: string;
  date?: string;
  status?: string;
  linkUrl?: string;
  linkText?: string;
  items?: string[];
  options?: Array<{ label: string; text: string; action: string }>;
}

export interface CopilotToolResult {
  tool: CopilotToolName;
  success: boolean;
  message: string;
  data?: any;
  card?: ActionCardData;
  invalidatedKeys?: string[];
}

export interface CopilotExecutionContext {
  householdId: string;
  userId: string;
  userName: string;
  userRole: string;
  currencySymbol: string;
  currencyCode?: string;
  idempotencyKey?: string;
}

export interface CopilotProcessRequest {
  householdId: string;
  userId: string;
  userRole?: string;
  message: string;
  threadId?: string;
  idempotencyKey?: string;
}

export interface CopilotResponse {
  threadId: string;
  answer: string;
  actionsExecuted: CopilotToolResult[];
  pendingConfirmation?: PendingActionConfirmation;
  clarificationRequired?: {
    question: string;
    options: Array<{ label: string; actionPayload: string }>;
  };
  cards: ActionCardData[];
  suggestions: string[];
  invalidatedDomains: string[];
}
