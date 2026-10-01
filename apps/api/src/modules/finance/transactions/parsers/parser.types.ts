export interface ParsedTransactionResult {
  provider: string;
  amount: number;
  currency: string;
  direction: 'DEBIT' | 'CREDIT';
  externalReference?: string | null;
  merchant?: string | null;
  accountMasked?: string | null;
  occurredAt: Date;
  confidence: number;
}

export interface ITransactionParser {
  readonly name: string;
  canParse(sender: string, body: string): boolean;
  parse(sender: string, body: string): ParsedTransactionResult | null;
}
