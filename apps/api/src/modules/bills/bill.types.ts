export interface CreateBillDto {
  title: string;
  category: string;
  amount: number;
  dueDate: string | Date;
  provider?: string | null;
  notes?: string | null;
}

export interface UpdateBillDto {
  title?: string;
  category?: string;
  amount?: number;
  dueDate?: string | Date;
  provider?: string | null;
  notes?: string | null;
}
