export interface CreateIncomeDto {
  title: string;
  amount: number;
  source: string;
  date?: string | Date;
}

export interface UpdateIncomeDto {
  title?: string;
  amount?: number;
  source?: string;
  date?: string | Date;
}
