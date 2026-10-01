export interface CreateExpenseDto {
  title: string;
  amount: number;
  category: string;
  date?: string | Date;
  isRecurring?: boolean;
  receiptUrl?: string | null;
}

export interface UpdateExpenseDto {
  title?: string;
  amount?: number;
  category?: string;
  date?: string | Date;
  isRecurring?: boolean;
  receiptUrl?: string | null;
}
