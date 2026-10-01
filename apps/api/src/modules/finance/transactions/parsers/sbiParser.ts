import { ITransactionParser, ParsedTransactionResult } from './parser.types';
import { roundMoney } from '@homemind/shared';

export class SBIBankParser implements ITransactionParser {
  readonly name = 'SBIBankParser';

  canParse(sender: string, body: string): boolean {
    const s = sender.toUpperCase();
    return s.includes('SBI') || /SBI/i.test(body) || /State Bank/i.test(body);
  }

  parse(sender: string, body: string): ParsedTransactionResult | null {
    if (!this.canParse(sender, body)) return null;

    // Pattern: Your A/C X1234 debited by Rs.2,400.00 on 02Oct26 transfer to Zomato Ref No 12345678
    const isDebit = /\b(debited|debited by|transferred)\b/i.test(body);
    const isCredit = /\b(credited|credited by|received)\b/i.test(body);

    if (!isDebit && !isCredit) return null;

    const amountMatch = body.match(/(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (!amountMatch) return null;

    const rawAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (isNaN(rawAmount) || rawAmount <= 0) return null;

    const accountMatch = body.match(/A\/C\s*(?:X+)?(\d{3,4})/i);
    const accountMasked = accountMatch ? `XX${accountMatch[1]}` : null;

    const refMatch = body.match(/(?:Ref(?:\s*No)?|UPI Ref|UTR)[\s:]*([A-Za-z0-9]+)/i);
    const externalReference = refMatch ? refMatch[1] : null;

    const merchantMatch = body.match(/(?:transfer to|trf to|to|at)\s+([A-Za-z0-9\s._-]+?)(?:\s+(?:on|Ref|via|\.))/i);
    const merchant = merchantMatch ? merchantMatch[1].trim() : 'SBI Transaction';

    return {
      provider: 'State Bank of India',
      amount: roundMoney(rawAmount),
      currency: 'INR',
      direction: isDebit ? 'DEBIT' : 'CREDIT',
      externalReference,
      merchant,
      accountMasked,
      occurredAt: new Date(),
      confidence: 0.95,
    };
  }
}
