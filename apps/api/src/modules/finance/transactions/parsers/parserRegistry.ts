import { ITransactionParser, ParsedTransactionResult } from './parser.types';
import { FinancialSmsFilter } from './financialFilter';
import { HDFCBankParser } from './hdfcParser';
import { ICICIBankParser } from './iciciParser';
import { SBIBankParser } from './sbiParser';
import { AxisBankParser } from './axisParser';
import { GenericUPIParser } from './genericUpiParser';

export class TransactionParserRegistry {
  private parsers: ITransactionParser[] = [];

  constructor() {
    // Specific bank parsers first
    this.register(new HDFCBankParser());
    this.register(new ICICIBankParser());
    this.register(new SBIBankParser());
    this.register(new AxisBankParser());
    // Generic fallback
    this.register(new GenericUPIParser());
  }

  public register(parser: ITransactionParser): void {
    this.parsers.push(parser);
  }

  public parse(sender: string, body: string): ParsedTransactionResult | null {
    // 1. Strict privacy filter
    if (!FinancialSmsFilter.isFinancial(sender, body)) {
      return null;
    }

    // 2. Iterate registered parsers
    for (const parser of this.parsers) {
      if (parser.canParse(sender, body)) {
        const result = parser.parse(sender, body);
        if (result) {
          return result;
        }
      }
    }

    return null;
  }
}

export const parserRegistry = new TransactionParserRegistry();
