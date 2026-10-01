import { ITransactionParser, ParsedTransactionResult } from './parser.types';
import { roundMoney } from '@homemind/shared';

export class GenericUPIParser implements ITransactionParser {
  readonly name = 'GenericUPIParser';

  canParse(sender: string, body: string): boolean {
    return /\b(upi|vpa|debited|credited|paid|sent|received)\b/i.test(body);
  }


  parse(sender: string, body: string): ParsedTransactionResult | null {
    const isDebit = /\b(debited|spent|paid|sent|withdrawn)\b/i.test(body);
    const isCredit = /\b(credited|received|refunded|cashback)\b/i.test(body);


    if (!isDebit && !isCredit) return null;

    const amountMatch = body.match(/(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
                        body.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|₹)/i);
    if (!amountMatch) return null;

    const rawAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
    if (isNaN(rawAmount) || rawAmount <= 0) return null;

    const accountMatch = body.match(/(?:A\/c|Acct|ending|card)\s*(?:XX|\*\*)?(\d{3,4})/i);
    const accountMasked = accountMatch ? `XX${accountMatch[1]}` : null;

    const refMatch = body.match(/(?:Ref|UPI Ref|UTR|RRN|Txn ID)[\s:]*([A-Za-z0-9]+)/i);
    const externalReference = refMatch ? refMatch[1] : null;

    const merchantMatch = body.match(/(?:to|at|paid to|sent to)\s+([A-Za-z0-9\s._@-]+?)(?:\s+(?:on|Ref|UPI|via|\.))/i) ||
                          body.match(/(?:from|received from)\s+([A-Za-z0-9\s._@-]+?)(?:\s+(?:on|Ref|UPI|via|\.))/i);
    const merchant = merchantMatch ? merchantMatch[1].trim() : (sender || 'UPI Transaction');

    return {
      provider: 'UPI / Bank',
      amount: roundMoney(rawAmount),
      currency: 'INR',
      direction: isDebit ? 'DEBIT' : 'CREDIT',
      externalReference,
      merchant,
      accountMasked,
      occurredAt: new Date(),
      confidence: 0.85,
    };
  }
}
