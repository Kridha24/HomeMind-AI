import { ITransactionParser, ParsedTransactionResult } from './parser.types';
import { roundMoney } from '@homemind/shared';

export class HDFCBankParser implements ITransactionParser {
  readonly name = 'HDFCBankParser';

  canParse(sender: string, body: string): boolean {
    const s = sender.toUpperCase();
    return s.includes('HDFC') || /HDFC/i.test(body);
  }

  parse(sender: string, body: string): ParsedTransactionResult | null {
    if (!this.canParse(sender, body)) return null;

    // Pattern: Rs 1,450.00 debited from HDFC Bank A/C **1234 on 02-OCT-26 to Swiggy Ref 1234567890
    // Pattern: Rs 5,000.00 credited to HDFC Bank A/C **1234 on 02-OCT-26 by info Ref 9876543210
    const isDebit = /\b(debited|spent|withdrawn)\b/i.test(body);
    const isCredit = /\b(credited|received|refunded|cashback)\b/i.test(body);

    if (!isDebit && !isCredit) return null;

    const amountMatch = body.match(/(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (!amountMatch) return null;

    const rawAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (isNaN(rawAmount) || rawAmount <= 0) return null;

    const accountMatch = body.match(/A\/C\s*(?:\*\*)?(\d{3,4})/i) || body.match(/ending\s*(\d{4})/i);
    const accountMasked = accountMatch ? `XX${accountMatch[1]}` : null;

    const refMatch = body.match(/(?:Ref|UPI Ref|UTR|RRN)[\s:]*([A-Za-z0-9]+)/i);
    const externalReference = refMatch ? refMatch[1] : null;

    const merchantMatch = body.match(/(?:to|at|info)\s+([A-Za-z0-9\s._-]+?)(?:\s+(?:on|Ref|UPI|via|\.))/i);
    const merchant = merchantMatch ? merchantMatch[1].trim() : 'HDFC Bank Transaction';

    return {
      provider: 'HDFC Bank',
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
