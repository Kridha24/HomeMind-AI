import { ParsedSmsTransaction, PaymentMethod, TransactionType } from './types';
import { FinancialSmsFilter } from './financialSmsFilter';

export class BankSmsParser {
  private static amountRegex = /(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
  private static vpaRegex = /(?:to|vpa|transfer\s*to|at)\s+([a-zA-Z0-9._-]+@[a-zA-Z0-9]+)/i;
  private static upiMerchantFallbackRegex = /(?:to|vpa|paid\s*to)\s+([a-zA-Z0-9\s&._-]{2,30}?)(?=\s+via|\s+ref|\s+on|\s+dated|\.|$)/i;
  private static bankMerchantRegex = /(?:at|to|info\s*:)\s+([a-zA-Z0-9\s&._-]{2,30}?)(?=\s+on|\s+avl|\s+ref|\s+dated|\.|\n|$)/i;
  private static refRegex = /(?:upi\s*ref(?:erence)?(?:\s*no)?|ref(?:\s*no)?|rrn|txn(?:\s*id)?|neft\s*ref|reference)\s*[:.]?\s*([a-zA-Z0-9]{6,18})/i;
  private static accountRegex = /(?:a\/c|account|acct|card|card\s*ending)\s*(?:no\.?)?\s*(?:ending\s*)?[x*X\s]*([0-9]{3,4})/i;

  static deduceBankName(sender: string): string | null {
    const clean = sender.toUpperCase();
    if (clean.includes('HDFC')) return 'HDFC Bank';
    if (clean.includes('SBI')) return 'State Bank of India';
    if (clean.includes('ICICI')) return 'ICICI Bank';
    if (clean.includes('AXIS')) return 'Axis Bank';
    if (clean.includes('KOTAK')) return 'Kotak Mahindra Bank';
    if (clean.includes('BOB') || clean.includes('BARODA')) return 'Bank of Baroda';
    if (clean.includes('PNB')) return 'Punjab National Bank';
    if (clean.includes('CANARA')) return 'Canara Bank';
    if (clean.includes('UNION')) return 'Union Bank';
    if (clean.includes('YES')) return 'Yes Bank';
    if (clean.includes('IDFC')) return 'IDFC First Bank';
    if (clean.includes('INDUS')) return 'IndusInd Bank';
    if (clean.includes('PAYTM')) return 'Paytm Payments Bank';
    if (clean.includes('FEDRL')) return 'Federal Bank';
    if (clean.includes('CITI')) return 'Citi Bank';
    if (clean.includes('SCB') || clean.includes('STANCHAR')) return 'Standard Chartered';
    return null;
  }

  static async computeSourceHash(
    sender: string | null | undefined,
    amount: number,
    type: string,
    reference: string | null | undefined,
    accountLast4: string | null | undefined,
    timestampMs: number
  ): Promise<string> {
    const normalizedSender = (sender || 'UNKNOWN').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const normalizedAmount = amount.toFixed(2);
    const normalizedType = type.trim().toUpperCase();
    const normalizedAccount = (accountLast4 || '').trim().replace(/[^0-9]/g, '');
    const ref = (reference || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    const datePart = ref.length >= 4
      ? new Date(timestampMs).toISOString().split('T')[0]
      : `B_${Math.floor(timestampMs / (5 * 60 * 1000))}`;

    const raw = [normalizedSender, normalizedAmount, normalizedType, ref, normalizedAccount, datePart].join('|');

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(raw);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback simple hash for non-crypto environments
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }

  /**
   * Parse a raw bank or payment SMS message
   */
  static async parse(
    sender: string,
    body: string,
    timestampMs: number = Date.now()
  ): Promise<ParsedSmsTransaction | null> {
    if (!FinancialSmsFilter.isFinancial(sender, body)) {
      return null;
    }

    const lower = body.toLowerCase();

    // 1. Amount
    const amountMatch = body.match(this.amountRegex);
    if (!amountMatch || !amountMatch[1]) return null;
    const cleanAmountStr = amountMatch[1].replace(/,/g, '');
    const amount = parseFloat(cleanAmountStr);
    if (isNaN(amount) || amount <= 0) return null;

    // 2. Type: Debit vs Credit
    const isCredit = lower.includes('credited') || lower.includes('received') || lower.includes('deposited') || lower.includes('refund');
    const isDebit = lower.includes('debited') || lower.includes('spent') || lower.includes('paid') || lower.includes('withdrawn') || lower.includes('purchase') || lower.includes('sent');
    if (!isCredit && !isDebit) return null;
    const type: TransactionType = (isCredit && !isDebit) ? 'CREDIT' : 'DEBIT';

    // 3. Payment Method
    let paymentMethod: PaymentMethod = 'BANK';
    if (lower.includes('upi') || lower.includes('vpa')) paymentMethod = 'UPI';
    else if (lower.includes('neft')) paymentMethod = 'NEFT';
    else if (lower.includes('imps')) paymentMethod = 'IMPS';
    else if (lower.includes('rtgs')) paymentMethod = 'RTGS';
    else if (lower.includes('atm')) paymentMethod = 'ATM';
    else if (lower.includes('card') || lower.includes('pos')) paymentMethod = 'CARD';

    // 4. Merchant
    let merchant: string | null = null;
    if (paymentMethod === 'UPI') {
      const vpaMatch = body.match(this.vpaRegex);
      if (vpaMatch && vpaMatch[1]) {
        const fullVpa = vpaMatch[1].trim();
        merchant = fullVpa.includes('@') ? fullVpa.split('@')[0].toUpperCase() : fullVpa;
      } else {
        const fallbackMatch = body.match(this.upiMerchantFallbackRegex);
        if (fallbackMatch && fallbackMatch[1]) {
          const candidate = fallbackMatch[1].trim();
          if (candidate.length < 35 && candidate.toLowerCase() !== 'upi') {
            merchant = candidate;
          }
        }
      }
    } else {
      const bankMerchantMatch = body.match(this.bankMerchantRegex);
      if (bankMerchantMatch && bankMerchantMatch[1]) {
        const candidate = bankMerchantMatch[1].trim();
        if (candidate.length < 35 && candidate.toLowerCase() !== 'upi') {
          merchant = candidate;
        }
      }
    }

    // 5. Account Last 4
    const accountMatch = body.match(this.accountRegex);
    const accountLast4 = accountMatch && accountMatch[1] ? accountMatch[1] : null;

    // 6. Reference Number
    const refMatch = body.match(this.refRegex);
    const reference = refMatch && refMatch[1] ? refMatch[1] : null;

    // 7. Bank Name
    const bankName = this.deduceBankName(sender);

    // 8. Confidence Score
    let confidence = 0.30; // valid amount
    if (isDebit || isCredit) confidence += 0.25;
    if (bankName) confidence += 0.10;
    if (reference) confidence += 0.10;
    if (accountLast4) confidence += 0.10;
    if (paymentMethod !== 'BANK') confidence += 0.10;
    if (merchant) confidence += 0.05;
    confidence = Math.min(1.0, confidence);

    const sourceHash = await this.computeSourceHash(
      sender,
      amount,
      type,
      reference,
      accountLast4,
      timestampMs
    );

    return {
      amount,
      currency: 'INR',
      type,
      merchant,
      category: null,
      paymentMethod,
      accountLast4,
      bankName,
      reference,
      occurredAt: new Date(timestampMs).toISOString(),
      sourceHash,
      rawSender: sender,
      parserConfidence: Number(confidence.toFixed(2))
    };
  }
}
