import { ITransactionParser, ParsedTransactionResult } from './parser.types';
import { roundMoney } from '@homemind/shared';

export class ICICIBankParser implements ITransactionParser {
  readonly name = 'ICICIBankParser';

  canParse(sender: string, body: string): boolean {
    const s = sender.toUpperCase();
    return s.includes('ICICI') || /ICICI/i.test(body);
  }

  parse(sender: string, body: string): ParsedTransactionResult | null {
    if (!this.canParse(sender, body)) return null;

    // Pattern: Acct XX123 debited for Rs 850.00 on 02-Oct-26. UPI:Swiggy@icici. Ref:9876543210
    const isDebit = /\b(debited|spent|withdrawn)\b/i.test(body);
    const isCredit = /\b(credited|received|refunded)\b/i.test(body);

    if (!isDebit && !isCredit) return null;

    const amountMatch = body.match(/(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (!amountMatch) return null;

    const rawAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (isNaN(rawAmount) || rawAmount <= 0) return null;

    const accountMatch = body.match(/(?:Acct|A\/c|Account)\s*(?:XX)?(\d{3,4})/i);
    const accountMasked = accountMatch ? `XX${accountMatch[1]}` : null;

    const refMatch = body.match(/(?:Ref|UPI|UTR|RRN)[\s:]*([A-Za-z0-9]+)/i);
    const externalReference = refMatch ? refMatch[1] : null;

    const merchantMatch = body.match(/(?:to|at|UPI:)\s*([A-Za-z0-9\s._@-]+?)(?:\s+(?:on|Ref|via|\.))/i);
    const merchant = merchantMatch ? merchantMatch[1].trim() : 'ICICI Bank Transaction';

    return {
      provider: 'ICICI Bank',
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
